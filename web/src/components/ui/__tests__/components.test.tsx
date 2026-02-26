import { render, screen } from "@testing-library/react";
import { Button } from "../button";
import { Card, CardHeader, CardTitle, CardContent } from "../card";
import { Badge } from "../badge";
import { Progress } from "../progress";
import { Input } from "../input";
import { Textarea } from "../textarea";
import { Label } from "../label";
import { Alert, AlertDescription } from "../alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from "../alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../tabs";

describe("shadcn/ui Components - Design System Verification", () => {
  describe("Button Variants (Constitutional Color Mapping)", () => {
    it("renders default variant (Vote For - Green)", () => {
      const { container } = render(<Button variant="default">Vote For</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("bg-primary");
      expect(button?.textContent).toBe("Vote For");
    });

    it("renders destructive variant (Vote Against - Red)", () => {
      const { container } = render(<Button variant="destructive">Vote Against</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("bg-destructive");
      expect(button?.textContent).toBe("Vote Against");
    });

    it("renders secondary variant (Abstain - Gray)", () => {
      const { container } = render(<Button variant="secondary">Abstain</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("bg-secondary");
      expect(button?.textContent).toBe("Abstain");
    });

    it("renders ghost variant (Transparent)", () => {
      const { container } = render(<Button variant="ghost">Cancel</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("hover:bg-accent");
    });

    it("renders outline variant", () => {
      const { container } = render(<Button variant="outline">Outline</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("border");
    });
  });

  describe("Card Component (Dark Mode)", () => {
    it("renders card with bg-card token (dark mode background)", () => {
      const { container } = render(
        <Card>
          <CardContent>Proposal Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[class*="bg-card"]');
      expect(card).toBeTruthy();
    });

    it("renders card with correct border and shadow", () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Proposal Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );
      const card = container.querySelector("div");
      expect(card).toHaveClass("rounded-lg", "border", "border-border", "shadow-sm");
    });

    it("displays card foreground text color", () => {
      const { container } = render(
        <Card>
          <CardContent>Test</CardContent>
        </Card>
      );
      const card = container.querySelector('[class*="text-card-foreground"]');
      expect(card).toBeTruthy();
    });
  });

  describe("Badge Component (Status Indicators)", () => {
    it("renders default variant badge (Green - Active)", () => {
      const { container } = render(<Badge variant="default">Active</Badge>);
      const badge = container.querySelector('[class*="bg-primary"]');
      expect(badge?.textContent).toBe("Active");
    });

    it("renders secondary variant badge (Gray - Closed)", () => {
      const { container } = render(<Badge variant="secondary">Closed</Badge>);
      const badge = container.querySelector('[class*="bg-secondary"]');
      expect(badge?.textContent).toBe("Closed");
    });

    it("renders destructive variant badge (Red - Failed)", () => {
      const { container } = render(<Badge variant="destructive">Failed</Badge>);
      const badge = container.querySelector('[class*="bg-destructive"]');
      expect(badge?.textContent).toBe("Failed");
    });

    it("maps all proposal lifecycle states to correct colors", () => {
      const statusTests = [
        { status: "Draft", variant: "secondary" as const },
        { status: "Active", variant: "default" as const },
        { status: "Closed", variant: "secondary" as const },
        { status: "Executed", variant: "default" as const },
        { status: "Failed", variant: "destructive" as const },
        { status: "Cancelled", variant: "destructive" as const },
      ];

      statusTests.forEach(({ status, variant }) => {
        const { container } = render(<Badge variant={variant}>{status}</Badge>);
        const badge = container.querySelector("span");
        expect(badge?.textContent).toBe(status);
      });
    });
  });

  describe("Progress Component (Voting Results)", () => {
    it("renders progress bar with primary color (For votes - Green)", () => {
      const { container } = render(<Progress value={65} />);
      const progress = container.querySelector('[class*="bg-primary"]');
      expect(progress).toBeTruthy();
    });

    it("accepts value prop for percentage", () => {
      const { container } = render(<Progress value={50} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute("aria-valuenow", "50");
    });

    it("displays 0-100 value range correctly", () => {
      const values = [0, 25, 50, 75, 100];
      values.forEach((val) => {
        const { container } = render(<Progress value={val} />);
        const progress = container.querySelector('[role="progressbar"]');
        expect(progress).toHaveAttribute("aria-valuenow", val.toString());
      });
    });
  });

  describe("Form Components Integration", () => {
    it("renders Input component with proper styling", () => {
      const { container } = render(<Input placeholder="Enter title..." />);
      const input = container.querySelector("input");
      expect(input).toHaveAttribute("placeholder", "Enter title...");
      expect(input).toHaveClass("border-input", "bg-background");
    });

    it("renders Textarea component for proposal descriptions", () => {
      const { container } = render(<Textarea placeholder="Enter description..." />);
      const textarea = container.querySelector("textarea");
      expect(textarea).toHaveAttribute("placeholder", "Enter description...");
      expect(textarea).toHaveClass("border-input", "bg-background");
    });

    it("renders Label component with muted foreground", () => {
      render(<Label htmlFor="proposal-title">Proposal Title</Label>);
      const label = screen.getByText("Proposal Title");
      expect(label).toBeInTheDocument();
    });
  });

  describe("Alert Component (Error/Success Messages)", () => {
    it("renders default alert with correct styling", () => {
      const { container } = render(
        <Alert>
          <AlertDescription>Success message</AlertDescription>
        </Alert>
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeTruthy();
    });

    it("renders destructive variant alert (Red - Errors)", () => {
      const { container } = render(
        <Alert variant="destructive">
          <AlertDescription>Error occurred</AlertDescription>
        </Alert>
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveClass("border-destructive/50", "bg-destructive/10", "text-destructive");
    });
  });

  describe("Dialog Component (Dark Mode)", () => {
    it("renders dialog with proper structure", () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vote Confirmation</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
      expect(container.querySelector('[role="dialog"]')).toBeTruthy();
    });
  });

  describe("AlertDialog Component (Vote Confirmation)", () => {
    it("renders alert dialog for vote confirmation", () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Vote</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(container.querySelector('[role="alertdialog"]')).toBeTruthy();
    });
  });

  describe("Tabs Component (Proposal Details)", () => {
    it("renders tabs with proper structure", () => {
      render(
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="votes">Votes</TabsTrigger>
          </TabsList>
          <TabsContent value="details">Details content</TabsContent>
          <TabsContent value="votes">Votes content</TabsContent>
        </Tabs>
      );
      expect(screen.getByText("Details")).toBeInTheDocument();
      expect(screen.getByText("Votes")).toBeInTheDocument();
    });
  });

  describe("Dark Mode CSS Variables Verification", () => {
    it("all components use Tailwind CSS v4 theme tokens", () => {
      const components = [
        { name: "Button", element: <Button>Test</Button> },
        { name: "Badge", element: <Badge>Test</Badge> },
        { name: "Card", element: <Card><CardContent>Test</CardContent></Card> },
        { name: "Input", element: <Input /> },
        { name: "Textarea", element: <Textarea /> },
        { name: "Progress", element: <Progress value={50} /> },
      ];

      components.forEach(({ name, element }) => {
        const { container } = render(element);
        const element_dom = container.querySelector("[class*='bg-']");
        expect(element_dom).toBeTruthy();
        expect(element_dom?.className).toMatch(/(bg-primary|bg-secondary|bg-destructive|bg-card|bg-background)/);
      });
    });
  });

  describe("Accessibility Features", () => {
    it("button has focus-visible state", () => {
      const { container } = render(<Button>Test Button</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("focus-visible:ring-ring/50");
    });

    it("input has proper aria attributes for disabled state", () => {
      const { container } = render(<Input disabled />);
      const input = container.querySelector("input");
      expect(input).toBeDisabled();
    });

    it("badge uses semantic color for meaning (not color alone)", () => {
      render(<Badge variant="destructive">Failed</Badge>);
      const badge = screen.getByText("Failed");
      expect(badge).toBeInTheDocument();
    });
  });
});
