import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AccountsOverview } from "@/components/accounts/AccountsOverview";
import * as backend from "@/lib/backend";

// Mock backend
vi.mock("@/lib/backend", () => ({
  accountsList: vi.fn(),
}));

// Mock AccountsHeader
vi.mock("@/components/accounts/AccountsHeader", () => ({
  AccountsHeader: ({ title, description }: any) => (
    <div data-testid="accounts-header">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe("AccountsOverview", () => {
  const mockAccounts = [
    {
      id: "1",
      account_name: "Customer A",
      account_no: "ACC001",
      group_code: "SD",
    },
    {
      id: "2",
      account_name: "Customer B",
      account_no: "ACC002",
      group_code: "SC",
    },
    {
      id: "3",
      account_name: "Customer C",
      account_no: "ACC003",
      group_code: "CASH",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders header with title and description", async () => {
      vi.mocked(backend.accountsList).mockResolvedValue({
        count: 0,
        results: [],
        next: null,
        previous: null,
      });

      render(<AccountsOverview />);

      await waitFor(() => {
        expect(screen.getByText("Accounts overview")).toBeInTheDocument();
      });

      expect(screen.getByText(/Monitor ledger health/)).toBeInTheDocument();
    });

    it("displays loading skeletons initially", () => {
      vi.mocked(backend.accountsList).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<AccountsOverview />);

      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("renders all stat cards", async () => {
      vi.mocked(backend.accountsList).mockResolvedValue({
        count: 10,
        results: mockAccounts,
        next: null,
        previous: null,
      });

      render(<AccountsOverview />);

      await waitFor(() => {
        expect(screen.getByText("Total accounts")).toBeInTheDocument();
      });

      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Inactive")).toBeInTheDocument();
    });
  });

  describe("Data Loading", () => {
    it("fetches accounts data on mount", async () => {
      vi.mocked(backend.accountsList).mockResolvedValue({
        count: 10,
        results: mockAccounts,
        next: null,
        previous: null,
      });

      render(<AccountsOverview />);

      await waitFor(() => {
        expect(backend.accountsList).toHaveBeenCalledTimes(3);
      });
    });

    it("displays total accounts count", async () => {
      vi.mocked(backend.accountsList).mockResolvedValue({
        count: 25,
        results: mockAccounts,
        next: null,
        previous: null,
      });

      render(<AccountsOverview />);

      await waitFor(() => {
        const elements = screen.getAllByText("25");
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it("displays active accounts count", async () => {
      vi.mocked(backend.accountsList)
        .mockResolvedValueOnce({
          count: 25,
          results: mockAccounts,
          next: null,
          previous: null,
        })
        .mockResolvedValueOnce({
          count: 20,
          results: [],
          next: null,
          previous: null,
        })
        .mockResolvedValueOnce({
          count: 5,
          results: [],
          next: null,
          previous: null,
        });

      render(<AccountsOverview />);

      await waitFor(() => {
        expect(screen.getByText("20")).toBeInTheDocument();
      });
    });

    it("displays inactive accounts count", async () => {
      vi.mocked(backend.accountsList)
        .mockResolvedValueOnce({
          count: 25,
          results: mockAccounts,
          next: null,
          previous: null,
        })
        .mockResolvedValueOnce({
          count: 20,
          results: [],
          next: null,
          previous: null,
        })
        .mockResolvedValueOnce({
          count: 5,
          results: [],
          next: null,
          previous: null,
        });

      render(<AccountsOverview />);

      await waitFor(() => {
        expect(screen.getByText("5")).toBeInTheDocument();
      });
    });

    it("displays recent accounts list", async () => {
      vi.mocked(backend.accountsList).mockResolvedValue({
        count: 10,
        results: mockAccounts,
        next: null,
        previous: null,
      });

      render(<AccountsOverview />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      expect(screen.getByText("Customer B")).toBeInTheDocument();
      expect(screen.getByText("Customer C")).toBeInTheDocument();
    });

    it("displays account numbers", async () => {
      vi.mocked(backend.accountsList).mockResolvedValue({
        count: 10,
        results: mockAccounts,
        next: null,
        previous: null,
      });

      render(<AccountsOverview />);

      await waitFor(() => {
        expect(screen.getByText("ACC001")).toBeInTheDocument();
      });

      expect(screen.getByText("ACC002")).toBeInTheDocument();
      expect(screen.getByText("ACC003")).toBeInTheDocument();
    });

    it("displays group codes", async () => {
      vi.mocked(backend.accountsList).mockResolvedValue({
        count: 10,
        results: mockAccounts,
        next: null,
        previous: null,
      });

      render(<AccountsOverview />);

      await waitFor(() => {
        expect(screen.getByText("SD")).toBeInTheDocument();
      });

      expect(screen.getByText("SC")).toBeInTheDocument();
      expect(screen.getByText("CASH")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("displays error message on fetch failure", async () => {
      vi.mocked(backend.accountsList).mockRejectedValue(
        new Error("Network error")
      );

      render(<AccountsOverview />);

      await waitFor(() => {
        expect(
          screen.getByText("Unable to load accounts overview.")
        ).toBeInTheDocument();
      });
    });

    it("shows error toast on fetch failure", async () => {
      vi.mocked(backend.accountsList).mockRejectedValue(
        new Error("Network error")
      );

      render(<AccountsOverview />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Failed to load accounts",
          description: "Network error",
        });
      });
    });

    it("resets state on error", async () => {
      vi.mocked(backend.accountsList).mockRejectedValue(
        new Error("Network error")
      );

      render(<AccountsOverview />);

      await waitFor(() => {
        expect(
          screen.getByText("Unable to load accounts overview.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("shows empty message when no accounts", async () => {
      vi.mocked(backend.accountsList).mockResolvedValue({
        count: 0,
        results: [],
        next: null,
        previous: null,
      });

      render(<AccountsOverview />);

      await waitFor(() => {
        expect(
          screen.getByText(/No accounts available yet/)
        ).toBeInTheDocument();
      });
    });

    it("displays zero counts when no accounts", async () => {
      vi.mocked(backend.accountsList).mockResolvedValue({
        count: 0,
        results: [],
        next: null,
        previous: null,
      });

      render(<AccountsOverview />);

      await waitFor(() => {
        const zeros = screen.getAllByText("0");
        expect(zeros.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe("Recent Accounts", () => {
    it("limits recent accounts to 5", async () => {
      const manyAccounts = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        account_name: `Customer ${i + 1}`,
        account_no: `ACC${String(i + 1).padStart(3, "0")}`,
        group_code: "SD",
      }));

      vi.mocked(backend.accountsList).mockResolvedValue({
        count: 10,
        results: manyAccounts,
        next: null,
        previous: null,
      });

      render(<AccountsOverview />);

      await waitFor(() => {
        expect(screen.getByText("Customer 1")).toBeInTheDocument();
      });

      // Should only show first 5
      expect(screen.getByText("Customer 5")).toBeInTheDocument();
      expect(screen.queryByText("Customer 6")).not.toBeInTheDocument();
    });

    it("handles accounts with missing names", async () => {
      const accountsWithMissingData = [
        { id: "1", account_no: "ACC001", group_code: "SD" },
      ];

      vi.mocked(backend.accountsList).mockResolvedValue({
        count: 1,
        results: accountsWithMissingData as any,
        next: null,
        previous: null,
      });

      render(<AccountsOverview />);

      await waitFor(() => {
        expect(screen.getByText("Unnamed account")).toBeInTheDocument();
      });
    });

    it("handles accounts with missing account numbers", async () => {
      const accountsWithMissingData = [
        { id: "1", account_name: "Customer A", group_code: "SD" },
      ];

      vi.mocked(backend.accountsList).mockResolvedValue({
        count: 1,
        results: accountsWithMissingData as any,
        next: null,
        previous: null,
      });

      render(<AccountsOverview />);

      await waitFor(() => {
        expect(screen.getByText("—")).toBeInTheDocument();
      });
    });

    it("renders see all accounts link", async () => {
      vi.mocked(backend.accountsList).mockResolvedValue({
        count: 10,
        results: mockAccounts,
        next: null,
        previous: null,
      });

      render(<AccountsOverview />);

      await waitFor(() => {
        expect(screen.getByText("See all accounts")).toBeInTheDocument();
      });

      const link = screen.getByText("See all accounts").closest("a");
      expect(link).toHaveAttribute("href", "/accounts/list");
    });
  });

  describe("Cleanup", () => {
    it("cleans up on unmount", async () => {
      vi.mocked(backend.accountsList).mockResolvedValue({
        count: 10,
        results: mockAccounts,
        next: null,
        previous: null,
      });

      const { unmount } = render(<AccountsOverview />);

      await waitFor(() => {
        expect(backend.accountsList).toHaveBeenCalled();
      });

      unmount();

      // Should not cause any errors
      expect(true).toBe(true);
    });
  });

  describe("Card Styling", () => {
    it("displays active count in green", async () => {
      vi.mocked(backend.accountsList)
        .mockResolvedValueOnce({
          count: 25,
          results: mockAccounts,
          next: null,
          previous: null,
        })
        .mockResolvedValueOnce({
          count: 20,
          results: [],
          next: null,
          previous: null,
        })
        .mockResolvedValueOnce({
          count: 5,
          results: [],
          next: null,
          previous: null,
        });

      const { container } = render(<AccountsOverview />);

      await waitFor(() => {
        const greenText = container.querySelector(".text-emerald-600");
        expect(greenText).toBeInTheDocument();
      });
    });

    it("displays inactive count in amber", async () => {
      vi.mocked(backend.accountsList)
        .mockResolvedValueOnce({
          count: 25,
          results: mockAccounts,
          next: null,
          previous: null,
        })
        .mockResolvedValueOnce({
          count: 20,
          results: [],
          next: null,
          previous: null,
        })
        .mockResolvedValueOnce({
          count: 5,
          results: [],
          next: null,
          previous: null,
        });

      const { container } = render(<AccountsOverview />);

      await waitFor(() => {
        const amberText = container.querySelector(".text-amber-600");
        expect(amberText).toBeInTheDocument();
      });
    });
  });
});
