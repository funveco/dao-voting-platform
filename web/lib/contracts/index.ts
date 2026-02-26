/**
 * Smart Contract Module Exports
 *
 * Central export point for all contract-related types, utilities, and configuration.
 * Per Constitution Principle II: Blockchain-First Architecture
 */

// Type definitions
export type {
  Proposal,
  CreateProposalInput,
  VotingResults,
  UserVote,
  VotingPowerSnapshot,
  MetaTxRequest,
  EIP712SignatureData,
  ProposalCreatedEvent,
  VoteCastEvent,
  ProposalStatusChangedEvent,
  VotingDeadlineReachedEvent,
  ContractError,
  TransactionReceipt,
  PendingTransaction,
  ContractDeploymentConfig,
  GovernanceParams,
  WalletState,
  DAOMember,
  ProposalStats,
  ApiResponse,
  Pagination,
  PaginatedProposals,
} from "./types";

// Enums
export {
  VoteChoice,
  ProposalStatus,
  ContractErrorType,
} from "./types";

// Configuration
export {
  LOCALHOST_CONFIG,
  SEPOLIA_CONFIG,
  MAINNET_CONFIG,
  POLYGON_CONFIG,
  DEFAULT_GOVERNANCE_PARAMS,
  getContractConfig,
  validateContractConfig,
  formatAddress as formatAddressConfig,
  getExplorerUrl,
} from "./config";

// Contract ABIs
export {
  GOVERNANCE_PROPOSAL_ABI,
  EIP712_VOTING_FORWARDER_ABI,
  ERC20_SNAPSHOT_ABI,
} from "./abis";

// Utility functions
export {
  parseProposalFromContract,
  calculateVotingResults,
  isProposalActive,
  hasProposalPassed,
  getTimeRemaining,
  formatTimeRemaining,
  parseContractError,
  getErrorMessage,
  encodeCreateProposal,
  encodeCastVote,
  voteChoiceToString,
  proposalStatusToString,
  getStatusBadgeColor,
  isValidAddress,
  formatAddressForDisplay,
  weiToEther,
  etherToWei,
  formatBigNumber,
  getTransactionUrl,
} from "./utils";
