/**
 * useUserVote Hook
 *
 * Checks if user has voted on a proposal and retrieves vote details.
 * Listens for real-time vote updates via contract events.
 *
 * Per Constitution Principle II: Blockchain-First Architecture
 * T2.2.2: Real-time Updates & WebSocket Integration
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { UserVote } from "@/lib/contracts/types";
import { getProposalService } from "@/lib/contracts/ProposalService";
import { useWalletContext } from "@/contexts/WalletProvider";
import { getEventManager, EventType } from "@/lib/contracts/EventManager";

interface UseUserVoteOptions {
  proposalId: bigint;
  autoFetch?: boolean;
}

export function useUserVote(options: UseUserVoteOptions) {
  const { proposalId, autoFetch = true } = options;
  const { address, isConnected } = useWalletContext();

  const [vote, setVote] = useState<UserVote | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch user's vote on proposal
   */
  const fetchUserVote = useCallback(async () => {
    if (!address || !isConnected) {
      setVote(null);
      setHasVoted(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const service = getProposalService();

      // Check if user has voted
      const voted = await service.hasUserVoted(proposalId, address);
      setHasVoted(voted);

      if (voted) {
        // Get vote details
        const userVote = await service.getUserVote(proposalId, address);
        setVote(userVote);
      } else {
        setVote(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch vote");
      setError(error);
      console.error("Error fetching user vote:", error);
    } finally {
      setIsLoading(false);
    }
  }, [proposalId, address, isConnected]);

  /**
   * Auto-fetch on mount
   * Also listen for vote cast events to update state
   */
  useEffect(() => {
    if (!autoFetch || !isConnected) return;

    fetchUserVote();

    // Listen for vote cast events
    const eventManager = getEventManager();
    const unsubscribe = eventManager.on(EventType.VOTE_CAST, (payload) => {
      // Update if this is a vote on this proposal by this user
      if (
        payload.proposalId === proposalId &&
        payload.userAddress?.toLowerCase() === address?.toLowerCase()
      ) {
        fetchUserVote();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [proposalId, address, isConnected, autoFetch, fetchUserVote]);

  const refetch = useCallback(() => {
    fetchUserVote();
  }, [fetchUserVote]);

  return {
    vote,
    hasVoted,
    isLoading,
    error,
    refetch,
  };
}
