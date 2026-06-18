import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SalesForm } from "@/components/vouchers/SalesForm";
import * as backend from "@/lib/backend";

vi.mock("@/lib/backend");

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockBack = vi.fn();
const mockPathname = vi.fn(() => "/vouchers/sale");
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: mockBack,
  }),
  usePathname: () => mockPathname(),
}));

describe("SalesForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.accountsDropdown).mockResolvedValue([
      { id: "1", name: "Account 1" },
      { id: "2", name: "Account 2" },
    ] as any);
    vi.mocked(backend.getJewelryTypes).mockResolvedValue({
      jewelry_types: [
        { value: "ring", label: "Ring" },
        { value: "necklace", label: "Necklace" },
      ],
    } as any);
    vi.mocked(backend.createSalesQuery).mockResolvedValue({} as any);
  });

  describe("Rendering", () => {
    it("renders form header", async () => {
      render(<SalesForm />);

      await waitFor(() => {
        expect(screen.getByText("New Sale")).toBeInTheDocument();
      });
    });

    it("renders step indicator", async () => {
      render(<SalesForm />);

      await waitFor(() => {
        expect(screen.getByText(/Step 1/)).toBeInTheDocument();
      });
    });

    it("renders first step content", async () => {
      render(<SalesForm />);

      await waitFor(() => {
        expect(screen.getByText(/Client & Basic Info/)).toBeInTheDocument();
      });
    });

    it("renders export PDF button", async () => {
      render(<SalesForm />);

      await waitFor(() => {
        expect(screen.getByText("Export PDF")).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    it("renders navigation tabs", async () => {
      render(<SalesForm />);

      await waitFor(() => {
        expect(screen.getByText("Overview")).toBeInTheDocument();
        expect(screen.getByText("List")).toBeInTheDocument();
        expect(screen.getByText("Add New")).toBeInTheDocument();
      });
    });
  });

  describe("Data Loading", () => {
    it("loads jewelry types on mount", async () => {
      render(<SalesForm />);

      await waitFor(() => {
        expect(backend.getJewelryTypes).toHaveBeenCalled();
      });
    });
  });
});
