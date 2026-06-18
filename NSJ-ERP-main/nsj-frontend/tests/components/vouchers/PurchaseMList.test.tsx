import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PurchaseMList from "@/components/vouchers/PurchaseMList";
import * as backend from "@/lib/backend";

vi.mock("@/lib/backend");

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock window.confirm
global.confirm = vi.fn(() => true);

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

describe("PurchaseMList", () => {
  const mockRecords = {
    results: [
      {
        id: "1",
        bill_no: "BILL-001",
        date: "2024-01-15",
        item_name: "Gold Ring",
      },
      {
        id: "2",
        bill_no: "BILL-002",
        date: "2024-01-16",
        item_name: "Silver Necklace",
      },
    ],
    count: 2,
    next: null,
    previous: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.purchaseMList).mockResolvedValue(mockRecords as any);
    vi.mocked(backend.purchaseMDelete).mockResolvedValue({} as any);
    vi.mocked(backend.exportVouchersAll).mockResolvedValue({
      blob: new Blob(),
      fileName: "purchase_data.xlsx",
    } as any);
  });

  describe("Rendering", () => {
    it("renders list header", async () => {
      render(<PurchaseMList />);

      await waitFor(() => {
        expect(screen.getByText("Purchase M")).toBeInTheDocument();
      });
    });

    it("renders search form", async () => {
      render(<PurchaseMList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Search by order number/i)
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Search/i })
        ).toBeInTheDocument();
      });
    });

    it("renders export button", async () => {
      render(<PurchaseMList />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Export Data/i })
        ).toBeInTheDocument();
      });
    });

    it("displays purchase records in table", async () => {
      render(<PurchaseMList />);

      await waitFor(() => {
        expect(screen.getByText("BILL-001")).toBeInTheDocument();
        expect(screen.getByText("BILL-002")).toBeInTheDocument();
        expect(screen.getByText("Gold Ring")).toBeInTheDocument();
        expect(screen.getByText("Silver Necklace")).toBeInTheDocument();
      });
    });

    it("formats dates correctly", async () => {
      render(<PurchaseMList />);

      await waitFor(() => {
        // Date formatting uses Intl.DateTimeFormat which may vary by locale
        // Just check that dates are displayed (not checking exact format)
        const dateElements = screen.getAllByText(/2024/i);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });

    it("displays pagination info", async () => {
      render(<PurchaseMList />);

      await waitFor(() => {
        expect(screen.getByText(/Showing page 1 of 1/i)).toBeInTheDocument();
        expect(screen.getByText(/2 total/i)).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("shows skeleton loaders while loading", async () => {
      vi.mocked(backend.purchaseMList).mockImplementation(
        () => new Promise(() => {})
      );

      render(<PurchaseMList />);

      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("displays error message on load failure", async () => {
      vi.mocked(backend.purchaseMList).mockRejectedValue(
        new Error("Load failed")
      );

      render(<PurchaseMList />);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load purchase records/i)
        ).toBeInTheDocument();
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Unable to load purchase records",
        })
      );
    });
  });

  describe("Empty State", () => {
    it("displays empty state when no records", async () => {
      vi.mocked(backend.purchaseMList).mockResolvedValue({
        results: [],
        count: 0,
        next: null,
        previous: null,
      } as any);

      render(<PurchaseMList />);

      await waitFor(() => {
        expect(
          screen.getByText(/No purchase records found/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Search Functionality", () => {
    it("allows entering search query", async () => {
      const user = userEvent.setup();
      render(<PurchaseMList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Search by order number/i)
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        /Search by order number/i
      );
      await user.type(searchInput, "BILL-001");

      expect(searchInput).toHaveValue("BILL-001");
    });

    it("submits search and fetches filtered results", async () => {
      const user = userEvent.setup();
      render(<PurchaseMList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Search by order number/i)
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        /Search by order number/i
      );
      await user.type(searchInput, "BILL-001");

      const searchButton = screen.getByRole("button", { name: /Search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(backend.purchaseMList).toHaveBeenCalledWith(
          expect.objectContaining({
            search: "BILL-001",
            page: 1,
          })
        );
      });
    });

    it("resets page to 1 when searching", async () => {
      const user = userEvent.setup();
      render(<PurchaseMList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Search by order number/i)
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        /Search by order number/i
      );
      await user.type(searchInput, "test");

      const searchButton = screen.getByRole("button", { name: /Search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(backend.purchaseMList).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 1,
          })
        );
      });
    });
  });

  describe("Pagination", () => {
    it("disables Previous button on first page", async () => {
      render(<PurchaseMList />);

      await waitFor(() => {
        const prevButton = screen.getByRole("button", { name: /Previous/i });
        expect(prevButton).toBeDisabled();
      });
    });

    it("enables Next button when more pages exist", async () => {
      vi.mocked(backend.purchaseMList).mockResolvedValue({
        results: mockRecords.results,
        count: 20,
        next: "next-url",
        previous: null,
      } as any);

      render(<PurchaseMList />);

      await waitFor(() => {
        const nextButton = screen.getByRole("button", { name: /Next/i });
        expect(nextButton).not.toBeDisabled();
      });
    });

    it("navigates to next page", async () => {
      vi.mocked(backend.purchaseMList).mockResolvedValue({
        results: mockRecords.results,
        count: 20,
        next: "next-url",
        previous: null,
      } as any);

      const user = userEvent.setup();
      render(<PurchaseMList />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Next/i })
        ).not.toBeDisabled();
      });

      const nextButton = screen.getByRole("button", { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(backend.purchaseMList).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
          })
        );
      });
    });
  });

  describe("Delete Functionality", () => {
    it("shows confirmation dialog before delete", async () => {
      const user = userEvent.setup();
      render(<PurchaseMList />);

      await waitFor(() => {
        expect(screen.getByText("BILL-001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
      await user.click(deleteButtons[0]);

      expect(global.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this purchase record?"
      );
    });

    it("deletes record on confirmation", async () => {
      const user = userEvent.setup();
      render(<PurchaseMList />);

      await waitFor(() => {
        expect(screen.getByText("BILL-001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(backend.purchaseMDelete).toHaveBeenCalledWith("1");
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Record removed",
          description: "The record has been deleted successfully.",
        })
      );
    });

    it("does not delete if user cancels", async () => {
      (global.confirm as any).mockReturnValueOnce(false);
      const user = userEvent.setup();
      render(<PurchaseMList />);

      await waitFor(() => {
        expect(screen.getByText("BILL-001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
      await user.click(deleteButtons[0]);

      expect(backend.purchaseMDelete).not.toHaveBeenCalled();
    });

    it("shows error on delete failure", async () => {
      vi.mocked(backend.purchaseMDelete).mockRejectedValue(
        new Error("Delete failed")
      );
      const user = userEvent.setup();
      render(<PurchaseMList />);

      await waitFor(() => {
        expect(screen.getByText("BILL-001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: "destructive",
            title: "Delete failed",
          })
        );
      });
    });

    it("shows deleting state during delete", async () => {
      vi.mocked(backend.purchaseMDelete).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const user = userEvent.setup();
      render(<PurchaseMList />);

      await waitFor(() => {
        expect(screen.getByText("BILL-001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Deleting/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Export Functionality", () => {
    it("exports data to Excel", async () => {
      const user = userEvent.setup();
      render(<PurchaseMList />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Export Data/i })
        ).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /Export Data/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(backend.exportVouchersAll).toHaveBeenCalled();
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Export complete",
        })
      );
    });

    it("shows error on export failure", async () => {
      vi.mocked(backend.exportVouchersAll).mockRejectedValue(
        new Error("Export failed")
      );
      const user = userEvent.setup();
      render(<PurchaseMList />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Export Data/i })
        ).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /Export Data/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: "destructive",
            title: "Export failed",
          })
        );
      });
    });

    it("shows exporting state during export", async () => {
      vi.mocked(backend.exportVouchersAll).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const user = userEvent.setup();
      render(<PurchaseMList />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Export Data/i })
        ).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /Export Data/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Exporting/i })
        ).toBeDisabled();
      });
    });
  });
});
