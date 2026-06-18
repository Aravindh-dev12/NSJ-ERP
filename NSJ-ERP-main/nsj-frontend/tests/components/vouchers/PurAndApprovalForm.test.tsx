import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PurAndApprovalForm from "@/components/vouchers/PurAndApprovalForm";
import * as backend from "@/lib/backend";
import * as exportLib from "@/lib/export";

vi.mock("@/lib/backend");
vi.mock("@/lib/export");

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("PurAndApprovalForm", () => {
  const mockAccounts = [
    { id: "1", account_name: "Account 1" },
    { id: "2", account_name: "Account 2" },
  ];

  const mockItems = [
    { id: "item1", name: "Gold Ring" },
    { id: "item2", name: "Silver Necklace" },
  ];

  const mockUnits = [
    { id: "unit1", name: "Gram" },
    { id: "unit2", name: "Piece" },
  ];

  const mockShapes = [
    { id: "shape1", name: "Round" },
    { id: "shape2", name: "Square" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.accountsDropdown).mockResolvedValue(mockAccounts);
    vi.mocked(backend.vouchersItemNames).mockResolvedValue({
      item_names: mockItems,
    });
    vi.mocked(backend.vouchersMasters).mockResolvedValue({
      series: [],
      stamps: [],
      base_metals: [],
      units: mockUnits,
    });
    vi.mocked(backend.vouchersUnits).mockResolvedValue({ units: mockUnits });
    vi.mocked(backend.vouchersShapes).mockResolvedValue({ shapes: mockShapes });
    vi.mocked(backend.purAndApprovalCreate).mockResolvedValue({} as any);
  });

  describe("Rendering", () => {
    it("renders form with all fields", async () => {
      render(<PurAndApprovalForm />);

      await waitFor(() => {
        expect(screen.getByText("Account")).toBeInTheDocument();
        expect(screen.getByText("Tag No")).toBeInTheDocument();
        expect(screen.getByText("Item Name")).toBeInTheDocument();
        expect(screen.getByText("Order No")).toBeInTheDocument();
        expect(screen.getByText("Remark")).toBeInTheDocument();
        expect(screen.getByText("Unit")).toBeInTheDocument();
        expect(screen.getByText("Piece")).toBeInTheDocument();
        expect(screen.getByText("Shape")).toBeInTheDocument();
        expect(screen.getByText("Gr. Wt")).toBeInTheDocument();
        expect(screen.getByText("Net Wt")).toBeInTheDocument();
      });
    });

    it("loads and displays accounts dropdown", async () => {
      render(<PurAndApprovalForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
        expect(screen.getByText("Account 2")).toBeInTheDocument();
      });
    });

    it("loads and displays items dropdown", async () => {
      render(<PurAndApprovalForm />);

      await waitFor(() => {
        expect(screen.getByText("Gold Ring")).toBeInTheDocument();
        expect(screen.getByText("Silver Necklace")).toBeInTheDocument();
      });
    });

    it("renders Save and Export Data buttons", async () => {
      render(<PurAndApprovalForm />);

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
      render(<PurAndApprovalForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const selects = document.querySelectorAll("select");
      const accountSelect = selects[0]; // First select is Account
      await user.selectOptions(accountSelect, "1");

      expect(accountSelect).toHaveValue("1");
    });

    it("allows entering tag number", async () => {
      const user = userEvent.setup();
      render(<PurAndApprovalForm />);

      await waitFor(() => {
        expect(screen.getByText("Tag No")).toBeInTheDocument();
      });

      const tagInput = screen.getAllByRole("textbox")[0];
      await user.type(tagInput, "TAG-001");

      expect(tagInput).toHaveValue("TAG-001");
    });

    it("allows entering numeric values", async () => {
      const user = userEvent.setup();
      render(<PurAndApprovalForm />);

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
      render(<PurAndApprovalForm />);

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
      render(<PurAndApprovalForm />);

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
      render(<PurAndApprovalForm />);

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
      render(<PurAndApprovalForm />);

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
    it("submits form with valid data", async () => {
      const user = userEvent.setup();
      render(<PurAndApprovalForm />);

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
        expect(backend.purAndApprovalCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            account: "1",
            item_name: "item1",
          })
        );
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Saved",
          description: "Pur and Approval M saved",
        })
      );
    });

    it("resets form after successful save", async () => {
      const user = userEvent.setup();
      render(<PurAndApprovalForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const selects = document.querySelectorAll("select");
      const accountSelect = selects[0];
      await user.selectOptions(accountSelect, "1");

      const itemSelect = selects[1];
      await user.selectOptions(itemSelect, "item1");

      const inputs = screen.getAllByRole("textbox");
      const tagInput = inputs[0];
      await user.type(tagInput, "TAG-001");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(tagInput).toHaveValue("");
      });
    });

    it("shows error on save failure", async () => {
      vi.mocked(backend.purAndApprovalCreate).mockRejectedValue(
        new Error("Save failed")
      );
      const user = userEvent.setup();
      render(<PurAndApprovalForm />);

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
      render(<PurAndApprovalForm />);

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
            formName: "Pur and Approval",
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
      render(<PurAndApprovalForm />);

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

      render(<PurAndApprovalForm />);

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
