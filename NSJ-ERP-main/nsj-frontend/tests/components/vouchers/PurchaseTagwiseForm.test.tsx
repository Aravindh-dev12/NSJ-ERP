import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PurchaseTagwiseForm from "@/components/vouchers/PurchaseTagwiseForm";
import * as backend from "@/lib/backend";
import * as exportLib from "@/lib/export";

vi.mock("@/lib/backend");
vi.mock("@/lib/export");

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("PurchaseTagwiseForm", () => {
  const mockAccounts = [
    { id: "1", account_name: "Account 1" },
    { id: "2", account_name: "Account 2" },
  ];

  const mockItems = [
    { id: "item1", name: "Gold Ring" },
    { id: "item2", name: "Silver Necklace" },
  ];

  const mockStamps = [
    { id: "stamp1", name: "22K" },
    { id: "stamp2", name: "18K" },
  ];

  const mockUnits = [
    { id: "unit1", name: "Gram" },
    { id: "unit2", name: "Piece" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.accountsDropdown).mockResolvedValue(mockAccounts);
    vi.mocked(backend.vouchersItemNames).mockResolvedValue({
      item_names: mockItems,
    });
    vi.mocked(backend.vouchersMasters).mockResolvedValue({
      series: [],
      stamps: mockStamps,
      base_metals: [],
      units: mockUnits,
    });
    vi.mocked(backend.vouchersUnits).mockResolvedValue({ units: mockUnits });
    vi.mocked(backend.purchaseTagwiseCreate).mockResolvedValue({} as any);
  });

  describe("Rendering", () => {
    it("renders form with all fields", async () => {
      render(<PurchaseTagwiseForm />);

      await waitFor(() => {
        expect(screen.getByText("Account")).toBeInTheDocument();
        expect(screen.getByText("Item Name")).toBeInTheDocument();
        expect(screen.getByText("Order No")).toBeInTheDocument();
        expect(screen.getByText("Stamp")).toBeInTheDocument();
        expect(screen.getByText("Remark")).toBeInTheDocument();
        expect(screen.getByText("Design")).toBeInTheDocument();
        expect(screen.getByText("Unit")).toBeInTheDocument();
        expect(screen.getByText("Piece")).toBeInTheDocument();
        expect(screen.getByText("Gr. Wt")).toBeInTheDocument();
        expect(screen.getByText("Net Wt")).toBeInTheDocument();
        expect(screen.getByText("Tunch")).toBeInTheDocument();
        expect(screen.getByText("Rate")).toBeInTheDocument();
        expect(screen.getByText("Supplier")).toBeInTheDocument();
      });
    });

    it("loads and displays accounts dropdown", async () => {
      render(<PurchaseTagwiseForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
        expect(screen.getByText("Account 2")).toBeInTheDocument();
      });
    });

    it("loads and displays items dropdown", async () => {
      render(<PurchaseTagwiseForm />);

      await waitFor(() => {
        expect(screen.getByText("Gold Ring")).toBeInTheDocument();
        expect(screen.getByText("Silver Necklace")).toBeInTheDocument();
      });
    });

    it("renders Save and Export Data buttons", async () => {
      render(<PurchaseTagwiseForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /save/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /export data/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Form Interaction", () => {
    it("allows selecting account", async () => {
      const user = userEvent.setup();
      render(<PurchaseTagwiseForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const selects = document.querySelectorAll("select");
      const accountSelect = selects[0];
      await user.selectOptions(accountSelect, "1");

      expect(accountSelect).toHaveValue("1");
    });

    it("allows entering order number", async () => {
      const user = userEvent.setup();
      render(<PurchaseTagwiseForm />);

      await waitFor(() => {
        expect(screen.getByText("Order No")).toBeInTheDocument();
      });

      const inputs = screen.getAllByRole("textbox");
      const orderInput = inputs[0];
      await user.type(orderInput, "ORD-001");

      expect(orderInput).toHaveValue("ORD-001");
    });

    it("allows entering numeric values", async () => {
      const user = userEvent.setup();
      render(<PurchaseTagwiseForm />);

      await waitFor(() => {
        expect(screen.getByText("Gr. Wt")).toBeInTheDocument();
      });

      const inputs = screen.getAllByRole("textbox");
      const grossWtInput = inputs.find(
        (input) => input.previousElementSibling?.textContent === "Gr. Wt"
      );

      if (grossWtInput) {
        await user.type(grossWtInput, "10.5");
        expect(grossWtInput).toHaveValue("10.5");
      }
    });
  });

  describe("Form Validation", () => {
    it("shows error when account is not selected", async () => {
      const user = userEvent.setup();
      render(<PurchaseTagwiseForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /save/i })
        ).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: "destructive",
            title: "Please select an account",
          })
        );
      });
    });

    it("shows error when item is not selected", async () => {
      const user = userEvent.setup();
      render(<PurchaseTagwiseForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const selects = document.querySelectorAll("select");
      const accountSelect = selects[0];
      await user.selectOptions(accountSelect, "1");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: "destructive",
            title: "Please select an item",
          })
        );
      });
    });

    it("validates piece must be numeric", async () => {
      const user = userEvent.setup();
      render(<PurchaseTagwiseForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const selects = document.querySelectorAll("select");
      const accountSelect = selects[0];
      await user.selectOptions(accountSelect, "1");

      const itemSelect = selects[1];
      await user.selectOptions(itemSelect, "item1");

      const inputs = screen.getAllByRole("textbox");
      const pieceInput = inputs.find(
        (input) => input.previousElementSibling?.textContent === "Piece"
      );

      if (pieceInput) {
        await user.type(pieceInput, "abc");
      }

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: "destructive",
            title: "Piece must be numeric",
          })
        );
      });
    });

    it("validates gross weight must be numeric", async () => {
      const user = userEvent.setup();
      render(<PurchaseTagwiseForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const selects = document.querySelectorAll("select");
      const accountSelect = selects[0];
      await user.selectOptions(accountSelect, "1");

      const itemSelect = selects[1];
      await user.selectOptions(itemSelect, "item1");

      const inputs = screen.getAllByRole("textbox");
      const grossWtInput = inputs.find(
        (input) => input.previousElementSibling?.textContent === "Gr. Wt"
      );

      if (grossWtInput) {
        await user.type(grossWtInput, "abc");
      }

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: "destructive",
            title: "Gr. Wt must be numeric",
          })
        );
      });
    });
  });

  describe("Form Submission", () => {
    it("submits form with valid data using FormData", async () => {
      const user = userEvent.setup();
      render(<PurchaseTagwiseForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const selects = document.querySelectorAll("select");
      const accountSelect = selects[0];
      await user.selectOptions(accountSelect, "1");

      const itemSelect = selects[1];
      await user.selectOptions(itemSelect, "item1");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(backend.purchaseTagwiseCreate).toHaveBeenCalled();
        // Verify it was called with FormData
        const callArg = vi.mocked(backend.purchaseTagwiseCreate).mock
          .calls[0][0];
        expect(callArg).toBeInstanceOf(FormData);
        expect((callArg as FormData).get("account")).toBe("1");
        expect((callArg as FormData).get("item_name")).toBe("item1");
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Saved",
          description: "Purchase Tagwise M saved",
        })
      );
    });

    it("resets form after successful save", async () => {
      const user = userEvent.setup();
      render(<PurchaseTagwiseForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const selects = document.querySelectorAll("select");
      const accountSelect = selects[0];
      await user.selectOptions(accountSelect, "1");

      const itemSelect = selects[1];
      await user.selectOptions(itemSelect, "item1");

      const inputs = screen.getAllByRole("textbox");
      const orderInput = inputs[0];
      await user.type(orderInput, "ORD-001");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(orderInput).toHaveValue("");
      });
    });

    it("shows error on save failure", async () => {
      vi.mocked(backend.purchaseTagwiseCreate).mockRejectedValue(
        new Error("Save failed")
      );
      const user = userEvent.setup();
      render(<PurchaseTagwiseForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const selects = document.querySelectorAll("select");
      const accountSelect = selects[0];
      await user.selectOptions(accountSelect, "1");

      const itemSelect = selects[1];
      await user.selectOptions(itemSelect, "item1");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: "destructive",
            title: "Save failed",
          })
        );
      });
    });
  });

  describe("Export Functionality", () => {
    it("exports form data to Excel", async () => {
      vi.mocked(exportLib.exportToExcel).mockReturnValue({
        ok: true,
        filename: "test.xlsx",
      });
      const user = userEvent.setup();
      render(<PurchaseTagwiseForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /export data/i })
        ).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /export data/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(exportLib.exportToExcel).toHaveBeenCalledWith(
          expect.objectContaining({
            formName: "Purchase Tagwise M",
            includeFooterTimestamp: true,
          })
        );
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Form data successfully exported to Excel.",
        })
      );
    });

    it("shows error on export failure", async () => {
      vi.mocked(exportLib.exportToExcel).mockReturnValue({
        ok: false,
        error: "Export failed",
      });
      const user = userEvent.setup();
      render(<PurchaseTagwiseForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /export data/i })
        ).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /export data/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: "destructive",
            title: "Export failed",
          })
        );
      });
    });
  });

  describe("Data Loading", () => {
    it("shows toast on masters load failure", async () => {
      vi.mocked(backend.accountsDropdown).mockRejectedValue(
        new Error("Load failed")
      );

      render(<PurchaseTagwiseForm />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: "destructive",
            title: "Failed to load masters",
          })
        );
      });
    });
  });
});
