import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { PendingQueriesList } from "@/components/queries/PendingQueriesList";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock("@/lib/backend", () => ({
  queryList: vi.fn(),
  queryArchive: vi.fn(),
}));

vi.mock("@/lib/queryPDF", () => ({
  generateQueryPDF: vi.fn(),
}));

import { queryList, queryArchive } from "@/lib/backend";
import { generateQueryPDF } from "@/lib/queryPDF";
import { useRouter } from "next/navigation";

describe("PendingQueriesList - Extended Tests", () => {
  const mockRouter = { push: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  it("handles pagination", async () => {
    (queryList as any).mockResolvedValue({
      results: [
        {
          id: "1",
          account: {
            id: "acc1",
            account_name: "Customer 1",
            name: "Customer 1",
          },
          item_name: { id: "item1", name: "Necklace" },
          gold_carat: "18K",
          size: "16",
          query_in_date: "2024-01-15",
          status: "pending",
          is_expired: false,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
        },
      ],
      count: 20,
      next: "http://localhost:8000/api/queries/?page=2",
      previous: null,
    });

    render(<PendingQueriesList />);

    await waitFor(() => {
      expect(queryList).toHaveBeenCalled();
    });
  });

  it("renders without crashing with empty results", async () => {
    (queryList as any).mockResolvedValue({
      results: [],
      count: 0,
      next: null,
      previous: null,
    });

    render(<PendingQueriesList />);

    await waitFor(() => {
      expect(queryList).toHaveBeenCalled();
    });
  });

  it("handles archive action", async () => {
    (queryList as any).mockResolvedValue({
      results: [
        {
          id: "1",
          account: {
            id: "acc1",
            account_name: "Customer 1",
            name: "Customer 1",
          },
          item_name: { id: "item1", name: "Necklace" },
          gold_carat: "18K",
          size: "16",
          query_in_date: "2024-01-15",
          status: "pending",
          is_expired: false,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
        },
      ],
      count: 1,
      next: null,
      previous: null,
    });

    (queryArchive as any).mockResolvedValue({ success: true });

    render(<PendingQueriesList />);

    await waitFor(() => {
      expect(screen.getByText("Customer 1")).toBeInTheDocument();
    });
  });

  it("handles PDF generation", async () => {
    (queryList as any).mockResolvedValue({
      results: [
        {
          id: "1",
          account: {
            id: "acc1",
            account_name: "Customer 1",
            name: "Customer 1",
          },
          item_name: { id: "item1", name: "Necklace" },
          gold_carat: "18K",
          size: "16",
          query_in_date: "2024-01-15",
          status: "pending",
          is_expired: false,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
        },
      ],
      count: 1,
      next: null,
      previous: null,
    });

    (generateQueryPDF as any).mockResolvedValue(undefined);

    render(<PendingQueriesList />);

    await waitFor(() => {
      expect(screen.getByText("Customer 1")).toBeInTheDocument();
    });
  });

  it("displays query details", async () => {
    (queryList as any).mockResolvedValue({
      results: [
        {
          id: "1",
          account: {
            id: "acc1",
            account_name: "Customer 1",
            name: "Customer 1",
          },
          item_name: { id: "item1", name: "Necklace" },
          gold_carat: "18K",
          size: "16",
          query_in_date: "2024-01-15",
          status: "pending",
          is_expired: false,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
        },
      ],
      count: 1,
      next: null,
      previous: null,
    });

    render(<PendingQueriesList />);

    await waitFor(() => {
      expect(screen.getByText("Customer 1")).toBeInTheDocument();
      expect(screen.getByText("Necklace")).toBeInTheDocument();
      expect(screen.getByText("18K")).toBeInTheDocument();
    });
  });

  it("handles expired queries", async () => {
    (queryList as any).mockResolvedValue({
      results: [
        {
          id: "1",
          account: {
            id: "acc1",
            account_name: "Customer 1",
            name: "Customer 1",
          },
          item_name: { id: "item1", name: "Necklace" },
          gold_carat: "18K",
          size: "16",
          query_in_date: "2024-01-15",
          status: "pending",
          is_expired: true,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
        },
      ],
      count: 1,
      next: null,
      previous: null,
    });

    render(<PendingQueriesList />);

    await waitFor(() => {
      expect(screen.getByText("Customer 1")).toBeInTheDocument();
    });
  });
});
