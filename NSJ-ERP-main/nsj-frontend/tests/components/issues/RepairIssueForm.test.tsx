import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RepairIssueForm from "@/components/issues/RepairIssueForm";
import * as backend from "@/lib/backend";

vi.mock("@/lib/backend");

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("RepairIssueForm", () => {
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
    vi.mocked(backend.repairIssueCreate).mockResolvedValue({} as any);
    vi.mocked(backend.repairIssueUpdate).mockResolvedValue({} as any);
  });

  describe("Rendering", () => {
    it("renders form with all fields", async () => {
      render(<RepairIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Account")).toBeInTheDocument();
        expect(screen.getByText("Tag No")).toBeInTheDocument();
        expect(screen.getByText("Item Name")).toBeInTheDocument();
        expect(screen.getByText("Piece")).toBeInTheDocument();
        expect(screen.getByText("Remark")).toBeInTheDocument();
        expect(screen.getByText("Stamp")).toBeInTheDocument();
        expect(screen.getByText("Gr.wt")).toBeInTheDocument();
        expect(screen.getByText("Net.wt")).toBeInTheDocument();
        expect(screen.getByText("Tunch")).toBeInTheDocument();
        expect(screen.getByText("Wstg")).toBeInTheDocument();
        expect(screen.getByText("Rate")).toBeInTheDocument();
        expect(screen.getByText("Total")).toBeInTheDocument();
      });
    });

    it("loads and displays accounts dropdown", async () => {
      render(<RepairIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
        expect(screen.getByText("Account 2")).toBeInTheDocument();
      });
    });

    it("loads and displays items dropdown", async () => {
      render(<RepairIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Gold Ring")).toBeInTheDocument();
        expect(screen.getByText("Silver Necklace")).toBeInTheDocument();
      });
    });

    it("renders Save button", async () => {
      render(<RepairIssueForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /save/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Form Interaction", () => {
    it("allows selecting account", async () => {
      const user = userEvent.setup();
      render(<RepairIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const selects = document.querySelectorAll("select");
      const accountSelect = selects[0];
      await user.selectOptions(accountSelect, "1");

      expect(accountSelect).toHaveValue("1");
    });

    it("allows entering tag number", async () => {
      const user = userEvent.setup();
      render(<RepairIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Tag No")).toBeInTheDocument();
      });

      const inputs = screen.getAllByRole("textbox");
      const tagInput = inputs[0];
      await user.type(tagInput, "TAG-001");

      expect(tagInput).toHaveValue("TAG-001");
    });

    it("allows entering numeric values", async () => {
      const user = userEvent.setup();
      render(<RepairIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Gr.wt")).toBeInTheDocument();
      });

      const inputs = screen.getAllByRole("textbox");
      const grWtInput = inputs.find(
        (input) => input.previousElementSibling?.textContent === "Gr.wt"
      );

      if (grWtInput) {
        await user.type(grWtInput, "10.5");
        expect(grWtInput).toHaveValue("10.5");
      }
    });
  });

  describe("Form Validation", () => {
    it("shows error when account is not selected", async () => {
      const user = userEvent.setup();
      render(<RepairIssueForm />);

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
      render(<RepairIssueForm />);

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

    it("validates numeric fields", async () => {
      const user = userEvent.setup();
      render(<RepairIssueForm />);

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
        (input) => input.previousElementSibling?.textContent === "Gr.wt"
      );

      if (grWtInput) {
        await user.type(grWtInput, "abc");
      }

      const saveButton = screen.getByRole("button", { name: /save/i });
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
      render(<RepairIssueForm />);

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

      const saveButton = screen.getByRole("button", { name: /save/i });
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
      render(<RepairIssueForm />);

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
        expect(backend.repairIssueCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            account: "1",
            item_name: "item1",
          })
        );
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Saved",
          description: "Repair issue created",
        })
      );
    });

    it("resets form after successful save", async () => {
      const user = userEvent.setup();
      render(<RepairIssueForm />);

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
      vi.mocked(backend.repairIssueCreate).mockRejectedValue(
        new Error("Save failed")
      );
      const user = userEvent.setup();
      render(<RepairIssueForm />);

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

  describe("Data Loading", () => {
    it("shows toast on masters load failure", async () => {
      vi.mocked(backend.accountsDropdown).mockRejectedValue(
        new Error("Load failed")
      );

      render(<RepairIssueForm />);

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
        tag_no: "TAG-001",
        item_name: { id: "item1" },
        piece: 5,
        remark: "Test remark",
        stamp: { id: "stamp1" },
        gr_wt: 10.5,
        net_wt: 9.5,
        tunch: 22,
        wstg: 1.0,
        rate: 5000,
        total: 25000,
      };

      vi.mocked(backend.repairIssueDetail).mockResolvedValue(mockRecord as any);

      render(<RepairIssueForm id="1" />);

      await waitFor(() => {
        expect(backend.repairIssueDetail).toHaveBeenCalledWith("1");
      });

      await waitFor(() => {
        const inputs = screen.getAllByRole("textbox");
        const tagInput = inputs[0];
        expect(tagInput).toHaveValue("TAG-001");
      });
    });

    it("updates record in edit mode", async () => {
      const mockRecord = {
        account: { id: "1" },
        tag_no: "TAG-001",
        item_name: { id: "item1" },
      };

      vi.mocked(backend.repairIssueDetail).mockResolvedValue(mockRecord as any);

      const user = userEvent.setup();
      render(<RepairIssueForm id="1" />);

      await waitFor(() => {
        expect(backend.repairIssueDetail).toHaveBeenCalledWith("1");
      });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /update/i })
        ).toBeInTheDocument();
      });

      const updateButton = screen.getByRole("button", { name: /update/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(backend.repairIssueUpdate).toHaveBeenCalledWith(
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
          description: "Repair issue updated",
        })
      );
    });
  });
});
