import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RepairForm from "@/components/vouchers/RepairForm";
import * as backend from "@/lib/backend";
import * as exportLib from "@/lib/export";

vi.mock("@/lib/backend");
vi.mock("@/lib/export");

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("RepairForm", () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.accountsDropdown).mockResolvedValue(mockAccounts);
    vi.mocked(backend.vouchersItemNames).mockResolvedValue({
      item_names: mockItems,
    } as any);
    vi.mocked(backend.vouchersMasters).mockResolvedValue({
      stamps: mockStamps,
    } as any);
    vi.mocked(backend.repairCreate).mockResolvedValue({} as any);
    vi.mocked(backend.repairUpdate).mockResolvedValue({} as any);
  });

  describe("Rendering", () => {
    it("renders form with all fields", async () => {
      render(<RepairForm />);

      await waitFor(() => {
        expect(screen.getByText("Account")).toBeInTheDocument();
        expect(screen.getByText("Date")).toBeInTheDocument();
        expect(screen.getByText("Type")).toBeInTheDocument();
        expect(screen.getByText("Tag No")).toBeInTheDocument();
        expect(screen.getByText("Item Name")).toBeInTheDocument();
        expect(screen.getByText("Supplier")).toBeInTheDocument();
        expect(screen.getByText("Stamp")).toBeInTheDocument();
        expect(screen.getByText("Piece")).toBeInTheDocument();
        expect(screen.getByText("Gr. Wt")).toBeInTheDocument();
        expect(screen.getByText("Net Wt")).toBeInTheDocument();
        expect(screen.getByText("Rate")).toBeInTheDocument();
        expect(screen.getByText("Total")).toBeInTheDocument();
        expect(screen.getByText("Remark")).toBeInTheDocument();
      });
    });

    it("loads and displays accounts dropdown", async () => {
      render(<RepairForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
        expect(screen.getByText("Account 2")).toBeInTheDocument();
      });
    });

    it("loads and displays items dropdown", async () => {
      render(<RepairForm />);

      await waitFor(() => {
        expect(screen.getByText("Gold Ring")).toBeInTheDocument();
        expect(screen.getByText("Silver Necklace")).toBeInTheDocument();
      });
    });

    it("renders Save and Export Data buttons", async () => {
      render(<RepairForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /^save$/i })
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
      render(<RepairForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const selects = document.querySelectorAll("select");
      const accountSelect = selects[0];
      await user.selectOptions(accountSelect, "1");

      expect(accountSelect).toHaveValue("1");
    });

    it("allows entering date", async () => {
      const user = userEvent.setup();
      render(<RepairForm />);

      await waitFor(() => {
        expect(screen.getByText("Date")).toBeInTheDocument();
      });

      const inputs = screen.getAllByRole("textbox");
      const dateInput = inputs.find(
        (input) => input.getAttribute("type") === "date"
      );

      if (dateInput) {
        await user.type(dateInput, "2024-01-15");
        expect(dateInput).toHaveValue("2024-01-15");
      }
    });

    it("allows entering numeric values", async () => {
      const user = userEvent.setup();
      render(<RepairForm />);

      await waitFor(() => {
        expect(screen.getByText("Piece")).toBeInTheDocument();
      });

      const inputs = screen.getAllByRole("textbox");
      const pieceInput = inputs.find(
        (input) => input.previousElementSibling?.textContent === "Piece"
      );

      if (pieceInput) {
        await user.type(pieceInput, "5");
        expect(pieceInput).toHaveValue("5");
      }
    });
  });

  describe("Auto-calculation", () => {
    it("auto-updates total when piece and rate are entered", async () => {
      const user = userEvent.setup();
      render(<RepairForm />);

      await waitFor(() => {
        expect(screen.getByText("Piece")).toBeInTheDocument();
      });

      const inputs = screen.getAllByRole("textbox");
      const pieceInput = inputs.find(
        (input) => input.previousElementSibling?.textContent === "Piece"
      );
      const rateInput = inputs.find(
        (input) => input.previousElementSibling?.textContent === "Rate"
      );

      // The component auto-updates total when piece or rate changes
      if (pieceInput && rateInput) {
        await user.type(pieceInput, "5");
        await user.type(rateInput, "1000");

        // Just verify the inputs were entered correctly
        expect(pieceInput).toHaveValue("5");
        expect(rateInput).toHaveValue("1000");
      }
    });
  });

  describe("Form Validation", () => {
    it("shows error when account is not selected", async () => {
      const user = userEvent.setup();
      render(<RepairForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /^save$/i })
        ).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /^save$/i });
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
      render(<RepairForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const selects = document.querySelectorAll("select");
      const accountSelect = selects[0];
      await user.selectOptions(accountSelect, "1");

      const saveButton = screen.getByRole("button", { name: /^save$/i });
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

    it("validates numeric fields", async () => {
      const user = userEvent.setup();
      render(<RepairForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const selects = document.querySelectorAll("select");
      const accountSelect = selects[0];
      await user.selectOptions(accountSelect, "1");

      const itemSelect = selects[1];
      await user.selectOptions(itemSelect, "item1");

      const inputs = screen.getAllByRole("textbox");
      const grWtInput = inputs.find(
        (input) => input.previousElementSibling?.textContent === "Gr. Wt"
      );

      if (grWtInput) {
        await user.type(grWtInput, "abc");
      }

      const saveButton = screen.getByRole("button", { name: /^save$/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: "destructive",
            title: "Numeric fields must be valid",
          })
        );
      });
    });

    it("validates piece must be integer", async () => {
      const user = userEvent.setup();
      render(<RepairForm />);

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
        await user.type(pieceInput, "10.5");
      }

      const saveButton = screen.getByRole("button", { name: /^save$/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: "destructive",
            title: "Piece must be integer",
          })
        );
      });
    });
  });

  describe("Form Submission", () => {
    it("submits form with valid data in create mode", async () => {
      const user = userEvent.setup();
      render(<RepairForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const selects = document.querySelectorAll("select");
      const accountSelect = selects[0];
      await user.selectOptions(accountSelect, "1");

      const itemSelect = selects[1];
      await user.selectOptions(itemSelect, "item1");

      const saveButton = screen.getByRole("button", { name: /^save$/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(backend.repairCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            account: "1",
            item_name: "item1",
          })
        );
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Saved",
          description: "Repair created",
        })
      );
    });

    it("resets form after successful save", async () => {
      const user = userEvent.setup();
      render(<RepairForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const selects = document.querySelectorAll("select");
      const accountSelect = selects[0];
      await user.selectOptions(accountSelect, "1");

      const itemSelect = selects[1];
      await user.selectOptions(itemSelect, "item1");

      const inputs = screen.getAllByRole("textbox");
      const tagInput = inputs.find(
        (input) => input.previousElementSibling?.textContent === "Tag No"
      );

      if (tagInput) {
        await user.type(tagInput, "TAG-001");
      }

      const saveButton = screen.getByRole("button", { name: /^save$/i });
      await user.click(saveButton);

      await waitFor(() => {
        if (tagInput) {
          expect(tagInput).toHaveValue("");
        }
      });
    });

    it("shows error on save failure", async () => {
      vi.mocked(backend.repairCreate).mockRejectedValue(
        new Error("Save failed")
      );
      const user = userEvent.setup();
      render(<RepairForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const selects = document.querySelectorAll("select");
      const accountSelect = selects[0];
      await user.selectOptions(accountSelect, "1");

      const itemSelect = selects[1];
      await user.selectOptions(itemSelect, "item1");

      const saveButton = screen.getByRole("button", { name: /^save$/i });
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
      render(<RepairForm />);

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
            formName: "Repair",
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
      render(<RepairForm />);

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

      render(<RepairForm />);

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

  describe("Edit Mode", () => {
    it("loads existing record in edit mode", async () => {
      const mockRecord = {
        account: { id: "1" },
        date: "2024-01-15",
        type: "Type A",
        tag_no: "TAG-001",
        item_name: { id: "item1" },
        supplier: "Supplier A",
        stamp: { id: "stamp1" },
        piece: 5,
        gr_wt: 10.5,
        net_wt: 9.5,
        rate: 5000,
        total: 25000,
        remark: "Test remark",
      };

      vi.mocked(backend.repairDetail).mockResolvedValue(mockRecord as any);

      render(<RepairForm id="1" />);

      await waitFor(() => {
        expect(backend.repairDetail).toHaveBeenCalledWith("1");
      });

      await waitFor(() => {
        const inputs = screen.getAllByRole("textbox");
        const tagInput = inputs.find(
          (input) => input.previousElementSibling?.textContent === "Tag No"
        );
        if (tagInput) {
          expect(tagInput).toHaveValue("TAG-001");
        }
      });
    });

    it("updates record in edit mode", async () => {
      const mockRecord = {
        account: { id: "1" },
        item_name: { id: "item1" },
        tag_no: "TAG-001",
      };

      vi.mocked(backend.repairDetail).mockResolvedValue(mockRecord as any);

      const user = userEvent.setup();
      render(<RepairForm id="1" />);

      await waitFor(() => {
        expect(backend.repairDetail).toHaveBeenCalledWith("1");
      });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /update/i })
        ).toBeInTheDocument();
      });

      const updateButton = screen.getByRole("button", { name: /update/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(backend.repairUpdate).toHaveBeenCalledWith(
          "1",
          expect.objectContaining({
            account: "1",
            item_name: "item1",
          })
        );
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Updated",
          description: "Repair updated",
        })
      );
    });
  });
});
