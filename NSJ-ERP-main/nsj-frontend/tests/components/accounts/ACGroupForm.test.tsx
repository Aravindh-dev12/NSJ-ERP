import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ACGroupForm from "@/components/accounts/ACGroupForm";
import * as backend from "@/lib/backend";
import * as exportLib from "@/lib/export";

// Mock backend
vi.mock("@/lib/backend", () => ({
  acGroupMastersList: vi.fn(),
  acGroupCreate: vi.fn(),
}));

// Mock export
vi.mock("@/lib/export", () => ({
  exportToExcel: vi.fn(),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("ACGroupForm", () => {
  const mockMasters = [
    { id: "1", name: "Sundry Debtors" },
    { id: "2", name: "Sundry Creditors" },
    { id: "3", name: "Cash" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.acGroupMastersList).mockResolvedValue(mockMasters);
    window.alert = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders form with all fields", async () => {
      render(<ACGroupForm />);

      await waitFor(() => {
        expect(screen.getByText("A/C Group Name")).toBeInTheDocument();
      });

      expect(screen.getByText("Incl. in Sale")).toBeInTheDocument();
      expect(screen.getByText("Incl. in Pur")).toBeInTheDocument();
      expect(screen.getByText("Incl. in Out")).toBeInTheDocument();
      expect(screen.getByText("Incl. in I/R")).toBeInTheDocument();
      expect(screen.getByText("Address Req")).toBeInTheDocument();
      expect(screen.getByText("Restrict Credit Facility")).toBeInTheDocument();
    });

    it("renders save and export buttons", async () => {
      render(<ACGroupForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /save/i })
        ).toBeInTheDocument();
      });

      expect(
        screen.getByRole("button", { name: /export data/i })
      ).toBeInTheDocument();
    });

    it("loads AC group masters on mount", async () => {
      render(<ACGroupForm />);

      await waitFor(() => {
        expect(backend.acGroupMastersList).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByText("Sundry Debtors")).toBeInTheDocument();
      });
    });

    it("displays all master options in dropdown", async () => {
      render(<ACGroupForm />);

      await waitFor(() => {
        expect(screen.getByText("Sundry Debtors")).toBeInTheDocument();
      });

      expect(screen.getByText("Sundry Creditors")).toBeInTheDocument();
      expect(screen.getByText("Cash")).toBeInTheDocument();
    });

    it("handles masters loading error gracefully", async () => {
      vi.mocked(backend.acGroupMastersList).mockRejectedValue(
        new Error("Load failed")
      );

      render(<ACGroupForm />);

      await waitFor(() => {
        expect(backend.acGroupMastersList).toHaveBeenCalled();
      });

      // Form should still render
      expect(screen.getByText("A/C Group Name")).toBeInTheDocument();
    });
  });

  describe("Form Interaction", () => {
    it("allows selecting AC group", async () => {
      const user = userEvent.setup();
      render(<ACGroupForm />);

      await waitFor(() => {
        expect(screen.getByText("Sundry Debtors")).toBeInTheDocument();
      });

      const select = screen.getByRole("combobox", { name: /a\/c group name/i });
      await user.selectOptions(select, "1");

      expect(select).toHaveValue("1");
    });

    it("allows changing all YES/NO fields", async () => {
      const user = userEvent.setup();
      render(<ACGroupForm />);

      await waitFor(() => {
        expect(screen.getByText("A/C Group Name")).toBeInTheDocument();
      });

      const saleSelect = screen.getByRole("combobox", {
        name: /incl\. in sale/i,
      });
      await user.selectOptions(saleSelect, "YES");
      expect(saleSelect).toHaveValue("YES");

      const purSelect = screen.getByRole("combobox", {
        name: /incl\. in pur/i,
      });
      await user.selectOptions(purSelect, "YES");
      expect(purSelect).toHaveValue("YES");
    });

    it("defaults all YES/NO fields to NO", async () => {
      render(<ACGroupForm />);

      await waitFor(() => {
        expect(screen.getByText("A/C Group Name")).toBeInTheDocument();
      });

      const saleSelect = screen.getByRole("combobox", {
        name: /incl\. in sale/i,
      });
      expect(saleSelect).toHaveValue("NO");

      const purSelect = screen.getByRole("combobox", {
        name: /incl\. in pur/i,
      });
      expect(purSelect).toHaveValue("NO");
    });
  });

  describe("Form Submission", () => {
    it("shows alert when no AC group selected", async () => {
      const user = userEvent.setup();
      render(<ACGroupForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /save/i })
        ).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      expect(window.alert).toHaveBeenCalledWith("Please select A/C Group Name");
      expect(backend.acGroupCreate).not.toHaveBeenCalled();
    });

    it("submits form with selected values", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.acGroupCreate).mockResolvedValue({} as any);

      render(<ACGroupForm />);

      await waitFor(() => {
        expect(screen.getByText("Sundry Debtors")).toBeInTheDocument();
      });

      const groupSelect = screen.getByRole("combobox", {
        name: /a\/c group name/i,
      });
      await user.selectOptions(groupSelect, "1");

      const saleSelect = screen.getByRole("combobox", {
        name: /incl\. in sale/i,
      });
      await user.selectOptions(saleSelect, "YES");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(backend.acGroupCreate).toHaveBeenCalledWith({
          ac_group_id: "1",
          incl_in_sale: "YES" as "YES" | "NO",
          incl_in_pur: "NO" as "YES" | "NO",
          incl_in_out: "NO" as "YES" | "NO",
          incl_in_ir: "NO" as "YES" | "NO",
          address_req: "NO" as "YES" | "NO",
          restrict_credit_facility: "NO" as "YES" | "NO",
        });
      });
    });

    it("shows success alert after save", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.acGroupCreate).mockResolvedValue({} as any);

      render(<ACGroupForm />);

      await waitFor(() => {
        expect(screen.getByText("Sundry Debtors")).toBeInTheDocument();
      });

      const groupSelect = screen.getByRole("combobox", {
        name: /a\/c group name/i,
      });
      await user.selectOptions(groupSelect, "1");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          "A/C Group saved successfully"
        );
      });
    });

    it("resets form after successful save", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.acGroupCreate).mockResolvedValue({} as any);

      render(<ACGroupForm />);

      await waitFor(() => {
        expect(screen.getByText("Sundry Debtors")).toBeInTheDocument();
      });

      const groupSelect = screen.getByRole("combobox", {
        name: /a\/c group name/i,
      });
      await user.selectOptions(groupSelect, "1");

      const saleSelect = screen.getByRole("combobox", {
        name: /incl\. in sale/i,
      });
      await user.selectOptions(saleSelect, "YES");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(groupSelect).toHaveValue("");
        expect(saleSelect).toHaveValue("NO");
      });
    });

    it("shows error alert on save failure", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.mocked(backend.acGroupCreate).mockRejectedValue(
        new Error("Save failed")
      );

      render(<ACGroupForm />);

      await waitFor(() => {
        expect(screen.getByText("Sundry Debtors")).toBeInTheDocument();
      });

      const groupSelect = screen.getByRole("combobox", {
        name: /a\/c group name/i,
      });
      await user.selectOptions(groupSelect, "1");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("Failed to save A/C Group");
      });

      consoleErrorSpy.mockRestore();
    });

    it("disables save button during submission", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.acGroupCreate).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ACGroupForm />);

      await waitFor(() => {
        expect(screen.getByText("Sundry Debtors")).toBeInTheDocument();
      });

      const groupSelect = screen.getByRole("combobox", {
        name: /a\/c group name/i,
      });
      await user.selectOptions(groupSelect, "1");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
        expect(screen.getByText("Saving...")).toBeInTheDocument();
      });
    });
  });

  describe("Export Functionality", () => {
    it("exports form data when export button clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(exportLib.exportToExcel).mockReturnValue({
        ok: true,
        filename: "test.xlsx",
      });

      render(<ACGroupForm />);

      await waitFor(() => {
        expect(screen.getByText("Sundry Debtors")).toBeInTheDocument();
      });

      const groupSelect = screen.getByRole("combobox", {
        name: /a\/c group name/i,
      });
      await user.selectOptions(groupSelect, "1");

      const exportButton = screen.getByRole("button", { name: /export data/i });
      await user.click(exportButton);

      expect(exportLib.exportToExcel).toHaveBeenCalledWith({
        formName: "A/C Group",
        headers: expect.arrayContaining([
          "A/C Group Name",
          "Incl. in Sale",
          "Incl. in Pur",
        ]),
        dataRow: expect.arrayContaining(["Sundry Debtors", "NO", "NO"]),
        includeFooterTimestamp: true,
      });
    });

    it("shows success toast on successful export", async () => {
      const user = userEvent.setup();
      vi.mocked(exportLib.exportToExcel).mockReturnValue({
        ok: true,
        filename: "test.xlsx",
      });

      render(<ACGroupForm />);

      await waitFor(() => {
        expect(screen.getByText("Sundry Debtors")).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /export data/i });
      await user.click(exportButton);

      expect(mockToast).toHaveBeenCalledWith({
        title: "Form data successfully exported to Excel.",
      });
    });

    it("shows error toast on export failure", async () => {
      const user = userEvent.setup();
      vi.mocked(exportLib.exportToExcel).mockReturnValue({
        ok: false,
        error: "Export failed",
      });

      render(<ACGroupForm />);

      await waitFor(() => {
        expect(screen.getByText("Sundry Debtors")).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /export data/i });
      await user.click(exportButton);

      expect(mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Export failed",
      });
    });
  });

  describe("Initial Values", () => {
    it("populates form with initial values", async () => {
      const initial = {
        ac_group_id: "2",
        incl_in_sale: "YES" as "YES" | "NO",
        incl_in_pur: "YES" as "YES" | "NO",
        incl_in_out: "NO" as "YES" | "NO",
        incl_in_ir: "NO" as "YES" | "NO",
        address_req: "YES" as "YES" | "NO",
        restrict_credit_facility: "NO" as "YES" | "NO",
      };

      render(<ACGroupForm initial={initial} />);

      await waitFor(() => {
        expect(screen.getByText("Sundry Creditors")).toBeInTheDocument();
      });

      const groupSelect = screen.getByRole("combobox", {
        name: /a\/c group name/i,
      });
      expect(groupSelect).toHaveValue("2");

      const saleSelect = screen.getByRole("combobox", {
        name: /incl\. in sale/i,
      });
      expect(saleSelect).toHaveValue("YES");

      const addressSelect = screen.getByRole("combobox", {
        name: /address req/i,
      });
      expect(addressSelect).toHaveValue("YES");
    });
  });

  describe("Cleanup", () => {
    it("cleans up on unmount", async () => {
      const { unmount } = render(<ACGroupForm />);

      await waitFor(() => {
        expect(backend.acGroupMastersList).toHaveBeenCalled();
      });

      unmount();

      // Should not cause any errors
      expect(true).toBe(true);
    });
  });
});
