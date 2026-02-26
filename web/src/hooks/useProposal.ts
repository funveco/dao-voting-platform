/**
 * useProposal Hook
 *
 * Fetches a single governance proposal with all voting data.
 * Provides loading, error, and data states.
 * Listens for real-time updates via contract events.
 * Falls back to cached proposals if contract is unavailable.
 *
 * Per Constitution Principle II: Blockchain-First Architecture
 * T2.2.2: Real-time Updates & WebSocket Integration
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { Proposal, VotingResults } from "@/lib/contracts/types";
import { getProposalService } from "@/lib/contracts/ProposalService";
import { getEventManager, EventType } from "@/lib/contracts/EventManager";
import { getCachedProposal } from "@/lib/storage/proposalCache";

interface UseProposalOptions {
  proposalId: bigint;
  autoFetch?: boolean;
  pollInterval?: number; // ms, 0 = disabled
}

export function useProposal(options: UseProposalOptions) {
  const { proposalId, autoFetch = true, pollInterval = 0 } = options;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [votingResults, setVotingResults] = useState<VotingResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch proposal and voting results
   */
  const fetchProposal = useCallback(async () => {
    if (!proposalId || proposalId <= BigInt(0)) return;

    setIsLoading(true);
    setError(null);

    try {
      const service = getProposalService();

      // Fetch proposal data from contract
      const proposalData = await service.getProposal(proposalId);
      
      if (proposalData) {
        setProposal(proposalData);

        // Fetch voting results
        const results = await service.getVotingResults(proposalId);
        setVotingResults(results);
      } else {
        // Try to load from cache if contract returns null
        try {
          const cached = await getCachedProposal(Number(proposalId));
          if (cached) {
            // Convert cached proposal to Proposal format
            // Handle both BigInt and number (JSON parsing converts BigInt to number)
            const toBigInt = (val: any): bigint => {
              if (typeof val === 'bigint') return val;
              if (typeof val === 'number') return BigInt(Math.floor(val));
              if (typeof val === 'string') return BigInt(Math.floor(parseFloat(val)));
              return BigInt(0);
            };
            
            const cachedProposal: Proposal = {
              id: toBigInt(cached.id),
              title: cached.title || "",
              description: cached.description || "",
              creator: cached.creator || "0x0000000000000000000000000000000000000000",
              createdAt: toBigInt(cached.createdAt),
              votingDeadline: toBigInt(cached.votingDeadline),
              snapshotBlock: BigInt(0),
              targetAction: "",
              forVotes: toBigInt(cached.forVotes),
              againstVotes: toBigInt(cached.againstVotes),
              abstainVotes: toBigInt(cached.abstainVotes),
              status: cached.status || 1,
            };
            setProposal(cachedProposal);
            setVotingResults(null);
          }
        } catch (cacheErr) {
          console.warn("Failed to load cached proposal:", cacheErr);
        }
      }
    } catch (err) {
      // If contract fails, try to load from cache
      try {
        const cached = await getCachedProposal(Number(proposalId));
        if (cached) {
          // Handle both BigInt and number (JSON parsing converts BigInt to number)
          const toBigInt = (val: any): bigint => {
            if (typeof val === 'bigint') return val;
            if (typeof val === 'number') return BigInt(Math.floor(val));
            if (typeof val === 'string') return BigInt(Math.floor(parseFloat(val)));
            return BigInt(0);
          };
          
          const cachedProposal: Proposal = {
            id: toBigInt(cached.id),
            title: cached.title || "",
            description: cached.description || "",
            creator: cached.creator || "0x0000000000000000000000000000000000000000",
            createdAt: toBigInt(cached.createdAt),
            votingDeadline: toBigInt(cached.votingDeadline),
            snapshotBlock: BigInt(0),
            targetAction: "",
            forVotes: toBigInt(cached.forVotes),
            againstVotes: toBigInt(cached.againstVotes),
            abstainVotes: toBigInt(cached.abstainVotes),
            status: cached.status || 1,
          };
          setProposal(cachedProposal);
          setVotingResults(null);
          setError(null); // Clear error since we got data from cache
        } else {
          const error = err instanceof Error ? err : new Error("Failed to fetch proposal");
          setError(error);
          console.error(`Error fetching proposal ${proposalId}:`, error);
        }
      } catch (cacheErr) {
        const error = err instanceof Error ? err : new Error("Failed to fetch proposal");
        setError(error);
        console.error(`Error fetching proposal ${proposalId}:`, error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [proposalId]);

  /**
   * Auto-fetch on mount and set up polling if enabled
   * Also listen for real-time events to trigger updates
   */
  useEffect(() => {
    if (!autoFetch || !proposalId) return;

    fetchProposal();

    // Set up polling if enabled
    let pollInterval_: NodeJS.Timeout | undefined;
    if (pollInterval > 0) {
      pollInterval_ = setInterval(fetchProposal, pollInterval);
    }

    // Listen for vote cast events on this proposal
    const eventManager = getEventManager();
    const unsubscribeVote = eventManager.on(EventType.VOTE_CAST, (payload) => {
      if (payload.proposalId === proposalId) {
        // Refresh proposal data when vote is cast
        fetchProposal();
      }
    });

    // Listen for proposal updates
    const unsubscribeUpdate = eventManager.on(
      EventType.PROPOSAL_UPDATED,
      (payload) => {
        if (payload.proposalId === proposalId) {
          fetchProposal();
        }
      }
    );

    return () => {
      if (pollInterval_) clearInterval(pollInterval_);
      unsubscribeVote();
      unsubscribeUpdate();
    };
  }, [proposalId, autoFetch, pollInterval, fetchProposal]);

  const refetch = useCallback(() => {
    fetchProposal();
  }, [fetchProposal]);

  return {
    proposal,
    votingResults,
    isLoading,
    error,
    refetch,
  };
}
