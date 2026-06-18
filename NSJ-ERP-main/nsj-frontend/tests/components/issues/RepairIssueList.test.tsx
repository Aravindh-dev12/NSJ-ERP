import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RepairIssueList from "@/components/issues/RepairIssueList";
import * as backend from "@/lib/backend";

vi.mock("@/lib/backend");

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockBack = vi.fn();
const mockPathname = vi.fn(() => "/issues/list");
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: mockBack,
  }),
  usePathname: () => mockPathname(),
}));

describe("RepairIssueList", () => {
  const mockIssues = [
    {
      id: "1",
      tag_no: "TAG-001",
      item_name: { id: "item1", name: "Gold Ring" },
      account: { id: "acc1", account_name: "Account A" },
      piece: 5,
      total: 25000,
      created_at: "2024-01-15T10:00:00Z",
    },
    {
      id: "2",
      tag_no: "TAG-002",
      item_name: { id: "item2", name: "Silver Necklace" },
      account: { id: "acc2", account_name: "Account B" },
      piece: 3,
      total: 15000,
      created_at: "2024-01-16T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.repairIssueList).mockResolvedValue({
      results: mockIssues,
      count: 2,
      next: null,
      previous: null,
    } as any);
    vi.mocked(backend.repairIssueDelete).mockResolvedValue({} as any);
    vi.mocked(backend.vouchersItemNames).mockResolvedValue({
      item_names: [],
    } as any);
    vi.mocked(backend.accountsDropdown).mockResolvedValue([]);
    window.confirm = vi.fn(() => true);
  });

  describe("Rendering", () => {
    it("renders the component with title when showHeader is true", async () => {
      render(<RepairIssueList showHeader={true} />);

      expect(screen.getByText("Repair Issues")).toBeInTheDocument();
      expect(screen.getByText("Manage repair issues")).toBeInTheDocument();
    });

    it("does not render header when showHeader is false", async () => {
      render(<RepairIssueList showHeader={false} />);

      expect(screen.queryByText("Repair Issues")).not.toBeInTheDocument();
    });

    it("loads issues on mount", async () => {
      render(<RepairIssueList />);

      await waitFor(() => {
        expect(backend.repairIssueList).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText("TAG-001")).toBeInTheDocument();
      });
    });

    it("displays all issues in table", async () => {
      render(<RepairIssueList />);

      await waitFor(() => {
        expect(screen.getByText("TAG-001")).toBeInTheDocument();
      });

      expect(screen.getByText("TAG-002")).toBeInTheDocument();
      expect(screen.getByText("Gold Ring")).toBeInTheDocument();
      expect(screen.getByText("Silver Necklace")).toBeInTheDocument();
      expect(screen.getByText("Account A")).toBeInTheDocument();
      expect(screen.getByText("Account B")).toBeInTheDocument();
    });

    it("displays table headers", async () => {
      render(<RepairIssueList />);

      await waitFor(() => {
        expect(screen.getByText("Tag No")).toBeInTheDocument();
      });

      expect(screen.getByText("Item")).toBeInTheDocument();
      expect(screen.getByText("Account")).toBeInTheDocument();
      expect(screen.getByText("Piece")).toBeInTheDocument();
      expect(screen.getByText("Total")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("shows loading skeletons while fetching", () => {
      render(<RepairIssueList />);

      const skeletons = screen
        .getAllByRole("generic")
        .filter((el) => el.className.includes("animate-pulse"));
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows empty state when no records", async () => {
      vi.mocked(backend.repairIssueList).mockResolvedValue({
        results: [],
        count: 0,
        next: null,
        previous: null,
      } as any);

      render(<RepairIssueList />);

      await waitFor(() => {
        expect(screen.getByText(/No issues found/i)).toBeInTheDocument();
      });
    });

    it("handles API error gracefully", async () => {
      vi.mocked(backend.repairIssueList).mockRejectedValue(
        new Error("API Error")
      );

      render(<RepairIssueList />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Unable to load issues",
          description: "API Error",
        });
      });
    });
  });

  describe("Search Functionality", () => {
    it("allows entering search text", async () => {
      const user = userEvent.setup();
      render(<RepairIssueList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search by tag, account or item")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by tag, account or item"
      );
      await user.type(searchInput, "TAG-001");

      expect(searchInput).toHaveValue("TAG-001");
    });

    it("triggers search on form submit", async () => {
      const user = userEvent.setup();
      render(<RepairIssueList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search by tag, account or item")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by tag, account or item"
      );
      await user.type(searchInput, "TAG-001");

      const searchButton = screen.getByRole("button", { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(backend.repairIssueList).toHaveBeenCalledWith(
          expect.objectContaining({ search: "TAG-001" })
        );
      });
    });

    it("trims search input before submitting", async () => {
      const user = userEvent.setup();
      render(<RepairIssueList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search by tag, account or item")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by tag, account or item"
      );
      await user.type(searchInput, "  TAG-001  ");

      const searchButton = screen.getByRole("button", { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(backend.repairIssueList).toHaveBeenCalledWith(
          expect.objectContaining({ search: "TAG-001" })
        );
      });
    });
  });

  describe("Pagination", () => {
    it("displays pagination info", async () => {
      render(<RepairIssueList />);

      await waitFor(() => {
        expect(screen.getByText(/Showing page 1 of 1/)).toBeInTheDocument();
        expect(screen.getByText(/2 total issues/)).toBeInTheDocument();
      });
    });

    it("disables Previous button on first page", async () => {
      render(<RepairIssueList />);

      await waitFor(() => {
        const prevButton = screen.getByRole("button", { name: /previous/i });
        expect(prevButton).toBeDisabled();
      });
    });

    it("enables Next button when more pages available", async () => {
      vi.mocked(backend.repairIssueList).mockResolvedValue({
        results: mockIssues,
        count: 50,
        next: "next-url",
        previous: null,
      } as any);

      render(<RepairIssueList />);

      await waitFor(() => {
        const nextButton = screen.getByRole("button", { name: /next/i });
        expect(nextButton).not.toBeDisabled();
      });
    });

    it("navigates to next page", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.repairIssueList).mockResolvedValue({
        results: mockIssues,
        count: 50,
        next: "next-url",
        previous: null,
      } as any);

      render(<RepairIssueList />);

      await waitFor(() => {
        expect(screen.getByText("TAG-001")).toBeInTheDocument();
      });

      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(backend.repairIssueList).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });
    });
  });

  describe("Delete Functionality", () => {
    it("shows confirmation dialog before delete", async () => {
      const user = userEvent.setup();
      render(<RepairIssueList />);

      await waitFor(() => {
        expect(screen.getByText("TAG-001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this issue?"
      );
    });

    it("deletes issue when confirmed", async () => {
      const user = userEvent.setup();
      render(<RepairIssueList />);

      await waitFor(() => {
        expect(screen.getByText("TAG-001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(backend.repairIssueDelete).toHaveBeenCalledWith("1");
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Issue removed",
        description: "The issue has been deleted successfully.",
      });
    });

    it("does not delete when cancelled", async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => false);

      render(<RepairIssueList />);

      await waitFor(() => {
        expect(screen.getByText("TAG-001")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(backend.repairIssueDelete).not.toHaveBeenCalled();
    });

    it("shows error on delete failure", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.repairIssueDelete).mockRejectedValue(
        new Error("Delete failed")
      );

      render(<RepairIssueList />);

      await waitFor(() => {
        expect(screen.getByText("TAG-001")).toBeInTheDocument();
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

  describe("View Functionality", () => {
    it("renders View button for each issue", async () => {
      render(<RepairIssueList />);

      await waitFor(() => {
        expect(screen.getByText("TAG-001")).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      expect(viewButtons).toHaveLength(2);
    });
  });
});
