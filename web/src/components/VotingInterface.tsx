"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Voting choice enum
 * Per spec.md User Story 2: Vote on Active Proposals
 */
export enum VoteChoice {
  FOR = "FOR",
  AGAINST = "AGAINST",
  ABSTAIN = "ABSTAIN",
}

/**
 * Voting results interface
 * Per spec.md US2 Acceptance Scenarios
 */
export interface VotingResults {
  forCount: bigint | number;
  againstCount: bigint | number;
  abstainCount: bigint | number;
  totalVotes: bigint | number;
  forPercentage: number;
  againstPercentage: number;
  abstainPercentage: number;
  userVotingPower: bigint | number | null;
}

export interface VotingInterfaceProps {
  proposalId: string;
  votingResults: VotingResults;
  onVote: (choice: VoteChoice) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  userAlreadyVoted?: boolean;
  onError?: (error: Error) => void;
  showGaslessOption?: boolean;
}

/**
 * VotingInterface Component
 *
 * Enables DAO members to vote on proposals with:
 * - Three semantic voting buttons (For/Against/Abstain)
 * - Constitutional color mapping (Green/Red/Gray)
 * - Real-time voting results visualization via Progress bar
 * - Vote confirmation dialog (AlertDialog)
 * - "Already voted" state handling
 * - Loading state during submission
 * - Error display and recovery
 *
 * Per Constitution Principle I: Design System Consistency
 * - Vote For: Button variant="default" (Green - primary color)
 * - Vote Against: Button variant="destructive" (Red)
 * - Abstain: Button variant="secondary" (Gray)
 *
 * Per spec.md User Story 2: Vote on Active Proposals
 * - All acceptance scenarios 1-5 implemented
 *
 * Per Constitution Principle VI: Accessibility & Performance
 * - Keyboard navigation via AlertDialog
 * - Screen reader friendly labels
 * - Fast submission (<90s UX goal)
 */
export function VotingInterface({
  proposalId,
  votingResults,
  onVote,
  isLoading = false,
  error = null,
  userAlreadyVoted = false,
  onError,
  showGaslessOption = false,
}: VotingInterfaceProps) {
  const [submitError, setSubmitError] = useState<string | null>(error);
  const [selectedVote, setSelectedVote] = useState<VoteChoice | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleVoteConfirm = async () => {
    if (!selectedVote) return;

    try {
      setSubmitError(null);
      await onVote(selectedVote);
      setConfirmDialogOpen(false);
      setSelectedVote(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit vote";
      setSubmitError(errorMessage);
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    }
  };

  /**
   * Button state:
   * - Disabled if already voted
   * - Disabled if loading
   * - Disabled if error
   */
  const isVotingDisabled = userAlreadyVoted || isLoading || !!submitError;

  /**
   * Get variant styling per Constitutional colors
   */
  const getVoteButtonVariant = (
    choice: VoteChoice
  ): "default" | "destructive" | "secondary" => {
    switch (choice) {
      case VoteChoice.FOR:
        return "default"; // Green (primary)
      case VoteChoice.AGAINST:
        return "destructive"; // Red
      case VoteChoice.ABSTAIN:
        return "secondary"; // Gray
    }
  };

  /**
   * Get vote label
   */
  const getVoteLabel = (choice: VoteChoice): string => {
    switch (choice) {
      case VoteChoice.FOR:
        return "Vote For";
      case VoteChoice.AGAINST:
        return "Vote Against";
      case VoteChoice.ABSTAIN:
        return "Abstain";
    }
  };

  /**
   * Convert bigint to number for display
   */
  const toBigInt = (value: bigint | number): number => {
    if (typeof value === "bigint") {
      return Number(value);
    }
    return value;
  };

  const forCount = toBigInt(votingResults.forCount);
  const againstCount = toBigInt(votingResults.againstCount);
  const abstainCount = toBigInt(votingResults.abstainCount);
  const totalVotes = toBigInt(votingResults.totalVotes);

  return (
    <div className="space-y-6">
      {/* Error Alert - Destructive variant per Constitution colors */}
      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Already Voted State */}
      {userAlreadyVoted && (
        <Alert>
          <AlertDescription>
            You have already voted on this proposal. Your vote has been recorded.
          </AlertDescription>
        </Alert>
      )}

      {/* Voting Buttons Container */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Vote For Button - Green (Constitutional default variant) */}
        <AlertDialog open={confirmDialogOpen && selectedVote === VoteChoice.FOR}>
          <AlertDialogTrigger asChild>
            <Button
              variant={getVoteButtonVariant(VoteChoice.FOR)}
              disabled={isVotingDisabled}
              onClick={() => {
                setSelectedVote(VoteChoice.FOR);
                setConfirmDialogOpen(true);
              }}
              className="w-full"
            >
              {isLoading ? "Submitting..." : getVoteLabel(VoteChoice.FOR)}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to vote <strong>FOR</strong> this proposal. This
                action cannot be undone.
                {showGaslessOption && (
                  <>
                    {" "}
                    You can choose to use a gasless transaction via a relayer.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel onClick={() => setConfirmDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleVoteConfirm}
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Confirm Vote"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Vote Against Button - Red (Constitutional destructive variant) */}
        <AlertDialog
          open={confirmDialogOpen && selectedVote === VoteChoice.AGAINST}
        >
          <AlertDialogTrigger asChild>
            <Button
              variant={getVoteButtonVariant(VoteChoice.AGAINST)}
              disabled={isVotingDisabled}
              onClick={() => {
                setSelectedVote(VoteChoice.AGAINST);
                setConfirmDialogOpen(true);
              }}
              className="w-full"
            >
              {isLoading ? "Submitting..." : getVoteLabel(VoteChoice.AGAINST)}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to vote <strong>AGAINST</strong> this proposal.
                This action cannot be undone.
                {showGaslessOption && (
                  <>
                    {" "}
                    You can choose to use a gasless transaction via a relayer.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel onClick={() => setConfirmDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleVoteConfirm}
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Confirm Vote"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Abstain Button - Gray (Constitutional secondary variant) */}
        <AlertDialog
          open={confirmDialogOpen && selectedVote === VoteChoice.ABSTAIN}
        >
          <AlertDialogTrigger asChild>
            <Button
              variant={getVoteButtonVariant(VoteChoice.ABSTAIN)}
              disabled={isVotingDisabled}
              onClick={() => {
                setSelectedVote(VoteChoice.ABSTAIN);
                setConfirmDialogOpen(true);
              }}
              className="w-full"
            >
              {isLoading ? "Submitting..." : getVoteLabel(VoteChoice.ABSTAIN)}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to <strong>ABSTAIN</strong> from voting on this
                proposal. This action cannot be undone.
                {showGaslessOption && (
                  <>
                    {" "}
                    You can choose to use a gasless transaction via a relayer.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel onClick={() => setConfirmDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleVoteConfirm}
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Confirm Vote"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Voting Results Container */}
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <h3 className="text-lg font-semibold text-foreground">Voting Results</h3>

        {/* Vote For Result */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="default">For</Badge>
              <span className="text-sm text-muted-foreground">
                {forCount.toLocaleString()} votes
              </span>
            </div>
            <span className="font-semibold text-foreground">
              {votingResults.forPercentage.toFixed(1)}%
            </span>
          </div>
          <Progress value={votingResults.forPercentage} className="h-2" />
        </div>

        {/* Vote Against Result */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Against</Badge>
              <span className="text-sm text-muted-foreground">
                {againstCount.toLocaleString()} votes
              </span>
            </div>
            <span className="font-semibold text-foreground">
              {votingResults.againstPercentage.toFixed(1)}%
            </span>
          </div>
          {/* Note: Progress bar will show green by default; in production, wrap in colored container */}
          <div className="overflow-hidden rounded-full bg-destructive/20">
            <div
              className="h-2 bg-destructive transition-all"
              style={{
                width: `${votingResults.againstPercentage}%`,
              }}
            />
          </div>
        </div>

        {/* Abstain Result */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Abstain</Badge>
              <span className="text-sm text-muted-foreground">
                {abstainCount.toLocaleString()} votes
              </span>
            </div>
            <span className="font-semibold text-foreground">
              {votingResults.abstainPercentage.toFixed(1)}%
            </span>
          </div>
          {/* Custom progress bar for Abstain (gray) */}
          <div className="overflow-hidden rounded-full bg-secondary/20">
            <div
              className="h-2 bg-secondary transition-all"
              style={{
                width: `${votingResults.abstainPercentage}%`,
              }}
            />
          </div>
        </div>

        {/* Total Votes */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Votes Cast</span>
            <span className="font-semibold text-foreground">
              {totalVotes.toLocaleString()}
            </span>
          </div>
        </div>

        {/* User Voting Power (if connected) */}
        {votingResults.userVotingPower !== null && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your Voting Power</span>
            <span className="font-semibold text-foreground">
              {toBigInt(votingResults.userVotingPower).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Gasless Option Info (if applicable) */}
      {showGaslessOption && (
        <Alert>
          <AlertDescription>
            💡 You can submit your vote using a gasless transaction. A relayer
            will cover the gas fees for this vote.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
