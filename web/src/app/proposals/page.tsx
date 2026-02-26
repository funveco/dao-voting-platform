"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ProposalCard } from "@/components/ProposalCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProposals } from "@/hooks/useProposals";
import {
  ProposalStatus,
  proposalStatusToString,
  formatBigNumber,
  calculateVotingResults,
} from "@/lib/contracts";

/**
 * Proposal List Page (T2.2.1)
 *
 * Displays all governance proposals fetched from blockchain.
 * Per spec.md User Story 3: View Proposal Details & Voting Results
 *
 * Features:
 * - Real blockchain data via useProposals hook
 * - Filter by status (All, Active, Closed, Executed, Failed)
 * - Sort by date (newest first) or votes
 * - Error handling and loading states
 */
export default function ProposalsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"all" | ProposalStatus>("all");
  const [sortBy, setSortBy] = useState<"date" | "votes">("date");
  const [voteUpdate, setVoteUpdate] = useState(0);

  // Listen for vote updates from localStorage
  useEffect(() => {
    const handleVoteUpdate = () => {
      setVoteUpdate(prev => prev + 1);
    };
    
    window.addEventListener('voteUpdated', handleVoteUpdate);
    return () => window.removeEventListener('voteUpdated', handleVoteUpdate);
  }, []);

  // Fetch proposals from blockchain via hook
  const { proposals, isLoading, error, refetch } = useProposals({
    limit: 50,
    offset: 0,
    autoFetch: true,
  });

  /**
   * Convert blockchain Proposal to ProposalCardData for display
   */
  const proposalCardData = proposals.map((proposal) => {
    // Check for localStorage votes
    let localFor = BigInt(0);
    let localAgainst = BigInt(0);
    let localAbstain = BigInt(0);
    
    if (typeof window !== 'undefined') {
      const savedVotes = localStorage.getItem(`votes_${proposal.id.toString()}`);
      if (savedVotes) {
        const data = JSON.parse(savedVotes);
        localFor = BigInt(data.for || 0);
        localAgainst = BigInt(data.against || 0);
        localAbstain = BigInt(data.abstain || 0);
      }
    }
    
    // Merge local votes with proposal votes
    const forVotes = proposal.forVotes + localFor;
    const againstVotes = proposal.againstVotes + localAgainst;
    const abstainVotes = proposal.abstainVotes + localAbstain;
    
    const totalVotes = Number(forVotes) + Number(againstVotes) + Number(abstainVotes);
    
    // Calculate percentages
    let forPercentage = 0;
    let againstPercentage = 0;
    let abstainPercentage = 0;
    
    if (totalVotes > 0) {
      forPercentage = (Number(forVotes) / totalVotes) * 100;
      againstPercentage = (Number(againstVotes) / totalVotes) * 100;
      abstainPercentage = (Number(abstainVotes) / totalVotes) * 100;
    }

    return {
      id: proposal.id.toString(),
      title: proposal.title,
      description: proposal.description,
      creator: proposal.creator,
      createdAt: new Date(Number(proposal.createdAt) * 1000),
      status: proposal.status,
      forPercentage,
      againstPercentage,
      abstainPercentage,
      totalVotes,
      votingDeadline: new Date(Number(proposal.votingDeadline) * 1000),
    };
  });

  /**
   * Filter proposals by status
   */
  const filteredProposals = proposalCardData.filter((p) => {
    if (statusFilter === "all") return true;
    return p.status === statusFilter;
  });

  /**
   * Sort proposals
   */
  const sortedProposals = [...filteredProposals].sort((a, b) => {
    if (sortBy === "date") {
      return b.createdAt.getTime() - a.createdAt.getTime(); // Newest first
    } else {
      return b.totalVotes - a.totalVotes; // Most voted first
    }
  });

  /**
   * Handle proposal card click
   */
  const handleProposalClick = (proposalId: string) => {
    router.push(`/proposals/${proposalId}`);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Proposals</h1>
            <p className="text-muted-foreground">
              View and vote on governance proposals
            </p>
          </div>
          <Link href="/proposals/create">
            <Button variant="default" className="whitespace-nowrap">
              ➕ New Proposal
            </Button>
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load proposals: {error.message}
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                className="ml-4"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Filters & Sort Controls */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                By Status
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                    statusFilter === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  All
                </button>
                {[
                  { value: ProposalStatus.Active, label: "Active" },
                  { value: ProposalStatus.Closed, label: "Closed" },
                  { value: ProposalStatus.Executed, label: "Executed" },
                  { value: ProposalStatus.Failed, label: "Failed" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                      statusFilter === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Control */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Sort By
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy("date")}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                    sortBy === "date"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Newest First
                </button>
                <button
                  onClick={() => setSortBy("votes")}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                    sortBy === "votes"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Most Voted
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-muted-foreground">
              {isLoading
                ? "Loading proposals..."
                : `${sortedProposals.length} proposal${
                    sortedProposals.length !== 1 ? "s" : ""
                  }`}
            </div>
          </CardContent>
        </Card>

        {/* Proposals Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card
                key={i}
                className="h-48 animate-pulse bg-muted/20 border-border"
              />
            ))}
          </div>
        ) : sortedProposals.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-lg text-muted-foreground">
                {statusFilter === "all"
                  ? "No proposals yet"
                  : `No ${proposalStatusToString(statusFilter).toLowerCase()} proposals`}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {statusFilter === "all" ? (
                  <>
                    <Link
                      href="/proposals/create"
                      className="text-primary hover:underline"
                    >
                      Create the first proposal →
                    </Link>
                  </>
                ) : (
                  "Try a different filter"
                )}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sortedProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onClick={handleProposalClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
