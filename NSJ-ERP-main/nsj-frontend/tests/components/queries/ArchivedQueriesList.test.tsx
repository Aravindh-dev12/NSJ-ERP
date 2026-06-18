import { render, screen, waitFor } from "@testing-library/react";
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

import { queryList } from "@/lib/backend";

describe("ArchivedQueriesList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    (queryList as any).mockImplementation(() => new Promise(() => {}));

    render(<ArchivedQueriesList />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders archived queries list", async () => {
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
    });
  });

  it("handles empty archived queries list", async () => {
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

  it("handles API error gracefully", async () => {
    (queryList as any).mockRejectedValue(new Error("API Error"));

    render(<ArchivedQueriesList />);

    await waitFor(() => {
      expect(queryList).toHaveBeenCalled();
    });
  });

  it("calls queryList with archived status", async () => {
    (queryList as any).mockResolvedValue({
      results: [],
      count: 0,
      next: null,
      previous: null,
    });

    render(<ArchivedQueriesList />);

    await waitFor(() => {
      expect(queryList).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "archived",
        })
      );
    });
  });
});
