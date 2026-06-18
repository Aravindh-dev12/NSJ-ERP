import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SalesReturnForm } from "@/components/vouchers/SalesReturnForm";
import * as backend from "@/lib/backend";

vi.mock("@/lib/backend");

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockBack = vi.fn();
const mockPathname = vi.fn(() => "/vouchers/sales-return");
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: mockBack,
  }),
  usePathname: () => mockPathname(),
}));

describe("SalesReturnForm", () => {
  const mockAccounts = {
    results: [
      { id: "1", account_name: "Account 1" },
      { id: "2", account_name: "Account 2" },
    ],
  };

  const mockItems = {
    item_names: [
      { id: "item1", name: "Gold Ring" },
      { id: "item2", name: "Silver Necklace" },
    ],
  };

  const mockUnits = {
    units: [
      { id: "unit1", name: "Gram" },
      { id: "unit2", name: "Piece" },
    ],
  };

  const mockShapes = {
    shapes: [
      { id: "shape1", name: "Round" },
      { id: "shape2", name: "Square" },
    ],
  };

  const mockClarities = {
    clarities: [
      { id: "clarity1", name: "VVS" },
      { id: "clarity2", name: "VS" },
    ],
  };

  const mockStamps = {
    stamps: [
      { id: "stamp1", name: "22K" },
      { id: "stamp2", name: "18K" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.accountsList).mockResolvedValue(mockAccounts as any);
    vi.mocked(backend.vouchersItemNames).mockResolvedValue(mockItems as any);
    vi.mocked(backend.vouchersUnits).mockResolvedValue(mockUnits as any);
    vi.mocked(backend.vouchersShapes).mockResolvedValue(mockShapes as any);
    vi.mocked(backend.vouchersClarities).mockResolvedValue(
      mockClarities as any
    );
    vi.mocked(backend.vouchersMasters).mockResolvedValue(mockStamps as any);
    vi.mocked(backend.salesReturnCreate).mockResolvedValue({} as any);
  });

  describe("Rendering", () => {
    it("renders form header", async () => {
      render(<SalesReturnForm />);

      await waitFor(() => {
        expect(screen.getByText("Add Sales Return")).toBeInTheDocument();
        expect(
          screen.getByText("Create a new sales return.")
        ).toBeInTheDocument();
      });
    });

    it("renders all form sections", async () => {
      render(<SalesReturnForm />);

      await waitFor(() => {
        expect(screen.getByText("Basic")).toBeInTheDocument();
        expect(screen.getByText("Measurement & Pricing")).toBeInTheDocument();
      });
    });

    it("renders required field indicators", async () => {
      render(<SalesReturnForm />);

      await waitFor(() => {
        const itemLabel = screen.getByText(/Item Name/);
        expect(
          itemLabel.querySelector(".text-destructive")
        ).toBeInTheDocument();

        const unitLabel = screen.getByText(/Unit/);
        expect(
          unitLabel.querySelector(".text-destructive")
        ).toBeInTheDocument();
      });
    });

    it("loads and displays accounts", async () => {
      render(<SalesReturnForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
        expect(screen.getByText("Account 2")).toBeInTheDocument();
      });
    });

    it("loads and displays items", async () => {
      render(<SalesReturnForm />);

      await waitFor(() => {
        expect(screen.getByText("Gold Ring")).toBeInTheDocument();
        expect(screen.getByText("Silver Necklace")).toBeInTheDocument();
      });
    });
  });

  describe("Form Interaction", () => {
    it("allows selecting account", async () => {
      const user = userEvent.setup();
      render(<SalesReturnForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Account/)).toBeInTheDocument();
      });

      const accountSelect = screen.getByLabelText(/Account/);
      await user.selectOptions(accountSelect, "1");

      expect(accountSelect).toHaveValue("1");
    });

    it("allows entering tag number", async () => {
      const user = userEvent.setup();
      render(<SalesReturnForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Tag No/)).toBeInTheDocument();
      });

      const tagInput = screen.getByLabelText(/Tag No/);
      await user.type(tagInput, "TAG-001");

      expect(tagInput).toHaveValue("TAG-001");
    });

    it("allows selecting date", async () => {
      const user = userEvent.setup();
      render(<SalesReturnForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Date/)).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/Date/);
      await user.type(dateInput, "2024-01-15");

      expect(dateInput).toHaveValue("2024-01-15");
    });

    it("allows entering numeric values", async () => {
      const user = userEvent.setup();
      render(<SalesReturnForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Piece/)).toBeInTheDocument();
      });

      const pieceInput = screen.getByLabelText(/Piece/);
      await user.type(pieceInput, "5");

      expect(pieceInput).toHaveValue(5);
    });
  });

  describe("Form Validation", () => {
    it("shows error when item name is not selected", async () => {
      const user = userEvent.setup();
      render(<SalesReturnForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Save Sales Return/i })
        ).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", {
        name: /Save Sales Return/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Item name is required")).toBeInTheDocument();
      });
    });

    it("shows error when unit is not selected", async () => {
      const user = userEvent.setup();
      render(<SalesReturnForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Item Name/)).toBeInTheDocument();
      });

      const itemSelect = screen.getByLabelText(/Item Name/);
      await user.selectOptions(itemSelect, "item1");

      const saveButton = screen.getByRole("button", {
        name: /Save Sales Return/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Unit is required")).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("renders save button", async () => {
      render(<SalesReturnForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Save Sales Return/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Cancel Action", () => {
    it("navigates back when Cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<SalesReturnForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Cancel/i })
        ).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe("Data Loading Errors", () => {
    it("shows toast on accounts load failure", async () => {
      vi.mocked(backend.accountsList).mockRejectedValue(
        new Error("Load failed")
      );

      render(<SalesReturnForm />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: "destructive",
            title: "Unable to load accounts",
          })
        );
      });
    });
  });

  describe("All Form Fields", () => {
    it("renders all measurement and pricing fields", async () => {
      render(<SalesReturnForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Piece/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Gr.Wt/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Net.Wt/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Divide/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Tunch/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Wstg/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Rate/)).toBeInTheDocument();
        expect(screen.getByLabelText(/MRP/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Shape/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Clarity/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Category/)).toBeInTheDocument();
      });
    });
  });
});
