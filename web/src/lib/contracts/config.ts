/**
 * Contract Configuration
 *
 * Environment-specific contract addresses and configuration.
 * Per Constitution Principle II: Blockchain-First Architecture
 */

import { ContractDeploymentConfig, GovernanceParams } from "./types";

/**
 * Development/Localhost configuration
 * Used for local Anvil/Hardhat testing
 * Addresses are populated from environment variables
 */
export const LOCALHOST_CONFIG: ContractDeploymentConfig = {
  network: "localhost",
  chainId: 31337, // Hardhat/Anvil chain ID
  governanceProposal: process.env.NEXT_PUBLIC_DAO_VOTING_ADDRESS || "0x0000000000000000000000000000000000000000",
  eip712VotingForwarder: process.env.NEXT_PUBLIC_MINIMAL_FORWARDER_ADDRESS || "0x0000000000000000000000000000000000000000",
  governanceToken: "0x0000000000000000000000000000000000000000", // Token contract from DAO voting contract
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545",
};

/**
 * Sepolia Testnet configuration
 * For public testnet deployment and QA
 */
export const SEPOLIA_CONFIG: ContractDeploymentConfig = {
  network: "sepolia",
  chainId: 11155111,
  governanceProposal: process.env.NEXT_PUBLIC_SEPOLIA_PROPOSAL_ADDRESS || "",
  eip712VotingForwarder: process.env.NEXT_PUBLIC_SEPOLIA_FORWARDER_ADDRESS || "",
  governanceToken: process.env.NEXT_PUBLIC_SEPOLIA_TOKEN_ADDRESS || "",
  rpcUrl: `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY || ""}`,
  explorerUrl: "https://sepolia.etherscan.io",
};

/**
 * Ethereum Mainnet configuration
 * For production deployment (post-audit)
 */
export const MAINNET_CONFIG: ContractDeploymentConfig = {
  network: "mainnet",
  chainId: 1,
  governanceProposal: process.env.NEXT_PUBLIC_MAINNET_PROPOSAL_ADDRESS || "",
  eip712VotingForwarder: process.env.NEXT_PUBLIC_MAINNET_FORWARDER_ADDRESS || "",
  governanceToken: process.env.NEXT_PUBLIC_MAINNET_TOKEN_ADDRESS || "",
  rpcUrl: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY || ""}`,
  explorerUrl: "https://etherscan.io",
};

/**
 * Polygon PoS configuration
 * Alternative: Layer 2 deployment for lower gas costs
 */
export const POLYGON_CONFIG: ContractDeploymentConfig = {
  network: "polygon",
  chainId: 137,
  governanceProposal: process.env.NEXT_PUBLIC_POLYGON_PROPOSAL_ADDRESS || "",
  eip712VotingForwarder: process.env.NEXT_PUBLIC_POLYGON_FORWARDER_ADDRESS || "",
  governanceToken: process.env.NEXT_PUBLIC_POLYGON_TOKEN_ADDRESS || "",
  rpcUrl: "https://polygon-rpc.com/",
  explorerUrl: "https://polygonscan.com",
};

/**
 * Default governance parameters
 * Used across all networks (can be overridden per network)
 */
export const DEFAULT_GOVERNANCE_PARAMS: GovernanceParams = {
  votingPeriod: BigInt(7 * 24 * 60 * 60), // 7 days in seconds
  quorumPercentage: 40, // 40% of voters must participate
  approvalThreshold: 50, // Simple majority (>50%)
  proposalCreationPowerThreshold: 10, // 10% of total voting power required
};

/**
 * Get active configuration based on environment
 */
export function getContractConfig(): ContractDeploymentConfig {
  const network = process.env.NEXT_PUBLIC_NETWORK || "localhost";

  switch (network) {
    case "sepolia":
      return SEPOLIA_CONFIG;
    case "mainnet":
      return MAINNET_CONFIG;
    case "polygon":
      return POLYGON_CONFIG;
    case "localhost":
    default:
      return LOCALHOST_CONFIG;
  }
}

/**
 * Validate contract configuration
 * Ensures all required addresses are set
 */
export function validateContractConfig(config: ContractDeploymentConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.governanceProposal || config.governanceProposal === "0x0000000000000000000000000000000000000000") {
    errors.push("GovernanceProposal contract address not configured");
  }

  if (!config.eip712VotingForwarder || config.eip712VotingForwarder === "0x0000000000000000000000000000000000000000") {
    errors.push("EIP712VotingForwarder contract address not configured");
  }

  if (!config.governanceToken || config.governanceToken === "0x0000000000000000000000000000000000000000") {
    errors.push("Governance token contract address not configured");
  }

  if (!config.rpcUrl) {
    errors.push("RPC URL not configured");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Get block explorer URL for transaction
 */
export function getExplorerUrl(
  config: ContractDeploymentConfig,
  type: "tx" | "address" | "block",
  value: string
): string {
  if (!config.explorerUrl) return "";

  switch (type) {
    case "tx":
      return `${config.explorerUrl}/tx/${value}`;
    case "address":
      return `${config.explorerUrl}/address/${value}`;
    case "block":
      return `${config.explorerUrl}/block/${value}`;
  }
}
