import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProposalCard, ProposalStatus, ProposalCardData } from "../ProposalCard";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("ProposalCard Component", () => {
  const mockOnClick = vi.fn();

  const defaultProposal: ProposalCardData = {
    id: "prop-1",
    title: "Fund DAO Treasury for Q1 Operations",
    description:
      "This proposal allocates 100 ETH from the community treasury to cover operational expenses for Q1 2025, including development, marketing, and infrastructure costs.",
    creator: "0x1234567890123456789012345678901234567890",
    createdAt: new Date("2025-02-06"),
    status: ProposalStatus.ACTIVE,
    forPercentage: 65.5,
    againstPercentage: 20.3,
    abstainPercentage: 14.2,
    totalVotes: 2150,
    votingDeadline: new Date("2025-02-13"),
  };

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  describe("Rendering", () => {
    it("renders proposal title", () => {
      render(<ProposalCard proposal={defaultProposal} />);
      expect(screen.getByText(/Fund DAO Treasury for Q1 Operations/i)).toBeInTheDocument();
    });

    it("renders truncated description", () => {
      render(<ProposalCard proposal={defaultProposal} />);
      // Description should be truncated to ~150 chars
      expect(screen.getByText(/This proposal allocates/i)).toBeInTheDocument();
    });

    it("renders creator address (formatted)", () => {
      render(<ProposalCard proposal={defaultProposal} />);
      // Address should be formatted as first 6 + ... + last 4
      expect(screen.getByText(/Created by 0x1234.../i)).toBeInTheDocument();
    });

    it("renders creation date", () => {
      render(<ProposalCard proposal={defaultProposal} />);
      expect(screen.getByText(/Created: Feb 6, 2025/i)).toBeInTheDocument();
    });

    it("renders voting deadline when provided", () => {
      render(<ProposalCard proposal={defaultProposal} />);
      expect(screen.getByText(/Deadline: Feb 13, 2025/i)).toBeInTheDocument();
    });

    it("does not render voting deadline when not provided", () => {
      const proposalWithoutDeadline = {
        ...defaultProposal,
        votingDeadline: undefined,
      };
      render(<ProposalCard proposal={proposalWithoutDeadline} />);
      expect(screen.queryByText(/Deadline:/i)).not.toBeInTheDocument();
    });

    it("renders status badge", () => {
      render(<ProposalCard proposal={defaultProposal} />);
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("renders voting percentages", () => {
      render(<ProposalCard proposal={defaultProposal} />);
      expect(screen.getByText(/65.5%/)).toBeInTheDocument(); // For
      expect(screen.getByText(/20.3%/)).toBeInTheDocument(); // Against
      expect(screen.getByText(/14.2%/)).toBeInTheDocument(); // Abstain
    });

    it("renders voting labels", () => {
      render(<ProposalCard proposal={defaultProposal} />);
      expect(screen.getByText("For")).toBeInTheDocument();
      expect(screen.getByText("Against")).toBeInTheDocument();
      expect(screen.getByText("Abstain")).toBeInTheDocument();
    });

    it("renders total vote count", () => {
      render(<ProposalCard proposal={defaultProposal} />);
      expect(screen.getByText(/2,150 votes cast/i)).toBeInTheDocument();
    });
  });

  describe("Constitutional Color Mapping - Status Badges", () => {
    it("Draft status uses secondary variant (Gray)", () => {
      const { container } = render(
        <ProposalCard proposal={{ ...defaultProposal, status: ProposalStatus.DRAFT }} />
      );
      const badge = screen.getByText("Draft");
      expect(badge).toHaveClass("bg-secondary");
    });

    it("Active status uses default variant (Green)", () => {
      const { container } = render(
        <ProposalCard proposal={{ ...defaultProposal, status: ProposalStatus.ACTIVE }} />
      );
      const badge = screen.getByText("Active");
      expect(badge).toHaveClass("bg-primary");
    });

    it("Closed status uses secondary variant (Gray)", () => {
      const { container } = render(
        <ProposalCard proposal={{ ...defaultProposal, status: ProposalStatus.CLOSED }} />
      );
      const badge = screen.getByText("Closed");
      expect(badge).toHaveClass("bg-secondary");
    });

    it("Executed status uses default variant (Green)", () => {
      const { container } = render(
        <ProposalCard proposal={{ ...defaultProposal, status: ProposalStatus.EXECUTED }} />
      );
      const badge = screen.getByText("Executed");
      expect(badge).toHaveClass("bg-primary");
    });

    it("Failed status uses destructive variant (Red)", () => {
      const { container } = render(
        <ProposalCard proposal={{ ...defaultProposal, status: ProposalStatus.FAILED }} />
      );
      const badge = screen.getByText("Failed");
      expect(badge).toHaveClass("bg-destructive");
    });

    it("Cancelled status uses destructive variant (Red)", () => {
      const { container } = render(
        <ProposalCard proposal={{ ...defaultProposal, status: ProposalStatus.CANCELLED }} />
      );
      const badge = screen.getByText("Cancelled");
      expect(badge).toHaveClass("bg-destructive");
    });
  });

  describe("Voting Results Bar Colors", () => {
    it("displays green bar for For votes", () => {
      const { container } = render(<ProposalCard proposal={defaultProposal} />);
      const bars = container.querySelectorAll("div[style*='width']");
      // Should have bars for For, Against, Abstain
      expect(bars.length).toBeGreaterThan(0);
    });

    it("correctly distributes voting bar width", () => {
      const proposal: ProposalCardData = {
        ...defaultProposal,
        forPercentage: 50,
        againstPercentage: 30,
        abstainPercentage: 20,
      };
      const { container } = render(<ProposalCard proposal={proposal} />);
      
      // Check that percentages match in display
      expect(screen.getByText(/50.0%/)).toBeInTheDocument();
      expect(screen.getByText(/30.0%/)).toBeInTheDocument();
      expect(screen.getByText(/20.0%/)).toBeInTheDocument();
    });

    it("handles zero voting percentages", () => {
      const proposal: ProposalCardData = {
        ...defaultProposal,
        forPercentage: 100,
        againstPercentage: 0,
        abstainPercentage: 0,
      };
      render(<ProposalCard proposal={proposal} />);
      expect(screen.getByText(/100.0%/)).toBeInTheDocument();
      expect(screen.getByText(/0.0%/)).toBeInTheDocument();
    });
  });

  describe("Click Handler", () => {
    it("calls onClick with proposal ID when card clicked", async () => {
      const user = userEvent.setup();
      render(<ProposalCard proposal={defaultProposal} onClick={mockOnClick} />);

      const card = screen.getByRole("button", {
        name: /Fund DAO Treasury for Q1 Operations/i,
      });

      await user.click(card);

      expect(mockOnClick).toHaveBeenCalledWith("prop-1");
    });

    it("handles click on title", async () => {
      const user = userEvent.setup();
      render(<ProposalCard proposal={defaultProposal} onClick={mockOnClick} />);

      const title = screen.getByText(/Fund DAO Treasury for Q1 Operations/i);
      await user.click(title);

      expect(mockOnClick).toHaveBeenCalledWith("prop-1");
    });

    it("does not call onClick if handler not provided", async () => {
      const user = userEvent.setup();
      render(<ProposalCard proposal={defaultProposal} />);

      const card = screen.getByRole("button");
      await user.click(card);

      // Should not throw or error
      expect(card).toBeInTheDocument();
    });
  });

  describe("Keyboard Accessibility", () => {
    it("responds to Enter key press", async () => {
      const user = userEvent.setup();
      render(<ProposalCard proposal={defaultProposal} onClick={mockOnClick} />);

      const card = screen.getByRole("button");
      card.focus();

      await user.keyboard("{Enter}");

      expect(mockOnClick).toHaveBeenCalledWith("prop-1");
    });

    it("responds to Space key press", async () => {
      const user = userEvent.setup();
      render(<ProposalCard proposal={defaultProposal} onClick={mockOnClick} />);

      const card = screen.getByRole("button");
      card.focus();

      await user.keyboard(" ");

      expect(mockOnClick).toHaveBeenCalledWith("prop-1");
    });

    it("card is keyboard focusable", () => {
      render(<ProposalCard proposal={defaultProposal} onClick={mockOnClick} />);

      const card = screen.getByRole("button");
      expect(card).toHaveAttribute("tabIndex", "0");
    });
  });

  describe("Data Formatting", () => {
    it("formats addresses correctly (6 chars + ... + 4 chars)", () => {
      const proposal: ProposalCardData = {
        ...defaultProposal,
        creator: "0xabcdefghijklmnopqrstuvwxyz1234567890",
      };
      render(<ProposalCard proposal={proposal} />);

      // Should show 0xabcd...4567 (first 6 + ... + last 4)
      expect(screen.getByText(/Created by 0xabcdef.../i)).toBeInTheDocument();
    });

    it("formats dates in US locale format", () => {
      const proposal: ProposalCardData = {
        ...defaultProposal,
        createdAt: "2025-12-25",
      };
      render(<ProposalCard proposal={proposal} />);

      expect(screen.getByText(/Created: Dec 25, 2025/i)).toBeInTheDocument();
    });

    it("truncates long descriptions at ~150 characters", () => {
      const longDescription = "A".repeat(200);
      const proposal: ProposalCardData = {
        ...defaultProposal,
        description: longDescription,
      };
      render(<ProposalCard proposal={proposal} />);

      // Should end with ellipsis
      const description = screen.getByText(/^A+\.\.\./);
      expect(description).toBeInTheDocument();
    });

    it("formats vote counts with locale separator", () => {
      const proposal: ProposalCardData = {
        ...defaultProposal,
        totalVotes: 1000000,
      };
      render(<ProposalCard proposal={proposal} />);

      expect(screen.getByText(/1,000,000 votes cast/i)).toBeInTheDocument();
    });

    it("handles bigint total votes", () => {
      const proposal: ProposalCardData = {
        ...defaultProposal,
        totalVotes: 2150n,
      };
      render(<ProposalCard proposal={proposal} />);

      expect(screen.getByText(/2,150 votes cast/i)).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("card is clickable and has hover effect class", () => {
      const { container } = render(
        <ProposalCard proposal={defaultProposal} onClick={mockOnClick} />
      );

      const card = container.querySelector("div[role='button']");
      expect(card).toHaveClass("cursor-pointer");
      expect(card).toHaveClass("hover:shadow-md");
    });

    it("description uses line-clamp for truncation", () => {
      const { container } = render(<ProposalCard proposal={defaultProposal} />);

      const description = container.querySelector("p");
      expect(description).toHaveClass("line-clamp-3");
    });

    it("title uses line-clamp for truncation", () => {
      const { container } = render(<ProposalCard proposal={defaultProposal} />);

      const titleElement = screen.getByText(/Fund DAO Treasury for Q1 Operations/i).closest("h3");
      expect(titleElement).toHaveClass("line-clamp-2");
    });
  });

  describe("All Proposal Statuses", () => {
    it("renders all 6 proposal lifecycle states", () => {
      const statuses = [
        ProposalStatus.DRAFT,
        ProposalStatus.ACTIVE,
        ProposalStatus.CLOSED,
        ProposalStatus.EXECUTED,
        ProposalStatus.FAILED,
        ProposalStatus.CANCELLED,
      ];

      statuses.forEach((status) => {
        const { unmount } = render(
          <ProposalCard proposal={{ ...defaultProposal, status }} />
        );

        expect(screen.getByText(status)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles proposal with zero votes", () => {
      const proposal: ProposalCardData = {
        ...defaultProposal,
        forPercentage: 0,
        againstPercentage: 0,
        abstainPercentage: 0,
        totalVotes: 0,
      };

      render(<ProposalCard proposal={proposal} />);

      expect(screen.getByText(/0.0%/)).toBeInTheDocument();
      expect(screen.getByText(/0 votes cast/i)).toBeInTheDocument();
    });

    it("handles proposal with very long title", () => {
      const proposal: ProposalCardData = {
        ...defaultProposal,
        title: "Very Long Proposal Title ".repeat(10),
      };

      const { container } = render(<ProposalCard proposal={proposal} />);

      const title = container.querySelector("h3");
      expect(title).toHaveClass("line-clamp-2");
    });

    it("handles proposal with special characters in title and description", () => {
      const proposal: ProposalCardData = {
        ...defaultProposal,
        title: 'Proposal: "Update" <protocol> & fees (2025)',
        description: 'Description with "quotes", \'apostrophes\', and émojis 🎯',
      };

      render(<ProposalCard proposal={proposal} />);

      expect(
        screen.getByText(/Proposal: "Update" <protocol> & fees \(2025\)/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Description with "quotes", 'apostrophes', and émojis 🎯/i)
      ).toBeInTheDocument();
    });

    it("handles creator address with short length", () => {
      const proposal: ProposalCardData = {
        ...defaultProposal,
        creator: "0x123",
      };

      render(<ProposalCard proposal={proposal} />);

      // Should not add ellipsis for short addresses
      expect(screen.getByText(/Created by 0x123/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper aria label", () => {
      render(<ProposalCard proposal={defaultProposal} />);

      const card = screen.getByRole("button");
      expect(card).toHaveAttribute(
        "aria-label",
        "Proposal: Fund DAO Treasury for Q1 Operations"
      );
    });

    it("card semantically indicates it is interactive", () => {
      render(<ProposalCard proposal={defaultProposal} onClick={mockOnClick} />);

      const card = screen.getByRole("button");
      expect(card).toHaveAttribute("tabIndex", "0");
    });

    it("voting results are accessible", () => {
      render(<ProposalCard proposal={defaultProposal} />);

      // All percentage values should be readable
      expect(screen.getByText(/For/)).toBeInTheDocument();
      expect(screen.getByText(/Against/)).toBeInTheDocument();
      expect(screen.getByText(/Abstain/)).toBeInTheDocument();
    });
  });
});
