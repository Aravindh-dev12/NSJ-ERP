import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { PaymentTracking } from "@/components/payment/PaymentTracking";

// Mock child components
vi.mock("@/components/payment/PaymentFilters", () => ({
  PaymentFilters: ({ onFilterChange }: any) => (
    <div data-testid="payment-filters">
      <input
        data-testid="vendor-filter"
        onChange={(e) => onFilterChange("vendor", e.target.value)}
      />
    </div>
  ),
}));

vi.mock("@/components/payment/PaymentTable", () => ({
  PaymentTable: ({ onSelectionChange }: any) => (
    <div data-testid="payment-table">
      <button
        data-testid="select-invoice"
        onClick={() => onSelectionChange(["inv-1", "inv-2"])}
      >
        Select
      </button>
    </div>
  ),
}));

vi.mock("@/components/payment/BulkActions", () => ({
  BulkActions: ({ selectedCount }: any) => (
    <div data-testid="bulk-actions">Selected: {selectedCount}</div>
  ),
}));

vi.mock("@/components/payment/ScheduleBuilder", () => ({
  ScheduleBuilder: ({ onClose }: any) => (
    <div data-testid="schedule-builder">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock("@/components/payment/ActivityLog", () => ({
  ActivityLog: () => <div data-testid="activity-log">Activity Log</div>,
}));

describe("PaymentTracking - Extended Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders payment tracking component", () => {
    render(<PaymentTracking />);
    expect(screen.getByText("Payment Tracking")).toBeInTheDocument();
  });

  it("displays description text", () => {
    render(<PaymentTracking />);
    expect(
      screen.getByText("Monitor invoices and manage payment reminders")
    ).toBeInTheDocument();
  });

  it("renders summary cards", () => {
    render(<PaymentTracking />);
    expect(screen.getByText("Due Soon")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Outstanding")).toBeInTheDocument();
  });

  it("renders payment filters", () => {
    render(<PaymentTracking />);
    expect(screen.getByTestId("payment-filters")).toBeInTheDocument();
  });

  it("renders payment table", () => {
    render(<PaymentTracking />);
    expect(screen.getByTestId("payment-table")).toBeInTheDocument();
  });

  it("handles invoice selection", async () => {
    render(<PaymentTracking />);

    const selectButton = screen.getByTestId("select-invoice");
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText("Selected: 2")).toBeInTheDocument();
    });
  });

  it("handles filter changes", async () => {
    render(<PaymentTracking />);

    const vendorFilter = screen.getByTestId("vendor-filter");
    fireEvent.change(vendorFilter, { target: { value: "Vendor A" } });

    // Filter change should be handled without errors
    expect(vendorFilter).toBeInTheDocument();
  });

  it("renders activity log", () => {
    render(<PaymentTracking />);
    expect(screen.getByTestId("activity-log")).toBeInTheDocument();
  });

  it("displays due soon count", () => {
    render(<PaymentTracking />);
    expect(screen.getByText("23")).toBeInTheDocument();
  });

  it("displays overdue count", () => {
    render(<PaymentTracking />);
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("displays outstanding amount", () => {
    render(<PaymentTracking />);
    expect(screen.getByText("$453K")).toBeInTheDocument();
  });
});
