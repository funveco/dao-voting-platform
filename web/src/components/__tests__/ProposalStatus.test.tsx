import { render, screen } from "@testing-library/react";
import { ProposalStatus as ProposalStatusComponent } from "../ProposalStatus";
import { ProposalStatus } from "../ProposalCard";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("ProposalStatus Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Status Badge Rendering", () => {
    it("renders Draft status with secondary variant (Gray)", () => {
      render(<ProposalStatusComponent status={ProposalStatus.DRAFT} />);

      const badge = screen.getByText("Draft");
      expect(badge).toHaveClass("bg-secondary");
    });

    it("renders Active status with default variant (Green)", () => {
      render(<ProposalStatusComponent status={ProposalStatus.ACTIVE} />);

      const badge = screen.getByText("Active");
      expect(badge).toHaveClass("bg-primary");
    });

    it("renders Closed status with secondary variant (Gray)", () => {
      render(<ProposalStatusComponent status={ProposalStatus.CLOSED} />);

      const badge = screen.getByText("Closed");
      expect(badge).toHaveClass("bg-secondary");
    });

    it("renders Executed status with default variant (Green)", () => {
      render(<ProposalStatusComponent status={ProposalStatus.EXECUTED} />);

      const badge = screen.getByText("Executed");
      expect(badge).toHaveClass("bg-primary");
    });

    it("renders Failed status with destructive variant (Red)", () => {
      render(<ProposalStatusComponent status={ProposalStatus.FAILED} />);

      const badge = screen.getByText("Failed");
      expect(badge).toHaveClass("bg-destructive");
    });

    it("renders Cancelled status with destructive variant (Red)", () => {
      render(<ProposalStatusComponent status={ProposalStatus.CANCELLED} />);

      const badge = screen.getByText("Cancelled");
      expect(badge).toHaveClass("bg-destructive");
    });
  });

  describe("Constitutional Color Mapping", () => {
    it("maps all active states to green (default variant)", () => {
      const activeStates = [ProposalStatus.ACTIVE, ProposalStatus.EXECUTED];

      activeStates.forEach((status) => {
        const { unmount } = render(
          <ProposalStatusComponent status={status} />
        );

        const badge = screen.getByText(status);
        expect(badge).toHaveClass("bg-primary");

        unmount();
      });
    });

    it("maps all inactive states to gray (secondary variant)", () => {
      const inactiveStates = [
        ProposalStatus.DRAFT,
        ProposalStatus.CLOSED,
      ];

      inactiveStates.forEach((status) => {
        const { unmount } = render(
          <ProposalStatusComponent status={status} />
        );

        const badge = screen.getByText(status);
        expect(badge).toHaveClass("bg-secondary");

        unmount();
      });
    });

    it("maps all negative states to red (destructive variant)", () => {
      const negativeStates = [
        ProposalStatus.FAILED,
        ProposalStatus.CANCELLED,
      ];

      negativeStates.forEach((status) => {
        const { unmount } = render(
          <ProposalStatusComponent status={status} />
        );

        const badge = screen.getByText(status);
        expect(badge).toHaveClass("bg-destructive");

        unmount();
      });
    });
  });

  describe("Countdown Timer", () => {
    it("does not show countdown by default", () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2);

      render(
        <ProposalStatusComponent
          status={ProposalStatus.ACTIVE}
          votingDeadline={futureDate}
        />
      );

      expect(screen.queryByText(/remaining/i)).not.toBeInTheDocument();
    });

    it("shows countdown when showCountdown is true", () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2);

      vi.setSystemTime(new Date("2025-02-08T10:00:00Z"));

      render(
        <ProposalStatusComponent
          status={ProposalStatus.ACTIVE}
          votingDeadline={futureDate}
          showCountdown={true}
        />
      );

      expect(screen.getByText(/remaining/i)).toBeInTheDocument();
    });

    it("shows countdown in days and hours format", () => {
      vi.setSystemTime(new Date("2025-02-08T10:00:00Z"));

      const futureDate = new Date("2025-02-10T15:00:00Z"); // 2 days, 5 hours away

      render(
        <ProposalStatusComponent
          status={ProposalStatus.ACTIVE}
          votingDeadline={futureDate}
          showCountdown={true}
        />
      );

      expect(screen.getByText(/2d 5h remaining/i)).toBeInTheDocument();
    });

    it("shows countdown in hours and minutes format", () => {
      vi.setSystemTime(new Date("2025-02-08T10:00:00Z"));

      const futureDate = new Date("2025-02-08T14:30:00Z"); // 4 hours, 30 minutes away

      render(
        <ProposalStatusComponent
          status={ProposalStatus.ACTIVE}
          votingDeadline={futureDate}
          showCountdown={true}
        />
      );

      expect(screen.getByText(/4h 30m remaining/i)).toBeInTheDocument();
    });

    it("shows countdown in minutes format", () => {
      vi.setSystemTime(new Date("2025-02-08T10:00:00Z"));

      const futureDate = new Date("2025-02-08T10:45:00Z"); // 45 minutes away

      render(
        <ProposalStatusComponent
          status={ProposalStatus.ACTIVE}
          votingDeadline={futureDate}
          showCountdown={true}
        />
      );

      expect(screen.getByText(/45m remaining/i)).toBeInTheDocument();
    });

    it("shows 'Voting ended' when deadline is in the past", () => {
      vi.setSystemTime(new Date("2025-02-08T10:00:00Z"));

      const pastDate = new Date("2025-02-08T09:00:00Z");

      render(
        <ProposalStatusComponent
          status={ProposalStatus.CLOSED}
          votingDeadline={pastDate}
          showCountdown={true}
        />
      );

      expect(screen.getByText(/Voting ended/i)).toBeInTheDocument();
    });

    it("does not show countdown for non-Active statuses", () => {
      vi.setSystemTime(new Date("2025-02-08T10:00:00Z"));

      const futureDate = new Date("2025-02-10T10:00:00Z");

      const nonActiveStatuses = [
        ProposalStatus.DRAFT,
        ProposalStatus.CLOSED,
        ProposalStatus.EXECUTED,
        ProposalStatus.FAILED,
        ProposalStatus.CANCELLED,
      ];

      nonActiveStatuses.forEach((status) => {
        const { unmount } = render(
          <ProposalStatusComponent
            status={status}
            votingDeadline={futureDate}
            showCountdown={true}
          />
        );

        expect(screen.queryByText(/remaining/i)).not.toBeInTheDocument();

        unmount();
      });
    });

    it("handles string deadline format", () => {
      vi.setSystemTime(new Date("2025-02-08T10:00:00Z"));

      const futureDate = "2025-02-08T14:00:00Z"; // 4 hours away (string)

      render(
        <ProposalStatusComponent
          status={ProposalStatus.ACTIVE}
          votingDeadline={futureDate}
          showCountdown={true}
        />
      );

      expect(screen.getByText(/4h remaining/i)).toBeInTheDocument();
    });
  });

  describe("Styling & Layout", () => {
    it("accepts className prop and applies it", () => {
      const { container } = render(
        <ProposalStatusComponent
          status={ProposalStatus.ACTIVE}
          className="custom-class"
        />
      );

      const wrapper = container.querySelector(".custom-class");
      expect(wrapper).toBeInTheDocument();
    });

    it("arranges content in column layout with gap", () => {
      const { container } = render(
        <ProposalStatusComponent
          status={ProposalStatus.ACTIVE}
          votingDeadline={new Date()}
          showCountdown={true}
        />
      );

      const wrapper = container.querySelector(".flex");
      expect(wrapper).toHaveClass("flex-col");
      expect(wrapper).toHaveClass("gap-1");
    });

    it("displays countdown text in muted gray color", () => {
      vi.setSystemTime(new Date("2025-02-08T10:00:00Z"));

      const futureDate = new Date("2025-02-08T12:00:00Z");

      render(
        <ProposalStatusComponent
          status={ProposalStatus.ACTIVE}
          votingDeadline={futureDate}
          showCountdown={true}
        />
      );

      const countdown = screen.getByText(/2h remaining/i);
      expect(countdown).toHaveClass("text-muted-foreground");
    });
  });

  describe("Edge Cases", () => {
    it("handles deadline exactly at current time", () => {
      const now = new Date("2025-02-08T10:00:00Z");
      vi.setSystemTime(now);

      render(
        <ProposalStatusComponent
          status={ProposalStatus.ACTIVE}
          votingDeadline={now}
          showCountdown={true}
        />
      );

      expect(screen.getByText(/Voting ended/i)).toBeInTheDocument();
    });

    it("handles very far future deadline", () => {
      vi.setSystemTime(new Date("2025-02-08T10:00:00Z"));

      const futureDate = new Date("2026-12-31T23:59:59Z"); // ~325 days away

      render(
        <ProposalStatusComponent
          status={ProposalStatus.ACTIVE}
          votingDeadline={futureDate}
          showCountdown={true}
        />
      );

      expect(screen.getByText(/remaining/i)).toBeInTheDocument();
    });

    it("handles 1 minute remaining correctly", () => {
      vi.setSystemTime(new Date("2025-02-08T10:00:00Z"));

      const futureDate = new Date("2025-02-08T10:01:00Z"); // 1 minute away

      render(
        <ProposalStatusComponent
          status={ProposalStatus.ACTIVE}
          votingDeadline={futureDate}
          showCountdown={true}
        />
      );

      expect(screen.getByText(/1m remaining/i)).toBeInTheDocument();
    });

    it("handles 1 day remaining correctly", () => {
      vi.setSystemTime(new Date("2025-02-08T10:00:00Z"));

      const futureDate = new Date("2025-02-09T10:00:00Z"); // 1 day away

      render(
        <ProposalStatusComponent
          status={ProposalStatus.ACTIVE}
          votingDeadline={futureDate}
          showCountdown={true}
        />
      );

      expect(screen.getByText(/1d 0h remaining/i)).toBeInTheDocument();
    });
  });

  describe("All 6 Proposal States", () => {
    it("renders all 6 lifecycle states correctly", () => {
      const allStatuses = [
        ProposalStatus.DRAFT,
        ProposalStatus.ACTIVE,
        ProposalStatus.CLOSED,
        ProposalStatus.EXECUTED,
        ProposalStatus.FAILED,
        ProposalStatus.CANCELLED,
      ];

      allStatuses.forEach((status) => {
        const { unmount } = render(
          <ProposalStatusComponent status={status} />
        );

        expect(screen.getByText(status)).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe("Accessibility", () => {
    it("badge is accessible with semantic markup", () => {
      const { container } = render(
        <ProposalStatusComponent status={ProposalStatus.ACTIVE} />
      );

      const badge = screen.getByText("Active");
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain("bg-primary");
    });

    it("countdown text has proper color contrast", () => {
      vi.setSystemTime(new Date("2025-02-08T10:00:00Z"));

      const futureDate = new Date("2025-02-08T12:00:00Z");

      render(
        <ProposalStatusComponent
          status={ProposalStatus.ACTIVE}
          votingDeadline={futureDate}
          showCountdown={true}
        />
      );

      const countdown = screen.getByText(/remaining/i);
      expect(countdown).toHaveClass("text-xs");
      expect(countdown).toHaveClass("text-muted-foreground");
    });
  });
});

// Helper to handle afterEach in vitest
function afterEach(callback: () => void) {
  callback();
}
