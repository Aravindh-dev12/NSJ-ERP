import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ReceiptList } from "@/components/vouchers/ReceiptList";

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
  receiptList: vi.fn(),
}));

import { receiptList } from "@/lib/backend";

describe("ReceiptList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    (receiptList as any).mockImplementation(() => new Promise(() => {}));

    render(<ReceiptList />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders receipt list", async () => {
    (receiptList as any).mockResolvedValue({
      results: [
        {
          id: "1",
          type: "Cr",
          party_name: {
            id: "party1",
            account_name: "Party 1",
            name: "Party 1",
          },
          balance: 5000,
          date: "2024-01-15",
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
        },
      ],
      count: 1,
      next: null,
      previous: null,
    });

    render(<ReceiptList />);

    await waitFor(() => {
      expect(screen.getByText("Party 1")).toBeInTheDocument();
    });
  });

  it("handles empty list", async () => {
    (receiptList as any).mockResolvedValue({
      results: [],
      count: 0,
      next: null,
      previous: null,
    });

    render(<ReceiptList />);

    await waitFor(() => {
      expect(receiptList).toHaveBeenCalled();
    });
  });

  it("handles API error", async () => {
    (receiptList as any).mockRejectedValue(new Error("API Error"));

    render(<ReceiptList />);

    await waitFor(() => {
      expect(receiptList).toHaveBeenCalled();
    });
  });
});
