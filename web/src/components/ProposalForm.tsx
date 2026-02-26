"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/**
 * Schema for proposal form validation
 * Per Constitution Principle I: Design System Consistency
 * Per spec.md User Story 1: Create a Governance Proposal
 */
const proposalFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(256, "Title must be 256 characters or less")
    .describe("Proposal title (max 256 characters)"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .describe("Detailed proposal description"),
  recipient: z
    .string()
    .min(42, "Recipient address must be a valid Ethereum address")
    .describe("ETH recipient address (0x...)"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,18})?$/, "Amount must be a valid number")
    .describe("Amount in ETH to transfer if proposal passes"),
  actionData: z
    .string()
    .optional()
    .describe("Optional target contract action data (hex-encoded)"),
});

export type ProposalFormValues = z.infer<typeof proposalFormSchema>;

export interface ProposalFormProps {
  onSubmit: (data: ProposalFormValues) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  onError?: (error: Error) => void;
}

/**
 * ProposalForm Component
 *
 * Enables DAO members to create governance proposals with:
 * - Title field (required, max 256 chars)
 * - Description field (required, min 10 chars)
 * - Optional action data for contract interactions
 * - Form validation with clear error messages
 * - Loading state while submitting to blockchain
 * - Error alert component for submission failures
 *
 * Per spec.md US1 Acceptance Scenarios:
 * - User Story 1: Create a Governance Proposal (Priority: P1)
 *
 * Per Constitution Principle III: Test-First Development
 * - All validation rules tested in unit tests
 * - Error scenarios covered
 */
export function ProposalForm({
  onSubmit,
  isLoading = false,
  error = null,
  onError,
}: ProposalFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(error);

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      title: "",
      description: "",
      recipient: "",
      amount: "",
      actionData: "",
    },
  });

  const handleSubmit = async (data: ProposalFormValues) => {
    try {
      setSubmitError(null);
      await onSubmit(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit proposal";
      setSubmitError(errorMessage);
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert - Destructive variant per Constitution colors */}
      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Form Container */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6"
          noValidate
        >
          {/* Title Field */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="proposal-title">Proposal Title</FormLabel>
                <FormControl>
                  <Input
                    id="proposal-title"
                    placeholder="Enter a descriptive proposal title"
                    disabled={isLoading}
                    maxLength={256}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Maximum 256 characters. Be concise and clear.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description Field */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="proposal-description">
                  Proposal Description
                </FormLabel>
                <FormControl>
                  <Textarea
                    id="proposal-description"
                    placeholder="Provide detailed explanation of the proposal, including rationale and any relevant context"
                    disabled={isLoading}
                    rows={8}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Minimum 10 characters. Include rationale and context for
                  voting members.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Recipient Address Field */}
          <FormField
            control={form.control}
            name="recipient"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="recipient-address">
                  Recipient Address
                </FormLabel>
                <FormControl>
                  <Input
                    id="recipient-address"
                    placeholder="0x..."
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Ethereum address that will receive funds if proposal passes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Amount Field */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="amount">
                  Amount (ETH)
                </FormLabel>
                <FormControl>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 1.5"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Amount of ETH to transfer if proposal passes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Action Data Field (Optional) */}
          <FormField
            control={form.control}
            name="actionData"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="proposal-action">
                  Target Contract Action (Optional)
                </FormLabel>
                <FormControl>
                  <Input
                    id="proposal-action"
                    placeholder="0x... (hex-encoded contract function call)"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Optional: If this proposal triggers a contract action,
                  provide the hex-encoded function call data.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isLoading || !form.formState.isValid}
              className="w-full sm:w-auto"
              variant="default"
            >
              {isLoading ? "Submitting..." : "Submit Proposal"}
            </Button>
            <Button
              type="reset"
              variant="outline"
              disabled={isLoading}
              className="w-full sm:w-auto"
              onClick={() => form.reset()}
            >
              Clear
            </Button>
          </div>

          {/* Loading State Message */}
          {isLoading && (
            <Alert>
              <AlertDescription>
                Submitting your proposal to the blockchain... Please wait.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </Form>
    </div>
  );
}
