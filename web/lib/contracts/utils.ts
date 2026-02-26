/**
 * Contract Utilities
 *
 * Helper functions for working with smart contracts and blockchain data.
 * Per Constitution Principle II: Blockchain-First Architecture
 */

import {
  Proposal,
  ProposalStatus,
  VoteChoice,
  VotingResults,
  ContractErrorType,
  ContractError,
} from "./types";

/**
 * Convert contract proposal data to typed Proposal interface
 */
export function parseProposalFromContract(contractData: any): Proposal {
  return {
    id: BigInt(contractData.id),
    creator: contractData.creator,
    title: contractData.title,
    description: contractData.description,
    targetAction: contractData.targetAction || "0x",
    snapshotBlock: BigInt(contractData.snapshotBlock),
    votingDeadline: BigInt(contractData.votingDeadline),
    createdAt: BigInt(contractData.createdAt),
    forVotes: BigInt(contractData.forVotes),
    againstVotes: BigInt(contractData.againstVotes),
    abstainVotes: BigInt(contractData.abstainVotes),
    status: contractData.status as ProposalStatus,
  };
}

/**
 * Calculate voting results with percentages
 */
export function calculateVotingResults(proposal: Proposal): VotingResults {
  const total =
    Number(proposal.forVotes) + Number(proposal.againstVotes) + Number(proposal.abstainVotes);

  if (total === 0) {
    return {
      forVotes: proposal.forVotes,
      againstVotes: proposal.againstVotes,
      abstainVotes: proposal.abstainVotes,
      totalVotes: BigInt(0),
      forPercentage: 0,
      againstPercentage: 0,
      abstainPercentage: 0,
    };
  }

  return {
    forVotes: proposal.forVotes,
    againstVotes: proposal.againstVotes,
    abstainVotes: proposal.abstainVotes,
    totalVotes: BigInt(total),
    forPercentage: (Number(proposal.forVotes) / total) * 100,
    againstPercentage: (Number(proposal.againstVotes) / total) * 100,
    abstainPercentage: (Number(proposal.abstainVotes) / total) * 100,
  };
}

/**
 * Check if proposal voting is still active
 */
export function isProposalActive(proposal: Proposal, currentTimestamp: bigint = BigInt(Date.now() / 1000)): boolean {
  return (
    proposal.status === ProposalStatus.Active && currentTimestamp < proposal.votingDeadline
  );
}

/**
 * Check if proposal has passed (more For votes than Against)
 */
export function hasProposalPassed(proposal: Proposal): boolean {
  return proposal.forVotes > proposal.againstVotes;
}

/**
 * Get time remaining until voting deadline
 * @param votingDeadline Unix timestamp
 * @param currentTimestamp Unix timestamp (defaults to now)
 * @returns Object with days, hours, minutes remaining
 */
export function getTimeRemaining(
  votingDeadline: bigint,
  currentTimestamp: bigint = BigInt(Math.floor(Date.now() / 1000))
) {
  const secondsRemaining = Number(votingDeadline) - Number(currentTimestamp);

  if (secondsRemaining <= 0) {
    return { days: 0, hours: 0, minutes: 0, ended: true };
  }

  const days = Math.floor(secondsRemaining / (24 * 60 * 60));
  const hours = Math.floor((secondsRemaining % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((secondsRemaining % (60 * 60)) / 60);

  return { days, hours, minutes, ended: false };
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(votingDeadline: bigint): string {
  const { days, hours, minutes, ended } = getTimeRemaining(votingDeadline);

  if (ended) return "Voting ended";
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

/**
 * Parse contract error and return typed error
 */
export function parseContractError(error: any): ContractError {
  const contractError = new Error(error.message || "Unknown contract error") as ContractError;

  // Determine error type from error message
  if (error.message?.includes("AlreadyVoted")) {
    contractError.type = ContractErrorType.AlreadyVoted;
  } else if (error.message?.includes("VotingClosed")) {
    contractError.type = ContractErrorType.VotingClosed;
  } else if (error.message?.includes("InsufficientVotingPower") || error.message?.includes("InsufficientPower")) {
    contractError.type = ContractErrorType.InsufficientVotingPower;
  } else if (error.message?.includes("InvalidProposalStatus")) {
    contractError.type = ContractErrorType.InvalidProposalStatus;
  } else if (error.message?.includes("ProposalNotFound")) {
    contractError.type = ContractErrorType.ProposalNotFound;
  } else if (error.message?.includes("Unauthorized") || error.message?.includes("Ownable")) {
    contractError.type = ContractErrorType.UnauthorizedAccess;
  } else if (error.message?.includes("invalid signature") || error.message?.includes("ECDSA")) {
    contractError.type = ContractErrorType.InvalidSignature;
  } else if (error.message?.includes("expired") || error.message?.includes("deadline")) {
    contractError.type = ContractErrorType.SignatureExpired;
  } else if (error.message?.includes("transfer failed") || error.message?.includes("Transfer")) {
    contractError.type = ContractErrorType.TransferFailed;
  } else if (error.message?.includes("chainId") || error.message?.includes("network")) {
    contractError.type = ContractErrorType.NetworkMismatch;
  } else {
    contractError.type = ContractErrorType.Unknown;
  }

  // Extract additional info from error
  if (error.data?.proposalId) contractError.proposalId = BigInt(error.data.proposalId);
  if (error.data?.voter) contractError.voter = error.data.voter;
  if (error.data?.required) contractError.required = BigInt(error.data.required);
  if (error.data?.actual) contractError.actual = BigInt(error.data.actual);
  if (error.transactionHash) contractError.transactionHash = error.transactionHash;

  return contractError;
}

/**
 * Get human-readable error message
 */
export function getErrorMessage(error: ContractError): string {
  switch (error.type) {
    case ContractErrorType.AlreadyVoted:
      return "You have already voted on this proposal";
    case ContractErrorType.VotingClosed:
      return "Voting has ended for this proposal";
    case ContractErrorType.InsufficientVotingPower:
      return `Insufficient voting power. Required: ${error.required}, Available: ${error.actual}`;
    case ContractErrorType.InvalidProposalStatus:
      return "Proposal is not in a valid state for this operation";
    case ContractErrorType.ProposalNotFound:
      return "Proposal not found";
    case ContractErrorType.UnauthorizedAccess:
      return "You do not have permission to perform this action";
    case ContractErrorType.InvalidSignature:
      return "Invalid signature. Please try again";
    case ContractErrorType.SignatureExpired:
      return "Signature has expired. Please sign again";
    case ContractErrorType.TransferFailed:
      return "Transaction failed. Please check your balance and try again";
    case ContractErrorType.NetworkMismatch:
      return "Wrong network. Please switch to the correct network";
    case ContractErrorType.Unknown:
    default:
      return error.message || "An unexpected error occurred";
  }
}

/**
 * Encode proposal create function call
 * For use in meta-transactions or direct calls
 */
export function encodeCreateProposal(
  title: string,
  description: string,
  targetAction: string = "0x"
): string {
  // This would normally use ethers.js or web3.js to encode
  // For now, return placeholder
  return "0x"; // TODO: Implement with ethers.js AbiCoder
}

/**
 * Encode cast vote function call
 */
export function encodeCastVote(proposalId: bigint, choice: VoteChoice): string {
  // Placeholder for ethers.js encoding
  return "0x"; // TODO: Implement with ethers.js AbiCoder
}

/**
 * Convert vote choice to human-readable string
 */
export function voteChoiceToString(choice: VoteChoice): string {
  switch (choice) {
    case VoteChoice.For:
      return "For";
    case VoteChoice.Against:
      return "Against";
    case VoteChoice.Abstain:
      return "Abstain";
    case VoteChoice.None:
    default:
      return "No Vote";
  }
}

/**
 * Convert proposal status to human-readable string
 */
export function proposalStatusToString(status: ProposalStatus): string {
  switch (status) {
    case ProposalStatus.Draft:
      return "Draft";
    case ProposalStatus.Active:
      return "Active";
    case ProposalStatus.Closed:
      return "Closed";
    case ProposalStatus.Executed:
      return "Executed";
    case ProposalStatus.Failed:
      return "Failed";
    case ProposalStatus.Cancelled:
      return "Cancelled";
    default:
      return "Unknown";
  }
}

/**
 * Get status badge color (Constitutional colors)
 */
export function getStatusBadgeColor(status: ProposalStatus): "default" | "secondary" | "destructive" {
  switch (status) {
    case ProposalStatus.Draft:
    case ProposalStatus.Closed:
      return "secondary"; // Gray
    case ProposalStatus.Active:
    case ProposalStatus.Executed:
      return "default"; // Green
    case ProposalStatus.Failed:
    case ProposalStatus.Cancelled:
      return "destructive"; // Red
    default:
      return "secondary";
  }
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format address for display (truncated)
 */
export function formatAddressForDisplay(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Convert Wei to Ether
 */
export function weiToEther(wei: bigint): number {
  return Number(wei) / 1e18;
}

/**
 * Convert Ether to Wei
 */
export function etherToWei(ether: number): bigint {
  return BigInt(Math.floor(ether * 1e18));
}

/**
 * Format big number for display with abbreviation (K, M, B)
 */
export function formatBigNumber(value: bigint | number): string {
  const num = typeof value === "bigint" ? Number(value) : value;

  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";

  return num.toFixed(0);
}

/**
 * Get block explorer URL for transaction
 */
export function getTransactionUrl(chainId: number, txHash: string): string {
  const baseUrls: Record<number, string> = {
    1: "https://etherscan.io/tx/",
    11155111: "https://sepolia.etherscan.io/tx/",
    137: "https://polygonscan.com/tx/",
    42161: "https://arbiscan.io/tx/",
  };

  return (baseUrls[chainId] || "https://etherscan.io/tx/") + txHash;
}
