"use client";

import { Badge } from "@/components/ui/badge";
import { ProposalStatus, proposalStatusToString } from "@/lib/contracts";

export interface ProposalStatusProps {
  status: ProposalStatus;
  className?: string;
  showCountdown?: boolean;
  votingDeadline?: Date | string;
}

/**
 * Get badge variant for proposal status per Constitutional colors
 * Per Constitution Principle I: Design System Consistency
 * Per Constitution Principle V: Proposal Lifecycle Clarity
 */
function getStatusBadgeVariant(
  status: ProposalStatus
): "default" | "secondary" | "destructive" {
  switch (status) {
    case ProposalStatus.Draft:
    case ProposalStatus.Closed:
      return "secondary"; // Gray - Inactive states
    case ProposalStatus.Active:
    case ProposalStatus.Executed:
      return "default"; // Green - Active/Success states
    case ProposalStatus.Failed:
    case ProposalStatus.Cancelled:
      return "destructive"; // Red - Negative states
  }
}

/**
 * Calculate time remaining until deadline
 */
function getCountdownText(deadline: Date | string): string {
  const now = new Date();
  const end = typeof deadline === "string" ? new Date(deadline) : deadline;

  if (end <= now) {
    return "Voting ended";
  }

  const diffMs = end.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h remaining`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ${diffMins % 60}m remaining`;
  }
  if (diffMins > 0) {
    return `${diffMins}m remaining`;
  }

  return "Voting ended";
}

/**
 * ProposalStatusBadge Component
 *
 * Displays a proposal status badge with Constitutional color mapping.
 * Optionally shows countdown timer for active proposals.
 *
 * Per spec.md User Story 4: Track Proposal Lifecycle
 * - Draft: Gray badge, indicates proposal in preparation
 * - Active: Green badge with optional countdown timer
 * - Closed: Gray badge, voting period ended
 * - Executed: Green badge, passed and action taken
 * - Failed: Red badge, did not meet threshold
 * - Cancelled: Red badge, withdrawn by governance
 *
 * Per Constitution Principle V: Proposal Lifecycle Clarity
 * - All 6 lifecycle states have distinct visual indicators
 * - Color-coded for quick identification
 * - Optional countdown helps users track voting windows
 *
 * Per Constitution Principle I: Design System Consistency
 * - Uses shadcn/ui Badge component
 * - Semantic color mapping (green/red/gray)
 * - Tailwind CSS tokens from globals.css
 */
export function ProposalStatusBadge({
  status,
  className = "",
  showCountdown = false,
  votingDeadline,
}: ProposalStatusProps) {
  const countdown =
    showCountdown && status === ProposalStatus.Active && votingDeadline
      ? getCountdownText(votingDeadline)
      : null;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <Badge variant={getStatusBadgeVariant(status)}>
        {proposalStatusToString(status)}
      </Badge>
      {countdown && (
        <span className="text-xs text-muted-foreground">{countdown}</span>
      )}
    </div>
  );
}
