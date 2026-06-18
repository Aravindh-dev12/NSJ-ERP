import { render, screen, waitFor } from "@testing-library/react";
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

import { queryList } from "@/lib/backend";

describe("PendingQueriesList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    (queryList as any).mockImplementation(() => new Promise(() => {}));

    render(<PendingQueriesList />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders pending queries list", async () => {
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
    });
  });

  it("handles empty pending queries list", async () => {
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

  it("handles API error gracefully", async () => {
    (queryList as any).mockRejectedValue(new Error("API Error"));

    render(<PendingQueriesList />);

    await waitFor(() => {
      expect(queryList).toHaveBeenCalled();
    });
  });

  it("calls queryList with pending status", async () => {
    (queryList as any).mockResolvedValue({
      results: [],
      count: 0,
      next: null,
      previous: null,
    });

    render(<PendingQueriesList />);

    await waitFor(() => {
      expect(queryList).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "pending",
        })
      );
    });
  });
});
