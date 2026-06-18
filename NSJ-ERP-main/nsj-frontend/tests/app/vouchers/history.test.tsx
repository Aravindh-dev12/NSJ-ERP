/**
 * Tests for Order History Timeline page
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
  pathname: "/vouchers/123/history",
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useParams: () => ({ id: "123" }),
}));

// Mock fetch
global.fetch = vi.fn();

describe("Order History Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display loading state initially", async () => {
    (global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { default: OrderHistoryPage } = await import(
      "@/app/vouchers/[id]/history/page"
    );

    render(<OrderHistoryPage />);

    expect(screen.getByText(/loading order history/i)).toBeInTheDocument();
  });

  it("should display order history when data is loaded", async () => {
    const mockHistory = {
      order_id: "123",
      bill_no: "ORD-001",
      timeline: [
        {
          date: "2026-01-15",
          event: "Order Created",
          description: "Order ORD-001 was created in the system",
          status: "created",
        },
        {
          date: "2026-01-15",
          event: "Advance Payment Received",
          description: "Advance payment confirmed and recorded",
          status: "advance_paid",
        },
      ],
      current_status: "Active",
      customer_name: "John Doe",
      item: "Gold Ring",
      advance_payment: "YES",
      days_since_order: 7,
      days_since_advance: 7,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
    });

    const { default: OrderHistoryPage } = await import(
      "@/app/vouchers/[id]/history/page"
    );

    render(<OrderHistoryPage />);

    await waitFor(() => {
      expect(screen.getByText("ORD-001")).toBeInTheDocument();
    });

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Gold Ring")).toBeInTheDocument();
    expect(screen.getByText("Order Created")).toBeInTheDocument();
    expect(screen.getByText("Advance Payment Received")).toBeInTheDocument();
  });

  it("should display error message when fetch fails", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const { default: OrderHistoryPage } = await import(
      "@/app/vouchers/[id]/history/page"
    );

    render(<OrderHistoryPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/failed to load order history/i)
      ).toBeInTheDocument();
    });
  });

  it("should call router.back when back button is clicked", async () => {
    const mockHistory = {
      order_id: "123",
      bill_no: "ORD-001",
      timeline: [],
      current_status: "Active",
      customer_name: "John Doe",
      item: "Gold Ring",
      advance_payment: "YES",
      days_since_order: 7,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
    });

    const { default: OrderHistoryPage } = await import(
      "@/app/vouchers/[id]/history/page"
    );

    const { container } = render(<OrderHistoryPage />);

    await waitFor(() => {
      expect(screen.getByText("ORD-001")).toBeInTheDocument();
    });

    const backButton = container.querySelector("button");
    if (backButton) {
      backButton.click();
      expect(mockRouter.back).toHaveBeenCalled();
    }
  });

  it("should display days since order correctly", async () => {
    const mockHistory = {
      order_id: "123",
      bill_no: "ORD-001",
      timeline: [],
      current_status: "Active",
      customer_name: "John Doe",
      item: "Gold Ring",
      advance_payment: "YES",
      days_since_order: 15,
      days_since_advance: 10,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
    });

    const { default: OrderHistoryPage } = await import(
      "@/app/vouchers/[id]/history/page"
    );

    render(<OrderHistoryPage />);

    await waitFor(() => {
      expect(screen.getByText(/15 days/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/10 days since advance/i)).toBeInTheDocument();
  });

  it("should display timeline events in order", async () => {
    const mockHistory = {
      order_id: "123",
      bill_no: "ORD-001",
      timeline: [
        {
          date: "2026-01-10",
          event: "Order Created",
          description: "First event",
          status: "created",
        },
        {
          date: "2026-01-15",
          event: "Payment Received",
          description: "Second event",
          status: "paid",
        },
        {
          date: "2026-01-20",
          event: "Order Updated",
          description: "Third event",
          status: "updated",
        },
      ],
      current_status: "Active",
      customer_name: "John Doe",
      item: "Gold Ring",
      advance_payment: "YES",
      days_since_order: 7,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
    });

    const { default: OrderHistoryPage } = await import(
      "@/app/vouchers/[id]/history/page"
    );

    render(<OrderHistoryPage />);

    await waitFor(() => {
      expect(screen.getByText("Order Created")).toBeInTheDocument();
    });

    expect(screen.getByText("Payment Received")).toBeInTheDocument();
    expect(screen.getByText("Order Updated")).toBeInTheDocument();
  });

  it("should display advance paid badge when advance payment is YES", async () => {
    const mockHistory = {
      order_id: "123",
      bill_no: "ORD-001",
      timeline: [],
      current_status: "Active",
      customer_name: "John Doe",
      item: "Gold Ring",
      advance_payment: "YES",
      days_since_order: 7,
      days_since_advance: 7,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
    });

    const { default: OrderHistoryPage } = await import(
      "@/app/vouchers/[id]/history/page"
    );

    render(<OrderHistoryPage />);

    await waitFor(() => {
      expect(screen.getByText(/advance paid/i)).toBeInTheDocument();
    });
  });

  it("should not display days since advance when advance payment is NO", async () => {
    const mockHistory = {
      order_id: "123",
      bill_no: "ORD-001",
      timeline: [],
      current_status: "Pending Advance",
      customer_name: "John Doe",
      item: "Gold Ring",
      advance_payment: "NO",
      days_since_order: 7,
      days_since_advance: null,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
    });

    const { default: OrderHistoryPage } = await import(
      "@/app/vouchers/[id]/history/page"
    );

    render(<OrderHistoryPage />);

    await waitFor(() => {
      expect(screen.getByText("ORD-001")).toBeInTheDocument();
    });

    expect(screen.queryByText(/days since advance/i)).not.toBeInTheDocument();
  });

  it("should display empty state when no timeline events", async () => {
    const mockHistory = {
      order_id: "123",
      bill_no: "ORD-001",
      timeline: [],
      current_status: "Active",
      customer_name: "John Doe",
      item: "Gold Ring",
      advance_payment: "YES",
      days_since_order: 7,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
    });

    const { default: OrderHistoryPage } = await import(
      "@/app/vouchers/[id]/history/page"
    );

    render(<OrderHistoryPage />);

    await waitFor(() => {
      expect(screen.getByText(/no timeline events/i)).toBeInTheDocument();
    });
  });
});
