import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  VoucherForm,
  computeLineValue,
} from "@/components/vouchers/VoucherForm";
import * as backend from "@/lib/backend";
import * as exportLib from "@/lib/export";

vi.mock("@/lib/backend");
vi.mock("@/lib/export");

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockBack = vi.fn();
const mockPathname = vi.fn(() => "/vouchers/new");
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: mockBack,
  }),
  usePathname: () => mockPathname(),
}));

describe("VoucherForm", () => {
  const mockAccounts = [
    { id: "1", account_name: "Account 1", account_no: "ACC-001" },
    { id: "2", account_name: "Account 2", account_no: "ACC-002" },
  ];

  const mockSeries = [
    { id: "series1", name: "DEFAULT" },
    { id: "series2", name: "SPECIAL" },
  ];

  const mockStamps = [
    { id: "stamp1", name: "22K", code: "22K" },
    { id: "stamp2", name: "18K", code: "18K" },
  ];

  const mockBaseMetals = [
    { id: "metal1", name: "Gold", code: "AU" },
    { id: "metal2", name: "Silver", code: "AG" },
  ];

  const mockItems = [
    { id: "item1", name: "Gold Ring" },
    { id: "item2", name: "Silver Necklace" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.accountsList).mockResolvedValue({
      results: mockAccounts,
      count: 2,
    } as any);
    vi.mocked(backend.vouchersMasters).mockResolvedValue({
      series: mockSeries,
      stamps: mockStamps,
      base_metals: mockBaseMetals,
    } as any);
    vi.mocked(backend.vouchersItemNames).mockResolvedValue({
      item_names: mockItems,
    } as any);
    vi.mocked(backend.subaccountsList).mockResolvedValue({
      results: [],
    } as any);
    vi.mocked(backend.voucherCreate).mockResolvedValue({
      result: { id: "voucher1" },
    } as any);
  });

  describe("Rendering", () => {
    it("renders form with basic fields", async () => {
      render(<VoucherForm />);

      await waitFor(() => {
        expect(screen.getByText("Account")).toBeInTheDocument();
        expect(screen.getByText("Series")).toBeInTheDocument();
        expect(screen.getByText("Date")).toBeInTheDocument();
        expect(screen.getByText("Item name")).toBeInTheDocument();
        expect(screen.getByText("Design")).toBeInTheDocument();
      });
    });

    it("loads and displays accounts dropdown", async () => {
      render(<VoucherForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
        expect(screen.getByText("Account 2")).toBeInTheDocument();
      });
    });

    it("loads and displays series dropdown", async () => {
      render(<VoucherForm />);

      await waitFor(() => {
        expect(screen.getByText("DEFAULT")).toBeInTheDocument();
        expect(screen.getByText("SPECIAL")).toBeInTheDocument();
      });
    });

    it("renders Save and Cancel buttons", async () => {
      render(<VoucherForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /save order/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /cancel/i })
        ).toBeInTheDocument();
      });
    });

    it("renders Export Data button", async () => {
      render(<VoucherForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /export data/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Form Interaction", () => {
    it("allows selecting account", async () => {
      const user = userEvent.setup();
      render(<VoucherForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const accountSelect = screen.getByLabelText(/account/i);
      await user.selectOptions(accountSelect, "1");

      expect(accountSelect).toHaveValue("1");
    });

    it("allows selecting series", async () => {
      const user = userEvent.setup();
      render(<VoucherForm />);

      await waitFor(() => {
        expect(screen.getByText("DEFAULT")).toBeInTheDocument();
      });

      const seriesSelect = screen.getByLabelText(/series/i);
      await user.selectOptions(seriesSelect, "DEFAULT");

      expect(seriesSelect).toHaveValue("DEFAULT");
    });

    it("allows entering item name", async () => {
      const user = userEvent.setup();
      render(<VoucherForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/item name/i)).toBeInTheDocument();
      });

      const itemInput = screen.getByLabelText(/item name/i);
      await user.type(itemInput, "Custom Item");

      expect(itemInput).toHaveValue("Custom Item");
    });

    it("allows entering design", async () => {
      const user = userEvent.setup();
      render(<VoucherForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/design/i)).toBeInTheDocument();
      });

      const designInput = screen.getByLabelText(/design/i);
      await user.type(designInput, "Design A");

      expect(designInput).toHaveValue("Design A");
    });
  });

  describe("Auto-fill Item Name", () => {
    it("auto-fills item name from sub-account when account is selected", async () => {
      vi.mocked(backend.subaccountsList).mockResolvedValue({
        results: [{ id: "sub1", account: "1", item_name: "Gold Ring" }],
      } as any);

      const user = userEvent.setup();
      render(<VoucherForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const accountSelect = screen.getByLabelText(/account/i);
      await user.selectOptions(accountSelect, "1");

      await waitFor(() => {
        const itemInput = screen.getByLabelText(/item name/i);
        expect(itemInput).toHaveValue("Gold Ring");
      });
    });

    it("clears item name when account changes", async () => {
      const user = userEvent.setup();
      render(<VoucherForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const itemInput = screen.getByLabelText(/item name/i);
      await user.type(itemInput, "Test Item");

      const accountSelect = screen.getByLabelText(/account/i);
      await user.selectOptions(accountSelect, "1");

      await waitFor(() => {
        expect(itemInput).toHaveValue("");
      });
    });
  });

  describe("Auto-calculation", () => {
    it("calculates valueItem from wt, rateItem, and discountPct", async () => {
      const user = userEvent.setup();
      render(<VoucherForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/wt \(line\)/i)).toBeInTheDocument();
      });

      const wtInput = screen.getByLabelText(/wt \(line\)/i);
      const rateInput = screen.getByLabelText(/rate \(per unit\)/i);
      const discountInput = screen.getByLabelText(/discount %/i);
      const valueInput = screen.getByLabelText(/value \(auto\)/i);

      await user.clear(wtInput);
      await user.type(wtInput, "10");
      await user.clear(rateInput);
      await user.type(rateInput, "1000");
      await user.clear(discountInput);
      await user.type(discountInput, "10");

      await waitFor(() => {
        expect(valueInput).toHaveValue(9000);
      });
    });
  });

  describe("computeLineValue helper", () => {
    it("calculates value correctly", () => {
      expect(computeLineValue(10, 1000, 0)).toBe(10000);
      expect(computeLineValue(10, 1000, 10)).toBe(9000);
      expect(computeLineValue(5, 2000, 20)).toBe(8000);
    });

    it("handles null and undefined values", () => {
      expect(computeLineValue(null, 1000, 0)).toBe(0);
      expect(computeLineValue(10, null, 0)).toBe(0);
      expect(computeLineValue(10, 1000, null)).toBe(10000);
    });

    it("handles string inputs", () => {
      expect(computeLineValue("10", "1000", "10")).toBe(9000);
    });
  });

  describe("File Upload", () => {
    it("renders file upload input", async () => {
      render(<VoucherForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/upload file/i)).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("renders save button", async () => {
      render(<VoucherForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /save order/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Cancel Action", () => {
    it("calls router.back when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<VoucherForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /cancel/i })
        ).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe("Export Functionality", () => {
    it("exports form data to Excel", async () => {
      vi.mocked(exportLib.exportToExcel).mockReturnValue({
        ok: true,
        filename: "test.xlsx",
      });
      const user = userEvent.setup();
      render(<VoucherForm />);

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
            formName: "Order Form",
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
      render(<VoucherForm />);

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
    it("shows toast on accounts load failure", async () => {
      vi.mocked(backend.accountsList).mockRejectedValue(
        new Error("Load failed")
      );

      render(<VoucherForm />);

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

  describe("Print Modal", () => {
    it("shows print modal after successful save", async () => {
      const user = userEvent.setup();
      render(<VoucherForm />);

      // Wait for form to load
      await waitFor(() => {
        expect(
          screen.getByLabelText(/advance payment received/i)
        ).toBeInTheDocument();
      });

      // Select required field
      const advanceSelect = screen.getByLabelText(/advance payment received/i);
      await user.selectOptions(advanceSelect, "YES");

      // Submit form
      const saveButton = screen.getByRole("button", { name: /save order/i });
      await user.click(saveButton);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Order created")).toBeInTheDocument();
        expect(
          screen.getByText("Do you want to print the receipt?")
        ).toBeInTheDocument();
      });
    });
  });
});
