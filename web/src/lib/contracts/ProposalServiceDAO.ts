/**
 * ProposalService - DAOVoting Contract Integration
 *
 * Integrates with Phase 3 smart contracts:
 * - MinimalForwarder (0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496)
 * - DAOVoting (0x34A1D3fff3958843C43aD80F30b94c510645C316)
 *
 * Per Constitution Principle II: Blockchain-First Architecture
 */

import { ethers } from "ethers";
import { DAO_VOTING_ABI, MINIMAL_FORWARDER_ABI } from "./abi";
import {
  parseContractError,
  getErrorMessage,
  isValidAddress,
} from "./utils";
import { ContractError, ContractErrorType, VoteChoice } from "./types";

/**
 * DAOVotingService - Integrated with real DAO contracts
 */
export class DAOVotingService {
  private daoVotingAddress: string;
  private minimalForwarderAddress: string;
  private provider: ethers.Provider;
  private daoContract: any;
  private forwarderContract: any;
  private signer: ethers.Signer | null = null;

  constructor(
    daoVotingAddress: string,
    minimalForwarderAddress: string,
    rpcUrl: string,
    signer?: ethers.Signer
  ) {
    // Validate addresses
    if (!isValidAddress(daoVotingAddress)) {
      throw new Error("Invalid DAOVoting address");
    }
    if (!isValidAddress(minimalForwarderAddress)) {
      throw new Error("Invalid MinimalForwarder address");
    }

    this.daoVotingAddress = daoVotingAddress;
    this.minimalForwarderAddress = minimalForwarderAddress;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = signer || null;

    // Initialize contracts
    this.daoContract = new ethers.Contract(
      daoVotingAddress,
      DAO_VOTING_ABI,
      signer || this.provider
    ) as any;

    this.forwarderContract = new ethers.Contract(
      minimalForwarderAddress,
      MINIMAL_FORWARDER_ABI,
      signer || this.provider
    ) as any;
  }

  /**
   * Create a new proposal
   */
  async createProposal(
    recipient: string,
    amount: bigint,
    deadline: number
  ): Promise<{ proposalId: bigint; transactionHash: string }> {
    try {
      if (!this.signer) {
        throw this.createError(
          "Signer not connected",
          ContractErrorType.UnauthorizedAccess
        );
      }

      // Validate inputs
      if (!isValidAddress(recipient)) {
        throw this.createError("Invalid recipient address", ContractErrorType.Unknown);
      }

      const daoWithSigner = this.daoContract.connect(this.signer);
      const tx = await daoWithSigner.createProposal(recipient, amount, deadline);
      const receipt = await tx.wait();

      if (!receipt) {
        throw this.createError(
          "Transaction failed",
          ContractErrorType.Unknown
        );
      }

      // Parse ProposalCreated event
      let proposalId: bigint | null = null;
      if (receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsed = this.daoContract.interface.parseLog(log);
            if (parsed && parsed.name === "ProposalCreated") {
              proposalId = parsed.args[0] as bigint;
              break;
            }
          } catch {
            // Continue if log parsing fails
          }
        }
      }

      if (proposalId === null) {
        throw this.createError(
          "Could not extract proposal ID from transaction",
          ContractErrorType.Unknown
        );
      }

      return {
        proposalId,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      throw parseContractError(error);
    }
  }

  /**
   * Get proposal details
   */
  async getProposal(proposalId: bigint) {
    try {
      const proposal = await this.daoContract.getProposal(proposalId);

      // Parse proposal structure
      return {
        id: proposal.id as bigint,
        creator: proposal.creator as string,
        recipient: proposal.recipient as string,
        amount: proposal.amount as bigint,
        deadline: proposal.deadline as bigint,
        forVotes: proposal.forVotes as bigint,
        againstVotes: proposal.againstVotes as bigint,
        abstainVotes: proposal.abstainVotes as bigint,
        executed: proposal.executed as boolean,
        createdAt: proposal.createdAt as bigint,
      };
    } catch (error: any) {
      throw parseContractError(error);
    }
  }

  /**
   * Submit a vote (normal transaction, user pays gas)
   */
  async submitVote(
    proposalId: bigint,
    voteChoice: VoteChoice
  ): Promise<{ transactionHash: string }> {
    try {
      if (!this.signer) {
        throw this.createError(
          "Signer not connected",
          ContractErrorType.UnauthorizedAccess
        );
      }

      // Map VoteChoice enum to contract's VoteType (1=FOR, 2=AGAINST, 3=ABSTAIN)
      let voteType: number;
      switch (voteChoice) {
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
          throw this.createError("Invalid vote choice", ContractErrorType.Unknown);
      }

      const daoWithSigner = this.daoContract.connect(this.signer);
      const tx = await daoWithSigner.vote(proposalId, voteType);
      const receipt = await tx.wait();

      if (!receipt) {
        throw this.createError(
          "Vote submission failed",
          ContractErrorType.Unknown
        );
      }

      return {
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      throw parseContractError(error);
    }
  }

  /**
   * Execute an approved proposal
   */
  async executeProposal(
    proposalId: bigint
  ): Promise<{ success: boolean; transactionHash: string }> {
    try {
      if (!this.signer) {
        throw this.createError(
          "Signer not connected",
          ContractErrorType.UnauthorizedAccess
        );
      }

      const daoWithSigner = this.daoContract.connect(this.signer);
      const tx = await daoWithSigner.executeProposal(proposalId);
      const receipt = await tx.wait();

      if (!receipt) {
        throw this.createError(
          "Execution failed",
          ContractErrorType.Unknown
        );
      }

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      throw parseContractError(error);
    }
  }

  /**
   * Get user's vote on a proposal
   */
  async getUserVote(proposalId: bigint, userAddress: string): Promise<number> {
    try {
      if (!isValidAddress(userAddress)) {
        throw this.createError("Invalid user address", ContractErrorType.Unknown);
      }

      const voteType = await this.daoContract.getUserVote(
        proposalId,
        userAddress
      );
      return voteType as number;
    } catch (error: any) {
      throw parseContractError(error);
    }
  }

  /**
   * Get DAO total balance
   */
  async getDAOBalance(): Promise<bigint> {
    try {
      const balance = await this.daoContract.getDAOBalance();
      return balance as bigint;
    } catch (error: any) {
      throw parseContractError(error);
    }
  }

  /**
   * Get total proposal count
   */
  async getProposalCount(): Promise<bigint> {
    try {
      const count = await this.daoContract.proposalCount();
      return count as bigint;
    } catch (error: any) {
      throw parseContractError(error);
    }
  }

  /**
   * Fund the DAO with ETH
   */
  async fundDAO(amount: bigint): Promise<{ transactionHash: string }> {
    try {
      if (!this.signer) {
        throw this.createError(
          "Signer not connected",
          ContractErrorType.UnauthorizedAccess
        );
      }

      const daoWithSigner = this.daoContract.connect(this.signer);
      const tx = await daoWithSigner.fundDAO({ value: amount });
      const receipt = await tx.wait();

      if (!receipt) {
        throw this.createError(
          "Fund submission failed",
          ContractErrorType.Unknown
        );
      }

      return {
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      throw parseContractError(error);
    }
  }

  /**
   * Get MinimalForwarder nonce for a user
   */
  async getNonce(userAddress: string): Promise<bigint> {
    try {
      if (!isValidAddress(userAddress)) {
        throw this.createError("Invalid user address", ContractErrorType.Unknown);
      }

      const nonce = await this.forwarderContract.getNonce(userAddress);
      return nonce as bigint;
    } catch (error: any) {
      throw parseContractError(error);
    }
  }

  /**
   * Submit a gasless vote via MinimalForwarder (EIP-2771)
   */
  async submitVoteGasless(
    proposalId: bigint,
    voteChoice: VoteChoice,
    signature: string,
    from: string
  ): Promise<{ transactionHash: string }> {
    try {
      if (!this.signer) {
        throw this.createError(
          "Signer not connected",
          ContractErrorType.UnauthorizedAccess
        );
      }

      // Map VoteChoice enum to contract's VoteType
      let voteType: number;
      switch (voteChoice) {
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
          throw this.createError("Invalid vote choice", ContractErrorType.Unknown);
      }

      // Encode vote function call
      const callData = this.daoContract.interface.encodeFunctionData("vote", [
        proposalId,
        voteType,
      ]);

      // Get current nonce
      const nonce = await this.getNonce(from);

      // Create ForwardRequest
      const forwardRequest = {
        from,
        to: this.daoVotingAddress,
        value: 0n,
        gas: 150000n,
        nonce,
        deadline: Math.floor(Date.now() / 1000) + 3600,
        data: callData,
      };

      // Submit to MinimalForwarder
      const forwarderWithSigner = this.forwarderContract.connect(this.signer);
      const tx = await forwarderWithSigner.execute(forwardRequest, signature);
      const receipt = await tx.wait();

      if (!receipt) {
        throw this.createError(
          "Gasless vote submission failed",
          ContractErrorType.Unknown
        );
      }

      return {
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      throw parseContractError(error);
    }
  }

  /**
   * Get DAO contract address
   */
  getDAOAddress(): string {
    return this.daoVotingAddress;
  }

  /**
   * Get forwarder contract for meta-transactions
   */
  getForwarderContract(): ethers.Contract {
    return this.forwarderContract;
  }

  /**
   * Update signer
   */
  setSigner(signer: ethers.Signer | null): void {
    this.signer = signer;
    // Reinitialize contracts with new signer
    const signerOrProvider = signer || this.provider;
    this.daoContract = new ethers.Contract(
      this.daoVotingAddress,
      DAO_VOTING_ABI,
      signerOrProvider
    ) as any;
    this.forwarderContract = new ethers.Contract(
      this.minimalForwarderAddress,
      MINIMAL_FORWARDER_ABI,
      signerOrProvider
    ) as any;
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
 * Singleton instance
 */
let daoService: DAOVotingService | null = null;

export function getDAOVotingService(signer?: ethers.Signer): DAOVotingService {
  if (!daoService) {
    const daoAddress = process.env.NEXT_PUBLIC_DAO_VOTING_ADDRESS || "";
    const forwarderAddress = process.env.NEXT_PUBLIC_MINIMAL_FORWARDER_ADDRESS || "";
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545";

    if (!daoAddress || !forwarderAddress) {
      throw new Error("Missing contract addresses in environment variables");
    }

    daoService = new DAOVotingService(daoAddress, forwarderAddress, rpcUrl, signer);
  }

  if (signer) {
    daoService.setSigner(signer);
  }

  return daoService;
}

export function resetDAOVotingService(): void {
  daoService = null;
}
