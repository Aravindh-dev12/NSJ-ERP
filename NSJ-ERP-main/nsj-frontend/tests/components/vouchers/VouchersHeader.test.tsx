import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { VouchersHeader } from "@/components/vouchers/VouchersHeader";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  usePathname: vi.fn(() => "/vouchers"),
}));

describe("VouchersHeader", () => {
  it("renders header with title", () => {
    render(<VouchersHeader title="Orders" />);
    expect(screen.getByText("Orders")).toBeInTheDocument();
  });

  it("renders with different titles", () => {
    render(<VouchersHeader title="Sales" />);
    expect(screen.getByText("Sales")).toBeInTheDocument();
  });

  it("renders header element", () => {
    render(<VouchersHeader title="Test" />);
    // Should render without errors
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("handles subLinks prop", () => {
    const subLinks = [
      { label: "Link 1", href: "/link1" },
      { label: "Link 2", href: "/link2" },
    ];

    render(<VouchersHeader title="Test" subLinks={subLinks} />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});
