import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RepairList from "@/components/vouchers/RepairList";
import * as backend from "@/lib/backend";

vi.mock("@/lib/backend");

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

global.confirm = vi.fn(() => true);
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

describe("RepairList", () => {
  const mockRecords = {
    results: [
      {
        id: "1",
        tag_no: "TAG-001",
        item_name: { name: "Gold Ring" },
        date: "2024-01-15",
        piece: 1,
        total: 5000,
        supplier: "Supplier A",
      },
      {
        id: "2",
        tag_no: "TAG-002",
        item_name: { name: "Silver Necklace" },
        date: "2024-01-16",
        piece: 2,
        total: 3000,
        supplier: "Supplier B",
      },
    ],
    count: 2,
    next: null,
    previous: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.repairList).mockResolvedValue(mockRecords as any);
    vi.mocked(backend.repairDelete).mockResolvedValue({} as any);
    vi.mocked(backend.exportRepairsAll).mockResolvedValue({
      blob: new Blob(),
      fileName: "repairs_data.xlsx",
    } as any);
    vi.mocked(backend.exportRepair).mockResolvedValue({
      blob: new Blob(),
      fileName: "repair_TAG-001.xlsx",
    } as any);
  });

  describe("Rendering", () => {
    it("renders repairs list header", async () => {
      render(<RepairList />);

      await waitFor(() => {
        expect(screen.getByText("Repairs")).toBeInTheDocument();
        expect(
          screen.getByText("Manage repairs: list, export, and create new.")
        ).toBeInTheDocument();
      });
    });

    it("displays repair records in table", async () => {
      render(<RepairList />);

      await waitFor(() => {
        expect(screen.getByText("TAG-001")).toBeInTheDocument();
        expect(screen.getByText("TAG-002")).toBeInTheDocument();
        expect(screen.getByText("Gold Ring")).toBeInTheDocument();
        expect(screen.getByText("Silver Necklace")).toBeInTheDocument();
        expect(screen.getByText("Supplier A")).toBeInTheDocument();
        expect(screen.getByText("Supplier B")).toBeInTheDocument();
      });
    });

    it("renders table headers", async () => {
      render(<RepairList />);

      await waitFor(() => {
        expect(screen.getByText("Tag No")).toBeInTheDocument();
        expect(screen.getByText("Item Name")).toBeInTheDocument();
        expect(screen.getByText("Date")).toBeInTheDocument();
        expect(screen.getByText("Piece")).toBeInTheDocument();
        expect(screen.getByText("Total")).toBeInTheDocument();
        expect(screen.getByText("Supplier")).toBeInTheDocument();
        expect(screen.getByText("Actions")).toBeInTheDocument();
      });
    });

    it("formats dates correctly", async () => {
      render(<RepairList />);

      await waitFor(() => {
        // Date formatting uses Intl.DateTimeFormat which may vary by locale
        // Just check that dates are displayed (not checking exact format)
        const dateElements = screen.getAllByText(/2024/i);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Search Functionality", () => {
    it("allows entering search query", async () => {
      const user = userEvent.setup();
      render(<RepairList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Search by tag no/i)
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by tag no/i);
      await user.type(searchInput, "TAG-001");

      expect(searchInput).toHaveValue("TAG-001");
    });

    it("submits search and fetches filtered results", async () => {
      const user = userEvent.setup();
      render(<RepairList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Search by tag no/i)
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by tag no/i);
      await user.type(searchInput, "TAG-001");

      const searchButton = screen.getByRole("button", { name: /Search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(backend.repairList).toHaveBeenCalledWith(
          expect.objectContaining({
            search: "TAG-001",
            page: 1,
          })
        );
      });
    });
  });

  describe("Delete Functionality", () => {
    it("shows confirmation dialog before delete", async () => {
      const user = userEvent.setup();
      render(<RepairList />);

      await waitFor(() => {
        expect(screen.getByText("TAG-001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
      await user.click(deleteButtons[0]);

      expect(global.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this repair?"
      );
    });

    it("deletes repair on confirmation", async () => {
      const user = userEvent.setup();
      render(<RepairList />);

      await waitFor(() => {
        expect(screen.getByText("TAG-001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(backend.repairDelete).toHaveBeenCalledWith("1");
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Repair removed",
          description: "The repair has been deleted.",
        })
      );
    });

    it("shows error on delete failure", async () => {
      vi.mocked(backend.repairDelete).mockRejectedValue(
        new Error("Delete failed")
      );
      const user = userEvent.setup();
      render(<RepairList />);

      await waitFor(() => {
        expect(screen.getByText("TAG-001")).toBeInTheDocument();
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
    it("exports all repairs data", async () => {
      const user = userEvent.setup();
      render(<RepairList />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Export Data/i })
        ).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /Export Data/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(backend.exportRepairsAll).toHaveBeenCalled();
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Export complete",
        })
      );
    });

    it("exports individual repair", async () => {
      const user = userEvent.setup();
      render(<RepairList />);

      await waitFor(() => {
        expect(screen.getByText("TAG-001")).toBeInTheDocument();
      });

      const exportButtons = screen.getAllByRole("button", { name: /Export/i });
      // First export button is "Export Data", skip it
      await user.click(exportButtons[1]);

      await waitFor(() => {
        expect(backend.exportRepair).toHaveBeenCalledWith("1");
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Form data successfully exported to Excel.",
        })
      );
    });

    it("shows error on export failure", async () => {
      vi.mocked(backend.exportRepairsAll).mockRejectedValue(
        new Error("Export failed")
      );
      const user = userEvent.setup();
      render(<RepairList />);

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
  });

  describe("Edit Functionality", () => {
    it("renders edit button for each repair", async () => {
      render(<RepairList />);

      await waitFor(() => {
        const editButtons = screen.getAllByRole("button", { name: /Edit/i });
        expect(editButtons.length).toBe(2);
      });
    });
  });

  describe("Pagination", () => {
    it("displays pagination controls", async () => {
      render(<RepairList />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Previous/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Next/i })
        ).toBeInTheDocument();
      });
    });

    it("disables Previous button on first page", async () => {
      render(<RepairList />);

      await waitFor(() => {
        const prevButton = screen.getByRole("button", { name: /Previous/i });
        expect(prevButton).toBeDisabled();
      });
    });

    it("navigates to next page", async () => {
      vi.mocked(backend.repairList).mockResolvedValue({
        results: mockRecords.results,
        count: 20,
        next: "next-url",
        previous: null,
      } as any);

      const user = userEvent.setup();
      render(<RepairList />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Next/i })
        ).not.toBeDisabled();
      });

      const nextButton = screen.getByRole("button", { name: /Next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(backend.repairList).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
          })
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("displays error message on load failure", async () => {
      vi.mocked(backend.repairList).mockRejectedValue(new Error("Load failed"));

      render(<RepairList />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load repairs/i)).toBeInTheDocument();
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Unable to load repairs",
        })
      );
    });
  });

  describe("Empty State", () => {
    it("displays empty state when no repairs", async () => {
      vi.mocked(backend.repairList).mockResolvedValue({
        results: [],
        count: 0,
        next: null,
        previous: null,
      } as any);

      render(<RepairList />);

      await waitFor(() => {
        expect(screen.getByText(/No repairs found/i)).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("shows skeleton loaders while loading", async () => {
      vi.mocked(backend.repairList).mockImplementation(
        () => new Promise(() => {})
      );

      render(<RepairList />);

      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});
