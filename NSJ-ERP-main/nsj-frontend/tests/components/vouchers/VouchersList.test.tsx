import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VouchersList } from "@/components/vouchers/VouchersList";
import * as backend from "@/lib/backend";

vi.mock("@/lib/backend");

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockBack = vi.fn();
const mockPathname = vi.fn(() => "/vouchers/list");
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: mockBack,
  }),
  usePathname: () => mockPathname(),
}));

describe("VouchersList", () => {
  const mockVouchers = [
    {
      id: "1",
      bill_no: "ORD-001",
      date: "2024-01-15",
      item_name: "Gold Ring",
      account: { account_name: "Customer A" },
      advance_payment_received: "YES",
    },
    {
      id: "2",
      bill_no: "ORD-002",
      date: "2024-01-16",
      item_name: "Silver Necklace",
      account: { account_name: "Customer B" },
      advance_payment_received: "NO",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.vouchersList).mockResolvedValue({
      results: mockVouchers,
      count: 2,
      next: null,
      previous: null,
    } as any);
    vi.mocked(backend.voucherDelete).mockResolvedValue({} as any);
    vi.mocked(backend.exportVouchersAll).mockResolvedValue({
      blob: new Blob(),
      fileName: "orders.xlsx",
    } as any);
    window.confirm = vi.fn(() => true);
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  describe("Rendering", () => {
    it("renders the component with title", async () => {
      render(<VouchersList />);

      expect(screen.getByText("Orders")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Manage orders: create, review status, and keep records tidy."
        )
      ).toBeInTheDocument();
    });

    it("loads vouchers on mount", async () => {
      render(<VouchersList />);

      await waitFor(() => {
        expect(backend.vouchersList).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText("ORD-001")).toBeInTheDocument();
      });
    });

    it("displays all vouchers in table", async () => {
      render(<VouchersList />);

      await waitFor(() => {
        expect(screen.getByText("ORD-001")).toBeInTheDocument();
      });

      expect(screen.getByText("ORD-002")).toBeInTheDocument();
      expect(screen.getByText("Gold Ring")).toBeInTheDocument();
      expect(screen.getByText("Silver Necklace")).toBeInTheDocument();
      expect(screen.getByText("Customer A")).toBeInTheDocument();
      expect(screen.getByText("Customer B")).toBeInTheDocument();
    });

    it("shows loading skeletons while fetching", () => {
      render(<VouchersList />);

      const skeletons = screen
        .getAllByRole("generic")
        .filter((el) => el.className.includes("animate-pulse"));
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows empty state when no records", async () => {
      vi.mocked(backend.vouchersList).mockResolvedValue({
        results: [],
        count: 0,
        next: null,
        previous: null,
      } as any);

      render(<VouchersList />);

      await waitFor(() => {
        expect(screen.getByText(/No orders found/i)).toBeInTheDocument();
      });
    });

    it("handles API error gracefully", async () => {
      vi.mocked(backend.vouchersList).mockRejectedValue(new Error("API Error"));

      render(<VouchersList />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Unable to load vouchers",
          description: "API Error",
        });
      });
    });
  });

  describe("Search Functionality", () => {
    it("allows entering search text", async () => {
      const user = userEvent.setup();
      render(<VouchersList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search by order number or description")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by order number or description"
      );
      await user.type(searchInput, "ORD-001");

      expect(searchInput).toHaveValue("ORD-001");
    });

    it("triggers search on form submit", async () => {
      const user = userEvent.setup();
      render(<VouchersList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search by order number or description")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by order number or description"
      );
      await user.type(searchInput, "ORD-001");

      const searchButton = screen.getByRole("button", { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(backend.vouchersList).toHaveBeenCalledWith(
          expect.objectContaining({ search: "ORD-001" })
        );
      });
    });
  });

  describe("Pagination", () => {
    it("displays pagination info", async () => {
      render(<VouchersList />);

      await waitFor(() => {
        expect(screen.getByText(/Showing page 1 of 1/)).toBeInTheDocument();
        expect(screen.getByText(/2 total orders/)).toBeInTheDocument();
      });
    });

    it("disables Previous button on first page", async () => {
      render(<VouchersList />);

      await waitFor(() => {
        const prevButton = screen.getByRole("button", { name: /previous/i });
        expect(prevButton).toBeDisabled();
      });
    });

    it("enables Next button when more pages available", async () => {
      vi.mocked(backend.vouchersList).mockResolvedValue({
        results: mockVouchers,
        count: 50,
        next: "next-url",
        previous: null,
      } as any);

      render(<VouchersList />);

      await waitFor(() => {
        const nextButton = screen.getByRole("button", { name: /next/i });
        expect(nextButton).not.toBeDisabled();
      });
    });
  });

  describe("Delete Functionality", () => {
    it("shows confirmation dialog before delete", async () => {
      const user = userEvent.setup();
      render(<VouchersList />);

      await waitFor(() => {
        expect(screen.getByText("ORD-001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this order?"
      );
    });

    it("deletes voucher when confirmed", async () => {
      const user = userEvent.setup();
      render(<VouchersList />);

      await waitFor(() => {
        expect(screen.getByText("ORD-001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(backend.voucherDelete).toHaveBeenCalledWith("1");
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Order removed",
        description: "The order has been deleted successfully.",
      });
    });

    it("does not delete when cancelled", async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => false);

      render(<VouchersList />);

      await waitFor(() => {
        expect(screen.getByText("ORD-001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(backend.voucherDelete).not.toHaveBeenCalled();
    });
  });

  describe("Export Functionality", () => {
    it("exports all vouchers", async () => {
      const user = userEvent.setup();
      render(<VouchersList />);

      await waitFor(() => {
        expect(screen.getByText("ORD-001")).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /export data/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(backend.exportVouchersAll).toHaveBeenCalled();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Export complete",
      });
    });
  });
});
