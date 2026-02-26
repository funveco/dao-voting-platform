"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProposalStatus, proposalStatusToString } from "@/lib/contracts";

/**
 * Proposal Card Data Interface
 * Per spec.md User Story 3: View Proposal Details & Voting Results
 */
export interface ProposalCardData {
  id: string;
  title: string;
  description: string;
  creator: string;
  createdAt: Date | string;
  status: ProposalStatus;
  forPercentage: number;
  againstPercentage: number;
  abstainPercentage: number;
  totalVotes: number | bigint;
  votingDeadline?: Date | string;
}

export interface ProposalCardProps {
  proposal: ProposalCardData;
  onClick?: (proposalId: string) => void;
  className?: string;
}

/**
 * Get badge variant for proposal status per Constitutional colors
 * Per Constitution Principle I: Design System Consistency
 */
function getStatusBadgeVariant(
  status: ProposalStatus
): "default" | "secondary" | "destructive" {
  switch (status) {
    case ProposalStatus.Draft:
    case ProposalStatus.Closed:
      return "secondary"; // Gray
    case ProposalStatus.Active:
    case ProposalStatus.Executed:
      return "default"; // Green
    case ProposalStatus.Failed:
    case ProposalStatus.Cancelled:
      return "destructive"; // Red
    default:
      return "secondary";
  }
}

/**
 * ProposalCard Component
 *
 * Displays a proposal in the proposal list with:
 * - Title and description (truncated)
 * - Status badge with Constitutional colors
 * - Creator address
 * - Creation date
 * - Voting results preview (For/Against/Abstain percentages)
 * - Click handler to navigate to proposal detail page
 * - Responsive design (full-width cards in grid)
 *
 * Per spec.md User Story 3: View Proposal Details & Voting Results
 * Per Constitution Principle I: Design System Consistency
 * - Status badges use semantic colors (green/red/gray)
 * - Dark mode background: bg-card
 * - Typography hierarchy maintained
 *
 * Per Constitution Principle VI: Accessibility & Performance
 * - Keyboard accessible via click handler
 * - Semantic HTML structure
 * - Progress bar shows voting distribution
 * - Mobile-responsive design
 */
export function ProposalCard({
  proposal,
  onClick,
  className = "",
}: ProposalCardProps) {
  /**
   * Convert Date to readable format
   */
  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /**
   * Truncate description to 150 characters
   */
  const truncateDescription = (text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  /**
   * Format address to show first 6 and last 4 chars
   */
  const formatAddress = (address: string): string => {
    if (!address) return "Unknown";
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  /**
   * Convert bigint to number for display
   */
  const getTotalVotes = (): number => {
    if (typeof proposal.totalVotes === "bigint") {
      return Number(proposal.totalVotes);
    }
    return proposal.totalVotes;
  };

  const handleClick = () => {
    if (onClick) {
      onClick(proposal.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const totalVotes = getTotalVotes();

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md hover:border-border/60 ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Proposal: ${proposal.title}`}
    >
      {/* Card Header: Title + Status Badge */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <CardTitle className="text-lg font-bold text-foreground line-clamp-2">
              {proposal.title}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Created by {formatAddress(proposal.creator)}
            </CardDescription>
          </div>
          <Badge variant={getStatusBadgeVariant(proposal.status)} className="flex-shrink-0">
            {proposalStatusToString(proposal.status)}
          </Badge>
        </div>
      </CardHeader>

      {/* Card Content: Description + Voting Preview */}
      <CardContent className="space-y-4">
        {/* Description Preview */}
        <p className="text-sm text-foreground line-clamp-3">
          {truncateDescription(proposal.description)}
        </p>

        {/* Creation Date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Created: {formatDate(proposal.createdAt)}</span>
          {proposal.votingDeadline && (
            <span>Deadline: {formatDate(proposal.votingDeadline)}</span>
          )}
        </div>

        {/* Voting Results Preview */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="grid grid-cols-3 gap-2 text-xs font-medium">
            <div className="flex flex-col">
              <span className="text-green-600 dark:text-green-400">
                {proposal.forPercentage.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">For</span>
            </div>
            <div className="flex flex-col">
              <span className="text-red-600 dark:text-red-400">
                {proposal.againstPercentage.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">Against</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-600 dark:text-gray-400">
                {proposal.abstainPercentage.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">Abstain</span>
            </div>
          </div>

          {/* Voting Distribution Bar */}
          <div className="flex h-2 gap-0.5 rounded-full overflow-hidden bg-border">
            {proposal.forPercentage > 0 && (
              <div
                className="bg-green-600 dark:bg-green-500"
                style={{ width: `${proposal.forPercentage}%` }}
              />
            )}
            {proposal.againstPercentage > 0 && (
              <div
                className="bg-red-600 dark:bg-red-500"
                style={{ width: `${proposal.againstPercentage}%` }}
              />
            )}
            {proposal.abstainPercentage > 0 && (
              <div
                className="bg-gray-500 dark:bg-gray-400"
                style={{ width: `${proposal.abstainPercentage}%` }}
              />
            )}
          </div>

          {/* Vote Count */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{totalVotes.toLocaleString()} votes cast</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
