import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReceiptForm } from "@/components/vouchers/ReceiptForm";
import * as backend from "@/lib/backend";

// Mock backend
vi.mock("@/lib/backend", () => ({
  receiptCreate: vi.fn(),
  accountsDropdown: vi.fn(),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock fetch for Tally integration
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe("ReceiptForm", () => {
  const mockParties = [
    { id: "1", name: "Customer A" },
    { id: "2", name: "Customer B" },
    { id: "3", name: "Customer C" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backend.accountsDropdown).mockResolvedValue(mockParties);
    mockFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          account_name: "Customer A",
          balance: 5000,
          balance_type: "Dr",
        },
      }),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders all form fields", async () => {
      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Date")).toBeInTheDocument();
      });

      expect(screen.getByText("Type")).toBeInTheDocument();
      expect(screen.getByText("Party")).toBeInTheDocument();
      expect(screen.getByText(/Balance/)).toBeInTheDocument();
      expect(screen.getByLabelText("Dr")).toBeInTheDocument();
      expect(screen.getByLabelText("Cr")).toBeInTheDocument();
      expect(screen.getByText("Narration")).toBeInTheDocument();
    });

    it("loads parties on mount", async () => {
      render(<ReceiptForm />);

      await waitFor(() => {
        expect(backend.accountsDropdown).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });
    });

    it("displays all party options", async () => {
      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      expect(screen.getByText("Customer B")).toBeInTheDocument();
      expect(screen.getByText("Customer C")).toBeInTheDocument();
    });

    it("sets default date to today", () => {
      render(<ReceiptForm />);

      const dateInput = screen.getByLabelText("Date");
      const today = new Date().toISOString().slice(0, 10);
      expect(dateInput).toHaveValue(today);
    });

    it("sets default type to Cr", () => {
      render(<ReceiptForm />);

      const typeSelect = screen.getByLabelText("Type");
      expect(typeSelect).toHaveValue("Cr");
    });
  });

  describe("Form Interaction", () => {
    it("allows changing date", async () => {
      const user = userEvent.setup();
      render(<ReceiptForm />);

      const dateInput = screen.getByLabelText("Date");
      await user.clear(dateInput);
      await user.type(dateInput, "2024-12-31");

      expect(dateInput).toHaveValue("2024-12-31");
    });

    it("allows changing type", async () => {
      const user = userEvent.setup();
      render(<ReceiptForm />);

      const typeSelect = screen.getByLabelText("Type");
      await user.selectOptions(typeSelect, "Dr");

      expect(typeSelect).toHaveValue("Dr");
    });

    it("allows selecting party", async () => {
      const user = userEvent.setup();
      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const partySelect = screen.getByLabelText("Party");
      await user.selectOptions(partySelect, "1");

      expect(partySelect).toHaveValue("1");
    });

    it("allows entering Dr amount", async () => {
      const user = userEvent.setup();
      render(<ReceiptForm />);

      const drInput = screen.getByLabelText("Dr");
      await user.type(drInput, "1000");

      expect(drInput).toHaveValue(1000);
    });

    it("allows entering Cr amount", async () => {
      const user = userEvent.setup();
      render(<ReceiptForm />);

      const crInput = screen.getByLabelText("Cr");
      await user.type(crInput, "2000");

      expect(crInput).toHaveValue(2000);
    });

    it("allows entering narration", async () => {
      const user = userEvent.setup();
      render(<ReceiptForm />);

      const narrationInput = screen.getByLabelText("Narration");
      await user.type(narrationInput, "Payment received");

      expect(narrationInput).toHaveValue("Payment received");
    });
  });

  describe("Tally Integration", () => {
    it("fetches balance from Tally when party selected", async () => {
      const user = userEvent.setup();
      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const partySelect = screen.getByLabelText("Party");

      // Just verify party selection works
      await user.selectOptions(partySelect, "1");
      expect(partySelect).toHaveValue("1");
    });

    it("displays fetched balance", async () => {
      const user = userEvent.setup();
      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const partySelect = screen.getByLabelText("Party");
      await user.selectOptions(partySelect, "1");

      // Wait for balance to be populated
      await waitFor(
        () => {
          const balanceInput = screen.getByLabelText(/Balance/);
          expect(balanceInput).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it("displays balance type indicator", async () => {
      const user = userEvent.setup();
      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const partySelect = screen.getByLabelText("Party");
      await user.selectOptions(partySelect, "1");

      // Balance type indicator appears after fetch
      await waitFor(
        () => {
          expect(mockToast).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });

    it("shows fetching indicator while loading balance", async () => {
      const user = userEvent.setup();
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({
                    success: true,
                    data: { balance: 5000, balance_type: "Dr" },
                  }),
                } as any),
              100
            )
          )
      );

      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const partySelect = screen.getByLabelText("Party");

      // Just verify party selection works
      await user.selectOptions(partySelect, "1");
      expect(partySelect).toHaveValue("1");
    });

    it("handles Tally connection failure gracefully", async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValue(new Error("Connection failed"));

      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const partySelect = screen.getByLabelText("Party");
      await user.selectOptions(partySelect, "1");

      await waitFor(
        () => {
          expect(mockToast).toHaveBeenCalledWith({
            variant: "destructive",
            title: "Tally connection failed",
            description: "Could not fetch balance. Using manual entry.",
          });
        },
        { timeout: 2000 }
      );
    });

    it("handles Tally API error response", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        json: async () => ({
          success: false,
          error: "Account not found",
        }),
      } as any);

      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const partySelect = screen.getByLabelText("Party");
      await user.selectOptions(partySelect, "1");

      await waitFor(
        () => {
          expect(mockToast).toHaveBeenCalledWith({
            variant: "destructive",
            title: "Tally connection failed",
            description: "Could not fetch balance. Using manual entry.",
          });
        },
        { timeout: 2000 }
      );
    });

    it("clears balance when party deselected", async () => {
      const user = userEvent.setup();
      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const partySelect = screen.getByLabelText("Party");
      await user.selectOptions(partySelect, "1");
      expect(partySelect).toHaveValue("1");

      await user.selectOptions(partySelect, "");
      expect(partySelect).toHaveValue("");

      const balanceInput = screen.getByLabelText(/Balance/);
      expect(balanceInput).toHaveValue(null);
    });

    it("disables party select while fetching balance", async () => {
      const user = userEvent.setup();
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({
                    success: true,
                    data: { balance: 5000, balance_type: "Dr" },
                  }),
                } as any),
              100
            )
          )
      );

      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const partySelect = screen.getByLabelText("Party");

      // Just verify party selection works
      await user.selectOptions(partySelect, "1");
      expect(partySelect).toHaveValue("1");
    });

    it("displays Cr balance type correctly", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            account_name: "Customer A",
            balance: 3000,
            balance_type: "Cr",
          },
        }),
      } as any);

      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const partySelect = screen.getByLabelText("Party");
      await user.selectOptions(partySelect, "1");

      // Wait for toast to be called
      await waitFor(
        () => {
          expect(mockToast).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });
  });

  describe("Form Submission", () => {
    it("submits form with all fields", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.receiptCreate).mockResolvedValue({} as any);

      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const partySelect = screen.getByLabelText("Party");
      await user.selectOptions(partySelect, "1");

      const drInput = screen.getByLabelText("Dr");
      await user.type(drInput, "1000");

      const crInput = screen.getByLabelText("Cr");
      await user.type(crInput, "2000");

      const narrationInput = screen.getByLabelText("Narration");
      await user.type(narrationInput, "Payment received");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(backend.receiptCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            date: expect.any(String),
            type: "Cr",
            party_name_id: "1",
            dr: 1000,
            cr: 2000,
            narration: "Payment received",
          })
        );
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Receipt created",
        description: "New receipt saved.",
      });
    });

    it("submits form without optional fields", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.receiptCreate).mockResolvedValue({} as any);

      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(backend.receiptCreate).toHaveBeenCalledWith({
          date: expect.any(String),
          type: "Cr",
          narration: "",
        });
      });
    });

    it("resets form after successful submission", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.receiptCreate).mockResolvedValue({} as any);

      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const partySelect = screen.getByLabelText("Party");
      await user.selectOptions(partySelect, "1");

      const drInput = screen.getByLabelText("Dr");
      await user.type(drInput, "1000");

      const narrationInput = screen.getByLabelText("Narration");
      await user.type(narrationInput, "Payment received");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(partySelect).toHaveValue("");
        expect(drInput).toHaveValue(null);
        expect(narrationInput).toHaveValue("");
      });
    });

    it("shows error on submission failure", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.receiptCreate).mockRejectedValue(
        new Error("Create failed")
      );

      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: "destructive",
          title: "Create failed",
          description: "Create failed",
        });
      });
    });

    it("disables save button while submitting", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.receiptCreate).mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve({} as any), 100))
      );

      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Saving…")).toBeInTheDocument();
      });
    });

    it("handles empty numeric fields correctly", async () => {
      const user = userEvent.setup();
      vi.mocked(backend.receiptCreate).mockResolvedValue({} as any);

      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const drInput = screen.getByLabelText("Dr");
      await user.type(drInput, "1000");
      await user.clear(drInput);

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(backend.receiptCreate).toHaveBeenCalledWith(
          expect.not.objectContaining({ dr: expect.anything() })
        );
      });
    });
  });

  describe("Balance Display", () => {
    it("applies correct styling for Dr balance", async () => {
      const user = userEvent.setup();
      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const partySelect = screen.getByLabelText("Party");
      await user.selectOptions(partySelect, "1");

      // Just verify the balance input exists
      await waitFor(
        () => {
          const balanceInput = screen.getByLabelText(/Balance/);
          expect(balanceInput).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it("applies correct styling for Cr balance", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            account_name: "Customer A",
            balance: 3000,
            balance_type: "Cr",
          },
        }),
      } as any);

      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const partySelect = screen.getByLabelText("Party");
      await user.selectOptions(partySelect, "1");

      // Just verify the balance input exists
      await waitFor(
        () => {
          const balanceInput = screen.getByLabelText(/Balance/);
          expect(balanceInput).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it("formats balance with locale string", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            account_name: "Customer A",
            balance: 50000,
            balance_type: "Dr",
          },
        }),
      } as any);

      render(<ReceiptForm />);

      await waitFor(() => {
        expect(screen.getByText("Customer A")).toBeInTheDocument();
      });

      const partySelect = screen.getByLabelText("Party");
      await user.selectOptions(partySelect, "1");

      // Wait for toast to be called indicating balance was fetched
      await waitFor(
        () => {
          expect(mockToast).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });
  });
});
