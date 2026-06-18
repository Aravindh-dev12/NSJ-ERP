/**
 * Tests for VouchersList component with clickable Order IDs
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { VouchersList } from "@/components/vouchers/VouchersList";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock backend functions
vi.mock("@/lib/backend", () => ({
  vouchersList: vi.fn(),
  voucherDelete: vi.fn(),
  exportVouchersAll: vi.fn(),
  voucherDetail: vi.fn(),
  accountDetail: vi.fn(),
  exportVoucher: vi.fn(),
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock PDF generation
vi.mock("@/lib/orderTrackingPDF", () => ({
  generateOrderTrackingPDF: vi.fn(),
}));

describe("VouchersList - Clickable Order IDs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render order IDs as clickable links", async () => {
    const { vouchersList } = await import("@/lib/backend");

    (vouchersList as any).mockResolvedValue({
      results: [
        {
          id: "123",
          bill_no: "ORD-001",
          date: "2026-01-15",
          item_name: "Gold Ring",
          account: { account_name: "John Doe" },
          advance_payment_received: "YES",
        },
      ],
      count: 1,
      next: null,
      previous: null,
    });

    render(<VouchersList />);

    await waitFor(() => {
      const orderLink = screen.getByText("ORD-001");
      expect(orderLink).toBeInTheDocument();
      expect(orderLink.tagName).toBe("A");
      expect(orderLink).toHaveAttribute("href", "/vouchers/123/history");
    });
  });

  it("should style order ID links with primary color", async () => {
    const { vouchersList } = await import("@/lib/backend");

    (vouchersList as any).mockResolvedValue({
      results: [
        {
          id: "123",
          bill_no: "ORD-001",
          date: "2026-01-15",
          item_name: "Gold Ring",
          account: { account_name: "John Doe" },
          advance_payment_received: "YES",
        },
      ],
      count: 1,
      next: null,
      previous: null,
    });

    render(<VouchersList />);

    await waitFor(() => {
      const orderLink = screen.getByText("ORD-001");
      expect(orderLink).toHaveClass("text-primary");
    });
  });

  it("should render multiple clickable order IDs", async () => {
    const { vouchersList } = await import("@/lib/backend");

    (vouchersList as any).mockResolvedValue({
      results: [
        {
          id: "123",
          bill_no: "ORD-001",
          date: "2026-01-15",
          item_name: "Gold Ring",
          account: { account_name: "John Doe" },
          advance_payment_received: "YES",
        },
        {
          id: "456",
          bill_no: "ORD-002",
          date: "2026-01-16",
          item_name: "Silver Necklace",
          account: { account_name: "Jane Smith" },
          advance_payment_received: "NO",
        },
      ],
      count: 2,
      next: null,
      previous: null,
    });

    render(<VouchersList />);

    await waitFor(() => {
      const order1 = screen.getByText("ORD-001");
      const order2 = screen.getByText("ORD-002");

      expect(order1).toHaveAttribute("href", "/vouchers/123/history");
      expect(order2).toHaveAttribute("href", "/vouchers/456/history");
    });
  });

  it('should display "Unnamed" for orders without bill_no', async () => {
    const { vouchersList } = await import("@/lib/backend");

    (vouchersList as any).mockResolvedValue({
      results: [
        {
          id: "123",
          bill_no: null,
          date: "2026-01-15",
          item_name: "Gold Ring",
          account: { account_name: "John Doe" },
          advance_payment_received: "YES",
        },
      ],
      count: 1,
      next: null,
      previous: null,
    });

    render(<VouchersList />);

    await waitFor(() => {
      expect(screen.getByText("Unnamed")).toBeInTheDocument();
    });
  });

  it("should display account name correctly", async () => {
    const { vouchersList } = await import("@/lib/backend");

    (vouchersList as any).mockResolvedValue({
      results: [
        {
          id: "123",
          bill_no: "ORD-001",
          date: "2026-01-15",
          item_name: "Gold Ring",
          account: { account_name: "John Doe", name: "John Doe" },
          advance_payment_received: "YES",
        },
      ],
      count: 1,
      next: null,
      previous: null,
    });

    render(<VouchersList />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("should display advance payment status", async () => {
    const { vouchersList } = await import("@/lib/backend");

    (vouchersList as any).mockResolvedValue({
      results: [
        {
          id: "123",
          bill_no: "ORD-001",
          date: "2026-01-15",
          item_name: "Gold Ring",
          account: { account_name: "John Doe" },
          advance_payment_received: "YES",
        },
      ],
      count: 1,
      next: null,
      previous: null,
    });

    render(<VouchersList />);

    await waitFor(() => {
      expect(screen.getByText("YES")).toBeInTheDocument();
    });
  });

  it("should handle delete action", async () => {
    const { vouchersList, voucherDelete } = await import("@/lib/backend");

    (vouchersList as any).mockResolvedValue({
      results: [
        {
          id: "123",
          bill_no: "ORD-001",
          date: "2026-01-15",
          item_name: "Gold Ring",
          account: { account_name: "John Doe" },
          advance_payment_received: "YES",
        },
      ],
      count: 1,
      next: null,
      previous: null,
    });

    (voucherDelete as any).mockResolvedValue({});

    // Mock window.confirm
    global.confirm = vi.fn(() => true);

    render(<VouchersList />);

    await waitFor(() => {
      expect(screen.getByText("ORD-001")).toBeInTheDocument();
    });

    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(voucherDelete).toHaveBeenCalledWith("123");
    });
  });

  it("should handle export action", async () => {
    const { vouchersList, voucherDetail, accountDetail } = await import(
      "@/lib/backend"
    );
    const { generateOrderTrackingPDF } = await import("@/lib/orderTrackingPDF");

    (vouchersList as any).mockResolvedValue({
      results: [
        {
          id: "123",
          bill_no: "ORD-001",
          date: "2026-01-15",
          item_name: "Gold Ring",
          account: { id: "acc-123", account_name: "John Doe" },
          advance_payment_received: "YES",
        },
      ],
      count: 1,
      next: null,
      previous: null,
    });

    (voucherDetail as any).mockResolvedValue({
      id: "123",
      bill_no: "ORD-001",
      date: "2026-01-15",
      item_name: "Gold Ring",
      account: { id: "acc-123", account_name: "John Doe" },
      advance_payment_received: "YES",
    });

    (accountDetail as any).mockResolvedValue({
      contact: { phone: "1234567890" },
    });

    render(<VouchersList />);

    await waitFor(() => {
      expect(screen.getByText("ORD-001")).toBeInTheDocument();
    });

    const exportButton = screen.getByText("Export");
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(generateOrderTrackingPDF).toHaveBeenCalled();
    });
  });

  it("should display pagination controls", async () => {
    const { vouchersList } = await import("@/lib/backend");

    (vouchersList as any).mockResolvedValue({
      results: Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        bill_no: `ORD-${i + 1}`,
        date: "2026-01-15",
        item_name: "Gold Ring",
        account: { account_name: "John Doe" },
        advance_payment_received: "YES",
      })),
      count: 20,
      next: "next-url",
      previous: null,
    });

    render(<VouchersList />);

    await waitFor(() => {
      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
    });
  });

  it("should display search input", async () => {
    const { vouchersList } = await import("@/lib/backend");

    (vouchersList as any).mockResolvedValue({
      results: [],
      count: 0,
      next: null,
      previous: null,
    });

    render(<VouchersList />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(
        /search by order number/i
      );
      expect(searchInput).toBeInTheDocument();
    });
  });

  it("should handle search submission", async () => {
    const { vouchersList } = await import("@/lib/backend");

    (vouchersList as any).mockResolvedValue({
      results: [],
      count: 0,
      next: null,
      previous: null,
    });

    render(<VouchersList />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(
        /search by order number/i
      );
      fireEvent.change(searchInput, { target: { value: "ORD-001" } });

      const searchButton = screen.getByText("Search");
      fireEvent.click(searchButton);
    });

    await waitFor(() => {
      expect(vouchersList).toHaveBeenCalledWith(
        expect.objectContaining({ search: "ORD-001" })
      );
    });
  });

  it("should display export data button", async () => {
    const { vouchersList } = await import("@/lib/backend");

    (vouchersList as any).mockResolvedValue({
      results: [],
      count: 0,
      next: null,
      previous: null,
    });

    render(<VouchersList />);

    await waitFor(() => {
      expect(screen.getByText("Export Data")).toBeInTheDocument();
    });
  });

  it("should handle empty state", async () => {
    const { vouchersList } = await import("@/lib/backend");

    (vouchersList as any).mockResolvedValue({
      results: [],
      count: 0,
      next: null,
      previous: null,
    });

    render(<VouchersList />);

    await waitFor(() => {
      expect(screen.getByText(/no orders found/i)).toBeInTheDocument();
    });
  });

  it("should display loading state", async () => {
    const { vouchersList } = await import("@/lib/backend");

    (vouchersList as any).mockImplementation(() => new Promise(() => {}));

    render(<VouchersList />);

    // Should show skeleton loaders
    expect(
      document.querySelectorAll('[class*="skeleton"]').length
    ).toBeGreaterThan(0);
  });
});
