/**
 * useWallet Hook
 *
 * Manages MetaMask wallet connection and provides signer for blockchain interactions.
 * Per Constitution Principle II: Blockchain-First Architecture
 *
 * T2.1.3: Create MetaMask Wallet Integration Hook
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { WalletState, ContractErrorType } from "@/lib/contracts";

/**
 * Window interface for web3 provider
 */
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (args: any) => void) => void;
      removeListener: (event: string, callback: (args: any) => void) => void;
      selectedAddress?: string;
      chainId?: string;
    };
  }
}

/**
 * useWallet Hook
 *
 * Provides wallet connection state and methods for interacting with MetaMask.
 *
 * Usage:
 * ```tsx
 * const { isConnected, address, balance, votingPower, connectWallet, disconnectWallet } = useWallet()
 *
 * return (
 *   <button onClick={connectWallet}>
 *     {isConnected ? address : 'Connect Wallet'}
 *   </button>
 * )
 * ```
 */
export function useWallet() {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    balance: null,
    votingPower: null,
    isValidNetwork: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isIntentionallyDisconnected, setIsIntentionallyDisconnected] = useState(false);

  // Target chain ID (from env var or default to localhost)
  const targetChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "31337", 10);

  /**
   * Check if MetaMask is installed
   */
  const isMetaMaskInstalled = useCallback((): boolean => {
    return typeof window !== "undefined" && !!window.ethereum?.isMetaMask;
  }, []);

  /**
   * Get current account and balance
   */
  const updateAccountInfo = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      // Test if MetaMask is actually accessible by checking chain ID first
      try {
        await Promise.race([
          window.ethereum.request({
            method: "eth_chainId",
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("RPC timeout")), 5000)
          ),
        ]);
      } catch (err: any) {
        // MetaMask is not accessible (extension disabled or closed)
        console.warn("MetaMask not accessible:", err?.message || String(err));
        setState((prev) => ({
          ...prev,
          isConnected: false,
          address: null,
          balance: null,
          votingPower: null,
        }));
        return;
      }

      let accounts: string[] = [];
      try {
        accounts = (await window.ethereum.request({
          method: "eth_accounts",
        })) as string[];
      } catch (accountErr) {
        console.warn("Failed to get accounts:", accountErr);
        return;
      }

      if (accounts.length === 0) {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          address: null,
          balance: null,
          votingPower: null,
        }));
        return;
      }

      const address = accounts[0];

      let balance = BigInt(0);
      try {
        // Get balance in Wei with timeout
        const balanceHex = (await Promise.race([
          window.ethereum.request({
            method: "eth_getBalance",
            params: [address, "latest"],
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Balance RPC timeout")), 5000)
          ),
        ])) as string;
        balance = BigInt(balanceHex);
      } catch (balanceErr) {
        console.warn("Failed to get balance:", balanceErr);
        balance = BigInt(0);
      }

      let chainId = targetChainId;
      try {
        // Get chain ID with timeout
        const chainIdHex = (await Promise.race([
          window.ethereum.request({
            method: "eth_chainId",
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("ChainID RPC timeout")), 5000)
          ),
        ])) as string;
        chainId = parseInt(chainIdHex, 16);
      } catch (chainErr) {
        console.warn("Failed to get chain ID:", chainErr);
        chainId = targetChainId;
      }

      const isValidNetwork = chainId === targetChainId;

      setState((prev) => ({
        ...prev,
        isConnected: true,
        address,
        balance,
        chainId,
        isValidNetwork,
        // TODO: Fetch voting power from contract when integrated
        votingPower: balance,
      }));

      setError(null);
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString?.() || "Failed to update account";
      console.error("Error updating account info:", errorMessage, err);
      setError(errorMessage);
    }
  }, [targetChainId]);

  /**
   * Connect to MetaMask wallet
   */
  const connectWallet = useCallback(async (): Promise<string | null> => {
    if (!isMetaMaskInstalled()) {
      const msg = "MetaMask is not installed. Please install it to continue.";
      setError(msg);
      return null;
    }

    // Clear intentional disconnect flag when user explicitly connects
    setIsIntentionallyDisconnected(false);
    
    setIsLoading(true);
    setError(null);

    try {
      // Request account access - this should trigger MetaMask popup
      let accounts: string[];
      try {
        accounts = (await window.ethereum!.request({
          method: "eth_requestAccounts",
        })) as string[];
      } catch (err: any) {
        // If user rejects or MetaMask is not accessible
        if (err.code === 4001) {
          setError("MetaMask connection rejected. Please try again.");
        } else if (err.code === -32603) {
          setError("MetaMask is not accessible. Make sure the extension is enabled.");
        } else {
          setError(err.message || "Failed to request accounts from MetaMask");
        }
        setIsLoading(false);
        return null;
      }

      if (accounts.length === 0) {
        throw new Error("No accounts returned from MetaMask");
      }

      // Switch network if needed
      let currentChainId: number;
      try {
        const chainIdHex = (await window.ethereum!.request({ 
          method: "eth_chainId" 
        })) as string;
        currentChainId = parseInt(chainIdHex, 16);
      } catch (chainErr: any) {
        console.warn("Could not get chain ID:", chainErr?.message);
        currentChainId = 31337; // Default to localhost
      }

      if (currentChainId !== targetChainId) {
        try {
          await window.ethereum!.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${targetChainId.toString(16)}` }],
          });
        } catch (switchError: any) {
          // Chain not added, user will need to add it manually
          setError(
            `Please switch to the correct network (Chain ID: ${targetChainId}) in MetaMask`
          );
          return accounts[0];
        }
      }

      // Update account info
      await updateAccountInfo();
      return accounts[0];
      } catch (err: any) {
      const message =
        err?.code === 4001
          ? "User rejected the connection request"
          : err?.message || err?.toString?.() || "Failed to connect wallet";
      setError(message);
      console.error("Connection error:", message, err);
      return null;
      } finally {
      setIsLoading(false);
      }
  }, [isMetaMaskInstalled, updateAccountInfo, targetChainId]);

  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(() => {
    // Mark as intentionally disconnected to prevent auto-reconnection
    setIsIntentionallyDisconnected(true);
    
    setState({
      isConnected: false,
      address: null,
      chainId: null,
      balance: null,
      votingPower: null,
      isValidNetwork: false,
    });
    setError(null);
  }, []);

  /**
   * Switch network
   */
  const switchNetwork = useCallback(
    async (chainId: number): Promise<boolean> => {
      if (!window.ethereum) return false;

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });

        // Wait a moment for the switch to complete
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Update state
        await updateAccountInfo();
        return true;
      } catch (err: any) {
        setError(`Failed to switch network: ${err.message}`);
        console.error("Network switch error:", err);
        return false;
      }
    },
    [updateAccountInfo]
  );

  /**
   * Get signer (for ethers.js v6)
   * Returns ethers.js Signer from MetaMask provider
   */
  const getSigner = useCallback(async () => {
    if (!window.ethereum || !state.isConnected) {
      throw new Error("Wallet not connected");
    }

    // Create ethers.js v6 BrowserProvider and get signer
    const { ethers } = await import("ethers");
    const provider = new ethers.BrowserProvider(window.ethereum);
    return provider.getSigner();
  }, [state.isConnected]);

  /**
   * Send transaction
   */
  const sendTransaction = useCallback(
    async (to: string, value: string, data?: string): Promise<string> => {
      if (!window.ethereum || !state.isConnected || !state.address) {
        throw new Error("Wallet not connected");
      }

      try {
        const txHash = (await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: state.address,
              to,
              value: value.startsWith("0x") ? value : `0x${BigInt(value).toString(16)}`,
              data: data || "0x",
            },
          ],
        })) as string;

        return txHash;
      } catch (err: any) {
        const message = err.code === 4001 ? "User rejected the transaction" : err.message;
        setError(message);
        throw err;
      }
    },
    [state.isConnected, state.address]
  );

  /**
   * Sign message with MetaMask
   */
  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!window.ethereum || !state.isConnected || !state.address) {
        throw new Error("Wallet not connected");
      }

      try {
        const signature = (await window.ethereum.request({
          method: "personal_sign",
          params: [message, state.address],
        })) as string;

        return signature;
      } catch (err: any) {
        const message = err.code === 4001 ? "User rejected the signing request" : err.message;
        setError(message);
        throw err;
      }
    },
    [state.isConnected, state.address]
  );

  /**
   * Sign typed data (EIP-712)
   * TODO: Full EIP-712 implementation
   */
  const signTypedData = useCallback(
    async (domain: any, types: any, value: any): Promise<string> => {
      if (!window.ethereum || !state.isConnected || !state.address) {
        throw new Error("Wallet not connected");
      }

      try {
        const signature = (await window.ethereum.request({
          method: "eth_signTypedData_v4",
          params: [state.address, JSON.stringify({ types, primaryType: "Message", domain, message: value })],
        })) as string;

        return signature;
      } catch (err: any) {
        const message = err.code === 4001 ? "User rejected the signing request" : err.message;
        setError(message);
        throw err;
      }
    },
    [state.isConnected, state.address]
  );

  /**
   * Set up event listeners on mount
   */
  useEffect(() => {
    if (!window.ethereum) return;

    // Only check if already connected on mount if not intentionally disconnected
    if (!isIntentionallyDisconnected) {
      updateAccountInfo();
    }

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User manually disconnected in MetaMask
        setState((prev) => ({
          ...prev,
          isConnected: false,
          address: null,
          balance: null,
          votingPower: null,
        }));
        setIsIntentionallyDisconnected(true);
      } else if (!isIntentionallyDisconnected) {
        // Only auto-reconnect if not intentionally disconnected
        updateAccountInfo();
      }
    };

    // Listen for network changes
    const handleChainChanged = () => {
      if (!isIntentionallyDisconnected) {
        updateAccountInfo();
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Cleanup listeners
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [updateAccountInfo, isIntentionallyDisconnected]);

  return {
    // State
    ...state,
    isLoading,
    error,
    isMetaMaskInstalled: isMetaMaskInstalled(),

    // Methods
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getSigner,
    sendTransaction,
    signMessage,
    signTypedData,

    // Computed
    displayAddress:
      state.address && state.address.length >= 10
        ? `${state.address.substring(0, 6)}...${state.address.substring(state.address.length - 4)}`
        : state.address,

    // Helpers
    balanceInEther: state.balance ? Number(state.balance) / 1e18 : 0,
    networkName:
      state.chainId === 31337
        ? "Localhost"
        : state.chainId === 11155111
          ? "Sepolia"
          : state.chainId === 1
            ? "Mainnet"
            : state.chainId === 137
              ? "Polygon"
              : "Unknown",
  };
}

/**
 * Hook return type
 */
export type UseWallet = ReturnType<typeof useWallet>;
