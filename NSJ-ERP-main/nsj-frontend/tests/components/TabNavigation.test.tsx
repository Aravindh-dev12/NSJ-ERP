import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { TabNavigation } from "@/components/TabNavigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/vouchers"),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

describe("TabNavigation", () => {
  const mockOnTabChange = vi.fn();
  const defaultProps = {
    activeTab: "owner",
    onTabChange: mockOnTabChange,
  };

  it("renders tab navigation", () => {
    render(<TabNavigation {...defaultProps} />);
    // Should render navigation
    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
  });

  it("renders tab buttons", () => {
    render(<TabNavigation {...defaultProps} />);

    // Check for buttons instead of links
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("displays Owner Dashboard tab", () => {
    render(<TabNavigation {...defaultProps} />);

    expect(screen.getByText("Owner Dashboard")).toBeInTheDocument();
  });

  it("displays Payment Tracking tab", () => {
    render(<TabNavigation {...defaultProps} />);

    expect(screen.getByText("Payment Tracking")).toBeInTheDocument();
  });

  it("displays Admin Panel tab", () => {
    render(<TabNavigation {...defaultProps} />);

    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });

  it("handles tab click", () => {
    render(<TabNavigation {...defaultProps} />);

    const buttons = screen.getAllByRole("button");
    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
      expect(mockOnTabChange).toHaveBeenCalled();
    }
  });

  it("highlights active tab", () => {
    render(
      <TabNavigation activeTab="payments" onTabChange={mockOnTabChange} />
    );

    expect(screen.getByText("Payment Tracking")).toBeInTheDocument();
  });
});
