import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReceiveForm } from "@/components/vouchers/ReceiveForm";
import * as backend from "@/lib/backend";

vi.mock("@/lib/backend");

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockBack = vi.fn();
const mockPathname = vi.fn(() => "/vouchers/receive/new");
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: mockBack,
  }),
  usePathname: () => mockPathname(),
}));

describe("ReceiveForm", () => {
  const mockAccounts = [
    { id: "1", account_name: "Account 1", account_no: "ACC-001" },
    { id: "2", account_name: "Account 2", account_no: "ACC-002" },
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
    vi.mocked(backend.accountsList).mockResolvedValue({
      results: mockAccounts,
      count: 2,
    } as any);
    vi.mocked(backend.vouchersItemNames).mockResolvedValue({
      item_names: mockItems,
    } as any);
    vi.mocked(backend.vouchersMasters).mockResolvedValue({
      stamps: mockStamps,
    } as any);
    vi.mocked(backend.vouchersUnits).mockResolvedValue({
      units: mockUnits,
    } as any);
    vi.mocked(backend.receiveCreate).mockResolvedValue({} as any);
  });

  describe("Rendering", () => {
    it("renders form with all required fields", async () => {
      render(<ReceiveForm />);

      await waitFor(() => {
        expect(screen.getByText("Account")).toBeInTheDocument();
        expect(screen.getByText("Item Name")).toBeInTheDocument();
        expect(screen.getByText("Unit")).toBeInTheDocument();
      });
    });

    it("loads and displays accounts dropdown", async () => {
      render(<ReceiveForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
        expect(screen.getByText("Account 2")).toBeInTheDocument();
      });
    });

    it("loads and displays items dropdown", async () => {
      render(<ReceiveForm />);

      await waitFor(() => {
        expect(screen.getByText("Gold Ring")).toBeInTheDocument();
        expect(screen.getByText("Silver Necklace")).toBeInTheDocument();
      });
    });

    it("loads and displays units dropdown", async () => {
      render(<ReceiveForm />);

      await waitFor(() => {
        expect(screen.getByText("Gram")).toBeInTheDocument();
        expect(screen.getByText("Piece")).toBeInTheDocument();
      });
    });

    it("renders Save and Cancel buttons", async () => {
      render(<ReceiveForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /save receive/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /cancel/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Form Interaction", () => {
    it("allows selecting account", async () => {
      const user = userEvent.setup();
      render(<ReceiveForm />);

      await waitFor(() => {
        expect(screen.getByText("Account 1")).toBeInTheDocument();
      });

      const accountSelect = screen.getByLabelText(/account/i);
      await user.selectOptions(accountSelect, "1");

      expect(accountSelect).toHaveValue("1");
    });

    it("allows selecting item", async () => {
      const user = userEvent.setup();
      render(<ReceiveForm />);

      await waitFor(() => {
        expect(screen.getByText("Gold Ring")).toBeInTheDocument();
      });

      const itemSelect = screen.getByLabelText(/item name/i);
      await user.selectOptions(itemSelect, "item1");

      expect(itemSelect).toHaveValue("item1");
    });

    it("allows selecting unit", async () => {
      const user = userEvent.setup();
      render(<ReceiveForm />);

      await waitFor(() => {
        expect(screen.getByText("Gram")).toBeInTheDocument();
      });

      const unitSelect = screen.getByLabelText(/unit/i);
      await user.selectOptions(unitSelect, "unit1");

      expect(unitSelect).toHaveValue("unit1");
    });

    it("allows entering numeric values", async () => {
      const user = userEvent.setup();
      render(<ReceiveForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/net wt/i)).toBeInTheDocument();
      });

      const netWtInput = screen.getByLabelText(/net wt/i);
      await user.type(netWtInput, "10.5");

      expect(netWtInput).toHaveValue(10.5);
    });
  });

  describe("Auto-calculation", () => {
    it("calculates total from netWt and rate", async () => {
      const user = userEvent.setup();
      render(<ReceiveForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/net wt/i)).toBeInTheDocument();
      });

      const netWtInput = screen.getByLabelText(/net wt/i);
      const rateInput = screen.getByLabelText(/rate/i);
      const totalInput = screen.getByLabelText(/total/i);

      await user.type(netWtInput, "10");
      await user.type(rateInput, "5000");

      await waitFor(() => {
        expect(totalInput).toHaveValue(50000);
      });
    });
  });

  describe("Form Submission", () => {
    it("renders save button", async () => {
      render(<ReceiveForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /save receive/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Cancel Action", () => {
    it("calls router.back when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<ReceiveForm />);

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

  describe("Data Loading", () => {
    it("shows toast on accounts load failure", async () => {
      vi.mocked(backend.accountsList).mockRejectedValue(
        new Error("Load failed")
      );

      render(<ReceiveForm />);

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
});
