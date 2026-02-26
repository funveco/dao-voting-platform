/**
 * Local Storage for Proposals
 * 
 * When contracts aren't deployed, persist created proposals locally
 * This allows frontend testing while waiting for contract deployment
 */

import { Proposal, ProposalStatus, VoteChoice } from "@/lib/contracts/types";

const STORAGE_KEY = "dao_proposals_local";

export interface LocalProposal extends Proposal {
  createdLocally?: boolean;
}

/**
 * Get all locally stored proposals
 */
export function getLocalProposals(): LocalProposal[] {
  if (typeof window === "undefined") return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (err) {
    console.warn("Failed to read local proposals:", err);
    return [];
  }
}

/**
 * Save a new proposal locally
 */
export function saveProposalLocally(
  proposalId: bigint,
  title: string,
  description: string,
  recipient: string,
  amount: bigint,
  deadline: number
): LocalProposal {
  const proposals = getLocalProposals();
  
  const newProposal: LocalProposal = {
    id: proposalId,
    creator: "", // Unknown for local proposals
    title,
    description,
    createdAt: BigInt(Math.floor(Date.now() / 1000)),
    votingDeadline: BigInt(deadline),
    snapshotBlock: BigInt(0),
    targetAction: `recipient:${recipient}|amount:${amount.toString()}`, // Store metadata in targetAction
    forVotes: BigInt(0),
    againstVotes: BigInt(0),
    abstainVotes: BigInt(0),
    status: ProposalStatus.Active,
    createdLocally: true,
  };
  
  proposals.push(newProposal);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals));
  } catch (err) {
    console.warn("Failed to save proposal locally:", err);
  }
  
  return newProposal;
}

/**
 * Clear all local proposals (for testing)
 */
export function clearLocalProposals(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
