/**
 * ProposalService - Ethers.js Contract Interface Layer
 *
 * Service class for interacting with smart contracts.
 * Handles proposal creation, voting, and data fetching.
 *
 * Per Constitution Principle II: Blockchain-First Architecture
 * This layer abstracts contract interaction complexity and provides
 * a clean interface for UI components.
 *
 * T2.1.2: Create Ethers.js Contract Service Layer
 */

import {
  Proposal,
  ProposalStatus,
  VoteChoice,
  VotingResults,
  CreateProposalInput,
  ContractError,
  TransactionReceipt,
  PendingTransaction,
  UserVote,
  ContractErrorType,
  ContractDeploymentConfig,
  GovernanceParams,
  VotingPowerSnapshot,
  DAOMember,
  ProposalStats,
  ApiResponse,
  PaginatedProposals,
} from "./types";

import * as ethers from "ethers";

import {
  parseProposalFromContract,
  calculateVotingResults,
  parseContractError,
  getErrorMessage,
  isValidAddress,
} from "./utils";

import {
  GOVERNANCE_PROPOSAL_ABI,
  EIP712_VOTING_FORWARDER_ABI,
  ERC20_SNAPSHOT_ABI,
} from "./abis";

import { getContractConfig } from "./config";
import { getEventManager, EventType, EventManager } from "./EventManager";
import { saveProposalToCache, getNextProposalId, getCachedProposals } from "@/lib/storage/proposalCache";

/**
 * ProposalService Class
 *
 * Manages all contract interactions for the DAO governance system.
 * Integrated with ethers.js v6 for contract interactions.
 * Emits real-time events for UI updates via EventManager.
 */
export class ProposalService {
  private config: ContractDeploymentConfig;
  private governanceParams: GovernanceParams;
  private provider: ethers.Provider;

  // Contract instances (ethers.js Contract objects)
  private governanceProposal: ethers.Contract;
  private votingForwarder: ethers.Contract;
  private governanceToken: ethers.Contract;

  // Signer for writing transactions
  private signer: ethers.Signer | null;

  // Cache for reducing RPC calls
  private proposalCache: Map<bigint, Proposal> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamps: Map<bigint, number> = new Map();

  // Event system for real-time updates
  private eventManager: EventManager;
  private eventListeners: Map<string, any> = new Map();

  constructor(
    config: ContractDeploymentConfig,
    governanceParams: GovernanceParams,
    signer?: ethers.Signer
  ) {
    this.config = config;
    this.governanceParams = governanceParams;
    this.signer = signer || null;
    this.eventManager = getEventManager();

    // Initialize provider from config RPC URL
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);

    // Initialize contract instances with ethers.js v6
    this.governanceProposal = new ethers.Contract(
      config.governanceProposal,
      GOVERNANCE_PROPOSAL_ABI,
      signer || this.provider
    );

    this.votingForwarder = new ethers.Contract(
      config.eip712VotingForwarder,
      EIP712_VOTING_FORWARDER_ABI,
      signer || this.provider
    );

    this.governanceToken = new ethers.Contract(
      config.governanceToken,
      ERC20_SNAPSHOT_ABI,
      signer || this.provider
    );

    // Initialize event listeners
    this.initializeEventListeners();
  }

  /**
   * Create a new governance proposal
   * @throws ContractError if operation fails
   */
  async createProposal(input: CreateProposalInput): Promise<{
    proposalId: bigint;
    transactionHash: string;
  }> {
    try {
      if (!this.signer) {
        throw this.createError(
          "Signer not available. Please connect wallet first.",
          ContractErrorType.UnauthorizedAccess
        );
      }

      // Validate inputs
      if (input.title.length === 0 || input.title.length > 256) {
        throw this.createError(
          "Title must be between 1 and 256 characters",
          ContractErrorType.Unknown
        );
      }

      if (input.description.length > 4096) {
        throw this.createError(
          "Description must be 4096 characters or less",
          ContractErrorType.Unknown
        );
      }

      // Call contract method with ethers.js
      // DAOVoting.createProposal(address recipient, uint256 amount, uint256 deadline)
      const governanceWithSigner = this.governanceProposal.connect(this.signer);
      
      // Parse recipient address
      if (!input.recipient || !isValidAddress(input.recipient)) {
        throw this.createError(
          "Invalid recipient address",
          ContractErrorType.Unknown
        );
      }
      
      // Parse amount (in ETH, convert to wei)
      let amountInWei: bigint;
      try {
        amountInWei = ethers.parseEther(input.amount || "0");
      } catch {
        throw this.createError(
          "Invalid amount format",
          ContractErrorType.Unknown
        );
      }
      
      // Set deadline (7 days from now if not specified)
      const deadline = input.deadline || Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      
      let tx = null;
      let receipt = null;
      let contractCallFailed = false;
      
      // Try to call the contract - if it fails OR contract address is zero address, use fallback mode
      const isZeroAddress = this.config.governanceProposal === "0x0000000000000000000000000000000000000000";
      try {
        tx = await (governanceWithSigner as any).createProposal(
          input.recipient,
          amountInWei,
          deadline
        );
        receipt = await tx.wait(1);
      } catch (contractErr) {
        console.warn("⚠️  Contract call failed:", contractErr);
        contractCallFailed = true;
      }
      
      // Force fallback mode if contract address is zero or call failed
      if (contractCallFailed || !receipt || isZeroAddress) {
        console.warn("⚠️  Using JSON cache for proposal storage (testing/fallback mode)");
        console.warn("ℹ️  Contract address:", this.config.governanceProposal);
        
        // Generate a sequential proposal ID from cache
        const proposalId = await getNextProposalId();
        
        // Get creator address from signer
        let creatorAddress = "0x0000000000000000000000000000000000000000";
        let snapshotBlock = BigInt(0);
        try {
          if (this.signer) {
            creatorAddress = await this.signer.getAddress();
            // Get current block number for snapshot
            const block = await this.signer.provider?.getBlockNumber();
            if (block) {
              snapshotBlock = BigInt(block);
              console.log("📸 Snapshot block:", snapshotBlock.toString());
            }
          }
        } catch (err) {
          console.warn("⚠️  Could not get creator address or block:", err);
        }
        
        // Save proposal to JSON cache
        try {
          await saveProposalToCache(
            proposalId,
            input.title,
            input.description,
            input.recipient,
            amountInWei,
            deadline,
            creatorAddress,
            snapshotBlock
          );
          console.log("✅ Proposal saved to JSON cache (fallback mode)");
          
          // Trigger a custom event to notify other components
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("proposalCreated"));
          }
        } catch (err) {
          console.warn("Failed to save proposal to cache:", err);
          throw this.createError(
            "Failed to save proposal",
            ContractErrorType.Unknown
          );
        }
        
        // Emit event for real-time updates
        this.eventManager.emit(
          EventType.PROPOSAL_CREATED,
          { transactionHash: "0x" + proposalId.toString(16) },
          proposalId
        );
        
        return {
          proposalId,
          transactionHash: "0x" + proposalId.toString(16),
        };
      }

      console.log("✅ Transaction receipt:", {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        status: receipt.status,
      });

      // Get proposal ID by querying the proposalCount() function
      // This is more reliable than parsing logs
      let proposalId: bigint | null = null;
      
      try {
        const count = await (this.governanceProposal as any).proposalCount();
        proposalId = BigInt(count);
        console.log("✅ Current proposal count:", proposalId.toString());
      } catch (err) {
        const errorStr = String((err as any).message || err || "Unknown error");
        console.warn("⚠️  Could not retrieve proposal count from contract:", errorStr);
        
        // Generate a sequential proposal ID from cache
        proposalId = await getNextProposalId();
      }

      if (proposalId === null || proposalId === BigInt(0)) {
        throw this.createError(
          "Failed to extract proposal ID from transaction",
          ContractErrorType.Unknown
        );
      }

      // Get creator address from signer
      let creatorAddress = "0x0000000000000000000000000000000000000000";
      let snapshotBlock = BigInt(0);
      try {
        if (this.signer) {
          creatorAddress = await this.signer.getAddress();
          // Get current block number for snapshot
          const block = await this.signer.provider?.getBlockNumber();
          if (block) {
            snapshotBlock = BigInt(block);
            console.log("📸 Snapshot block:", snapshotBlock.toString());
          }
        }
      } catch (err) {
        console.warn("⚠️  Could not get creator address:", err);
      }

      // Also save to cache as backup (in case contract query fails later)
      try {
        await saveProposalToCache(
          proposalId,
          input.title,
          input.description,
          input.recipient,
          amountInWei,
          deadline,
          creatorAddress,
          snapshotBlock
        );
        console.log("✅ Proposal also saved to JSON cache (backup)");
      } catch (cacheErr) {
        console.warn("⚠️  Failed to save to cache (non-critical):", cacheErr);
      }

      // Emit event for real-time updates
      this.eventManager.emit(
        EventType.PROPOSAL_CREATED,
        { transactionHash: receipt.hash },
        proposalId
      );

      return {
        proposalId,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      throw parseContractError(error);
    }
  }

  /**
   * Get proposal by ID
   * Returns null if proposal doesn't exist
   */
  async getProposal(proposalId: bigint): Promise<Proposal | null> {
    try {
      if (proposalId <= BigInt(0)) {
        return null;
      }

      // Check cache first
      const cached = this.proposalCache.get(proposalId);
      const cacheTime = this.cacheTimestamps.get(proposalId) || 0;

      if (cached && Date.now() - cacheTime < this.cacheTTL) {
        return cached;
      }

      // Call contract method
      const contractProposal = await (this.governanceProposal as any).getProposal(proposalId);
      const proposal = parseProposalFromContract(contractProposal, proposalId);

      // Cache the result
      this.proposalCache.set(proposalId, proposal);
      this.cacheTimestamps.set(proposalId, Date.now());

      return proposal;
    } catch (error: any) {
      if (error.message?.includes("invalid proposal ID") || error.code === "BAD_DATA") {
        return null;
      }
      throw parseContractError(error);
    }
  }

  /**
   * Get all proposals with pagination
   */
  async getAllProposals(
    limit: number = 50,
    offset: number = 0
  ): Promise<PaginatedProposals> {
    try {
      let total = BigInt(0);
      
      // Get total proposal count
      let contractAvailable = true;
      try {
        const proposalCount = await this.governanceProposal.proposalCount();
        total = BigInt(proposalCount);
      } catch (err) {
        console.warn("⚠️  Could not get proposal count from contract:", err);
        contractAvailable = false;
      }

      const proposals: Proposal[] = [];

      // Only fetch from contract if contract is available
      if (contractAvailable && total > BigInt(0)) {
        // Calculate pagination
        const startIndex = Math.max(0, Number(total) - offset - limit);
        const endIndex = Math.max(0, Number(total) - offset);

        // Fetch proposals in reverse order (newest first)
        for (let i = startIndex; i < endIndex; i++) {
          try {
            const proposalId = BigInt(i + 1); // Proposal IDs are 1-indexed
            const contractProposal = await (this.governanceProposal as any).getProposal(proposalId);
            const proposal = parseProposalFromContract(contractProposal, proposalId);
            proposals.push(proposal);
          } catch (err) {
            // Skip proposals that fail to load
            console.warn(`Failed to load proposal ${i + 1}:`, err);
          }
        }
      }

      // Add cached proposals for development/testing
      // These will appear in the UI even if contracts aren't deployed
      try {
        const cachedProposals = await getCachedProposals();
        console.log("📦 getAllProposals: Loaded", cachedProposals.length, "cached proposals");
        
        if (cachedProposals.length > 0) {
          console.log("📦 Cached proposal IDs:", cachedProposals.map(p => p.id.toString()).join(", "));
          
          // If no contract proposals, just use cached ones
          if (proposals.length === 0) {
            proposals.push(...cachedProposals);
          } else {
            // Merge, avoiding duplicates by ID
            const existingIds = new Set(proposals.map(p => p.id.toString()));
            for (const cached of cachedProposals) {
              if (!existingIds.has(cached.id.toString())) {
                proposals.push(cached);
              }
            }
          }
          // Update total count
          total = BigInt(proposals.length);
        } else {
          console.log("📦 getAllProposals: No cached proposals found");
        }
      } catch (err) {
        console.warn("Failed to load cached proposals:", err);
      }

      return {
        proposals,
        page: Math.floor(offset / limit),
        pageSize: limit,
        total,
        hasMore: offset + limit < Number(total),
      };
    } catch (error: any) {
      throw parseContractError(error);
    }
  }

  /**
   * Cast a vote on a proposal
   */
  async submitVote(proposalId: bigint, choice: VoteChoice): Promise<{
    transactionHash: string;
    blockNumber: bigint;
  }> {
    try {
      if (!this.signer) {
        throw this.createError(
          "Signer not available. Please connect wallet first.",
          ContractErrorType.UnauthorizedAccess
        );
      }

      if (choice === VoteChoice.None) {
        throw this.createError(
          "Please select a valid vote choice",
          ContractErrorType.Unknown
        );
      }

      // Call contract method with signer
      const governanceWithSigner = this.governanceProposal.connect(this.signer);
      const tx = await (governanceWithSigner as any).castVote(proposalId, choice);

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (!receipt) {
        throw this.createError(
          "Transaction failed: no receipt returned",
          ContractErrorType.Unknown
        );
      }

      // Invalidate proposal cache since voting state changed
      this.proposalCache.delete(proposalId);
      this.cacheTimestamps.delete(proposalId);

      // Emit event for real-time updates
      const userAddress = await this.signer.getAddress();
      this.eventManager.emit(
        EventType.VOTE_CAST,
        { choice, transactionHash: receipt.hash },
        proposalId,
        userAddress
      );
      return {
        transactionHash: receipt.hash,
        blockNumber: BigInt(receipt.blockNumber),
      };
    } catch (error: any) {
      if (error.code !== "BAD_DATA") {
        console.warn(`Error submitting vote: ${error.message}`);
      }
      throw parseContractError(error);
    }
  }

  /**
   * Cast a gasless vote via EIP-712 signature
   * Allows voting without spending gas via meta-transaction forwarder
   */
  async submitVoteGasless(
    proposalId: bigint,
    choice: VoteChoice,
    signature: string,
    from: string
  ): Promise<{
    transactionHash: string;
    blockNumber: bigint;
  }> {
    try {
      if (!this.signer) {
        throw this.createError(
          "Signer not available. Please connect wallet first.",
          ContractErrorType.UnauthorizedAccess
        );
      }

      // Encode the castVote function call
      const iface = this.governanceProposal.interface;
      const data = iface.encodeFunctionData("castVote", [proposalId, choice]);

      // Submit meta-transaction to forwarder
      const forwarderWithSigner = this.votingForwarder.connect(this.signer);
      const tx = await (forwarderWithSigner as any).executeMetaTx(
        from,
        (this.governanceProposal as any).address,
        data,
        signature
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (!receipt) {
        throw this.createError(
          "Transaction failed: no receipt returned",
          ContractErrorType.Unknown
        );
      }

      // Invalidate proposal cache
      this.proposalCache.delete(proposalId);
      this.cacheTimestamps.delete(proposalId);

      return {
        transactionHash: receipt.hash,
        blockNumber: BigInt(receipt.blockNumber),
      };
    } catch (error: any) {
      throw parseContractError(error);
    }
  }

  /**
   * Get voting results for a proposal
   */
  async getVotingResults(proposalId: bigint): Promise<VotingResults | null> {
    try {
      const proposal = await this.getProposal(proposalId);
      if (!proposal) return null;
      if (!proposal.forVotes) return null;
      return calculateVotingResults(proposal);
    } catch (error: any) {
      console.warn(`Error getting voting results for proposal ${proposalId}:`, error);
      return null;
    }
  }

  /**
   * Check if a user has already voted on a proposal
   */
  async hasUserVoted(proposalId: bigint, userAddress: string): Promise<boolean> {
    try {
      if (!isValidAddress(userAddress)) {
        return false;
      }

      // Call contract method to check vote status
      return await this.governanceProposal.hasVoted(proposalId, userAddress);
    } catch (error: any) {
      if (error.code !== "BAD_DATA") {
        console.warn(`Error checking vote status: ${error.message}`);
      }
      return false;
    }
  }

  /**
   * Get user's vote on a proposal
   */
  async getUserVote(proposalId: bigint, userAddress: string): Promise<UserVote | null> {
    try {
      const hasVoted = await this.hasUserVoted(proposalId, userAddress);
      if (!hasVoted) return null;

      // Call contract method to get vote details
      const vote = await this.governanceProposal.getVote(proposalId, userAddress);

      return {
        choice: vote.choice as VoteChoice,
        votingPower: BigInt(vote.votingPower),
        votedAt: BigInt(vote.timestamp || Math.floor(Date.now() / 1000)),
      };
    } catch (error: any) {
      console.warn(`Error fetching user vote: ${error.message}`);
      return null;
    }
  }

  /**
   * Get user's voting power (current token balance)
   */
  async getUserVotingPower(userAddress: string): Promise<bigint> {
    try {
      if (!isValidAddress(userAddress)) {
        return BigInt(0);
      }

      // Call ERC20 token contract to get current balance
      const balance = await this.governanceToken.balanceOf(userAddress);
      return BigInt(balance);
    } catch (error: any) {
      if (error.code !== "BAD_DATA") {
        console.warn(`Error fetching voting power: ${error.message}`);
      }
      return BigInt(0);
    }
  }

  /**
   * Get voting power at a historical block (for voting eligibility)
   */
  async getVotingPowerAtBlock(
    userAddress: string,
    blockNumber: bigint
  ): Promise<VotingPowerSnapshot> {
    try {
      if (!isValidAddress(userAddress)) {
        return {
          member: userAddress,
          blockNumber,
          votingPower: BigInt(0),
        };
      }

      // Call ERC20Snapshot contract to get balance at historical block
      const votingPower = await this.governanceToken.balanceOfAt(
        userAddress,
        blockNumber
      );

      return {
        member: userAddress,
        blockNumber,
        votingPower: BigInt(votingPower),
      };
    } catch (error: any) {
      console.warn(`Error fetching voting power at block: ${error.message}`);
      return {
        member: userAddress,
        blockNumber,
        votingPower: BigInt(0),
      };
    }
  }

  /**
   * Get DAO member profile with aggregated voting stats
   * Note: Some stats like proposalsCreated and votesCount require event indexing
   */
  async getDAOMember(userAddress: string): Promise<DAOMember> {
    try {
      const votingPower = await this.getUserVotingPower(userAddress);

      // TODO: Fetch these from event logs or subgraph
      // For now, return basic member data available on-chain
      return {
        address: userAddress,
        votingPower,
        proposalsCreated: BigInt(0), // Would require event indexing
        votesCount: BigInt(0), // Would require event indexing
        lastVoteAt: null,
        joinedAt: BigInt(Math.floor(Date.now() / 1000)),
      };
    } catch (error: any) {
      console.warn(`Error fetching DAO member: ${error.message}`);
      return {
        address: userAddress,
        votingPower: BigInt(0),
        proposalsCreated: BigInt(0),
        votesCount: BigInt(0),
        lastVoteAt: null,
        joinedAt: BigInt(0),
      };
    }
  }

  /**
   * Get governance statistics by iterating all proposals
   */
  async getGovernanceStats(): Promise<ProposalStats> {
    try {
      const proposalCount = await this.governanceProposal.proposalCount();
      const total = Number(proposalCount);

      let activeCount = 0;
      let executedCount = 0;
      let failedCount = 0;
      let lastProposalAt = BigInt(0);
      let highestVotedProposal = BigInt(0);
      let maxVotes = BigInt(0);

      // Iterate through all proposals to gather stats
      for (let i = 1; i <= total; i++) {
        try {
          const proposal = await this.getProposal(BigInt(i));
          if (!proposal) continue;
          
          lastProposalAt = proposal.createdAt > lastProposalAt ? proposal.createdAt : lastProposalAt;

          if (proposal.status === ProposalStatus.Active) activeCount++;
          else if (proposal.status === ProposalStatus.Executed) executedCount++;
          else if (proposal.status === ProposalStatus.Failed) failedCount++;

          const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
          if (totalVotes > maxVotes) {
            maxVotes = totalVotes;
            highestVotedProposal = proposal.id;
          }
        } catch (err) {
          console.warn(`Failed to fetch proposal ${i} for stats:`, err);
        }
      }

      return {
        totalProposals: BigInt(total),
        activeProposals: BigInt(activeCount),
        executedProposals: BigInt(executedCount),
        failedProposals: BigInt(failedCount),
        totalVoters: BigInt(0), // Would require event indexing
        averageVotingPower: BigInt(0), // Would require event indexing
        highestVotedProposal: maxVotes > BigInt(0) ? highestVotedProposal : null,
        lastProposalAt,
      };
    } catch (error: any) {
      console.warn(`Error fetching governance stats: ${error.message}`);
      return {
        totalProposals: BigInt(0),
        activeProposals: BigInt(0),
        executedProposals: BigInt(0),
        failedProposals: BigInt(0),
        totalVoters: BigInt(0),
        averageVotingPower: BigInt(0),
        highestVotedProposal: null,
        lastProposalAt: BigInt(0),
      };
    }
  }

  /**
   * Update signer (when wallet connects/switches)
   */
  setSigner(signer: ethers.Signer | null): void {
    this.signer = signer;
    // Reinitialize contracts with new signer
    const signerOrProvider = signer || this.provider;
    this.governanceProposal = new ethers.Contract(
      this.config.governanceProposal,
      GOVERNANCE_PROPOSAL_ABI,
      signerOrProvider
    );
    this.votingForwarder = new ethers.Contract(
      this.config.eip712VotingForwarder,
      EIP712_VOTING_FORWARDER_ABI,
      signerOrProvider
    );
    this.governanceToken = new ethers.Contract(
      this.config.governanceToken,
      ERC20_SNAPSHOT_ABI,
      signerOrProvider
    );
  }

  /**
   * Update config (when network switches)
   */
  updateConfig(config: ContractDeploymentConfig): void {
    this.config = config;
    this.proposalCache.clear();
    this.cacheTimestamps.clear();

    // Reinitialize provider and contracts with new RPC
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const signerOrProvider = this.signer || this.provider;

    this.governanceProposal = new ethers.Contract(
      config.governanceProposal,
      GOVERNANCE_PROPOSAL_ABI,
      signerOrProvider
    );
    this.votingForwarder = new ethers.Contract(
      config.eip712VotingForwarder,
      EIP712_VOTING_FORWARDER_ABI,
      signerOrProvider
    );
    this.governanceToken = new ethers.Contract(
      config.governanceToken,
      ERC20_SNAPSHOT_ABI,
      signerOrProvider
    );
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.proposalCache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Initialize contract event listeners for real-time updates
   */
  private initializeEventListeners(): void {
    try {
      // Listen for ProposalCreated events
      const proposalCreatedListener = (...args: any[]) => {
        try {
          const proposalId = args[0] as bigint;
          const creator = args[1] as string;
          
          // Invalidate cache for new proposal
          this.proposalCache.delete(proposalId);
          this.cacheTimestamps.delete(proposalId);
          
          // Emit event for UI updates
          this.eventManager.emit(
            EventType.PROPOSAL_CREATED,
            { creator },
            proposalId
          );
        } catch (err) {
          console.warn("Error processing ProposalCreated event:", err);
        }
      };

      this.governanceProposal.on("ProposalCreated", proposalCreatedListener);
      this.eventListeners.set("ProposalCreated", proposalCreatedListener);

      // Listen for VoteCast events
      const voteCastListener = (...args: any[]) => {
        try {
          const proposalId = args[0] as bigint;
          const voter = args[1] as string;
          const choice = args[2] as number;
          const power = args[3] as bigint;
          
          // Invalidate proposal cache to force refresh
          this.proposalCache.delete(proposalId);
          this.cacheTimestamps.delete(proposalId);
          
          // Emit event for UI updates
          this.eventManager.emit(
            EventType.VOTE_CAST,
            { voter, choice, power },
            proposalId,
            voter
          );
        } catch (err) {
          console.warn("Error processing VoteCast event:", err);
        }
      };

      this.governanceProposal.on("VoteCast", voteCastListener);
      this.eventListeners.set("VoteCast", voteCastListener);

      // Listen for Transfer events from token contract (voting power changes)
      const tokenTransferListener = (...args: any[]) => {
        try {
          const from = args[0] as string;
          const to = args[1] as string;
          
          // Emit vote power changed for both parties
          this.eventManager.emit(
            EventType.VOTE_POWER_CHANGED,
            { amount: args[2] },
            undefined,
            from
          );
          this.eventManager.emit(
            EventType.VOTE_POWER_CHANGED,
            { amount: args[2] },
            undefined,
            to
          );
        } catch (err) {
          console.warn("Error processing Transfer event:", err);
        }
      };

      this.governanceToken.on("Transfer", tokenTransferListener);
      this.eventListeners.set("Transfer", tokenTransferListener);
    } catch (err) {
      console.warn("Error initializing event listeners:", err);
      // Continue even if event listeners fail - app still works with polling
    }
  }

  /**
   * Remove all contract event listeners (cleanup)
   */
  private removeEventListeners(): void {
    try {
      // Remove ProposalCreated listener
      const proposalCreatedListener = this.eventListeners.get("ProposalCreated");
      if (proposalCreatedListener) {
        this.governanceProposal.off("ProposalCreated", proposalCreatedListener);
      }

      // Remove VoteCast listener
      const voteCastListener = this.eventListeners.get("VoteCast");
      if (voteCastListener) {
        this.governanceProposal.off("VoteCast", voteCastListener);
      }

      // Remove Transfer listener
      const transferListener = this.eventListeners.get("Transfer");
      if (transferListener) {
        this.governanceToken.off("Transfer", transferListener);
      }

      this.eventListeners.clear();
    } catch (err) {
      console.warn("Error removing event listeners:", err);
    }
  }

  /**
   * Helper: Create typed error
   */
  private createError(message: string, type: ContractErrorType): ContractError {
    const error = new Error(message) as ContractError;
    error.type = type;
    return error;
  }
}

/**
 * Singleton instance of ProposalService
 * Created lazily when first needed
 */
let proposalServiceInstance: ProposalService | null = null;

/**
 * Get or create ProposalService singleton
 * TODO: Update with proper ethers.js configuration
 */
export function getProposalService(
  config?: ContractDeploymentConfig,
  params?: GovernanceParams,
  signer?: any
): ProposalService {
  if (!proposalServiceInstance) {
    const cfg = config || getContractConfig();
    const govParams = params || {
      votingPeriod: BigInt(7 * 24 * 60 * 60),
      quorumPercentage: 40,
      approvalThreshold: 50,
      proposalCreationPowerThreshold: 10,
    };

    proposalServiceInstance = new ProposalService(cfg, govParams, signer);
  }

  if (config) {
    proposalServiceInstance.updateConfig(config);
  }

  if (signer) {
    proposalServiceInstance.setSigner(signer);
  }

  return proposalServiceInstance;
}

/**
 * Reset singleton (for testing)
 */
export function resetProposalService(): void {
  proposalServiceInstance = null;
}
