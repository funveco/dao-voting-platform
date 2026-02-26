import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VotingInterface, VoteChoice, VotingResults } from "../VotingInterface";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("VotingInterface Component", () => {
  const mockOnVote = vi.fn(async () => Promise.resolve());
  const mockOnError = vi.fn();

  const defaultVotingResults: VotingResults = {
    forCount: 150,
    againstCount: 45,
    abstainCount: 30,
    totalVotes: 225,
    forPercentage: 66.67,
    againstPercentage: 20,
    abstainPercentage: 13.33,
    userVotingPower: 10n,
  };

  beforeEach(() => {
    mockOnVote.mockClear();
    mockOnError.mockClear();
  });

  describe("Rendering", () => {
    it("renders all three voting buttons", () => {
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      expect(
        screen.getByRole("button", { name: /Vote For/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Vote Against/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Abstain/i })
      ).toBeInTheDocument();
    });

    it("renders voting results display", () => {
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText(/Voting Results/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Votes Cast/i)).toBeInTheDocument();
      expect(screen.getByText("225")).toBeInTheDocument(); // Total votes
    });

    it("renders result percentages", () => {
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText(/66.7%/)).toBeInTheDocument(); // For
      expect(screen.getByText(/20.0%/)).toBeInTheDocument(); // Against
      expect(screen.getByText(/13.3%/)).toBeInTheDocument(); // Abstain
    });

    it("renders vote count displays", () => {
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText("150 votes")).toBeInTheDocument(); // For
      expect(screen.getByText("45 votes")).toBeInTheDocument(); // Against
      expect(screen.getByText("30 votes")).toBeInTheDocument(); // Abstain
    });

    it("renders user voting power when provided", () => {
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText(/Your Voting Power/i)).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument(); // User voting power
    });

    it("does not render user voting power when null", () => {
      const resultsWithoutPower: VotingResults = {
        ...defaultVotingResults,
        userVotingPower: null,
      };

      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={resultsWithoutPower}
          onVote={mockOnVote}
        />
      );

      expect(screen.queryByText(/Your Voting Power/i)).not.toBeInTheDocument();
    });
  });

  describe("Constitutional Color Mapping", () => {
    it("Vote For button uses default variant (Green)", () => {
      const { container } = render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      const forButton = screen.getByRole("button", { name: /Vote For/i });
      expect(forButton).toHaveClass("bg-primary");
    });

    it("Vote Against button uses destructive variant (Red)", () => {
      const { container } = render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      const againstButton = screen.getByRole("button", {
        name: /Vote Against/i,
      });
      expect(againstButton).toHaveClass("bg-destructive");
    });

    it("Abstain button uses secondary variant (Gray)", () => {
      const { container } = render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      const abstainButton = screen.getByRole("button", { name: /Abstain/i });
      expect(abstainButton).toHaveClass("bg-secondary");
    });

    it("Badge colors match voting choices", () => {
      const { container } = render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      const badges = container.querySelectorAll("[class*='bg-']");
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe("Voting Confirmation Dialog", () => {
    it("shows confirmation dialog when Vote For button clicked", async () => {
      const user = userEvent.setup();
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      const forButton = screen.getByRole("button", { name: /Vote For/i });
      await user.click(forButton);

      expect(
        screen.getByRole("alertdialog", { hidden: false })
      ).toBeInTheDocument();
      expect(screen.getByText(/Confirm Your Vote/i)).toBeInTheDocument();
      expect(screen.getByText(/vote FOR/i)).toBeInTheDocument();
    });

    it("shows confirmation dialog when Vote Against button clicked", async () => {
      const user = userEvent.setup();
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      const againstButton = screen.getByRole("button", {
        name: /Vote Against/i,
      });
      await user.click(againstButton);

      expect(
        screen.getByRole("alertdialog", { hidden: false })
      ).toBeInTheDocument();
      expect(screen.getByText(/Confirm Your Vote/i)).toBeInTheDocument();
      expect(screen.getByText(/vote AGAINST/i)).toBeInTheDocument();
    });

    it("shows confirmation dialog when Abstain button clicked", async () => {
      const user = userEvent.setup();
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      const abstainButton = screen.getByRole("button", { name: /Abstain/i });
      await user.click(abstainButton);

      expect(
        screen.getByRole("alertdialog", { hidden: false })
      ).toBeInTheDocument();
      expect(screen.getByText(/Confirm Your Vote/i)).toBeInTheDocument();
      expect(screen.getByText(/ABSTAIN/i)).toBeInTheDocument();
    });

    it("closes dialog when Cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      const forButton = screen.getByRole("button", { name: /Vote For/i });
      await user.click(forButton);

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnVote).not.toHaveBeenCalled();
    });

    it("calls onVote with correct choice when Confirm Vote clicked", async () => {
      const user = userEvent.setup();
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      const forButton = screen.getByRole("button", { name: /Vote For/i });
      await user.click(forButton);

      const confirmButton = screen.getByRole("button", {
        name: /Confirm Vote/i,
      });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnVote).toHaveBeenCalledWith(VoteChoice.FOR);
      });
    });
  });

  describe("Already Voted State", () => {
    it("disables all voting buttons when userAlreadyVoted is true", () => {
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
          userAlreadyVoted={true}
        />
      );

      const forButton = screen.getByRole("button", { name: /Vote For/i });
      const againstButton = screen.getByRole("button", {
        name: /Vote Against/i,
      });
      const abstainButton = screen.getByRole("button", { name: /Abstain/i });

      expect(forButton).toBeDisabled();
      expect(againstButton).toBeDisabled();
      expect(abstainButton).toBeDisabled();
    });

    it("shows already voted message when userAlreadyVoted is true", () => {
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
          userAlreadyVoted={true}
        />
      );

      expect(
        screen.getByText(/You have already voted on this proposal/i)
      ).toBeInTheDocument();
    });

    it("does not prevent voting when userAlreadyVoted is false", () => {
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
          userAlreadyVoted={false}
        />
      );

      const forButton = screen.getByRole("button", { name: /Vote For/i });
      expect(forButton).not.toBeDisabled();
    });
  });

  describe("Loading State", () => {
    it("disables voting buttons while loading", () => {
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
          isLoading={true}
        />
      );

      const forButton = screen.getByRole("button", { name: /Submitting/i });
      expect(forButton).toBeDisabled();
    });

    it("shows Submitting... text on buttons while loading", () => {
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
          isLoading={true}
        />
      );

      expect(screen.getAllByText(/Submitting.../i).length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("displays error alert when error prop provided", () => {
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
          error="Failed to submit vote"
        />
      );

      expect(screen.getByText(/Failed to submit vote/i)).toBeInTheDocument();
    });

    it("disables voting buttons when error displayed", () => {
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
          error="Blockchain error"
        />
      );

      const forButton = screen.getByRole("button", { name: /Vote For/i });
      expect(forButton).toBeDisabled();
    });

    it("calls onError callback when vote submission fails", async () => {
      const failingOnVote = vi.fn(async () => {
        throw new Error("Network error");
      });

      const user = userEvent.setup();
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={failingOnVote}
          onError={mockOnError}
        />
      );

      const forButton = screen.getByRole("button", { name: /Vote For/i });
      await user.click(forButton);

      const confirmButton = screen.getByRole("button", {
        name: /Confirm Vote/i,
      });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Network error",
          })
        );
      });
    });

    it("displays error message after vote submission fails", async () => {
      const failingOnVote = vi.fn(async () => {
        throw new Error("Contract reverted");
      });

      const user = userEvent.setup();
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={failingOnVote}
          onError={mockOnError}
        />
      );

      const forButton = screen.getByRole("button", { name: /Vote For/i });
      await user.click(forButton);

      const confirmButton = screen.getByRole("button", {
        name: /Confirm Vote/i,
      });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Contract reverted/i)).toBeInTheDocument();
      });
    });
  });

  describe("BigInt Handling", () => {
    it("handles bigint vote counts correctly", () => {
      const bigIntResults: VotingResults = {
        forCount: 150n,
        againstCount: 45n,
        abstainCount: 30n,
        totalVotes: 225n,
        forPercentage: 66.67,
        againstPercentage: 20,
        abstainPercentage: 13.33,
        userVotingPower: 10n,
      };

      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={bigIntResults}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText("150 votes")).toBeInTheDocument();
      expect(screen.getByText("45 votes")).toBeInTheDocument();
      expect(screen.getByText("30 votes")).toBeInTheDocument();
      expect(screen.getByText("225")).toBeInTheDocument();
    });

    it("handles number vote counts correctly", () => {
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText("150 votes")).toBeInTheDocument();
      expect(screen.getByText("225")).toBeInTheDocument();
    });
  });

  describe("Gasless Option", () => {
    it("shows gasless option message when enabled", () => {
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
          showGaslessOption={true}
        />
      );

      expect(screen.getByText(/gasless transaction/i)).toBeInTheDocument();
      expect(
        screen.getByText(/relayer will cover the gas fees/i)
      ).toBeInTheDocument();
    });

    it("includes gasless info in confirmation dialog", async () => {
      const user = userEvent.setup();
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
          showGaslessOption={true}
        />
      );

      const forButton = screen.getByRole("button", { name: /Vote For/i });
      await user.click(forButton);

      expect(
        screen.getByText(/gasless transaction via a relayer/i)
      ).toBeInTheDocument();
    });

    it("does not show gasless option when disabled", () => {
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
          showGaslessOption={false}
        />
      );

      expect(
        screen.queryByText(/gasless transaction/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("buttons are keyboard accessible", async () => {
      const user = userEvent.setup();
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      const forButton = screen.getByRole("button", { name: /Vote For/i });

      // Tab to button and press Enter
      await user.tab();
      await user.keyboard("{Enter}");

      // Should trigger vote confirmation
      expect(
        screen.getByRole("alertdialog", { hidden: false })
      ).toBeInTheDocument();
    });

    it("dialog has proper accessibility attributes", async () => {
      const user = userEvent.setup();
      render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      const forButton = screen.getByRole("button", { name: /Vote For/i });
      await user.click(forButton);

      const dialog = screen.getByRole("alertdialog", { hidden: false });
      expect(dialog).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("voting buttons have responsive width classes", () => {
      const { container } = render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      const buttons = container.querySelectorAll("button[class*='w-full']");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("grid layout is responsive (1 col mobile, 3 cols desktop)", () => {
      const { container } = render(
        <VotingInterface
          proposalId="prop-1"
          votingResults={defaultVotingResults}
          onVote={mockOnVote}
        />
      );

      const gridContainer = container.querySelector(".grid");
      expect(gridContainer).toHaveClass("grid-cols-1");
      expect(gridContainer).toHaveClass("sm:grid-cols-3");
    });
  });

  describe("Vote Choices Enum", () => {
    it("has correct enum values", () => {
      expect(VoteChoice.FOR).toBe("FOR");
      expect(VoteChoice.AGAINST).toBe("AGAINST");
      expect(VoteChoice.ABSTAIN).toBe("ABSTAIN");
    });
  });
});
