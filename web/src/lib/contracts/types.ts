/**
 * Smart Contract Type Definitions
 *
 * TypeScript interfaces for DAO Voting smart contracts.
 * Corresponds to Solidity contract specs in:
 * - GovernanceProposal.sol
 * - EIP712VotingForwarder.sol
 *
 * Per Constitution Principle II: Blockchain-First Architecture
 * These types form the contract between frontend and on-chain systems.
 */

/**
 * Voting choice enum
 * Maps to Solidity: enum VoteChoice { None = 0, For = 1, Against = 2, Abstain = 3 }
 */
export enum VoteChoice {
  None = 0,
  For = 1,
  Against = 2,
  Abstain = 3,
}

/**
 * Proposal status lifecycle
 * Maps to Solidity: enum ProposalStatus { Draft = 0, Active = 1, Closed = 2, Executed = 3, Failed = 4, Cancelled = 5 }
 */
export enum ProposalStatus {
  Draft = 0,
  Active = 1,
  Closed = 2,
  Executed = 3,
  Failed = 4,
  Cancelled = 5,
}

/**
 * Proposal data structure
 * Maps to Solidity: struct Proposal { ... }
 *
 * Represents a governance proposal with its metadata and voting state.
 */
export interface Proposal {
  // Identifiers
  id: bigint;

  // Creator and Timeline
  creator: string; // Ethereum address (0x...)
  title: string; // ≤256 characters
  description: string; // ≤4096 characters
  createdAt: bigint; // Unix timestamp

  // Voting Configuration
  votingDeadline: bigint; // Unix timestamp when voting closes
  snapshotBlock: bigint; // Block number for voting power calculation

  // Target Action (optional)
  targetAction: string; // Hex-encoded bytes, e.g., "0x..." or empty

  // Voting State
  forVotes: bigint; // Cumulative voting power (For)
  againstVotes: bigint; // Cumulative voting power (Against)
  abstainVotes: bigint; // Cumulative voting power (Abstain)

  // Lifecycle
  status: ProposalStatus;
}

/**
 * Proposal creation input
 * Input parameters for createProposal() function
 */
export interface CreateProposalInput {
  title: string; // Proposal title (≤256 characters)
  description: string; // Proposal description (≤4096 characters)
  recipient: string; // ETH recipient address
  amount: string; // ETH amount in wei or ether (will be converted)
  deadline?: number; // Unix timestamp (optional, defaults to +7 days)
  targetAction?: string; // Legacy: Optional hex-encoded action data
}

/**
 * Voting results data
 * Vote tallies and percentages for UI display
 */
export interface VotingResults {
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  totalVotes: bigint;

  // Calculated percentages for UI
  forPercentage: number; // 0-100
  againstPercentage: number; // 0-100
  abstainPercentage: number; // 0-100
}

/**
 * User vote information
 * Records what a user voted on a specific proposal
 */
export interface UserVote {
  choice: VoteChoice;
  votingPower: bigint; // Voting power used in this vote
  votedAt: bigint; // Unix timestamp when vote was cast
}

/**
 * Member voting power snapshot
 * Historical voting power at a specific block
 */
export interface VotingPowerSnapshot {
  member: string; // Ethereum address
  blockNumber: bigint;
  votingPower: bigint; // Token balance at that block
}

/**
 * Meta-transaction request
 * For EIP-712 gasless voting via EIP712VotingForwarder
 */
export interface MetaTxRequest {
  from: string; // Voter address
  to: string; // GovernanceProposal contract address
  data: string; // Encoded castVote call (0x...)
  nonce: bigint;
  deadline: bigint; // Signature expiry timestamp
}

/**
 * EIP-712 signature data
 * Structured data for signing with MetaMask
 */
export interface EIP712SignatureData {
  types: {
    EIP712Domain: Array<{ name: string; type: string }>;
    MetaTx: Array<{ name: string; type: string }>;
  };
  primaryType: "MetaTx";
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string; // EIP712VotingForwarder address
  };
  message: MetaTxRequest;
}

/**
 * Contract event: ProposalCreated
 * Emitted when a new proposal is created
 */
export interface ProposalCreatedEvent {
  proposalId: bigint;
  creator: string;
  title: string;
  votingDeadline: bigint;
  snapshotBlock: bigint;
  transactionHash: string;
  blockNumber: bigint;
  timestamp: bigint;
}

/**
 * Contract event: VoteCast
 * Emitted when a vote is recorded
 */
export interface VoteCastEvent {
  proposalId: bigint;
  voter: string;
  choice: VoteChoice;
  votingPower: bigint;
  transactionHash: string;
  blockNumber: bigint;
  timestamp: bigint;
}

/**
 * Contract event: ProposalStatusChanged
 * Emitted when proposal lifecycle status transitions
 */
export interface ProposalStatusChangedEvent {
  proposalId: bigint;
  oldStatus: ProposalStatus;
  newStatus: ProposalStatus;
  transactionHash: string;
  blockNumber: bigint;
  timestamp: bigint;
}

/**
 * Contract event: VotingDeadlineReached
 * Emitted when voting deadline passes and results are finalized
 */
export interface VotingDeadlineReachedEvent {
  proposalId: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  passed: boolean; // forVotes > againstVotes
  transactionHash: string;
  blockNumber: bigint;
  timestamp: bigint;
}

/**
 * Contract error types
 * Maps to Solidity custom errors or revert reasons
 */
export enum ContractErrorType {
  AlreadyVoted = "AlreadyVoted",
  VotingClosed = "VotingClosed",
  InsufficientVotingPower = "InsufficientVotingPower",
  InvalidProposalStatus = "InvalidProposalStatus",
  ProposalNotFound = "ProposalNotFound",
  UnauthorizedAccess = "UnauthorizedAccess",
  InvalidSignature = "InvalidSignature",
  SignatureExpired = "SignatureExpired",
  TransferFailed = "TransferFailed",
  NetworkMismatch = "NetworkMismatch",
  Unknown = "Unknown",
}

/**
 * Contract error details
 * Enhanced error information for debugging
 */
export interface ContractError extends Error {
  type: ContractErrorType;
  proposalId?: bigint;
  voter?: string;
  required?: bigint;
  actual?: bigint;
  transactionHash?: string;
  blockNumber?: bigint;
}

/**
 * Transaction receipt details
 * Confirmation after transaction is mined
 */
export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: bigint;
  blockHash: string;
  from: string;
  to: string;
  gasUsed: bigint;
  cumulativeGasUsed: bigint;
  status: 1 | 0; // 1 = success, 0 = failed
  events: Array<
    ProposalCreatedEvent | VoteCastEvent | ProposalStatusChangedEvent | VotingDeadlineReachedEvent
  >;
}

/**
 * Pending transaction state
 * For tracking transactions in-flight
 */
export interface PendingTransaction {
  hash: string;
  from: string;
  to: string;
  type: "proposal_create" | "vote_cast" | "proposal_close" | "vote_gasless";
  proposalId?: bigint;
  status: "pending" | "confirmed" | "failed";
  createdAt: bigint; // Unix timestamp
  confirmations: number; // Number of blocks since inclusion
  error?: string;
}

/**
 * Contract deployment configuration
 * Environment-specific contract addresses and RPC endpoints
 */
export interface ContractDeploymentConfig {
  network: "localhost" | "sepolia" | "mainnet" | "polygon" | "arbitrum";
  governanceProposal: string; // Contract address (0x...)
  eip712VotingForwarder: string; // Forwarder address
  governanceToken: string; // ERC20Snapshot token address
  rpcUrl: string;
  explorerUrl?: string; // Block explorer base URL
  chainId: number;
}

/**
 * Governance parameters
 * Constants from smart contracts
 */
export interface GovernanceParams {
  votingPeriod: bigint; // Duration in seconds (e.g., 7 days = 604800)
  quorumPercentage: number; // e.g., 40 (40%)
  approvalThreshold: number; // e.g., 50 (simple majority)
  proposalCreationPowerThreshold: number; // e.g., 10 (10% of total)
}

/**
 * Wallet connection state
 * For frontend state management
 */
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: bigint | null; // Native token balance in wei
  votingPower: bigint | null; // Governance token balance
  isValidNetwork: boolean; // True if on configured chain
}

/**
 * Member profile (voting member of DAO)
 * Aggregated member information
 */
export interface DAOMember {
  address: string;
  votingPower: bigint;
  proposalsCreated: bigint;
  votesCount: bigint;
  lastVoteAt: bigint | null;
  joinedAt: bigint;
}

/**
 * Proposal statistics
 * Aggregated proposal data for dashboard
 */
export interface ProposalStats {
  totalProposals: bigint;
  activeProposals: bigint;
  executedProposals: bigint;
  failedProposals: bigint;
  totalVoters: bigint;
  averageVotingPower: bigint;
  highestVotedProposal: bigint | null;
  lastProposalAt: bigint;
}

/**
 * Response wrapper for API calls
 * Standardized response format
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ContractError;
  timestamp: bigint;
}

/**
 * Pagination for list results
 */
export interface Pagination {
  page: number;
  pageSize: number;
  total: bigint;
  hasMore: boolean;
}

/**
 * Paginated proposal list
 */
export interface PaginatedProposals extends Pagination {
  proposals: Proposal[];
}
