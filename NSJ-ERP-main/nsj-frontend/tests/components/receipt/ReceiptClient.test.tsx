import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReceiptClient from "@/components/receipt/ReceiptClient";
import { API_BASE_URL } from "@/lib/constants";

// Mock next/navigation
const mockBack = vi.fn();
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

// Mock window.print
const mockPrint = vi.fn();
global.window.print = mockPrint;

describe("ReceiptClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("shows loading message while fetching receipt", () => {
      (global.fetch as any).mockImplementation(() => new Promise(() => {}));

      render(<ReceiptClient id="123" />);

      expect(screen.getByText("Loading receipt…")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("displays error message when fetch fails", async () => {
      (global.fetch as any).mockRejectedValue(new Error("Network error"));

      render(<ReceiptClient id="123" />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it("displays unauthorized error for 401 response", async () => {
      (global.fetch as any).mockResolvedValue({
        status: 401,
        ok: false,
      });

      render(<ReceiptClient id="123" />);

      await waitFor(() => {
        expect(screen.getByText(/Unauthorized/i)).toBeInTheDocument();
      });
    });

    it("displays server error for non-ok response", async () => {
      (global.fetch as any).mockResolvedValue({
        status: 500,
        ok: false,
        text: async () => "Internal Server Error",
      });

      render(<ReceiptClient id="123" />);

      await waitFor(() => {
        expect(screen.getByText(/Server error: 500/i)).toBeInTheDocument();
      });
    });
  });

  describe("Receipt Display", () => {
    const mockReceiptData = {
      order: {
        bill_no: "BILL-001",
        date: "2024-01-15",
        account: "Test Account",
        item_name: "Gold Ring",
        design: "Classic",
        job_no: "JOB-001",
        series: "A",
        stamp: "22K",
        gold_rate: 5000,
        base_metal: "Gold",
        size: "7",
        number_of_pieces: 1,
        estimated_gross_weight: 10.5,
        estimated_gold_weight: 9.8,
        estimated_diamond_weight: 0.5,
        tunch_percent: 91.6,
        average_diamond_rate: 3000,
        gemstone_stone_weight: 0.2,
        craftsmanship_fee: 500,
        advance_payment_received: 1000,
      },
      company: {
        name: "Niti Shah Jewels",
      },
    };

    beforeEach(() => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockReceiptData,
      });
    });

    it("renders receipt data successfully", async () => {
      render(<ReceiptClient id="123" />);

      await waitFor(() => {
        expect(screen.getByText("Niti Shah Jewels")).toBeInTheDocument();
      });
    });

    it("displays company contact information", async () => {
      render(<ReceiptClient id="123" />);

      await waitFor(() => {
        expect(screen.getByText(/\+919987520906/)).toBeInTheDocument();
        expect(
          screen.getByText(/hello@nitishahjewels.com/)
        ).toBeInTheDocument();
      });
    });

    it("displays order fields in table", async () => {
      render(<ReceiptClient id="123" />);

      await waitFor(() => {
        expect(screen.getByText("Gold Ring")).toBeInTheDocument();
        expect(screen.getByText("Classic")).toBeInTheDocument();
        expect(screen.getByText("22K")).toBeInTheDocument();
      });
    });

    it("formats numeric values correctly", async () => {
      render(<ReceiptClient id="123" />);

      await waitFor(() => {
        expect(screen.getByText("10.5")).toBeInTheDocument();
        expect(screen.getByText("9.8")).toBeInTheDocument();
      });
    });
  });

  describe("Attachment Display", () => {
    it("displays PDF attachment link", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          order: {
            upload_file: "https://example.com/file.pdf",
          },
        }),
      });

      render(<ReceiptClient id="123" />);

      await waitFor(() => {
        const link = screen.getByText("Open PDF");
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "https://example.com/file.pdf");
      });
    });

    it("displays image attachment", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          order: {
            upload_file: "https://example.com/image.jpg",
          },
        }),
      });

      render(<ReceiptClient id="123" />);

      await waitFor(() => {
        const img = screen.getByAltText("attachment");
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", "https://example.com/image.jpg");
      });
    });
  });

  describe("User Actions", () => {
    beforeEach(() => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ order: {}, company: {} }),
      });
    });

    it("calls router.back when Close button is clicked", async () => {
      const user = userEvent.setup();
      render(<ReceiptClient id="123" />);

      await waitFor(() => {
        expect(screen.getByText("Close")).toBeInTheDocument();
      });

      const closeButton = screen.getByText("Close");
      await user.click(closeButton);

      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it("calls window.print when Print button is clicked", async () => {
      const user = userEvent.setup();
      render(<ReceiptClient id="123" />);

      await waitFor(() => {
        expect(screen.getByText("Print")).toBeInTheDocument();
      });

      const printButton = screen.getByText("Print");
      await user.click(printButton);

      expect(mockPrint).toHaveBeenCalledTimes(1);
    });
  });

  describe("Logo Display", () => {
    it("checks for custom logo image", async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes("nitishah-script.png")) {
          return Promise.resolve({ ok: true, status: 200 });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ order: {}, company: {} }),
        });
      });

      render(<ReceiptClient id="123" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/images/nitishah-script.png",
          { method: "HEAD" }
        );
      });
    });
  });

  describe("API Integration", () => {
    it("fetches receipt from correct endpoint", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ order: {}, company: {} }),
      });

      render(<ReceiptClient id="456" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/vouchers/456/receipt/`,
          expect.objectContaining({
            credentials: "include",
            headers: { Accept: "application/json" },
          })
        );
      });
    });
  });
});
