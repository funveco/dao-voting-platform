/**
 * WalletProvider Context
 *
 * Provides wallet state globally to all components.
 * Per Constitution Principle II: Blockchain-First Architecture
 *
 * Wraps useWallet hook in React Context for efficient state sharing.
 */

"use client";

import React, { createContext, ReactNode } from "react";
import { useWallet, type UseWallet } from "@/hooks/useWallet";

/**
 * WalletContext type
 */
export const WalletContext = createContext<UseWallet | undefined>(undefined);

/**
 * WalletProvider component
 *
 * Wraps app with wallet context. Add to layout.tsx:
 *
 * ```tsx
 * import { WalletProvider } from '@/contexts/WalletProvider'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <WalletProvider>
 *       {children}
 *     </WalletProvider>
 *   )
 * }
 * ```
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();

  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>;
}

/**
 * useWalletContext hook
 *
 * Access wallet state from context.
 * Must be used inside WalletProvider.
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { address, isConnected, connectWallet } = useWalletContext()
 *   return <button onClick={connectWallet}>{address || 'Connect'}</button>
 * }
 * ```
 */
export function useWalletContext(): UseWallet {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletContext must be used inside WalletProvider");
  }
  return context;
}
