import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountsList } from "@/components/accounts/AccountsList";
import * as backend from "@/lib/backend";

vi.mock("@/lib/backend");

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockBack = vi.fn();
const mockPathname = vi.fn(() => "/accounts/list");
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: mockBack,
  }),
  usePathname: () => mockPathname(),
}));

describe("AccountsList", () => {
  const mockAccounts = [
    {
      id: "1",
      account_name: "Customer A",
      account_no: "ACC-001",
      group_code: "CUSTOMER",
      branch: { name: "Main Branch" },
      location: { name: "Mumbai" },
      status: "ACTIVE",
      created_at: "2024-01-15T10:00:00Z",
    },
    {
      id: "2",
      account_name: "Supplier B",
      account_no: "ACC-002",
      group_code: "SUPPLIER",
      branch: { name: "Branch 2" },
      contact: { city: { name: "Delhi" } },
      status: "INACTIVE",
      created_at: "2024-01-16T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.accountsList).mockResolvedValue({
      results: mockAccounts,
      count: 2,
      next: null,
      previous: null,
    } as any);
    vi.mocked(backend.accountDelete).mockResolvedValue({} as any);
    vi.mocked(backend.exportAccountsAll).mockResolvedValue({
      blob: new Blob(),
      fileName: "accounts.xlsx",
    } as any);
    vi.mocked(backend.exportAccount).mockResolvedValue({
      blob: new Blob(),
      fileName: "account.xlsx",
    } as any);
    window.confirm = vi.fn(() => true);
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  describe("Rendering", () => {
    it("renders the component with title", async () => {
      render(<AccountsList />);

      expect(screen.getByText("Accounts")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Manage company accounts, review their status, and keep records tidy."
        )
      ).toBeInTheDocument();
    });

    it("loads accounts on mount", async () => {
      render(<AccountsList />);

      await waitFor(() => {
        expect(backend.accountsList).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });
    });

    it("displays all accounts in table", async () => {
      render(<AccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      expect(screen.getByText("Supplier B")).toBeInTheDocument();
      expect(screen.getByText("ACC-001")).toBeInTheDocument();
      expect(screen.getByText("ACC-002")).toBeInTheDocument();
      expect(screen.getByText("CUSTOMER")).toBeInTheDocument();
      expect(screen.getByText("SUPPLIER")).toBeInTheDocument();
    });

    it("displays table headers", async () => {
      render(<AccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Account")).toBeInTheDocument();
      });

      expect(screen.getByText("Group")).toBeInTheDocument();
      expect(screen.getByText("Branch")).toBeInTheDocument();
      expect(screen.getByText("Location")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Created")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("shows loading skeletons while fetching", () => {
      render(<AccountsList />);

      const skeletons = screen
        .getAllByRole("generic")
        .filter((el) => el.className.includes("animate-pulse"));
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows empty state when no records", async () => {
      vi.mocked(backend.accountsList).mockResolvedValue({
        results: [],
        count: 0,
        next: null,
        previous: null,
      } as any);

      render(<AccountsList />);

      await waitFor(() => {
        expect(screen.getByText(/No accounts found/i)).toBeInTheDocument();
      });
    });

    it("handles API error gracefully", async () => {
      vi.mocked(backend.accountsList).mockRejectedValue(new Error("API Error"));

      render(<AccountsList />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Unable to load accounts",
          description: "API Error",
        });
      });
    });
  });

  describe("Search Functionality", () => {
    it("allows entering search text", async () => {
      const user = userEvent.setup();
      render(<AccountsList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search by name or account number")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by name or account number"
      );
      await user.type(searchInput, "Customer A");

      expect(searchInput).toHaveValue("Customer A");
    });

    it("triggers search on form submit", async () => {
      const user = userEvent.setup();
      render(<AccountsList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search by name or account number")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by name or account number"
      );
      await user.type(searchInput, "Customer A");

      const searchButton = screen.getByRole("button", { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(backend.accountsList).toHaveBeenCalledWith(
          expect.objectContaining({ search: "Customer A" })
        );
      });
    });

    it("trims search input before submitting", async () => {
      const user = userEvent.setup();
      render(<AccountsList />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search by name or account number")
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Search by name or account number"
      );
      await user.type(searchInput, "  Customer A  ");

      const searchButton = screen.getByRole("button", { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(backend.accountsList).toHaveBeenCalledWith(
          expect.objectContaining({ search: "Customer A" })
        );
      });
    });
  });

  describe("Filtering", () => {
    it("filters by group", async () => {
      const user = userEvent.setup();
      render(<AccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const selects = document.querySelectorAll("select");
      const groupSelect = selects[0];
      await user.selectOptions(groupSelect, "CUSTOMER");

      await waitFor(() => {
        expect(backend.accountsList).toHaveBeenCalledWith(
          expect.objectContaining({ group: "CUSTOMER" })
        );
      });
    });

    it("shows all groups by default", async () => {
      render(<AccountsList />);

      await waitFor(() => {
        expect(backend.accountsList).toHaveBeenCalledWith(
          expect.not.objectContaining({ group: expect.anything() })
        );
      });
    });
  });

  describe("Pagination", () => {
    it("displays pagination info", async () => {
      render(<AccountsList />);

      await waitFor(() => {
        expect(screen.getByText(/Showing page 1 of 1/)).toBeInTheDocument();
        expect(screen.getByText(/2 total accounts/)).toBeInTheDocument();
      });
    });

    it("disables Previous button on first page", async () => {
      render(<AccountsList />);

      await waitFor(() => {
        const prevButton = screen.getByRole("button", { name: /previous/i });
        expect(prevButton).toBeDisabled();
      });
    });

    it("enables Next button when more pages available", async () => {
      vi.mocked(backend.accountsList).mockResolvedValue({
        results: mockAccounts,
        count: 50,
        next: "next-url",
        previous: null,
      } as any);

      render(<AccountsList />);

      await waitFor(() => {
        const nextButton = screen.getByRole("button", { name: /next/i });
        expect(nextButton).not.toBeDisabled();
      });
    });

    it("navigates to next page", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.accountsList).mockResolvedValue({
        results: mockAccounts,
        count: 50,
        next: "next-url",
        previous: null,
      } as any);

      render(<AccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(backend.accountsList).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });
    });
  });

  describe("Delete Functionality", () => {
    it("shows confirmation dialog before delete", async () => {
      const user = userEvent.setup();
      render(<AccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this account?"
      );
    });

    it("deletes account when confirmed", async () => {
      const user = userEvent.setup();
      render(<AccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(backend.accountDelete).toHaveBeenCalledWith("1");
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Account removed",
        description: "The account has been deleted successfully.",
      });
    });

    it("does not delete when cancelled", async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => false);

      render(<AccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(backend.accountDelete).not.toHaveBeenCalled();
    });

    it("shows error on delete failure", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.accountDelete).mockRejectedValue(
        new Error("Delete failed")
      );

      render(<AccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
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

  describe("Export Functionality", () => {
    it("exports all accounts", async () => {
      const user = userEvent.setup();
      render(<AccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /export data/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(backend.exportAccountsAll).toHaveBeenCalled();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Accounts exported",
      });
    });

    it("exports single account", async () => {
      const user = userEvent.setup();
      render(<AccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const exportButtons = screen.getAllByRole("button", {
        name: /^export$/i,
      });
      await user.click(exportButtons[0]);

      await waitFor(() => {
        expect(backend.exportAccount).toHaveBeenCalledWith("1");
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Form data successfully exported to Excel.",
      });
    });

    it("shows error on export failure", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.exportAccountsAll).mockRejectedValue(
        new Error("Export failed")
      );

      render(<AccountsList />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
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
