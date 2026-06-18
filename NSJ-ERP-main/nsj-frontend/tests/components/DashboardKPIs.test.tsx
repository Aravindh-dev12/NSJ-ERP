import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { DashboardKPIs } from "@/components/DashboardKPIs";

// Mock backend
vi.mock("@/lib/backend", () => ({
  backend: {
    getSalesAggregates: vi.fn(),
  },
}));

import { backend } from "@/lib/backend";

describe("DashboardKPIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    (backend.getSalesAggregates as any).mockImplementation(
      () => new Promise(() => {})
    );

    render(<DashboardKPIs />);

    // Should show loading skeletons
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("displays KPI values after loading", async () => {
    (backend.getSalesAggregates as any).mockResolvedValue({
      total_sales: 100000,
      total_orders: 50,
      total_quantity: 200,
      average_order_value: 2000,
      latest_month_label: "December 2024",
    });

    render(<DashboardKPIs />);

    await waitFor(() => {
      expect(screen.getByText("Total Sales")).toBeInTheDocument();
    });

    expect(screen.getByText("Total Orders")).toBeInTheDocument();
    expect(screen.getByText("Total Quantity")).toBeInTheDocument();
    expect(screen.getByText("Average Order Value")).toBeInTheDocument();
  });

  it("formats currency values correctly", async () => {
    (backend.getSalesAggregates as any).mockResolvedValue({
      total_sales: 100000,
      total_orders: 50,
      total_quantity: 200,
      average_order_value: 2000,
    });

    render(<DashboardKPIs />);

    await waitFor(() => {
      expect(screen.getByText("Total Sales")).toBeInTheDocument();
    });

    // Should format as Indian currency
    expect(screen.getByText(/₹1,00,000/)).toBeInTheDocument();
  });

  it("handles string values from API", async () => {
    (backend.getSalesAggregates as any).mockResolvedValue({
      total_sales: "1,00,000",
      total_orders: "50",
      total_quantity: "200",
      average_order_value: "2,000",
    });

    render(<DashboardKPIs />);

    await waitFor(() => {
      expect(screen.getByText("Total Sales")).toBeInTheDocument();
    });
  });

  it("shows error state when API fails", async () => {
    (backend.getSalesAggregates as any).mockRejectedValue(
      new Error("API Error")
    );

    render(<DashboardKPIs />);

    await waitFor(() => {
      expect(
        screen.getByText(/Unable to load KPI metrics/)
      ).toBeInTheDocument();
    });
  });

  it("displays -- for null values", async () => {
    (backend.getSalesAggregates as any).mockResolvedValue({
      total_sales: null,
      total_orders: null,
      total_quantity: null,
      average_order_value: null,
    });

    render(<DashboardKPIs />);

    await waitFor(() => {
      expect(screen.getByText("Total Sales")).toBeInTheDocument();
    });

    const dashes = screen.getAllByText("--");
    expect(dashes.length).toBe(4);
  });

  it("shows month label in descriptions", async () => {
    (backend.getSalesAggregates as any).mockResolvedValue({
      total_sales: 100000,
      total_orders: 50,
      total_quantity: 200,
      average_order_value: 2000,
      latest_month_label: "November 2024",
    });

    render(<DashboardKPIs />);

    await waitFor(() => {
      const elements = screen.getAllByText(/November 2024/);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it("shows default description when no month label", async () => {
    (backend.getSalesAggregates as any).mockResolvedValue({
      total_sales: 100000,
      total_orders: 50,
      total_quantity: 200,
      average_order_value: 2000,
    });

    render(<DashboardKPIs />);

    await waitFor(() => {
      const elements = screen.getAllByText(/last 30 days/);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it("refetches data when refreshKey changes", async () => {
    (backend.getSalesAggregates as any).mockResolvedValue({
      total_sales: 100000,
      total_orders: 50,
      total_quantity: 200,
      average_order_value: 2000,
    });

    const { rerender } = render(<DashboardKPIs refreshKey={1} />);

    await waitFor(() => {
      expect(screen.getByText("Total Sales")).toBeInTheDocument();
    });

    expect(backend.getSalesAggregates).toHaveBeenCalledTimes(1);

    rerender(<DashboardKPIs refreshKey={2} />);

    await waitFor(() => {
      expect(backend.getSalesAggregates).toHaveBeenCalledTimes(2);
    });
  });

  it("renders all four KPI cards", async () => {
    (backend.getSalesAggregates as any).mockResolvedValue({
      total_sales: 100000,
      total_orders: 50,
      total_quantity: 200,
      average_order_value: 2000,
    });

    render(<DashboardKPIs />);

    await waitFor(() => {
      expect(screen.getByText("Total Sales")).toBeInTheDocument();
      expect(screen.getByText("Total Orders")).toBeInTheDocument();
      expect(screen.getByText("Total Quantity")).toBeInTheDocument();
      expect(screen.getByText("Average Order Value")).toBeInTheDocument();
    });
  });
});
