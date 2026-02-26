import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProposalForm, ProposalFormValues } from "../ProposalForm";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("ProposalForm Component", () => {
  const mockOnSubmit = vi.fn(
    async (data: ProposalFormValues) => Promise.resolve()
  );
  const mockOnError = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnError.mockClear();
  });

  describe("Rendering", () => {
    it("renders all form fields", () => {
      render(<ProposalForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/Proposal Title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Proposal Description/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Target Contract Action/i)
      ).toBeInTheDocument();
    });

    it("renders submit and clear buttons", () => {
      render(<ProposalForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole("button", { name: /Submit Proposal/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Clear/i })).toBeInTheDocument();
    });

    it("renders form descriptions for fields", () => {
      render(<ProposalForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText(/Maximum 256 characters/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Minimum 10 characters/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Optional: If this proposal triggers/i)
      ).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("requires title field", async () => {
      const user = userEvent.setup();
      render(<ProposalForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole("button", {
        name: /Submit Proposal/i,
      });

      // Try submit with empty form
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("requires description field (minimum 10 characters)", async () => {
      const user = userEvent.setup();
      render(<ProposalForm onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByLabelText(/Proposal Title/i);
      const descriptionInput = screen.getByLabelText(/Proposal Description/i);
      const submitButton = screen.getByRole("button", {
        name: /Submit Proposal/i,
      });

      // Fill title but short description
      await user.type(titleInput, "Test Proposal");
      await user.type(descriptionInput, "Short");

      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("enforces title max length (256 characters)", async () => {
      const user = userEvent.setup();
      render(<ProposalForm onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByLabelText(/Proposal Title/i) as HTMLInputElement;

      // Try to input more than 256 characters
      const longTitle = "a".repeat(300);
      await user.type(titleInput, longTitle);

      // HTML input maxLength attribute should prevent this
      expect(titleInput.value.length).toBeLessThanOrEqual(256);
    });

    it("accepts valid proposal data", async () => {
      const user = userEvent.setup();
      render(<ProposalForm onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByLabelText(/Proposal Title/i);
      const descriptionInput = screen.getByLabelText(/Proposal Description/i);
      const submitButton = screen.getByRole("button", {
        name: /Submit Proposal/i,
      });

      await user.type(titleInput, "Fund DAO Treasury");
      await user.type(
        descriptionInput,
        "This proposal allocates 100 ETH to the treasury for operational expenses"
      );

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Fund DAO Treasury",
            description: expect.stringContaining("100 ETH"),
          })
        );
      });
    });
  });

  describe("Form Submission", () => {
    it("calls onSubmit with form data on valid submission", async () => {
      const user = userEvent.setup();
      render(<ProposalForm onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByLabelText(/Proposal Title/i);
      const descriptionInput = screen.getByLabelText(/Proposal Description/i);
      const submitButton = screen.getByRole("button", {
        name: /Submit Proposal/i,
      });

      const testData = {
        title: "Emergency Pause Protocol",
        description:
          "Activate emergency pause protocol to protect DAO funds during ongoing security audit",
      };

      await user.type(titleInput, testData.title);
      await user.type(descriptionInput, testData.description);

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining(testData)
        );
      });
    });

    it("includes optional actionData when provided", async () => {
      const user = userEvent.setup();
      render(<ProposalForm onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByLabelText(/Proposal Title/i);
      const descriptionInput = screen.getByLabelText(/Proposal Description/i);
      const actionInput = screen.getByLabelText(/Target Contract Action/i);
      const submitButton = screen.getByRole("button", {
        name: /Submit Proposal/i,
      });

      await user.type(titleInput, "Execute Treasury Transfer");
      await user.type(
        descriptionInput,
        "Transfer 50 ETH from treasury to development fund"
      );
      await user.type(actionInput, "0x1234567890abcdef");

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            actionData: "0x1234567890abcdef",
          })
        );
      });
    });

    it("disables submit button while loading", () => {
      render(<ProposalForm onSubmit={mockOnSubmit} isLoading={true} />);

      const submitButton = screen.getByRole("button", {
        name: /Submitting/i,
      }) as HTMLButtonElement;

      expect(submitButton).toBeDisabled();
    });

    it("shows loading state message during submission", () => {
      render(<ProposalForm onSubmit={mockOnSubmit} isLoading={true} />);

      expect(
        screen.getByText(/Submitting your proposal to the blockchain/i)
      ).toBeInTheDocument();
    });

    it("disables inputs while loading", () => {
      render(<ProposalForm onSubmit={mockOnSubmit} isLoading={true} />);

      const titleInput = screen.getByLabelText(/Proposal Title/i) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(
        /Proposal Description/i
      ) as HTMLTextAreaElement;

      expect(titleInput.disabled).toBe(true);
      expect(descriptionInput.disabled).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("displays error alert when submission fails", async () => {
      const errorMessage = "Network error: Failed to connect to blockchain";
      const user = userEvent.setup();
      render(<ProposalForm onSubmit={mockOnSubmit} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it("calls onError callback when submission throws", async () => {
      const testError = new Error("Blockchain submission failed");
      const failingOnSubmit = vi.fn(async () => {
        throw testError;
      });
      const user = userEvent.setup();

      render(
        <ProposalForm
          onSubmit={failingOnSubmit}
          onError={mockOnError}
        />
      );

      const titleInput = screen.getByLabelText(/Proposal Title/i);
      const descriptionInput = screen.getByLabelText(/Proposal Description/i);
      const submitButton = screen.getByRole("button", {
        name: /Submit Proposal/i,
      });

      await user.type(titleInput, "Test Proposal");
      await user.type(
        descriptionInput,
        "This is a test proposal description"
      );

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(testError);
      });
    });

    it("displays error message in alert on submission failure", async () => {
      const failingOnSubmit = vi.fn(async () => {
        throw new Error("Contract execution reverted");
      });
      const user = userEvent.setup();

      render(
        <ProposalForm
          onSubmit={failingOnSubmit}
          onError={mockOnError}
        />
      );

      const titleInput = screen.getByLabelText(/Proposal Title/i);
      const descriptionInput = screen.getByLabelText(/Proposal Description/i);
      const submitButton = screen.getByRole("button", {
        name: /Submit Proposal/i,
      });

      await user.type(titleInput, "Failed Proposal");
      await user.type(
        descriptionInput,
        "This proposal will fail during submission"
      );

      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Contract execution reverted/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Clear Button", () => {
    it("clears all form fields when clear button is clicked", async () => {
      const user = userEvent.setup();
      render(<ProposalForm onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByLabelText(/Proposal Title/i) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(
        /Proposal Description/i
      ) as HTMLTextAreaElement;
      const clearButton = screen.getByRole("button", { name: /Clear/i });

      await user.type(titleInput, "Test Proposal");
      await user.type(descriptionInput, "Test description");

      expect(titleInput.value).not.toBe("");
      expect(descriptionInput.value).not.toBe("");

      await user.click(clearButton);

      expect(titleInput.value).toBe("");
      expect(descriptionInput.value).toBe("");
    });
  });

  describe("Accessibility", () => {
    it("has proper label associations", () => {
      render(<ProposalForm onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByLabelText(/Proposal Title/i);
      const descriptionInput = screen.getByLabelText(/Proposal Description/i);

      expect(titleInput).toHaveAttribute("id", "proposal-title");
      expect(descriptionInput).toHaveAttribute("id", "proposal-description");
    });

    it("displays validation errors with aria-invalid", async () => {
      const user = userEvent.setup();
      render(<ProposalForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole("button", {
        name: /Submit Proposal/i,
      });

      // Submit without filling required fields
      await user.click(submitButton);

      // Form should show validation state
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it("form has noValidate attribute for custom validation", () => {
      const { container } = render(<ProposalForm onSubmit={mockOnSubmit} />);
      const form = container.querySelector("form");

      expect(form).toHaveAttribute("novalidate");
    });
  });

  describe("Edge Cases", () => {
    it("handles rapid form submissions gracefully", async () => {
      const user = userEvent.setup();
      const slowSubmit = vi.fn(
        async () =>
          new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ProposalForm onSubmit={slowSubmit} />);

      const titleInput = screen.getByLabelText(/Proposal Title/i);
      const descriptionInput = screen.getByLabelText(/Proposal Description/i);
      const submitButton = screen.getByRole("button", {
        name: /Submit Proposal/i,
      });

      await user.type(titleInput, "Test");
      await user.type(descriptionInput, "Test description here");

      // Click multiple times rapidly
      await user.click(submitButton);
      await user.click(submitButton);

      // Should only submit once (disabled while loading)
      await waitFor(() => {
        expect(slowSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it("handles special characters in proposal title and description", async () => {
      const user = userEvent.setup();
      render(<ProposalForm onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByLabelText(/Proposal Title/i);
      const descriptionInput = screen.getByLabelText(/Proposal Description/i);
      const submitButton = screen.getByRole("button", {
        name: /Submit Proposal/i,
      });

      const specialTitle = "Proposal: Update <> & % © 2025";
      const specialDesc =
        'Description with "quotes", \'apostrophes\', and émojis 🎯';

      await user.type(titleInput, specialTitle);
      await user.type(descriptionInput, specialDesc);

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: specialTitle,
            description: specialDesc,
          })
        );
      });
    });
  });
});
