"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { VotingInterface } from "@/components/VotingInterface";
import { ProposalStatusBadge } from "@/components/ProposalStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProposal } from "@/hooks/useProposal";
import { useUserVote } from "@/hooks/useUserVote";
import { useUserVotingPower } from "@/hooks/useUserVotingPower";
import { useVoteSubmission } from "@/hooks/useVoteSubmission";
import { useWalletContext } from "@/contexts/WalletProvider";
import {
  formatTimeRemaining,
  isProposalActive,
  formatAddressForDisplay,
  formatFullAddress,
  proposalStatusToString,
  formatBigNumber,
  VoteChoice,
} from "@/lib/contracts";
import type { VotingResults as ComponentVotingResults } from "@/components/VotingInterface";
import { VoteChoice as VotingInterfaceVoteChoice } from "@/components/VotingInterface";

/**
 * Proposal Detail Page (T2.2.1)
 *
 * Displays full proposal information with voting interface.
 * Per spec.md User Story 2+3: Vote on Proposals & View Details
 *
 * Features:
 * - Real blockchain data via useProposal hook
 * - Three-tab layout: Details | Voting | Results
 * - VotingInterface component for voting
 * - User vote status detection
 * - Real-time voting updates with polling
 */
export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useWalletContext();
  const proposalId = BigInt(params.id as string);

  // Get user's address for vote tracking
  const userAddress = address?.toLowerCase() || '';

  // Load persisted votes from localStorage on mount (only for current user)
  const [userVote, setUserVote] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && userAddress) {
      const saved = localStorage.getItem(`vote_${proposalId.toString()}_${userAddress}`);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [voteCountFor, setVoteCountFor] = useState<bigint>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`votes_${proposalId.toString()}`);
      if (saved) {
        const data = JSON.parse(saved);
        return BigInt(data.for || 0);
      }
    }
    return BigInt(0);
  });
  const [voteCountAgainst, setVoteCountAgainst] = useState<bigint>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`votes_${proposalId.toString()}`);
      if (saved) {
        const data = JSON.parse(saved);
        return BigInt(data.against || 0);
      }
    }
    return BigInt(0);
  });
  const [voteCountAbstain, setVoteCountAbstain] = useState<bigint>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`votes_${proposalId.toString()}`);
      if (saved) {
        const data = JSON.parse(saved);
        return BigInt(data.abstain || 0);
      }
    }
    return BigInt(0);
  });

  // Fetch proposal and voting results
  const { proposal, votingResults, isLoading: proposalLoading, error, refetch } = useProposal({
    proposalId,
    autoFetch: true,
    pollInterval: 10000, // Poll every 10 seconds for live updates
  });

  // Check if user has voted
  const { hasVoted, isLoading: voteCheckLoading, refetch: refetchUserVote } = useUserVote({
    proposalId,
    autoFetch: true,
  });

  // Get user's voting power
  const { votingPower } = useUserVotingPower({ autoFetch: true });

  // Vote submission handler
  const { submitVote, isSubmitting, error: submitError, transactionHash } =
    useVoteSubmission();

  // Gasless voting toggle
  const [useGasless, setUseGasless] = useState(true);

  // Load user vote when address changes
  useEffect(() => {
    if (typeof window !== 'undefined' && userAddress) {
      const saved = localStorage.getItem(`vote_${proposalId.toString()}_${userAddress}`);
      if (saved) {
        setUserVote(JSON.parse(saved));
      } else {
        setUserVote(null);
      }
    }
  }, [userAddress, proposalId]);

  // Override hasVoted if user just voted (declare before use)
  const userHasVoted = hasVoted || userVote !== null;

  const isLoading = proposalLoading || voteCheckLoading;
  const isActive = proposal ? isProposalActive(proposal) : false;
  const canVote = isActive && isConnected && !userHasVoted;
  const timeRemaining = proposal ? formatTimeRemaining(proposal.votingDeadline) : "";

  // Calculate totals including local vote updates
  const totalForVotes = (proposal?.forVotes || BigInt(0)) + voteCountFor;
  const totalAgainstVotes = (proposal?.againstVotes || BigInt(0)) + voteCountAgainst;
  const totalAbstainVotes = (proposal?.abstainVotes || BigInt(0)) + voteCountAbstain;
  const totalVotes = totalForVotes + totalAgainstVotes + totalAbstainVotes;

  // Transform contract VotingResults to component VotingResults
  const componentVotingResults: ComponentVotingResults = votingResults
    ? {
        forCount: votingResults.forVotes,
        againstCount: votingResults.againstVotes,
        abstainCount: votingResults.abstainVotes,
        totalVotes: votingResults.totalVotes,
        forPercentage: votingResults.forPercentage,
        againstPercentage: votingResults.againstPercentage,
        abstainPercentage: votingResults.abstainPercentage,
        userVotingPower: votingPower,
      }
    : proposal
    ? {
        forCount: totalForVotes,
        againstCount: totalAgainstVotes,
        abstainCount: totalAbstainVotes,
        totalVotes: totalVotes,
        forPercentage: totalVotes > BigInt(0) ? (Number(totalForVotes) / Number(totalVotes) * 100) : 0,
        againstPercentage: totalVotes > BigInt(0) ? (Number(totalAgainstVotes) / Number(totalVotes) * 100) : 0,
        abstainPercentage: totalVotes > BigInt(0) ? (Number(totalAbstainVotes) / Number(totalVotes) * 100) : 0,
        userVotingPower: votingPower,
      }
    : {
        forCount: 0,
        againstCount: 0,
        abstainCount: 0,
        totalVotes: 0,
        forPercentage: 0,
        againstPercentage: 0,
        abstainPercentage: 0,
        userVotingPower: null,
      };

  if (!proposal && isLoading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="space-y-4">
            <Card className="h-48 animate-pulse bg-muted/20" />
            <Card className="h-64 animate-pulse bg-muted/20" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <Link href="/proposals">
            <Button variant="ghost">← Back to Proposals</Button>
          </Link>
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <Link href="/proposals">
            <Button variant="ghost">← Back to Proposals</Button>
          </Link>
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-lg text-muted-foreground">Proposal not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Link href="/proposals">
            <Button variant="ghost">← Back to Proposals</Button>
          </Link>

          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-foreground">{proposal.title}</h1>
              <ProposalStatusBadge status={proposal.status} />
            </div>

            <p className="text-muted-foreground">
              Created by {proposal.creator && proposal.creator !== "0x0000000000000000000000000000000000000000" 
                ? formatFullAddress(proposal.creator) 
                : "Unknown"} •{" "}
              {proposal.createdAt > 0 
                ? new Date(Number(proposal.createdAt) * 1000).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Voting Status Alerts */}
        {userHasVoted && (
          <Alert className="border-green-600/50 bg-green-600/10">
            <AlertDescription className="text-green-600 dark:text-green-400">
              ✓ You have voted on this proposal
            </AlertDescription>
          </Alert>
        )}

        {transactionHash && (
          <Alert className="border-green-600/50 bg-green-600/10">
            <AlertDescription className="text-green-600 dark:text-green-400">
              ✓ Vote submitted successfully! Transaction:{" "}
              <code className="text-xs font-mono">
                {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
              </code>
            </AlertDescription>
          </Alert>
        )}

        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError.message}</AlertDescription>
          </Alert>
        )}

        {isActive && !isConnected && (
          <Alert className="border-yellow-600/50 bg-yellow-600/10">
            <AlertDescription className="text-yellow-600 dark:text-yellow-400">
              Connect your wallet to vote on this proposal
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="voting">Voting</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Proposal Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-invert max-w-none break-words whitespace-pre-wrap">
                  {proposal.description}
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Creator</p>
                    <p className="font-medium break-all">{formatFullAddress(proposal.creator)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {proposal.createdAt > 0 
                        ? new Date(Number(proposal.createdAt) * 1000).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Voting Deadline</p>
                    <p className="font-medium">
                      {proposal.votingDeadline > 0
                        ? new Date(Number(proposal.votingDeadline) * 1000).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Snapshot Block</p>
                    <p className="font-medium">{formatBigNumber(proposal.snapshotBlock)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{proposalStatusToString(proposal.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time Remaining</p>
                    <p className="font-medium">{timeRemaining}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voting Tab */}
          <TabsContent value="voting">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Cast Your Vote</CardTitle>
              </CardHeader>
              <CardContent>
                {!isConnected ? (
                  <Alert className="border-yellow-600/50 bg-yellow-600/10">
                    <AlertDescription className="text-yellow-600 dark:text-yellow-400">
                      Connect your wallet to vote on this proposal
                    </AlertDescription>
                  </Alert>
                ) : !isActive ? (
                  <Alert>
                    <AlertDescription>
                      Voting is closed for this proposal
                    </AlertDescription>
                  </Alert>
                ) : userHasVoted ? (
                  <Alert className="border-green-600/50 bg-green-600/10">
                    <AlertDescription className="text-green-600">
                      You have already voted on this proposal
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        id="useGasless"
                        checked={useGasless}
                        onChange={(e) => setUseGasless(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="useGasless" className="text-sm text-gray-700 dark:text-gray-300">
                        Use gasless transaction (relayer pays gas)
                      </label>
                    </div>
                    <VotingInterface
                      proposalId={proposalId.toString()}
                      votingResults={componentVotingResults || {
                        forCount: 0,
                        againstCount: 0,
                        abstainCount: 0,
                        totalVotes: 0,
                        forPercentage: 0,
                        againstPercentage: 0,
                        abstainPercentage: 0,
                        userVotingPower: null,
                      }}
                      userAlreadyVoted={userHasVoted}
                      isLoading={isSubmitting}
                      error={submitError?.message || null}
                      showGaslessOption={useGasless}
                      onVote={async (choice) => {
                        const voteChoiceMap: {
                          [key in VotingInterfaceVoteChoice]: VoteChoice;
                        } = {
                          FOR: VoteChoice.For,
                          AGAINST: VoteChoice.Against,
                          ABSTAIN: VoteChoice.Abstain,
                        };

                        const contractChoice = voteChoiceMap[choice];
                        await submitVote(proposalId, contractChoice, useGasless);
                        
                        // Update local state immediately after voting
                        setUserVote(choice);
                        
                        // Update vote counts based on choice
                        let newFor = voteCountFor;
                        let newAgainst = voteCountAgainst;
                        let newAbstain = voteCountAbstain;
                        
                        if (choice === 'FOR') {
                          newFor = voteCountFor + BigInt(1);
                          setVoteCountFor(newFor);
                        } else if (choice === 'AGAINST') {
                          newAgainst = voteCountAgainst + BigInt(1);
                          setVoteCountAgainst(newAgainst);
                        } else if (choice === 'ABSTAIN') {
                          newAbstain = voteCountAbstain + BigInt(1);
                          setVoteCountAbstain(newAbstain);
                        }
                        
                        // Persist to localStorage (with user address for vote tracking, without for total counts)
                        if (userAddress) {
                          localStorage.setItem(`vote_${proposalId.toString()}_${userAddress}`, JSON.stringify(choice));
                        }
                        localStorage.setItem(`votes_${proposalId.toString()}`, JSON.stringify({
                          for: newFor.toString(),
                          against: newAgainst.toString(),
                          abstain: newAbstain.toString(),
                        }));
                        
                        // Notify other components about vote update
                        window.dispatchEvent(new Event('voteUpdated'));
                        
                        // Refresh data from contract
                        setTimeout(() => {
                          refetch();
                          refetchUserVote();
                        }, 2000);
                      }}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Voting Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Use componentVotingResults which has local vote updates */}
                {componentVotingResults && (componentVotingResults.totalVotes > 0 || votingResults) ? (
                  <div className="space-y-6">
                    {/* For Votes */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-600 dark:text-green-400">
                          For
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatBigNumber(componentVotingResults.forCount)} votes (
                          {componentVotingResults.forPercentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-green-600"
                          style={{
                            width: `${Math.max(
                              componentVotingResults.forPercentage,
                              5
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Against Votes */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-red-600 dark:text-red-400">
                          Against
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatBigNumber(componentVotingResults.againstCount)} votes (
                          {componentVotingResults.againstPercentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-red-600"
                          style={{
                            width: `${Math.max(
                              componentVotingResults.againstPercentage,
                              5
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Abstain Votes */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-yellow-600 dark:text-yellow-400">
                          Abstain
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatBigNumber(componentVotingResults.abstainCount)} votes (
                          {componentVotingResults.abstainPercentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-yellow-600"
                          style={{
                            width: `${Math.max(
                              componentVotingResults.abstainPercentage,
                              5
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Total Votes */}
                    <div className="border-t border-border pt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Total Votes</span>
                        <span className="font-semibold">
                          {formatBigNumber(componentVotingResults.totalVotes)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* For Votes from proposal */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-600 dark:text-green-400">
                          For
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatBigNumber(proposal.forVotes)} votes
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-green-600" style={{ width: '5%' }} />
                      </div>
                    </div>

                    {/* Against Votes from proposal */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-red-600 dark:text-red-400">
                          Against
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatBigNumber(proposal.againstVotes)} votes
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-red-600" style={{ width: '5%' }} />
                      </div>
                    </div>

                    {/* Abstain Votes from proposal */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-yellow-600 dark:text-yellow-400">
                          Abstain
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatBigNumber(proposal.abstainVotes)} votes
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-yellow-600" style={{ width: '5%' }} />
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>No voting results available</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
