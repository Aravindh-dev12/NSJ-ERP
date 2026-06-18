import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SalesList } from "@/components/vouchers/SalesList";
import * as backend from "@/lib/backend";

vi.mock("@/lib/backend");

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockBack = vi.fn();
const mockPathname = vi.fn(() => "/vouchers/sale/list");
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: mockBack,
  }),
  usePathname: () => mockPathname(),
}));

describe("SalesList", () => {
  const mockSales = [
    {
      id: "1",
      order_date: "2024-01-15",
      sales_person: "John Doe",
      vendor: "Vendor A",
      account: {
        id: "acc-1",
        account_name: "Gold Ring Customer",
        name: "Gold Ring Customer",
      },
      sub_account: "",
      phone_number: "1234567890",
      email: "customer@example.com",
      city: "Mumbai",
      client_delivery_type: "Standard",
      pan_gstin: "",
      occasion: ["Wedding"],
      required_delivery_date: "2024-02-15",
      stock_in_deadline: "",
      purpose: ["Self"],
      jewellery_type: "Gold Ring",
      size_details: "7",
      fit_details: "",
      follow_up_log: "",
      style_preference: ["Modern"],
      metal_preference: ["Yellow"],
      diamond_shape: "Round",
      color_clarity: "F-VVS",
      origin: "Natural",
      diamond_budget: "50000",
      diamond_priority: ["Quality"],
      sample_details: "",
      gemstone_preference: "",
      gemstone_color_clarity: "",
      gemstone_origin: "",
      other_details: "",
      budget_range: "50000-100000",
      urgency_level: ["Standard"],
      reference_source: ["Walk-in"],
      must_have: "",
      must_avoid: "",
      special_instructions: "",
      transfer_department: "",
      follow_up_logs: [],
      advance_handling: {},
      department_instructions: {},
      design_delivery: {},
      ledger_entries: [],
      reference_photo: null,
      workflow_status: "inquiry_received",
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
    },
    {
      id: "2",
      order_date: "2024-01-16",
      sales_person: "Jane Smith",
      vendor: "Vendor B",
      account: {
        id: "acc-2",
        account_name: "Silver Necklace Customer",
        name: "Silver Necklace Customer",
      },
      sub_account: "",
      phone_number: "0987654321",
      email: "customer2@example.com",
      city: "Delhi",
      client_delivery_type: "Express",
      pan_gstin: "",
      occasion: ["Birthday"],
      required_delivery_date: "2024-02-20",
      stock_in_deadline: "",
      purpose: ["Gift"],
      jewellery_type: "Silver Necklace",
      size_details: "18",
      fit_details: "",
      follow_up_log: "",
      style_preference: ["Traditional"],
      metal_preference: ["White"],
      diamond_shape: "",
      color_clarity: "",
      origin: "",
      diamond_budget: "",
      diamond_priority: [],
      sample_details: "",
      gemstone_preference: "",
      gemstone_color_clarity: "",
      gemstone_origin: "",
      other_details: "",
      budget_range: "30000-50000",
      urgency_level: ["Priority"],
      reference_source: ["Referral"],
      must_have: "",
      must_avoid: "",
      special_instructions: "",
      transfer_department: "",
      follow_up_logs: [],
      advance_handling: {},
      department_instructions: {},
      design_delivery: {},
      ledger_entries: [],
      reference_photo: null,
      workflow_status: "estimates_pending",
      created_at: "2024-01-16T10:00:00Z",
      updated_at: "2024-01-16T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.getSalesQueries).mockResolvedValue({
      items: mockSales,
      count: 2,
      next: null,
      previous: null,
    } as any);
    vi.mocked(backend.deleteSalesQuery).mockResolvedValue({} as any);
    window.confirm = vi.fn(() => true);
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  describe("Rendering", () => {
    it("renders the component with title", async () => {
      render(<SalesList />);

      expect(screen.getByText("Sales")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Manage sales: create, review status, and keep records tidy."
        )
      ).toBeInTheDocument();
    });

    it("loads sales on mount", async () => {
      render(<SalesList />);

      await waitFor(() => {
        expect(backend.getSalesQueries).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText("Gold Ring Customer")).toBeInTheDocument();
      });
    });

    it("displays all sales in table", async () => {
      render(<SalesList />);

      await waitFor(() => {
        expect(screen.getByText("Gold Ring Customer")).toBeInTheDocument();
      });

      expect(screen.getByText("Silver Necklace Customer")).toBeInTheDocument();
      expect(screen.getByText("Gold Ring")).toBeInTheDocument();
      expect(screen.getByText("Silver Necklace")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("displays table headers", async () => {
      render(<SalesList />);

      await waitFor(() => {
        expect(screen.getByText("Account")).toBeInTheDocument();
      });

      expect(screen.getByText("Sales Person")).toBeInTheDocument();
      expect(screen.getByText("Item")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Order Date")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("shows loading skeletons while fetching", () => {
      render(<SalesList />);

      const skeletons = screen
        .getAllByRole("generic")
        .filter((el) => el.className.includes("animate-pulse"));
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows empty state when no records", async () => {
      vi.mocked(backend.getSalesQueries).mockResolvedValue({
        items: [],
        count: 0,
        next: null,
        previous: null,
      } as any);

      render(<SalesList />);

      await waitFor(() => {
        expect(screen.getByText(/No sales found/i)).toBeInTheDocument();
      });
    });

    it("handles API error gracefully", async () => {
      vi.mocked(backend.getSalesQueries).mockRejectedValue(
        new Error("API Error")
      );

      render(<SalesList />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Unable to load sales",
          description: "API Error",
        });
      });
    });
  });

  describe("Search Functionality", () => {
    it("allows entering search text", async () => {
      const user = userEvent.setup();
      render(<SalesList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(
            "Search by account, item, or salesperson..."
          )
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by account, item, or salesperson..."
      );
      await user.type(searchInput, "Gold Ring");

      expect(searchInput).toHaveValue("Gold Ring");
    });

    it("triggers search on form submit", async () => {
      const user = userEvent.setup();
      render(<SalesList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(
            "Search by account, item, or salesperson..."
          )
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by account, item, or salesperson..."
      );
      await user.type(searchInput, "Gold Ring");

      const searchButton = screen.getByRole("button", { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(backend.getSalesQueries).toHaveBeenCalledWith(
          expect.objectContaining({ search: "Gold Ring" })
        );
      });
    });

    it("trims search input before submitting", async () => {
      const user = userEvent.setup();
      render(<SalesList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(
            "Search by account, item, or salesperson..."
          )
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by account, item, or salesperson..."
      );
      await user.type(searchInput, "  Gold Ring  ");

      const searchButton = screen.getByRole("button", { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(backend.getSalesQueries).toHaveBeenCalledWith(
          expect.objectContaining({ search: "Gold Ring" })
        );
      });
    });
  });

  describe("Pagination", () => {
    it("displays pagination info", async () => {
      render(<SalesList />);

      await waitFor(() => {
        expect(screen.getByText(/Showing page 1 of 1/)).toBeInTheDocument();
        expect(screen.getByText(/2 total sales/)).toBeInTheDocument();
      });
    });

    it("disables Previous button on first page", async () => {
      render(<SalesList />);

      await waitFor(() => {
        const prevButton = screen.getByRole("button", { name: /previous/i });
        expect(prevButton).toBeDisabled();
      });
    });

    it("enables Next button when more pages available", async () => {
      vi.mocked(backend.getSalesQueries).mockResolvedValue({
        items: mockSales,
        count: 50,
        next: "next-url",
        previous: null,
      } as any);

      render(<SalesList />);

      await waitFor(() => {
        const nextButton = screen.getByRole("button", { name: /next/i });
        expect(nextButton).not.toBeDisabled();
      });
    });

    it("navigates to next page", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.getSalesQueries).mockResolvedValue({
        items: mockSales,
        count: 50,
        next: "next-url",
        previous: null,
      } as any);

      render(<SalesList />);

      await waitFor(() => {
        expect(screen.getByText("Gold Ring Customer")).toBeInTheDocument();
      });

      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(backend.getSalesQueries).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });
    });
  });

  describe("Delete Functionality", () => {
    it("shows confirmation dialog before delete", async () => {
      const user = userEvent.setup();
      render(<SalesList />);

      await waitFor(() => {
        expect(screen.getByText("Gold Ring Customer")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this sale?"
      );
    });

    it("deletes sale when confirmed", async () => {
      const user = userEvent.setup();
      render(<SalesList />);

      await waitFor(() => {
        expect(screen.getByText("Gold Ring Customer")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(backend.deleteSalesQuery).toHaveBeenCalledWith("1");
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Sale removed",
        description: "The sale has been deleted successfully.",
      });
    });

    it("does not delete when cancelled", async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => false);

      render(<SalesList />);

      await waitFor(() => {
        expect(screen.getByText("Gold Ring Customer")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(backend.deleteSalesQuery).not.toHaveBeenCalled();
    });

    it("shows error on delete failure", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.deleteSalesQuery).mockRejectedValue(
        new Error("Delete failed")
      );

      render(<SalesList />);

      await waitFor(() => {
        expect(screen.getByText("Gold Ring Customer")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Delete failed",
          description: "Delete failed",
        });
      });
    });
  });
});
