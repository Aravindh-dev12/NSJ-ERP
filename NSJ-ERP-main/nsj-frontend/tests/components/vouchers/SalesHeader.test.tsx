import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { SalesHeader } from "@/components/vouchers/SalesHeader";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/vouchers/sale"),
}));

import { usePathname } from "next/navigation";

describe("SalesHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders title correctly", () => {
    render(<SalesHeader title="Sales Management" />);
    expect(screen.getByText("Sales Management")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <SalesHeader
        title="Sales Management"
        description="Manage all your sales records"
      />
    );
    expect(
      screen.getByText("Manage all your sales records")
    ).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    const { container } = render(<SalesHeader title="Sales Management" />);
    const description = container.querySelector("p.text-muted-foreground");
    expect(description).not.toBeInTheDocument();
  });

  it("renders default navigation links", () => {
    render(<SalesHeader title="Sales Management" />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("List")).toBeInTheDocument();
    expect(screen.getByText("Add New")).toBeInTheDocument();
  });

  it("renders custom navigation links when provided", () => {
    const customLinks = [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Reports", href: "/reports" },
    ];
    render(<SalesHeader title="Sales Management" links={customLinks} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
  });

  it("highlights active link based on pathname", () => {
    (usePathname as any).mockReturnValue("/vouchers/sale");
    render(<SalesHeader title="Sales Management" />);

    const overviewLink = screen.getByText("Overview").closest("a");
    expect(overviewLink).toHaveClass("bg-primary");
    expect(overviewLink).toHaveClass("text-primary-foreground");
  });

  it("does not highlight inactive links", () => {
    (usePathname as any).mockReturnValue("/vouchers/sale");
    render(<SalesHeader title="Sales Management" />);

    const listLink = screen.getByText("List").closest("a");
    expect(listLink).toHaveClass("bg-secondary");
    expect(listLink).not.toHaveClass("bg-primary");
  });

  it("handles pathname with trailing slash", () => {
    (usePathname as any).mockReturnValue("/vouchers/sale/");
    render(<SalesHeader title="Sales Management" />);

    const overviewLink = screen.getByText("Overview").closest("a");
    expect(overviewLink).toHaveClass("bg-primary");
  });

  it("handles href with trailing slash", () => {
    const customLinks = [{ label: "Test", href: "/test/" }];
    (usePathname as any).mockReturnValue("/test");
    render(<SalesHeader title="Sales" links={customLinks} />);

    const testLink = screen.getByText("Test").closest("a");
    expect(testLink).toHaveClass("bg-primary");
  });

  it("renders correct href attributes for links", () => {
    render(<SalesHeader title="Sales Management" />);

    const overviewLink = screen.getByText("Overview").closest("a");
    const listLink = screen.getByText("List").closest("a");
    const addNewLink = screen.getByText("Add New").closest("a");

    expect(overviewLink).toHaveAttribute("href", "/vouchers/sale");
    expect(listLink).toHaveAttribute("href", "/vouchers/sale/list");
    expect(addNewLink).toHaveAttribute("href", "/vouchers/sale/new");
  });

  it("applies hover styles to inactive links", () => {
    (usePathname as any).mockReturnValue("/vouchers/sale");
    render(<SalesHeader title="Sales Management" />);

    const listLink = screen.getByText("List").closest("a");
    expect(listLink).toHaveClass("hover:border-primary/40");
    expect(listLink).toHaveClass("hover:text-primary");
  });

  it("renders multiple custom links correctly", () => {
    const customLinks = [
      { label: "Link 1", href: "/link1" },
      { label: "Link 2", href: "/link2" },
      { label: "Link 3", href: "/link3" },
    ];
    render(<SalesHeader title="Test" links={customLinks} />);

    expect(screen.getByText("Link 1")).toBeInTheDocument();
    expect(screen.getByText("Link 2")).toBeInTheDocument();
    expect(screen.getByText("Link 3")).toBeInTheDocument();
  });

  it("handles null pathname gracefully", () => {
    (usePathname as any).mockReturnValue(null);
    render(<SalesHeader title="Sales Management" />);

    // Should not crash and should render links
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });

  it("applies correct styling classes to container", () => {
    const { container } = render(<SalesHeader title="Sales Management" />);
    const mainDiv = container.firstChild;

    expect(mainDiv).toHaveClass("space-y-6");
    expect(mainDiv).toHaveClass("rounded-lg");
    expect(mainDiv).toHaveClass("border");
    expect(mainDiv).toHaveClass("bg-background");
  });

  it("renders title with correct styling", () => {
    render(<SalesHeader title="Sales Management" />);
    const title = screen.getByText("Sales Management");

    expect(title.tagName).toBe("H1");
    expect(title).toHaveClass("text-2xl");
    expect(title).toHaveClass("font-semibold");
  });

  it("renders navigation in a nav element", () => {
    const { container } = render(<SalesHeader title="Sales Management" />);
    const nav = container.querySelector("nav");

    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass("flex");
    expect(nav).toHaveClass("flex-wrap");
  });
});
