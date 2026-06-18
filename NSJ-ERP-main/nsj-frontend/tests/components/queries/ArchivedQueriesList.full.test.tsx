import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ArchivedQueriesList } from "@/components/queries/ArchivedQueriesList";

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
  queryReopen: vi.fn(),
}));

vi.mock("@/lib/queryPDF", () => ({
  generateQueryPDF: vi.fn(),
}));

import { queryList, queryReopen } from "@/lib/backend";
import { generateQueryPDF } from "@/lib/queryPDF";
import { useRouter } from "next/navigation";

describe("ArchivedQueriesList - Extended Tests", () => {
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
          item_name: { id: "item1", name: "Ring" },
          gold_carat: "22K",
          size: "7",
          query_in_date: "2024-01-15",
          status: "archived",
          is_expired: false,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-20T10:00:00Z",
        },
      ],
      count: 20,
      next: "http://localhost:8000/api/queries/?page=2",
      previous: null,
    });

    render(<ArchivedQueriesList />);

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

    render(<ArchivedQueriesList />);

    await waitFor(() => {
      expect(queryList).toHaveBeenCalled();
    });
  });

  it("handles reopen action", async () => {
    (queryList as any).mockResolvedValue({
      results: [
        {
          id: "1",
          account: {
            id: "acc1",
            account_name: "Customer 1",
            name: "Customer 1",
          },
          item_name: { id: "item1", name: "Ring" },
          gold_carat: "22K",
          size: "7",
          query_in_date: "2024-01-15",
          status: "archived",
          is_expired: false,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-20T10:00:00Z",
        },
      ],
      count: 1,
      next: null,
      previous: null,
    });

    (queryReopen as any).mockResolvedValue({ success: true });

    render(<ArchivedQueriesList />);

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
          item_name: { id: "item1", name: "Ring" },
          gold_carat: "22K",
          size: "7",
          query_in_date: "2024-01-15",
          status: "archived",
          is_expired: false,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-20T10:00:00Z",
        },
      ],
      count: 1,
      next: null,
      previous: null,
    });

    (generateQueryPDF as any).mockResolvedValue(undefined);

    render(<ArchivedQueriesList />);

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
          item_name: { id: "item1", name: "Ring" },
          gold_carat: "22K",
          size: "7",
          query_in_date: "2024-01-15",
          status: "archived",
          is_expired: false,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-20T10:00:00Z",
        },
      ],
      count: 1,
      next: null,
      previous: null,
    });

    render(<ArchivedQueriesList />);

    await waitFor(() => {
      expect(screen.getByText("Customer 1")).toBeInTheDocument();
      expect(screen.getByText("Ring")).toBeInTheDocument();
      expect(screen.getByText("22K")).toBeInTheDocument();
    });
  });
});
