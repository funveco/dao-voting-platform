/**
 * useVoteSubmission Hook
 *
 * Handles voting submission to blockchain with transaction tracking.
 * Manages loading, error, and success states.
 * Supports both direct and gasless (meta-transaction) voting.
 *
 * Per Constitution Principle II: Blockchain-First Architecture
 * T2.3: Vote Submission Integration
 */

"use client";

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { getDAOVotingService } from "@/lib/contracts/ProposalServiceDAO";
import { useWalletContext } from "@/contexts/WalletProvider";
import { VoteChoice } from "@/lib/contracts/types";
import { parseContractError, getErrorMessage } from "@/lib/contracts";
import type { ContractError } from "@/lib/contracts";
import {
  signMetaTxRequest,
  buildVoteRequest,
} from "@/lib/metaTx";

interface VoteSubmissionState {
  transactionHash: string | null;
  blockNumber: bigint | null;
  isSubmitting: boolean;
  error: Error | null;
}

export interface UseVoteSubmissionResult {
  submitVote: (proposalId: bigint, choice: VoteChoice, useGasless?: boolean) => Promise<void>;
  transactionHash: string | null;
  blockNumber: bigint | null;
  isSubmitting: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * useVoteSubmission Hook
 *
 * Submits vote to blockchain and tracks transaction state
 * Supports both direct and gasless (meta-transaction) voting
 *
 * Usage:
 * ```tsx
 * const { submitVote, isSubmitting, error } = useVoteSubmission();
 *
 * const handleVote = async (choice: VoteChoice) => {
 *   await submitVote(proposalId, choice, useGasless);
 * };
 * ```
 */
export function useVoteSubmission(): UseVoteSubmissionResult {
  const { isConnected, address, getSigner } = useWalletContext();
  const [useGaslessDefault, setUseGaslessDefault] = useState(true);

  const [state, setState] = useState<VoteSubmissionState>({
    transactionHash: null,
    blockNumber: null,
    isSubmitting: false,
    error: null,
  });

  /**
   * Submit vote to blockchain
   */
  const submitVote = useCallback(
    async (
      proposalId: bigint,
      choice: VoteChoice,
      useGasless: boolean = useGaslessDefault
    ): Promise<void> => {
      // Validate wallet connection
      if (!isConnected || !address) {
        const error = new Error("Wallet not connected. Please connect first.");
        setState((prev) => ({ ...prev, error }));
        throw error;
      }

      setState((prev) => ({
        ...prev,
        isSubmitting: true,
        error: null,
        transactionHash: null,
        blockNumber: null,
      }));

      try {
        const signer = await getSigner();

        if (!signer) {
          throw new Error("Failed to get signer from wallet");
        }

        const service = getDAOVotingService(signer);

        if (useGasless) {
          // Gasless meta-transaction voting
          try {
            const forwarder = service.getForwarderContract();
            const daoAddress = service.getDAOAddress();

            // Map VoteChoice to voteType
            let voteType: number;
            switch (choice) {
              case VoteChoice.For:
                voteType = 1;
                break;
              case VoteChoice.Against:
                voteType = 2;
                break;
              case VoteChoice.Abstain:
                voteType = 3;
                break;
              default:
                throw new Error("Invalid vote choice");
            }

            // Build the vote request
            const request = await buildVoteRequest(
              daoAddress,
              address,
              proposalId,
              voteType
            );

            // Sign the meta-transaction
            const { request: signedRequest, signature } = await signMetaTxRequest(
              signer,
              forwarder,
              { ...request, from: address }
          );

          // Send to relayer
          const response = await fetch("/api/relay", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              request: {
                from: signedRequest.from,
                to: signedRequest.to,
                value: signedRequest.value.toString(),
                gas: signedRequest.gas.toString(),
                nonce: signedRequest.nonce.toString(),
                data: signedRequest.data,
              },
              signature,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to submit gasless vote");
          }

          const result = await response.json();

          setState((prev) => ({
            ...prev,
            transactionHash: result.txHash,
            blockNumber: BigInt(result.blockNumber || 0),
            isSubmitting: false,
            error: null,
          }));
          } catch (gaslessError: any) {
            // If gasless fails (forwarder not available), fall back to direct vote
            if (gaslessError.code === "BAD_DATA" || gaslessError.message?.includes("decode")) {
              console.warn("Forwarder contract not available, falling back to direct vote");
              const result = await service.submitVote(BigInt(proposalId), choice);
              setState((prev) => ({
                ...prev,
                transactionHash: result.transactionHash,
                blockNumber: null,
                isSubmitting: false,
                error: null,
              }));
            } else {
              throw gaslessError;
            }
          }
        } else {
          // Direct vote submission (user pays gas)
          const result = await service.submitVote(BigInt(proposalId), choice);

          setState((prev) => ({
            ...prev,
            transactionHash: result.transactionHash,
            blockNumber: null,
            isSubmitting: false,
            error: null,
          }));
        }
      } catch (err: any) {
        const contractError = parseContractError(err);
        const errorMsg = getErrorMessage(contractError as ContractError);
        const error = new Error(errorMsg);

        setState((prev) => ({
          ...prev,
          error,
          isSubmitting: false,
        }));

        console.error("Vote submission error:", err);
        throw error;
      }
    },
    [isConnected, address, getSigner, useGaslessDefault]
  );

  /**
   * Reset submission state
   */
  const reset = useCallback(() => {
    setState({
      transactionHash: null,
      blockNumber: null,
      isSubmitting: false,
      error: null,
    });
  }, []);

  return {
    submitVote,
    transactionHash: state.transactionHash,
    blockNumber: state.blockNumber,
    isSubmitting: state.isSubmitting,
    error: state.error,
    reset,
  };
}
