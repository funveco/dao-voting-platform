/**
 * useUserVotingPower Hook
 *
 * Fetches user's current voting power (token balance).
 * Used to check eligibility for creating proposals and voting.
 * Listens for voting power changes via token transfer events.
 *
 * Per Constitution Principle II: Blockchain-First Architecture
 * T2.2.2: Real-time Updates & WebSocket Integration
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { getProposalService } from "@/lib/contracts/ProposalService";
import { useWalletContext } from "@/contexts/WalletProvider";
import { getEventManager, EventType } from "@/lib/contracts/EventManager";

interface UseUserVotingPowerOptions {
  autoFetch?: boolean;
  pollInterval?: number; // ms, 0 = disabled
}

export function useUserVotingPower(options: UseUserVotingPowerOptions = {}) {
  const { autoFetch = true, pollInterval = 30000 } = options; // Default poll every 30s
  const { address, isConnected } = useWalletContext();

  const [votingPower, setVotingPower] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch user's voting power
   */
  const fetchVotingPower = useCallback(async () => {
    if (!address || !isConnected) {
      setVotingPower(BigInt(0));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const service = getProposalService();
      const power = await service.getUserVotingPower(address);
      setVotingPower(power);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch voting power");
      setError(error);
      console.error("Error fetching voting power:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  /**
   * Auto-fetch on mount and set up polling
   * Also listen for voting power change events
   */
  useEffect(() => {
    if (!autoFetch || !isConnected || !address) return;

    fetchVotingPower();

    // Set up polling if enabled
    let interval_: NodeJS.Timeout | undefined;
    if (pollInterval > 0) {
      interval_ = setInterval(fetchVotingPower, pollInterval);
    }

    // Listen for voting power changes (token transfers)
    const eventManager = getEventManager();
    const unsubscribe = eventManager.on(
      EventType.VOTE_POWER_CHANGED,
      (payload) => {
        if (payload.userAddress === address) {
          // Refresh voting power when tokens are transferred
          fetchVotingPower();
        }
      }
    );

    return () => {
      if (interval_) clearInterval(interval_);
      unsubscribe();
    };
  }, [address, isConnected, autoFetch, pollInterval, fetchVotingPower]);

  const refetch = useCallback(() => {
    fetchVotingPower();
  }, [fetchVotingPower]);

  return {
    votingPower,
    isLoading,
    error,
    refetch,
  };
}
