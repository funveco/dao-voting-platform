"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProposalForm, ProposalFormValues } from "@/components/ProposalForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/contexts/WalletProvider";
import { getProposalService } from "@/lib/contracts/ProposalService";
import { getErrorMessage, parseContractError } from "@/lib/contracts";
import type { ContractError } from "@/lib/contracts";

/**
 * Proposal Creation Page (T2.2.1)
 *
 * Enables DAO members to create new governance proposals.
 * Per spec.md User Story 1: Create a Governance Proposal
 *
 * Features:
 * - Real blockchain proposal submission via ProposalService
 * - MetaMask connection validation
 * - Transaction status tracking
 * - Success confirmation with transaction hash
 * - Error handling and user feedback
 * - Redirect to proposals list on success
 * - Gasless transaction support via relayer
 */
export default function ProposalCreatePage() {
  const router = useRouter();
  const { isConnected, address, getSigner } = useWalletContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successTxHash, setSuccessTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useGasless, setUseGasless] = useState(true);

  /**
   * Handle proposal form submission
   * Submits proposal to blockchain via ProposalService
   */
  const handleProposalSubmit = async (data: ProposalFormValues) => {
    console.log("📝 handleProposalSubmit: Form data received:", data);
    
    // Validate wallet connection
    if (!isConnected) {
      setErrorMessage("Please connect your wallet first");
      console.warn("⚠️  Wallet not connected");
      return;
    }

    if (!address) {
      setErrorMessage("Wallet address not available");
      console.warn("⚠️  Wallet address not available");
      return;
    }

    console.log("✅ Wallet connected:", address);
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Get signer from wallet
      console.log("🔐 Getting signer from wallet...");
      const signer = await getSigner();
      console.log("✅ Signer obtained");

      // Initialize ProposalService with signer
      console.log("🚀 Initializing ProposalService...");
      const service = getProposalService(undefined, undefined, signer);

      // Submit proposal to blockchain
      console.log("📤 Submitting proposal to ProposalService.createProposal()...");
      const result = await service.createProposal({
        title: data.title,
        description: data.description,
        recipient: data.recipient,
        amount: data.amount,
        targetAction: data.actionData || "0x",
      });

      console.log("✅ Proposal created with result:", result);

      // Success
      setSuccessTxHash(result.transactionHash);
      setSuccessMessage(
        `✅ Proposal created successfully! Transaction: ${result.transactionHash.slice(
          0,
          10
        )}...`
      );

      // Redirect to proposals list after 2 seconds
      console.log("⏰ Redirecting to proposals list in 2 seconds...");
      setTimeout(() => {
        router.push("/proposals");
      }, 2000);
    } catch (error: any) {
      console.error("❌ Proposal creation error:", error);
      // Parse contract error
      const contractError = parseContractError(error);
      const errorMsg = getErrorMessage(contractError as ContractError);
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleError = (error: Error) => {
    console.error("Form error:", error);
    setErrorMessage(error.message);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <Link href="/proposals">
            <Button variant="ghost">← Back to Proposals</Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Create Proposal</h1>
          <p className="text-muted-foreground">
            Submit a new governance proposal for DAO members to vote on
          </p>
        </div>

        {/* Wallet Connection Alert */}
        {!isConnected && (
          <Alert className="border-yellow-600/50 bg-yellow-600/10">
            <AlertDescription className="text-yellow-600 dark:text-yellow-400">
              Please connect your wallet to create a proposal
            </AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {successMessage && (
          <Alert className="border-green-600/50 bg-green-600/10">
            <AlertDescription className="text-green-600 dark:text-green-400">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Proposal Form Card */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Proposal Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="useGasless"
                checked={useGasless}
                onChange={(e) => setUseGasless(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="useGasless" className="text-sm text-gray-700 dark:text-gray-300">
                Use gasless transaction (relayer pays gas)
              </label>
            </div>
            <ProposalForm
              onSubmit={handleProposalSubmit}
              isLoading={isSubmitting || !isConnected}
              error={errorMessage}
              onError={handleError}
            />
          </CardContent>
        </Card>

        {/* Helper Information */}
        <Card className="border-border/50 bg-muted/20">
          <CardHeader>
            <CardTitle className="text-base">💡 Creating a Proposal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>Title:</strong> A concise summary of your proposal (max 256
              characters)
            </p>
            <p>
              <strong>Description:</strong> Detailed explanation including rationale,
              expected impact, and voting guidance (max 4096 characters)
            </p>
            <p>
              <strong>Target Contract Action:</strong> (Optional) Hex-encoded function
              call if this proposal triggers a smart contract action
            </p>
            <p className="pt-2 border-t border-border/50">
              Once submitted, your proposal will be recorded on the blockchain and
              appear in the proposal list. DAO members will have the voting window
              specified in governance to vote on it.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
