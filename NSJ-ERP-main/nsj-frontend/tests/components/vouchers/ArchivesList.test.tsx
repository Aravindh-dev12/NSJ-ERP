import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArchivesList } from "@/components/vouchers/ArchivesList";
import * as backend from "@/lib/backend";

// Mock backend
vi.mock("@/lib/backend", () => ({
  vouchersArchivesList: vi.fn(),
  archiveDelete: vi.fn(),
  exportVouchersAll: vi.fn(),
  exportArchive: vi.fn(),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("ArchivesList", () => {
  const mockArchives = [
    {
      id: "1",
      bill_no: "ORD001",
      date: "2024-12-01",
      item_name: "Ring",
      account: { name: "Customer A" },
      advance_payment_received: "NO",
      upload_file: null,
    },
    {
      id: "2",
      bill_no: "ORD002",
      date: "2024-12-02",
      item_name: "Necklace",
      account: { name: "Customer B" },
      advance_payment_received: "NO",
      upload_file: "https://example.com/image.jpg",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.vouchersArchivesList).mockResolvedValue({
      results: mockArchives,
      count: 2,
      next: null,
      previous: null,
    } as any);
    window.confirm = vi.fn(() => true);
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
    global.console.debug = vi.fn();
    global.console.error = vi.fn();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    // Wait for any pending state updates to complete
    await waitFor(() => {}, { timeout: 100 }).catch(() => {});
  });

  describe("Rendering", () => {
    it("renders the component with title", async () => {
      render(<ArchivesList />);

      const titles = screen.getAllByText("Pending Queries");
      expect(titles.length).toBeGreaterThan(0);
      expect(
        screen.getByText("Orders pending queries (advance payment = NO).")
      ).toBeInTheDocument();
    });

    it("loads archives on mount", async () => {
      render(<ArchivesList />);

      await waitFor(() => {
        expect(backend.vouchersArchivesList).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByText("ORD001")).toBeInTheDocument();
      });
    });

    it("displays all archives in table", async () => {
      render(<ArchivesList />);

      await waitFor(() => {
        expect(screen.getByText("ORD001")).toBeInTheDocument();
      });

      expect(screen.getByText("ORD002")).toBeInTheDocument();
      expect(screen.getByText("Ring")).toBeInTheDocument();
      expect(screen.getByText("Necklace")).toBeInTheDocument();
      expect(screen.getByText("Customer A")).toBeInTheDocument();
      expect(screen.getByText("Customer B")).toBeInTheDocument();
    });

    it("displays table headers", async () => {
      render(<ArchivesList />);

      await waitFor(() => {
        expect(screen.getByText("Order")).toBeInTheDocument();
      });

      expect(screen.getByText("Date")).toBeInTheDocument();
      expect(screen.getByText("Item")).toBeInTheDocument();
      expect(screen.getByText("Account")).toBeInTheDocument();
      expect(screen.getByText("Advance payment")).toBeInTheDocument();
      expect(screen.getByText("Attachment")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("shows loading skeletons while fetching", () => {
      render(<ArchivesList />);

      const skeletons = screen
        .getAllByRole("generic")
        .filter((el) => el.className.includes("animate-pulse"));
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows empty state when no records", async () => {
      vi.mocked(backend.vouchersArchivesList).mockResolvedValue({
        results: [],
        count: 0,
        next: null,
        previous: null,
      } as any);

      render(<ArchivesList />);

      await waitFor(() => {
        expect(
          screen.getByText("No pending queries found.")
        ).toBeInTheDocument();
      });
    });

    it("handles API error gracefully", async () => {
      vi.mocked(backend.vouchersArchivesList).mockRejectedValue(
        new Error("API Error")
      );

      render(<ArchivesList />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Unable to load pending queries",
          description: "API Error",
        });
      });

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load pending queries. Please try again.")
        ).toBeInTheDocument();
      });
    });

    it("formats dates correctly", async () => {
      render(<ArchivesList />);

      await waitFor(() => {
        // Date should be formatted as "Dec 1, 2024" or similar
        const dates = screen.getAllByText(/Dec/);
        expect(dates.length).toBeGreaterThan(0);
      });
    });

    it("displays image attachment", async () => {
      render(<ArchivesList />);

      await waitFor(() => {
        const images = screen.getAllByRole("img", { name: /attachment/i });
        expect(images.length).toBeGreaterThan(0);
      });
    });

    it("displays link for non-image attachment", async () => {
      const archivesWithPdf = [
        {
          ...mockArchives[0],
          upload_file: "https://example.com/document.pdf",
        },
      ];

      vi.mocked(backend.vouchersArchivesList).mockResolvedValue({
        results: archivesWithPdf,
        count: 1,
        next: null,
        previous: null,
      } as any);

      render(<ArchivesList />);

      await waitFor(() => {
        expect(screen.getByText("Open")).toBeInTheDocument();
      });
    });
  });

  describe("Search Functionality", () => {
    it("allows entering search text", async () => {
      const user = userEvent.setup();
      render(<ArchivesList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search by order number or description")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by order number or description"
      );
      await user.type(searchInput, "ORD001");

      expect(searchInput).toHaveValue("ORD001");
    });

    it("triggers search on form submit", async () => {
      const user = userEvent.setup();
      render(<ArchivesList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search by order number or description")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by order number or description"
      );
      await user.type(searchInput, "ORD001");

      const searchButton = screen.getByRole("button", { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(backend.vouchersArchivesList).toHaveBeenCalledWith(
          expect.objectContaining({ search: "ORD001" })
        );
      });
    });

    it("trims search input before submitting", async () => {
      const user = userEvent.setup();
      render(<ArchivesList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search by order number or description")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by order number or description"
      );
      await user.type(searchInput, "  ORD001  ");

      const searchButton = screen.getByRole("button", { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(backend.vouchersArchivesList).toHaveBeenCalledWith(
          expect.objectContaining({ search: "ORD001" })
        );
      });
    });

    it("resets page to 1 when searching", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.vouchersArchivesList).mockResolvedValue({
        results: mockArchives,
        count: 50,
        next: "next-url",
        previous: null,
      } as any);

      render(<ArchivesList />);

      await waitFor(() => {
        expect(screen.getByText("ORD001")).toBeInTheDocument();
      });

      // Go to page 2
      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      // Now search
      const searchInput = screen.getByPlaceholderText(
        "Search by order number or description"
      );
      await user.type(searchInput, "ORD001");

      const searchButton = screen.getByRole("button", { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(backend.vouchersArchivesList).toHaveBeenCalledWith(
          expect.objectContaining({ page: 1 })
        );
      });
    });
  });

  describe("Pagination", () => {
    it("displays pagination info", async () => {
      render(<ArchivesList />);

      await waitFor(() => {
        expect(screen.getByText(/Showing page 1 of 1/)).toBeInTheDocument();
        expect(screen.getByText(/2 total pending queries/)).toBeInTheDocument();
      });
    });

    it("disables Previous button on first page", async () => {
      render(<ArchivesList />);

      await waitFor(() => {
        const prevButton = screen.getByRole("button", { name: /previous/i });
        expect(prevButton).toBeDisabled();
      });
    });

    it("enables Next button when more pages available", async () => {
      vi.mocked(backend.vouchersArchivesList).mockResolvedValue({
        results: mockArchives,
        count: 50,
        next: "next-url",
        previous: null,
      } as any);

      render(<ArchivesList />);

      await waitFor(() => {
        const nextButton = screen.getByRole("button", { name: /next/i });
        expect(nextButton).not.toBeDisabled();
      });
    });

    it("navigates to next page", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.vouchersArchivesList).mockResolvedValue({
        results: mockArchives,
        count: 50,
        next: "next-url",
        previous: null,
      } as any);

      render(<ArchivesList />);

      await waitFor(() => {
        expect(screen.getByText("ORD001")).toBeInTheDocument();
      });

      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(backend.vouchersArchivesList).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });
    });

    it("navigates to previous page", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.vouchersArchivesList).mockResolvedValue({
        results: mockArchives,
        count: 50,
        next: "next-url",
        previous: null,
      } as any);

      render(<ArchivesList />);

      await waitFor(() => {
        expect(screen.getByText("ORD001")).toBeInTheDocument();
      });

      // Go to page 2 first
      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/page 2/i)).toBeInTheDocument();
      });

      // Go back to page 1
      const prevButton = screen.getByRole("button", { name: /previous/i });
      await user.click(prevButton);

      await waitFor(() => {
        expect(backend.vouchersArchivesList).toHaveBeenCalledWith(
          expect.objectContaining({ page: 1 })
        );
      });
    });

    it("disables pagination buttons while loading", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.vouchersArchivesList).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  results: mockArchives,
                  count: 50,
                  next: "next-url",
                  previous: null,
                } as any),
              100
            )
          )
      );

      render(<ArchivesList />);

      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      // Buttons should be disabled while loading
      expect(nextButton).toBeDisabled();
      expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    });
  });

  describe("Delete Functionality", () => {
    it("shows confirmation dialog before delete", async () => {
      const user = userEvent.setup();
      render(<ArchivesList />);

      await waitFor(() => {
        expect(screen.getByText("ORD001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this pending query record?"
      );
    });

    it("deletes archive when confirmed", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.archiveDelete).mockResolvedValue({} as any);

      render(<ArchivesList />);

      await waitFor(() => {
        expect(screen.getByText("ORD001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(backend.archiveDelete).toHaveBeenCalledWith("1");
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Pending query removed",
        description: "The record has been deleted successfully.",
      });
    });

    it("does not delete when cancelled", async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => false);

      render(<ArchivesList />);

      await waitFor(() => {
        expect(screen.getByText("ORD001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(backend.archiveDelete).not.toHaveBeenCalled();
    });

    it("shows error on delete failure", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.archiveDelete).mockRejectedValue(
        new Error("Delete failed")
      );

      render(<ArchivesList />);

      await waitFor(() => {
        expect(screen.getByText("ORD001")).toBeInTheDocument();
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

    it("disables delete button while deleting", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.archiveDelete).mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve({} as any), 100))
      );

      render(<ArchivesList />);

      await waitFor(() => {
        expect(screen.getByText("ORD001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Deleting…")).toBeInTheDocument();
      });
    });

    it("logs debug info on delete", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.archiveDelete).mockResolvedValue({} as any);

      render(<ArchivesList />);

      await waitFor(() => {
        expect(screen.getByText("ORD001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(console.debug).toHaveBeenCalledWith(
          "Deleting archive",
          expect.objectContaining({ id: "1" })
        );
      });
    });
  });

  describe("Export Functionality", () => {
    it("exports all archives", async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(["data"], { type: "application/vnd.ms-excel" });
      vi.mocked(backend.exportVouchersAll).mockResolvedValue({
        blob: mockBlob,
        fileName: "orders_data.xlsx",
      } as any);

      render(<ArchivesList />);

      await waitFor(() => {
        expect(screen.getByText("ORD001")).toBeInTheDocument();
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

    it("exports single archive", async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(["data"], { type: "application/vnd.ms-excel" });
      vi.mocked(backend.exportArchive).mockResolvedValue({
        blob: mockBlob,
        fileName: "Order_ORD001.xlsx",
      } as any);

      render(<ArchivesList />);

      await waitFor(() => {
        expect(screen.getByText("ORD001")).toBeInTheDocument();
      });

      const exportButtons = screen.getAllByRole("button", {
        name: /^export$/i,
      });
      await user.click(exportButtons[0]);

      await waitFor(() => {
        expect(backend.exportArchive).toHaveBeenCalledWith("1");
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Form data successfully exported to Excel.",
      });
    });

    it("shows error on export all failure", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.exportVouchersAll).mockRejectedValue(
        new Error("Export failed")
      );

      render(<ArchivesList />);

      await waitFor(() => {
        expect(screen.getByText("ORD001")).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /export data/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Export failed",
        });
      });
    });

    it("shows error on single export failure", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.exportArchive).mockRejectedValue(
        new Error("Export failed")
      );

      render(<ArchivesList />);

      await waitFor(() => {
        expect(screen.getByText("ORD001")).toBeInTheDocument();
      });

      const exportButtons = screen.getAllByRole("button", {
        name: /^export$/i,
      });
      await user.click(exportButtons[0]);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Export failed",
        });
      });
    });

    it("disables export button while exporting", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.exportVouchersAll).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  blob: new Blob(),
                  fileName: "test.xlsx",
                } as any),
              100
            )
          )
      );

      render(<ArchivesList />);

      await waitFor(() => {
        expect(screen.getByText("ORD001")).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /export data/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText("Exporting…")).toBeInTheDocument();
      });
    });
  });
});
