/**
 * useProposals Hook
 *
 * Fetches paginated list of governance proposals from blockchain.
 * Provides loading, error, and data states for UI components.
 * Listens for new proposals via real-time events.
 *
 * Per Constitution Principle II: Blockchain-First Architecture
 * T2.2.2: Real-time Updates & WebSocket Integration
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { PaginatedProposals } from "@/lib/contracts/types";
import { getProposalService } from "@/lib/contracts/ProposalService";
import { getEventManager, EventType } from "@/lib/contracts/EventManager";

interface UseProposalsOptions {
  limit?: number;
  offset?: number;
  autoFetch?: boolean;
}

export function useProposals(options: UseProposalsOptions = {}) {
  const { limit = 50, offset = 0, autoFetch = true } = options;

  const [data, setData] = useState<PaginatedProposals | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch proposals from contract or cache
   */
  const fetchProposals = useCallback(async () => {
    console.log("🔄 useProposals: Fetching proposals...");
    setIsLoading(true);
    setError(null);

    try {
      const service = getProposalService();
      const proposals = await service.getAllProposals(limit, offset);
      console.log(`✅ useProposals: Fetched ${proposals.proposals.length} proposals`);
      console.log("📊 Proposal data:", proposals);
      setData(proposals);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch proposals");
      setError(error);
      console.error("❌ Error fetching proposals:", error);
    } finally {
      setIsLoading(false);
    }
  }, [limit, offset]);

  /**
   * Auto-fetch on mount and when pagination changes
   * Also listen for real-time events to trigger refetch
   */
   useEffect(() => {
     if (autoFetch) {
       fetchProposals();
     }

     // Listen for new proposals to trigger refetch
     const eventManager = getEventManager();
     const unsubscribe = eventManager.on(
       EventType.PROPOSAL_CREATED,
       () => {
         // Refetch proposals list when new proposal is created
         console.log("📢 Proposal created event received, refetching proposals...");
         fetchProposals();
       }
     );

     // Listen for proposal creation events (for local proposals)
     const handleProposalCreated = () => {
       console.log("💾 Local proposal created, refetching proposals...");
       fetchProposals();
     };

     window.addEventListener("proposalCreated", handleProposalCreated);

     return () => {
       unsubscribe();
       window.removeEventListener("proposalCreated", handleProposalCreated);
     };
   }, [limit, offset, autoFetch, fetchProposals]);

  const refetch = useCallback(() => {
    fetchProposals();
  }, [fetchProposals]);

  return {
    proposals: data?.proposals ?? [],
    total: data?.total ?? BigInt(0),
    page: data?.page ?? 0,
    pageSize: data?.pageSize ?? limit,
    hasMore: data?.hasMore ?? false,
    isLoading,
    error,
    refetch,
  };
}
