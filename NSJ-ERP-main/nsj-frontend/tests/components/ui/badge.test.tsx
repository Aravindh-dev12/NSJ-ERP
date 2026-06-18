import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge, badgeVariants } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders with default variant", () => {
    render(<Badge>Default Badge</Badge>);
    expect(screen.getByText("Default Badge")).toBeInTheDocument();
  });

  it("renders with secondary variant", () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);
    const badge = screen.getByText("Secondary Badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-secondary");
  });

  it("renders with destructive variant", () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>);
    const badge = screen.getByText("Destructive Badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-destructive");
  });

  it("renders with outline variant", () => {
    render(<Badge variant="outline">Outline Badge</Badge>);
    const badge = screen.getByText("Outline Badge");
    expect(badge).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);
    const badge = screen.getByText("Custom Badge");
    expect(badge).toHaveClass("custom-class");
  });

  it("renders children correctly", () => {
    render(
      <Badge>
        <span>Child Element</span>
      </Badge>
    );
    expect(screen.getByText("Child Element")).toBeInTheDocument();
  });

  it("badgeVariants returns correct classes for default", () => {
    const classes = badgeVariants({ variant: "default" });
    expect(classes).toContain("bg-primary");
  });

  it("badgeVariants returns correct classes for secondary", () => {
    const classes = badgeVariants({ variant: "secondary" });
    expect(classes).toContain("bg-secondary");
  });

  it("badgeVariants returns correct classes for destructive", () => {
    const classes = badgeVariants({ variant: "destructive" });
    expect(classes).toContain("bg-destructive");
  });

  it("badgeVariants returns correct classes for outline", () => {
    const classes = badgeVariants({ variant: "outline" });
    expect(classes).toContain("text-foreground");
  });
});
