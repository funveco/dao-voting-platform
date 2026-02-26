/**
 * ConnectWallet Component
 *
 * Button to connect/disconnect MetaMask wallet.
 * Shows connected address and network status.
 *
 * Per Constitution Principle II: Blockchain-First Architecture
 * Per Constitution Principle VI: Accessibility & Performance
 */

"use client";

import { useState, useEffect } from "react";
import { useWalletContext } from "@/contexts/WalletProvider";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ethers } from "ethers";

/**
 * ConnectWallet Component
 *
 * Displays wallet connection button with address, balance, and network info.
 */
export function ConnectWallet() {
  const wallet = useWalletContext();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [isFunding, setIsFunding] = useState(false);
  const [fundError, setFundError] = useState("");
  const [fundSuccess, setFundSuccess] = useState("");

  // Fix hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await wallet.connectWallet();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFundDAO = async () => {
    if (!fundAmount || !wallet.address) {
      setFundError("Please enter an amount");
      return;
    }

    setIsFunding(true);
    setFundError("");
    setFundSuccess("");

    try {
      // Convert ETH to Wei
      const valueInWei = ethers.parseEther(fundAmount);

      // Send transaction directly to DAO contract
      const daoAddress = process.env.NEXT_PUBLIC_DAO_VOTING_ADDRESS;
      if (!daoAddress) {
        throw new Error("DAO address not configured");
      }

      const txHash = await wallet.sendTransaction(daoAddress, valueInWei.toString());

      setFundSuccess(`✅ Funded DAO with ${fundAmount} ETH! Tx: ${txHash.substring(0, 10)}...`);
      setFundAmount("");
      setTimeout(() => {
        setShowFundModal(false);
        setFundSuccess("");
      }, 3000);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setFundError(error.message || "Failed to fund DAO");
    } finally {
      setIsFunding(false);
    }
  };

  // Prevent hydration mismatch by waiting for mount
  if (!isMounted) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    );
  }

  // Not connected state
  if (!wallet.isConnected) {
    return (
      <div className="space-y-2">
        {!wallet.isMetaMaskInstalled && (
          <Alert variant="destructive">
            <AlertDescription>
              MetaMask is not installed.{" "}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
              >
                Install MetaMask →
              </a>
            </AlertDescription>
          </Alert>
        )}

        {wallet.error && (
          <Alert variant="destructive">
            <AlertDescription>{wallet.error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleConnect}
          disabled={isConnecting || !wallet.isMetaMaskInstalled}
          className="w-full"
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      </div>
    );
  }

  // Connected state
  return (
    <>
      <div className="space-y-3">
        {!wallet.isValidNetwork && (
          <Alert variant="destructive">
            <AlertDescription>
              Wrong network. Please switch to Chain ID {process.env.NEXT_PUBLIC_CHAIN_ID || "31337"} in
              MetaMask.
            </AlertDescription>
          </Alert>
        )}

        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setShowDetails(true)}
        >
          <span className="flex items-center gap-2">
            <Badge className="bg-green-600">Connected</Badge>
            <span className="font-mono text-sm">{wallet.displayAddress}</span>
          </span>
          <span className="text-xs text-muted-foreground">{wallet.balanceInEther.toFixed(3)} Ξ</span>
        </Button>
      </div>

      {/* Wallet Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pt-70">
          <Card className="w-96 max-w-full mx-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Wallet Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Account */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Account</p>
                <p className="font-mono text-sm break-all text-foreground">{wallet.address}</p>
              </div>

              {/* Balance */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Balance</p>
                <p className="text-lg font-semibold">{wallet.balanceInEther.toFixed(4)} Ξ</p>
              </div>

              {/* Voting Power */}
              {wallet.votingPower && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Voting Power</p>
                  <p className="font-semibold">{(Number(wallet.votingPower) / 1e18).toFixed(2)} tokens</p>
                </div>
              )}

              {/* Network */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Network</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{wallet.networkName}</span>
                  <Badge
                    variant={wallet.isValidNetwork ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {wallet.chainId ? `#${wallet.chainId}` : "Unknown"}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t">
                <Button
                  size="sm"
                  className="w-full text-xs bg-green-600 hover:bg-green-700"
                  onClick={() => setShowFundModal(true)}
                >
                  💰 Fund DAO
                </Button>
                <a
                  href={`https://etherscan.io/address/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                    View on Etherscan →
                  </Button>
                </a>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full text-xs"
                  onClick={wallet.disconnectWallet}
                >
                  Disconnect
                </Button>
              </div>
            </CardContent>
            <div className="px-6 py-4 border-t flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDetails(false)}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Fund DAO Modal */}
      {showFundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pt-40">
          <Card className="w-96 max-w-full mx-4">
            <CardHeader>
              <CardTitle>💰 Fund the DAO</CardTitle>
              <CardDescription>Contribute ETH to enable proposal execution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fundError && (
                <Alert variant="destructive">
                  <AlertDescription>{fundError}</AlertDescription>
                </Alert>
              )}

              {fundSuccess && (
                <Alert className="border-green-500/30 bg-green-50 dark:bg-green-950/20">
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {fundSuccess}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (ETH)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g., 5"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  disabled={isFunding}
                />
                <p className="text-xs text-muted-foreground">
                  Your balance: {wallet.balanceInEther.toFixed(4)} Ξ
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleFundDAO}
                  disabled={isFunding || !fundAmount}
                >
                  {isFunding ? "Funding..." : "Fund DAO"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowFundModal(false);
                    setFundAmount("");
                    setFundError("");
                  }}
                  disabled={isFunding}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
