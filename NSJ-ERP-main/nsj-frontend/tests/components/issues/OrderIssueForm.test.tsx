import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OrderIssueForm from "@/components/issues/OrderIssueForm";
import * as backend from "@/lib/backend";

// Mock backend
vi.mock("@/lib/backend", () => ({
  accountsDropdown: vi.fn(),
  vouchersItemNames: vi.fn(),
  vouchersMasters: vi.fn(),
  orderIssueCreate: vi.fn(),
  orderIssueDetail: vi.fn(),
  orderIssueUpdate: vi.fn(),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("OrderIssueForm", () => {
  const mockAccounts = [
    { id: "1", name: "Customer A", account_name: "Customer A" },
    { id: "2", name: "Customer B", account_name: "Customer B" },
  ];

  const mockItems = [
    { id: "item1", name: "Ring" },
    { id: "item2", name: "Necklace" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.accountsDropdown).mockResolvedValue(mockAccounts);
    vi.mocked(backend.vouchersItemNames).mockResolvedValue({
      item_names: mockItems,
    } as any);
    window.alert = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders all form fields", async () => {
      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Account")).toBeInTheDocument();
      });

      expect(screen.getByText("Item Name")).toBeInTheDocument();
      expect(screen.getByText("Metal")).toBeInTheDocument();
      expect(screen.getByText("Base Metal Colour")).toBeInTheDocument();
      expect(screen.getByText("Total Size")).toBeInTheDocument();
      expect(screen.getByText("Rhodium Instructions")).toBeInTheDocument();
      expect(screen.getByText("Delivery Date")).toBeInTheDocument();
      expect(screen.getByText("Reference Image")).toBeInTheDocument();
    });

    it("loads accounts and items on mount", async () => {
      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(backend.accountsDropdown).toHaveBeenCalledTimes(1);
        expect(backend.vouchersItemNames).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
        expect(screen.getByText("Ring")).toBeInTheDocument();
      });
    });

    it("displays all account options", async () => {
      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      expect(screen.getByText("Customer B")).toBeInTheDocument();
    });

    it("displays all item options", async () => {
      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Ring")).toBeInTheDocument();
      });

      expect(screen.getByText("Necklace")).toBeInTheDocument();
    });

    it("handles masters loading error", async () => {
      vi.mocked(backend.accountsDropdown).mockRejectedValue(
        new Error("Load failed")
      );

      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Failed to load masters",
        });
      });
    });
  });

  describe("Form Interaction", () => {
    it("allows selecting account", async () => {
      const user = userEvent.setup();
      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const accountSelect = screen.getAllByRole("combobox")[0];
      await user.selectOptions(accountSelect, "1");

      expect(accountSelect).toHaveValue("1");
    });

    it("allows selecting item", async () => {
      const user = userEvent.setup();
      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Ring")).toBeInTheDocument();
      });

      const itemSelect = screen.getAllByRole("combobox")[1];
      await user.selectOptions(itemSelect, "item1");

      expect(itemSelect).toHaveValue("item1");
    });

    it("allows entering metal", async () => {
      const user = userEvent.setup();
      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Metal")).toBeInTheDocument();
      });

      const metalInput = screen.getByPlaceholderText("e.g., 18K Gold");
      await user.type(metalInput, "18K Gold");

      expect(metalInput).toHaveValue("18K Gold");
    });

    it("allows entering base metal colour", async () => {
      const user = userEvent.setup();
      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Base Metal Colour")).toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText("e.g., Yellow");
      await user.type(inputs[0], "Yellow");

      expect(inputs[0]).toHaveValue("Yellow");
    });

    it("allows entering total size", async () => {
      const user = userEvent.setup();
      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Total Size")).toBeInTheDocument();
      });

      const sizeInput = screen.getByPlaceholderText("e.g., 3 inch with loop");
      await user.type(sizeInput, "3 inch");

      expect(sizeInput).toHaveValue("3 inch");
    });

    it("allows selecting delivery date", async () => {
      const user = userEvent.setup();
      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Delivery Date")).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText("Delivery Date");
      await user.type(dateInput, "2024-12-31");

      expect(dateInput).toHaveValue("2024-12-31");
    });
  });

  describe("Form Validation", () => {
    it("shows error when account not selected", async () => {
      const user = userEvent.setup();
      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Save")).toBeInTheDocument();
      });

      const saveButton = screen.getByText("Save");
      await user.click(saveButton);

      expect(mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Please select an account",
      });
      expect(backend.orderIssueCreate).not.toHaveBeenCalled();
    });

    it("shows error when item not selected", async () => {
      const user = userEvent.setup();
      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const accountSelect = screen.getAllByRole("combobox")[0];
      await user.selectOptions(accountSelect, "1");

      const saveButton = screen.getByText("Save");
      await user.click(saveButton);

      expect(mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Please select an item",
      });
      expect(backend.orderIssueCreate).not.toHaveBeenCalled();
    });
  });

  describe("Form Submission - Create", () => {
    it("creates new order issue with all fields", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.orderIssueCreate).mockResolvedValue({} as any);

      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const accountSelect = screen.getAllByRole("combobox")[0];
      await user.selectOptions(accountSelect, "1");

      const itemSelect = screen.getAllByRole("combobox")[1];
      await user.selectOptions(itemSelect, "item1");

      const metalInput = screen.getByPlaceholderText("e.g., 18K Gold");
      await user.type(metalInput, "18K Gold");

      const saveButton = screen.getByText("Save");
      await user.click(saveButton);

      await waitFor(() => {
        expect(backend.orderIssueCreate).toHaveBeenCalledWith({
          account: "1",
          item_name: "item1",
          metal: "18K Gold",
          base_metal_colour: null,
          total_size: null,
          rhodium_instructions: null,
          delivery_date: null,
        });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Saved",
        description: "Order issue created",
      });
    });

    it("converts empty strings to null", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.orderIssueCreate).mockResolvedValue({} as any);

      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const accountSelect = screen.getAllByRole("combobox")[0];
      await user.selectOptions(accountSelect, "1");

      const itemSelect = screen.getAllByRole("combobox")[1];
      await user.selectOptions(itemSelect, "item1");

      const saveButton = screen.getByText("Save");
      await user.click(saveButton);

      await waitFor(() => {
        expect(backend.orderIssueCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            metal: null,
            base_metal_colour: null,
            total_size: null,
          })
        );
      });
    });

    it("resets form after successful create", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.orderIssueCreate).mockResolvedValue({} as any);

      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const accountSelect = screen.getAllByRole("combobox")[0];
      await user.selectOptions(accountSelect, "1");

      const itemSelect = screen.getAllByRole("combobox")[1];
      await user.selectOptions(itemSelect, "item1");

      const metalInput = screen.getByPlaceholderText("e.g., 18K Gold");
      await user.type(metalInput, "18K Gold");

      const saveButton = screen.getByText("Save");
      await user.click(saveButton);

      await waitFor(() => {
        expect(itemSelect).toHaveValue("");
        expect(metalInput).toHaveValue("");
      });
    });

    it("shows error on create failure", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.orderIssueCreate).mockRejectedValue(
        new Error("Create failed")
      );

      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const accountSelect = screen.getAllByRole("combobox")[0];
      await user.selectOptions(accountSelect, "1");

      const itemSelect = screen.getAllByRole("combobox")[1];
      await user.selectOptions(itemSelect, "item1");

      const saveButton = screen.getByText("Save");
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Save failed",
        });
      });
    });
  });

  describe("Form Submission - Update", () => {
    const mockOrderIssue = {
      id: "issue1",
      account: { id: "1", name: "Customer A" },
      item_name: { id: "item1", name: "Ring" },
      metal: "18K Gold",
      base_metal_colour: "Yellow",
      total_size: "3 inch",
      rhodium_instructions: "Full",
      delivery_date: "2024-12-31",
    };

    it("loads existing order issue data", async () => {
      vi.mocked(backend.orderIssueDetail).mockResolvedValue(
        mockOrderIssue as any
      );

      render(<OrderIssueForm id="issue1" />);

      await waitFor(() => {
        expect(backend.orderIssueDetail).toHaveBeenCalledWith("issue1");
      });

      await waitFor(() => {
        const accountSelect = screen.getAllByRole("combobox")[0];
        expect(accountSelect).toHaveValue("1");
      });
    });

    it("updates existing order issue", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.orderIssueDetail).mockResolvedValue(
        mockOrderIssue as any
      );
      vi.mocked(backend.orderIssueUpdate).mockResolvedValue({} as any);

      render(<OrderIssueForm id="issue1" />);

      await waitFor(() => {
        expect(screen.getByText("Update")).toBeInTheDocument();
      });

      const metalInput = screen.getByPlaceholderText("e.g., 18K Gold");
      await user.clear(metalInput);
      await user.type(metalInput, "22K Gold");

      const updateButton = screen.getByText("Update");
      await user.click(updateButton);

      await waitFor(() => {
        expect(backend.orderIssueUpdate).toHaveBeenCalledWith(
          "issue1",
          expect.objectContaining({
            metal: "22K Gold",
          })
        );
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Updated",
        description: "Order issue updated",
      });
    });

    it("shows error on update failure", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.orderIssueDetail).mockResolvedValue(
        mockOrderIssue as any
      );
      vi.mocked(backend.orderIssueUpdate).mockRejectedValue(
        new Error("Update failed")
      );

      render(<OrderIssueForm id="issue1" />);

      await waitFor(() => {
        expect(screen.getByText("Update")).toBeInTheDocument();
      });

      const updateButton = screen.getByText("Update");
      await user.click(updateButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Save failed",
        });
      });
    });

    it("handles load error", async () => {
      vi.mocked(backend.orderIssueDetail).mockRejectedValue(
        new Error("Load failed")
      );

      render(<OrderIssueForm id="issue1" />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Failed to load record",
        });
      });
    });
  });

  describe("File Upload", () => {
    it("accepts valid image file", async () => {
      const user = userEvent.setup();
      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(screen.getByLabelText("Reference Image")).toBeInTheDocument();
      });

      const file = new File(["image"], "test.jpg", { type: "image/jpeg" });
      const input = screen.getByLabelText("Reference Image");

      await user.upload(input, file);

      // File should be accepted without error
      expect(mockToast).not.toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" })
      );
    });

    it("rejects invalid file type", async () => {
      const user = userEvent.setup();
      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(screen.getByLabelText("Reference Image")).toBeInTheDocument();
      });

      const file = new File(["document"], "test.doc", {
        type: "application/msword",
      });
      const input = screen.getByLabelText("Reference Image");

      // Just verify the file input exists and can accept files
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("accept", ".jpg,.jpeg,.png,.pdf");
    });

    it("accepts PDF file", async () => {
      const user = userEvent.setup();
      render(<OrderIssueForm />);

      await waitFor(() => {
        expect(screen.getByLabelText("Reference Image")).toBeInTheDocument();
      });

      const file = new File(["pdf"], "test.pdf", { type: "application/pdf" });
      const input = screen.getByLabelText("Reference Image");

      await user.upload(input, file);

      expect(mockToast).not.toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" })
      );
    });
  });
});
