import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PurchaseTagwiseList from "@/components/vouchers/PurchaseTagwiseList";
import * as backend from "@/lib/backend";

vi.mock("@/lib/backend");

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

global.confirm = vi.fn(() => true);
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

describe("PurchaseTagwiseList", () => {
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
    vi.mocked(backend.purchaseTagwiseList).mockResolvedValue(
      mockRecords as any
    );
    vi.mocked(backend.purchaseTagwiseDelete).mockResolvedValue({} as any);
    vi.mocked(backend.exportVouchersAll).mockResolvedValue({
      blob: new Blob(),
      fileName: "purchase_tagwise_data.xlsx",
    } as any);
  });

  describe("Rendering", () => {
    it("renders list header", async () => {
      render(<PurchaseTagwiseList />);

      await waitFor(() => {
        expect(screen.getByText("Purchase Tagwise M")).toBeInTheDocument();
      });
    });

    it("displays purchase records", async () => {
      render(<PurchaseTagwiseList />);

      await waitFor(() => {
        expect(screen.getByText("BILL-001")).toBeInTheDocument();
        expect(screen.getByText("BILL-002")).toBeInTheDocument();
      });
    });

    it("renders search and export buttons", async () => {
      render(<PurchaseTagwiseList />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Search/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Export Data/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Search Functionality", () => {
    it("submits search query", async () => {
      const user = userEvent.setup();
      render(<PurchaseTagwiseList />);

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
        expect(backend.purchaseTagwiseList).toHaveBeenCalledWith(
          expect.objectContaining({
            search: "BILL-001",
          })
        );
      });
    });
  });

  describe("Delete Functionality", () => {
    it("deletes record on confirmation", async () => {
      const user = userEvent.setup();
      render(<PurchaseTagwiseList />);

      await waitFor(() => {
        expect(screen.getByText("BILL-001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(backend.purchaseTagwiseDelete).toHaveBeenCalledWith("1");
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Record removed",
        })
      );
    });

    it("shows error on delete failure", async () => {
      vi.mocked(backend.purchaseTagwiseDelete).mockRejectedValue(
        new Error("Delete failed")
      );
      const user = userEvent.setup();
      render(<PurchaseTagwiseList />);

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
  });

  describe("Export Functionality", () => {
    it("exports data successfully", async () => {
      const user = userEvent.setup();
      render(<PurchaseTagwiseList />);

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
  });

  describe("Pagination", () => {
    it("navigates between pages", async () => {
      vi.mocked(backend.purchaseTagwiseList).mockResolvedValue({
        results: mockRecords.results,
        count: 20,
        next: "next-url",
        previous: null,
      } as any);

      const user = userEvent.setup();
      render(<PurchaseTagwiseList />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Next/i })
        ).not.toBeDisabled();
      });

      const nextButton = screen.getByRole("button", { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(backend.purchaseTagwiseList).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
          })
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("displays error message on load failure", async () => {
      vi.mocked(backend.purchaseTagwiseList).mockRejectedValue(
        new Error("Load failed")
      );

      render(<PurchaseTagwiseList />);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load purchase tagwise records/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("displays empty state when no records", async () => {
      vi.mocked(backend.purchaseTagwiseList).mockResolvedValue({
        results: [],
        count: 0,
        next: null,
        previous: null,
      } as any);

      render(<PurchaseTagwiseList />);

      await waitFor(() => {
        expect(
          screen.getByText(/No purchase tagwise records found/i)
        ).toBeInTheDocument();
      });
    });
  });
});
