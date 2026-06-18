import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SubAccountForm from "@/components/accounts/SubAccountForm";
import * as backend from "@/lib/backend";
import * as exportLib from "@/lib/export";

// Mock backend
vi.mock("@/lib/backend", () => ({
  accountsDropdown: vi.fn(),
  subaccountCreate: vi.fn(),
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

describe("SubAccountForm", () => {
  const mockAccounts = [
    { id: "1", name: "Customer A" },
    { id: "2", name: "Customer B" },
    { id: "3", name: "Customer C" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.accountsDropdown).mockResolvedValue(mockAccounts);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders all form fields", async () => {
      render(<SubAccountForm />);

      await waitFor(() => {
        expect(screen.getByText("Account")).toBeInTheDocument();
      });

      expect(screen.getByText("Sub Account Name")).toBeInTheDocument();
      expect(screen.getByText("Address")).toBeInTheDocument();
      expect(screen.getByText("Phone Number")).toBeInTheDocument();
      expect(screen.getByText("Email Address")).toBeInTheDocument();
      expect(screen.getByText("Gender")).toBeInTheDocument();
    });

    it("loads accounts on mount", async () => {
      render(<SubAccountForm />);

      await waitFor(() => {
        expect(backend.accountsDropdown).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });
    });

    it("displays all account options", async () => {
      render(<SubAccountForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      expect(screen.getByText("Customer B")).toBeInTheDocument();
      expect(screen.getByText("Customer C")).toBeInTheDocument();
    });

    it("handles account loading error", async () => {
      vi.mocked(backend.accountsDropdown).mockRejectedValue(
        new Error("Load failed")
      );

      render(<SubAccountForm />);

      await waitFor(() => {
        expect(backend.accountsDropdown).toHaveBeenCalled();
      });

      // Form should still render
      expect(screen.getByText("Account")).toBeInTheDocument();
    });
  });

  describe("Form Interaction", () => {
    it("allows entering sub account name", async () => {
      const user = userEvent.setup();
      render(<SubAccountForm />);

      await waitFor(() => {
        expect(screen.getByText("Sub Account Name")).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText("Enter contact person name");
      await user.type(input, "John Doe");

      expect(input).toHaveValue("John Doe");
    });

    it("allows entering address", async () => {
      const user = userEvent.setup();
      render(<SubAccountForm />);

      await waitFor(() => {
        expect(screen.getByText("Address")).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText("Enter full address");
      await user.type(input, "123 Main St");

      expect(input).toHaveValue("123 Main St");
    });

    it("allows entering phone number", async () => {
      const user = userEvent.setup();
      render(<SubAccountForm />);

      await waitFor(() => {
        expect(screen.getByText("Phone Number")).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText("10-digit number");
      await user.type(input, "1234567890");

      expect(input).toHaveValue("1234567890");
    });

    it("allows selecting gender", async () => {
      const user = userEvent.setup();
      render(<SubAccountForm />);

      await waitFor(() => {
        expect(screen.getByText("Gender")).toBeInTheDocument();
      });

      const select = screen.getByRole("combobox", { name: /gender/i });
      await user.selectOptions(select, "MALE");

      expect(select).toHaveValue("MALE");
    });
  });

  describe("Form Validation", () => {
    it("requires account selection via HTML5 validation", async () => {
      render(<SubAccountForm />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /save/i })
        ).toBeInTheDocument();
      });

      // The form has required attribute on account select, so HTML5 validation prevents submission
      const accountSelect = screen.getByRole("combobox", { name: /account/i });
      expect(accountSelect).toBeRequired();
    });

    it("requires sub account name via HTML5 validation", async () => {
      render(<SubAccountForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      // The form has required attribute on sub account name input
      const nameInput = screen.getByPlaceholderText(
        "Enter contact person name"
      );
      expect(nameInput).toBeRequired();
    });

    it("validates phone number format", async () => {
      const user = userEvent.setup();
      render(<SubAccountForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const accountSelect = screen.getByRole("combobox", { name: /account/i });
      await user.selectOptions(accountSelect, "1");

      const nameInput = screen.getByPlaceholderText(
        "Enter contact person name"
      );
      await user.type(nameInput, "John Doe");

      const phoneInput = screen.getByPlaceholderText("10-digit number");
      await user.type(phoneInput, "abc123");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Phone must contain only numbers and be at most 10 digits",
        });
      });
      expect(backend.subaccountCreate).not.toHaveBeenCalled();
    });

    it("accepts valid phone number", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.subaccountCreate).mockResolvedValue({} as any);

      render(<SubAccountForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const accountSelect = screen.getByRole("combobox", { name: /account/i });
      await user.selectOptions(accountSelect, "1");

      const nameInput = screen.getByPlaceholderText(
        "Enter contact person name"
      );
      await user.type(nameInput, "John Doe");

      const phoneInput = screen.getByPlaceholderText("10-digit number");
      await user.type(phoneInput, "1234567890");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(backend.subaccountCreate).toHaveBeenCalled();
      });
    });
  });

  describe("Form Submission", () => {
    it("submits form with all fields", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.subaccountCreate).mockResolvedValue({} as any);

      render(<SubAccountForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const accountSelect = screen.getByRole("combobox", { name: /account/i });
      await user.selectOptions(accountSelect, "1");

      const nameInput = screen.getByPlaceholderText(
        "Enter contact person name"
      );
      await user.type(nameInput, "John Doe");

      const addressInput = screen.getByPlaceholderText("Enter full address");
      await user.type(addressInput, "123 Main St");

      const phoneInput = screen.getByPlaceholderText("10-digit number");
      await user.type(phoneInput, "1234567890");

      const genderSelect = screen.getByRole("combobox", { name: /gender/i });
      await user.selectOptions(genderSelect, "MALE");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(backend.subaccountCreate).toHaveBeenCalledWith({
          account: "1",
          sub_account_name: "John Doe",
          address: "123 Main St",
          phone_number: "1234567890",
          email: null,
          gender: "MALE",
        });
      });
    });

    it("shows success toast after save", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.subaccountCreate).mockResolvedValue({} as any);

      render(<SubAccountForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const accountSelect = screen.getByRole("combobox", { name: /account/i });
      await user.selectOptions(accountSelect, "1");

      const nameInput = screen.getByPlaceholderText(
        "Enter contact person name"
      );
      await user.type(nameInput, "John Doe");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Success",
          description: "Sub Account saved successfully",
        });
      });
    });

    it("resets form after successful save", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.subaccountCreate).mockResolvedValue({} as any);

      render(<SubAccountForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const accountSelect = screen.getByRole("combobox", { name: /account/i });
      await user.selectOptions(accountSelect, "1");

      const nameInput = screen.getByPlaceholderText(
        "Enter contact person name"
      );
      await user.type(nameInput, "John Doe");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(accountSelect).toHaveValue("");
        expect(nameInput).toHaveValue("");
      });
    });

    it("shows error toast on save failure", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.mocked(backend.subaccountCreate).mockRejectedValue(
        new Error("Save failed")
      );

      render(<SubAccountForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const accountSelect = screen.getByRole("combobox", { name: /account/i });
      await user.selectOptions(accountSelect, "1");

      const nameInput = screen.getByPlaceholderText(
        "Enter contact person name"
      );
      await user.type(nameInput, "John Doe");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Failed to save Sub Account",
        });
      });

      consoleErrorSpy.mockRestore();
    });

    it("disables save button during submission", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.subaccountCreate).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<SubAccountForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const accountSelect = screen.getByRole("combobox", { name: /account/i });
      await user.selectOptions(accountSelect, "1");

      const nameInput = screen.getByPlaceholderText(
        "Enter contact person name"
      );
      await user.type(nameInput, "John Doe");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
        expect(screen.getByText("Saving...")).toBeInTheDocument();
      });
    });
  });

  describe("Export Functionality", () => {
    it("exports form data", async () => {
      const user = userEvent.setup();
      vi.mocked(exportLib.exportToExcel).mockReturnValue({
        ok: true,
        filename: "test.xlsx",
      });

      render(<SubAccountForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const accountSelect = screen.getByRole("combobox", { name: /account/i });
      await user.selectOptions(accountSelect, "1");

      const nameInput = screen.getByPlaceholderText(
        "Enter contact person name"
      );
      await user.type(nameInput, "John Doe");

      const exportButton = screen.getByRole("button", { name: /export data/i });
      await user.click(exportButton);

      expect(exportLib.exportToExcel).toHaveBeenCalledWith({
        formName: "Sub Account",
        headers: expect.arrayContaining(["Account", "Sub Account Name"]),
        dataRow: expect.arrayContaining(["Customer A", "John Doe"]),
        includeFooterTimestamp: true,
      });
    });

    it("shows success toast on export", async () => {
      const user = userEvent.setup();
      vi.mocked(exportLib.exportToExcel).mockReturnValue({
        ok: true,
        filename: "test.xlsx",
      });

      render(<SubAccountForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
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

      render(<SubAccountForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /export data/i });
      await user.click(exportButton);

      expect(mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Export failed",
      });
    });
  });

  describe("Gender Options", () => {
    it("displays all gender options", async () => {
      render(<SubAccountForm />);

      await waitFor(() => {
        expect(screen.getByText("Gender")).toBeInTheDocument();
      });

      const select = screen.getByRole("combobox", { name: /gender/i });
      expect(select).toBeInTheDocument();

      const options = within(select).getAllByRole("option");
      expect(options).toHaveLength(4); // -- Select --, Male, Female, Others
      expect(
        within(select).getByRole("option", { name: "Male" })
      ).toBeInTheDocument();
      expect(
        within(select).getByRole("option", { name: "Female" })
      ).toBeInTheDocument();
      expect(
        within(select).getByRole("option", { name: "Others" })
      ).toBeInTheDocument();
    });
  });
});
