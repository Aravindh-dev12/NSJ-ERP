import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubAccountsList } from "@/components/accounts/SubAccountsList";
import * as backend from "@/lib/backend";
import * as exportLib from "@/lib/export";

// Mock Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock backend
vi.mock("@/lib/backend", () => ({
  subaccountsList: vi.fn(),
  subaccountDelete: vi.fn(),
  subaccountDetail: vi.fn(),
  subaccountUpdate: vi.fn(),
  exportSubaccountsAll: vi.fn(),
}));

// Mock export
vi.mock("@/lib/export", () => ({
  exportToExcel: vi.fn(),
  exportRowsToExcel: vi.fn(),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("SubAccountsList", () => {
  const mockSubAccounts = [
    {
      id: "1",
      account: "acc1",
      account_detail: { id: "acc1", name: "Customer A" },
      sub_account_name: "Sub A",
      phone_number: "1234567890",
      email: "suba@test.com",
    },
    {
      id: "2",
      account: "acc2",
      account_detail: { id: "acc2", name: "Customer B" },
      sub_account_name: "Sub B",
      phone_number: "0987654321",
      email: "subb@test.com",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.subaccountsList).mockResolvedValue({
      items: mockSubAccounts,
      results: mockSubAccounts,
      total: 2,
      count: 2,
    } as any);
    window.confirm = vi.fn(() => true);
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders the component with title", async () => {
      render(<SubAccountsList />);

      expect(screen.getByText("Sub Accounts List")).toBeInTheDocument();
    });

    it("loads sub accounts on mount", async () => {
      render(<SubAccountsList />);

      await waitFor(() => {
        expect(backend.subaccountsList).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByText("Sub A")).toBeInTheDocument();
      });
    });

    it("displays all sub accounts in table", async () => {
      render(<SubAccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Sub A")).toBeInTheDocument();
      });

      expect(screen.getByText("Sub B")).toBeInTheDocument();
      expect(screen.getByText("Customer A")).toBeInTheDocument();
      expect(screen.getByText("Customer B")).toBeInTheDocument();
    });

    it("displays table headers", async () => {
      render(<SubAccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Account")).toBeInTheDocument();
      });

      expect(screen.getByText("Sub Account")).toBeInTheDocument();
      expect(screen.getByText("Contact")).toBeInTheDocument();
      expect(screen.getByText("Orders")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("shows loading skeletons while fetching", () => {
      render(<SubAccountsList />);

      // Check for loading state by looking for skeleton elements
      const container = document.querySelector(".space-y-3");
      expect(container).toBeInTheDocument();
    });

    it("shows empty state when no records", async () => {
      vi.mocked(backend.subaccountsList).mockResolvedValue({
        items: [],
        results: [],
        total: 0,
        count: 0,
      } as any);

      render(<SubAccountsList />);

      await waitFor(() => {
        expect(screen.getByText("No sub accounts found.")).toBeInTheDocument();
      });
    });

    it("handles API error gracefully", async () => {
      vi.mocked(backend.subaccountsList).mockRejectedValue(
        new Error("API Error")
      );

      render(<SubAccountsList />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Unable to load sub accounts",
        });
      });

      await waitFor(() => {
        expect(screen.getByText("No sub accounts found.")).toBeInTheDocument();
      });
    });
  });

  describe("Search Functionality", () => {
    it("allows entering search text", async () => {
      const user = userEvent.setup();
      render(<SubAccountsList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search by name or phone")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by name or phone"
      );
      await user.type(searchInput, "Ring");

      expect(searchInput).toHaveValue("Ring");
    });

    it("triggers search on button click", async () => {
      const user = userEvent.setup();
      render(<SubAccountsList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search by name or phone")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by name or phone"
      );
      await user.type(searchInput, "Ring");

      const searchButton = screen.getByRole("button", { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(backend.subaccountsList).toHaveBeenCalledWith(
          expect.objectContaining({ search: "Ring" })
        );
      });
    });

    it("resets page to 1 when searching", async () => {
      const user = userEvent.setup();
      render(<SubAccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Sub A")).toBeInTheDocument();
      });

      // Type in search - this should reset page to 1
      const searchInput = screen.getByPlaceholderText(
        "Search by name or phone"
      );
      await user.type(searchInput, "Ring");

      await waitFor(() => {
        expect(backend.subaccountsList).toHaveBeenCalledWith(
          expect.objectContaining({ page: 1 })
        );
      });
    });
  });

  describe("Pagination", () => {
    it("displays pagination info", async () => {
      render(<SubAccountsList />);

      await waitFor(() => {
        expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
        expect(screen.getByText(/2 total/)).toBeInTheDocument();
      });
    });

    it("disables Previous button on first page", async () => {
      render(<SubAccountsList />);

      await waitFor(() => {
        const prevButton = screen.getByRole("button", { name: /previous/i });
        expect(prevButton).toBeDisabled();
      });
    });

    it("enables Next button when more pages available", async () => {
      vi.mocked(backend.subaccountsList).mockResolvedValue({
        items: mockSubAccounts,
        results: mockSubAccounts,
        total: 50,
        count: 50,
      } as any);

      render(<SubAccountsList />);

      await waitFor(() => {
        const nextButton = screen.getByRole("button", { name: /next/i });
        expect(nextButton).not.toBeDisabled();
      });
    });

    it("navigates to next page", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.subaccountsList).mockResolvedValue({
        items: mockSubAccounts,
        results: mockSubAccounts,
        total: 50,
        count: 50,
      } as any);

      render(<SubAccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Sub A")).toBeInTheDocument();
      });

      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(backend.subaccountsList).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });
    });

    it("navigates to previous page", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.subaccountsList).mockResolvedValue({
        items: mockSubAccounts,
        results: mockSubAccounts,
        total: 50,
        count: 50,
      } as any);

      render(<SubAccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Sub A")).toBeInTheDocument();
      });

      // Go to page 2 first
      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Page 2/)).toBeInTheDocument();
      });

      // Go back to page 1
      const prevButton = screen.getByRole("button", { name: /previous/i });
      await user.click(prevButton);

      await waitFor(() => {
        expect(backend.subaccountsList).toHaveBeenCalledWith(
          expect.objectContaining({ page: 1 })
        );
      });
    });
  });

  describe("Delete Functionality", () => {
    it("shows confirmation dialog before delete", async () => {
      const user = userEvent.setup();
      render(<SubAccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Sub A")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this sub account?"
      );
    });

    it("deletes sub account when confirmed", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.subaccountDelete).mockResolvedValue({} as any);

      render(<SubAccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Sub A")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(backend.subaccountDelete).toHaveBeenCalledWith("1");
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Deleted",
        description: "Sub account removed",
      });
    });

    it("does not delete when cancelled", async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => false);

      render(<SubAccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Sub A")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(backend.subaccountDelete).not.toHaveBeenCalled();
    });

    it("shows error on delete failure", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.subaccountDelete).mockRejectedValue(
        new Error("Delete failed")
      );

      render(<SubAccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Sub A")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Delete failed",
        });
      });
    });
  });

  describe("Edit Functionality", () => {
    it("opens edit dialog when Edit clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.subaccountDetail).mockResolvedValue(
        mockSubAccounts[0] as any
      );

      render(<SubAccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Sub A")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole("button", { name: /^edit$/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Edit Sub Account")).toBeInTheDocument();
      });
    });

    it("loads record details in edit dialog", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.subaccountDetail).mockResolvedValue(
        mockSubAccounts[0] as any
      );

      render(<SubAccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Sub A")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole("button", { name: /^edit$/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(backend.subaccountDetail).toHaveBeenCalledWith("1");
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue("Sub A")).toBeInTheDocument();
      });
    });

    it("closes edit dialog on Cancel", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.subaccountDetail).mockResolvedValue(
        mockSubAccounts[0] as any
      );

      render(<SubAccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Sub A")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole("button", { name: /^edit$/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Edit Sub Account")).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText("Edit Sub Account")).not.toBeInTheDocument();
      });
    });

    it("saves edited sub account", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.subaccountDetail).mockResolvedValue(
        mockSubAccounts[0] as any
      );
      vi.mocked(backend.subaccountUpdate).mockResolvedValue({} as any);

      render(<SubAccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Sub A")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole("button", { name: /^edit$/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Edit Sub Account")).toBeInTheDocument();
      });

      const subNameInput = screen.getByDisplayValue("Sub A");
      await user.clear(subNameInput);
      await user.type(subNameInput, "Sub A Updated");

      const saveButton = screen.getByRole("button", { name: /^save$/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(backend.subaccountUpdate).toHaveBeenCalledWith(
          "1",
          expect.objectContaining({
            sub_account_name: "Sub A Updated",
          })
        );
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Saved",
        description: "Sub account updated",
      });
    });

    it("shows error on save failure", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.subaccountDetail).mockResolvedValue(
        mockSubAccounts[0] as any
      );
      vi.mocked(backend.subaccountUpdate).mockRejectedValue(
        new Error("Update failed")
      );

      render(<SubAccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Sub A")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole("button", { name: /^edit$/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Edit Sub Account")).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /^save$/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Save failed",
        });
      });
    });
  });

  describe("Export Functionality", () => {
    it("exports all sub accounts", async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(["data"], { type: "application/vnd.ms-excel" });
      vi.mocked(backend.exportSubaccountsAll).mockResolvedValue({
        blob: mockBlob,
        fileName: "subaccounts.xlsx",
      } as any);

      render(<SubAccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Sub A")).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /export data/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(backend.exportSubaccountsAll).toHaveBeenCalled();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Sub accounts exported",
      });
    });

    it("shows error on export failure", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.exportSubaccountsAll).mockRejectedValue(
        new Error("Export failed")
      );

      render(<SubAccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Sub A")).toBeInTheDocument();
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
  });
});
