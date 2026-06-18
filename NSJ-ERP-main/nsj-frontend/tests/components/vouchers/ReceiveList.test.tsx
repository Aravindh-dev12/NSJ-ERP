import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReceiveList } from "@/components/vouchers/ReceiveList";
import * as backend from "@/lib/backend";

// Mock the backend module
vi.mock("@/lib/backend", () => ({
  receiveList: vi.fn(),
  receiveDelete: vi.fn(),
}));

// Mock the toast hook
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock SalesHeader component
vi.mock("@/components/vouchers/SalesHeader", () => ({
  SalesHeader: ({ title, description }: any) => (
    <div data-testid="sales-header">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}));

describe("ReceiveList", () => {
  const mockReceiveData = {
    count: 3,
    next: null,
    previous: null,
    items: [
      {
        id: "1",
        date: "2024-01-15",
        account: { account_name: "Test Customer 1" },
        tag_no: "TAG001",
        item_name: { name: "Gold Ring" },
        pc: 1,
        gr_wt: 10.5,
        net_wt: 9.8,
        rate: 5000,
      },
      {
        id: "2",
        date: "2024-01-16",
        account: { account_name: "Test Customer 2" },
        tag_no: "TAG002",
        item_name: { name: "Silver Necklace" },
        pc: 2,
        gr_wt: 15.2,
        net_wt: 14.5,
        rate: 3000,
      },
      {
        id: "3",
        date: "2024-01-17",
        account: "Test Customer 3",
        tag_no: "TAG003",
        item_name: "Diamond Bracelet",
        pc: 1,
        gr_wt: 20.0,
        net_wt: 19.0,
        rate: 10000,
      },
    ],
    results: [
      {
        id: "1",
        date: "2024-01-15",
        account: { account_name: "Test Customer 1" },
        tag_no: "TAG001",
        item_name: { name: "Gold Ring" },
        pc: 1,
        gr_wt: 10.5,
        net_wt: 9.8,
        rate: 5000,
      },
      {
        id: "2",
        date: "2024-01-16",
        account: { account_name: "Test Customer 2" },
        tag_no: "TAG002",
        item_name: { name: "Silver Necklace" },
        pc: 2,
        gr_wt: 15.2,
        net_wt: 14.5,
        rate: 3000,
      },
      {
        id: "3",
        date: "2024-01-17",
        account: "Test Customer 3",
        tag_no: "TAG003",
        item_name: "Diamond Bracelet",
        pc: 1,
        gr_wt: 20.0,
        net_wt: 19.0,
        rate: 10000,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.receiveList).mockResolvedValue(mockReceiveData);
    window.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders the component with header", async () => {
      render(<ReceiveList />);

      await waitFor(() => {
        expect(screen.getByTestId("sales-header")).toBeInTheDocument();
      });

      expect(screen.getByText("Receive")).toBeInTheDocument();
      expect(screen.getByText("Manage receive entries.")).toBeInTheDocument();
    });

    it("renders the receive list title", async () => {
      render(<ReceiveList />);

      await waitFor(() => {
        expect(screen.getByText("Receive list")).toBeInTheDocument();
      });
    });

    it("renders search input and button", async () => {
      render(<ReceiveList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search by tag no, account or item")
        ).toBeInTheDocument();
      });

      expect(
        screen.getByRole("button", { name: /search/i })
      ).toBeInTheDocument();
    });
  });

  describe("Data Loading", () => {
    it("displays loading skeletons initially", () => {
      render(<ReceiveList />);

      // Check for skeleton elements (they have specific class)
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("fetches and displays receive records", async () => {
      render(<ReceiveList />);

      await waitFor(() => {
        expect(backend.receiveList).toHaveBeenCalledWith({
          page: 1,
          page_size: 10,
        });
      });

      await waitFor(() => {
        expect(screen.getByText("Test Customer 1")).toBeInTheDocument();
        expect(screen.getByText("Test Customer 2")).toBeInTheDocument();
        expect(screen.getByText("TAG001")).toBeInTheDocument();
        expect(screen.getByText("Gold Ring")).toBeInTheDocument();
      });
    });

    it("displays formatted dates", async () => {
      render(<ReceiveList />);

      await waitFor(() => {
        const dateElements = screen.getAllByText(
          /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/
        );
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });

    it("handles string account names", async () => {
      render(<ReceiveList />);

      await waitFor(() => {
        expect(screen.getByText("Test Customer 3")).toBeInTheDocument();
      });
    });

    it("handles string item names", async () => {
      render(<ReceiveList />);

      await waitFor(() => {
        expect(screen.getByText("Diamond Bracelet")).toBeInTheDocument();
      });
    });
  });

  describe("Table Display", () => {
    it("renders table headers", async () => {
      render(<ReceiveList />);

      await waitFor(() => {
        expect(screen.getByText("Date")).toBeInTheDocument();
      });

      expect(screen.getByText("Account")).toBeInTheDocument();
      expect(screen.getByText("Tag No")).toBeInTheDocument();
      expect(screen.getByText("Item Name")).toBeInTheDocument();
      expect(screen.getByText("Pc")).toBeInTheDocument();
      expect(screen.getByText("Gr.Wt")).toBeInTheDocument();
      expect(screen.getByText("Net.Wt")).toBeInTheDocument();
      expect(screen.getByText("Rate")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("displays all record data in table", async () => {
      render(<ReceiveList />);

      await waitFor(() => {
        expect(screen.getByText("TAG001")).toBeInTheDocument();
      });

      expect(screen.getByText("10.5")).toBeInTheDocument();
      expect(screen.getByText("9.8")).toBeInTheDocument();
      expect(screen.getByText("5000")).toBeInTheDocument();
    });

    it("displays delete buttons for each record", async () => {
      render(<ReceiveList />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole("button", {
          name: /delete/i,
        });
        expect(deleteButtons).toHaveLength(3);
      });
    });
  });

  describe("Search Functionality", () => {
    it("handles search input changes", async () => {
      const user = userEvent.setup();
      render(<ReceiveList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search by tag no, account or item")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by tag no, account or item"
      );
      await user.type(searchInput, "TAG001");

      expect(searchInput).toHaveValue("TAG001");
    });

    it("submits search and fetches filtered results", async () => {
      const user = userEvent.setup();
      const filteredData = {
        ...mockReceiveData,
        count: 1,
        results: [mockReceiveData.results[0]],
        items: [mockReceiveData.results[0]],
      };

      vi.mocked(backend.receiveList)
        .mockResolvedValueOnce(mockReceiveData)
        .mockResolvedValueOnce(filteredData);

      render(<ReceiveList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search by tag no, account or item")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by tag no, account or item"
      );
      const searchButton = screen.getByRole("button", { name: /search/i });

      await user.type(searchInput, "TAG001");
      await user.click(searchButton);

      await waitFor(() => {
        expect(backend.receiveList).toHaveBeenCalledWith({
          page: 1,
          page_size: 10,
          search: "TAG001",
        });
      });
    });

    it("trims search input before submitting", async () => {
      const user = userEvent.setup();
      render(<ReceiveList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search by tag no, account or item")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by tag no, account or item"
      );
      const searchButton = screen.getByRole("button", { name: /search/i });

      await user.type(searchInput, "  TAG001  ");
      await user.click(searchButton);

      await waitFor(() => {
        expect(backend.receiveList).toHaveBeenCalledWith({
          page: 1,
          page_size: 10,
          search: "TAG001",
        });
      });
    });

    it("resets to page 1 when searching", async () => {
      const user = userEvent.setup();
      render(<ReceiveList />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /search/i })
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by tag no, account or item"
      );
      const searchButton = screen.getByRole("button", { name: /search/i });

      await user.type(searchInput, "test");
      await user.click(searchButton);

      await waitFor(() => {
        expect(backend.receiveList).toHaveBeenLastCalledWith(
          expect.objectContaining({ page: 1 })
        );
      });
    });
  });

  describe("Pagination", () => {
    it("displays pagination information", async () => {
      render(<ReceiveList />);

      await waitFor(() => {
        expect(screen.getByText(/Showing page 1 of 1/)).toBeInTheDocument();
        expect(screen.getByText(/3 total receives/)).toBeInTheDocument();
      });
    });

    it("renders previous and next buttons", async () => {
      render(<ReceiveList />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /previous/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /next/i })
        ).toBeInTheDocument();
      });
    });

    it("disables previous button on first page", async () => {
      render(<ReceiveList />);

      await waitFor(() => {
        const prevButton = screen.getByRole("button", { name: /previous/i });
        expect(prevButton).toBeDisabled();
      });
    });

    it("handles next page navigation", async () => {
      const user = userEvent.setup();
      const multiPageData = {
        count: 25,
        next: "http://api.example.com/page2",
        previous: null,
        results: mockReceiveData.results,
        items: mockReceiveData.results,
      };

      vi.mocked(backend.receiveList).mockResolvedValue(multiPageData);

      render(<ReceiveList />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /next/i })
        ).toBeInTheDocument();
      });

      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(backend.receiveList).toHaveBeenCalledWith({
          page: 2,
          page_size: 10,
        });
      });
    });

    it("handles previous page navigation", async () => {
      const user = userEvent.setup();
      const multiPageData = {
        count: 25,
        next: "http://api.example.com/page2",
        previous: null,
        results: mockReceiveData.results,
        items: mockReceiveData.results,
      };
      const page2Data = {
        count: 25,
        next: null,
        previous: "http://api.example.com/page1",
        results: mockReceiveData.results,
        items: mockReceiveData.results,
      };

      vi.mocked(backend.receiveList)
        .mockResolvedValueOnce(multiPageData)
        .mockResolvedValueOnce(page2Data)
        .mockResolvedValueOnce(multiPageData);

      render(<ReceiveList />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /next/i })
        ).toBeInTheDocument();
      });

      // Go to page 2
      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(backend.receiveList).toHaveBeenCalledWith({
          page: 2,
          page_size: 10,
        });
      });

      // Wait for page 2 to load and previous button to be enabled
      await waitFor(() => {
        const prevButton = screen.getByRole("button", { name: /previous/i });
        expect(prevButton).not.toBeDisabled();
      });

      // Go back to page 1
      const prevButton = screen.getByRole("button", { name: /previous/i });
      await user.click(prevButton);

      await waitFor(() => {
        expect(backend.receiveList).toHaveBeenCalledWith({
          page: 1,
          page_size: 10,
        });
      });
    });

    it("calculates total pages correctly", async () => {
      const largeData = {
        count: 47,
        next: null,
        previous: null,
        results: mockReceiveData.results,
        items: mockReceiveData.results,
      };

      vi.mocked(backend.receiveList).mockResolvedValue(largeData);

      render(<ReceiveList />);

      await waitFor(() => {
        expect(screen.getByText(/Showing page 1 of 5/)).toBeInTheDocument();
      });
    });
  });

  describe("Delete Functionality", () => {
    it("shows confirmation dialog when deleting", async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, "confirm");

      render(<ReceiveList />);

      await waitFor(() => {
        expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(
          3
        );
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith(
        "Are you sure you want to delete this receive entry?"
      );
    });

    it("deletes record when confirmed", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.receiveDelete).mockResolvedValue(undefined);

      render(<ReceiveList />);

      await waitFor(() => {
        expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(
          3
        );
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(backend.receiveDelete).toHaveBeenCalledWith("1");
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Receive removed",
        description: "The receive entry has been deleted.",
      });
    });

    it("does not delete when cancelled", async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => false);

      render(<ReceiveList />);

      await waitFor(() => {
        expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(
          3
        );
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(backend.receiveDelete).not.toHaveBeenCalled();
    });

    it("shows deleting state during deletion", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.receiveDelete).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ReceiveList />);

      await waitFor(() => {
        expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(
          3
        );
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Deleting…")).toBeInTheDocument();
      });
    });

    it("handles delete error", async () => {
      const user = userEvent.setup();
      const error = new Error("Delete failed");
      vi.mocked(backend.receiveDelete).mockRejectedValue(error);

      render(<ReceiveList />);

      await waitFor(() => {
        expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(
          3
        );
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

    it("refreshes list after successful deletion", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.receiveDelete).mockResolvedValue(undefined);

      render(<ReceiveList />);

      await waitFor(() => {
        expect(backend.receiveList).toHaveBeenCalledTimes(1);
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Component calls receiveList after successful deletion to refresh the list
      // May be called 2-3 times depending on React rendering behavior
      await waitFor(() => {
        expect(backend.receiveList.mock.calls.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe("Error Handling", () => {
    it("displays error message when fetch fails", async () => {
      const error = new Error("Network error");
      vi.mocked(backend.receiveList).mockRejectedValue(error);

      render(<ReceiveList />);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load receives. Please try again.")
        ).toBeInTheDocument();
      });

      expect(mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Unable to load receives",
        description: "Network error",
      });
    });

    it("shows empty state when no records found", async () => {
      vi.mocked(backend.receiveList).mockResolvedValue({
        count: 0,
        next: null,
        previous: null,
        results: [],
        items: [],
      });

      render(<ReceiveList />);

      await waitFor(() => {
        expect(
          screen.getByText("No receive entries found.")
        ).toBeInTheDocument();
      });
    });

    it("handles missing optional fields gracefully", async () => {
      const dataWithMissingFields = {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: "1",
            date: null,
            account: null,
            tag_no: null,
            item_name: null,
            pc: null,
            gr_wt: null,
            net_wt: null,
            rate: null,
          },
        ],
        items: [
          {
            id: "1",
            date: null,
            account: null,
            tag_no: null,
            item_name: null,
            pc: null,
            gr_wt: null,
            net_wt: null,
            rate: null,
          },
        ],
      };

      vi.mocked(backend.receiveList).mockResolvedValue(dataWithMissingFields);

      render(<ReceiveList />);

      await waitFor(() => {
        const emDashes = screen.getAllByText("—");
        expect(emDashes.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles zero count with results", async () => {
      const edgeCaseData = {
        count: 0,
        next: null,
        previous: null,
        results: mockReceiveData.results,
        items: mockReceiveData.results,
      };

      vi.mocked(backend.receiveList).mockResolvedValue(edgeCaseData);

      render(<ReceiveList />);

      await waitFor(() => {
        expect(screen.getByText(/0 total receives/)).toBeInTheDocument();
      });
    });

    it("handles missing meta fields", async () => {
      const dataWithoutMeta = {
        results: mockReceiveData.results,
        items: mockReceiveData.results,
      } as any;

      vi.mocked(backend.receiveList).mockResolvedValue(dataWithoutMeta);

      render(<ReceiveList />);

      await waitFor(() => {
        expect(screen.getByText("Test Customer 1")).toBeInTheDocument();
      });
    });

    it("disables pagination buttons during loading", async () => {
      vi.mocked(backend.receiveList).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockReceiveData), 100)
          )
      );

      render(<ReceiveList />);

      const prevButton = screen.getByRole("button", { name: /previous/i });
      const nextButton = screen.getByRole("button", { name: /next/i });

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });
  });
});
