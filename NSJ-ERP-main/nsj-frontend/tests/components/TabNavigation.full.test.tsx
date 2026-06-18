import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { TabNavigation } from "@/components/TabNavigation";

describe("TabNavigation - Extended Tests", () => {
  const mockOnTabChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all tabs", () => {
    render(<TabNavigation activeTab="owner" onTabChange={mockOnTabChange} />);
    expect(screen.getByText("Owner Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Payment Tracking")).toBeInTheDocument();
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });

  it("displays first tab as active by default", () => {
    render(<TabNavigation activeTab="owner" onTabChange={mockOnTabChange} />);
    const ownerTab = screen.getByText("Owner Dashboard").closest("button");
    expect(ownerTab).toHaveClass("border-blue-500");
  });

  it("switches tab on click", () => {
    render(<TabNavigation activeTab="owner" onTabChange={mockOnTabChange} />);
    fireEvent.click(screen.getByText("Payment Tracking"));
    expect(mockOnTabChange).toHaveBeenCalledWith("payment");
  });

  it("highlights active tab", () => {
    render(<TabNavigation activeTab="payment" onTabChange={mockOnTabChange} />);
    const paymentTab = screen.getByText("Payment Tracking").closest("button");
    expect(paymentTab).toHaveClass("border-blue-500");
  });

  it("handles multiple tab switches", () => {
    render(<TabNavigation activeTab="owner" onTabChange={mockOnTabChange} />);

    fireEvent.click(screen.getByText("Payment Tracking"));
    expect(mockOnTabChange).toHaveBeenCalledWith("payment");

    fireEvent.click(screen.getByText("Admin Panel"));
    expect(mockOnTabChange).toHaveBeenCalledWith("admin");

    fireEvent.click(screen.getByText("Owner Dashboard"));
    expect(mockOnTabChange).toHaveBeenCalledWith("owner");
  });

  it("renders with admin tab active", () => {
    render(<TabNavigation activeTab="admin" onTabChange={mockOnTabChange} />);
    const adminTab = screen.getByText("Admin Panel").closest("button");
    expect(adminTab).toHaveClass("border-blue-500");
  });

  it("renders navigation with proper role", () => {
    render(<TabNavigation activeTab="owner" onTabChange={mockOnTabChange} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("renders icons for each tab", () => {
    const { container } = render(
      <TabNavigation activeTab="owner" onTabChange={mockOnTabChange} />
    );
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBe(3);
  });
});
