import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InvoiceUploadModal } from "@/components/InvoiceUploadModal";
import { backend } from "@/lib/backend";

// Mock the backend module
vi.mock("@/lib/backend", () => ({
  backend: {
    uploadSalesRecords: vi.fn(),
  },
}));

describe("InvoiceUploadModal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the upload modal with correct title", () => {
    render(<InvoiceUploadModal onClose={mockOnClose} />);
    expect(screen.getByText("Import Sales Records")).toBeInTheDocument();
    expect(
      screen.getByText(/Upload an Excel or CSV file containing sales data/i)
    ).toBeInTheDocument();
  });

  it("displays file type acceptance info", () => {
    render(<InvoiceUploadModal onClose={mockOnClose} />);
    expect(
      screen.getByText(/Accepted formats: \.xlsx, \.xls, \.csv/i)
    ).toBeInTheDocument();
  });

  it("allows file selection via file input", async () => {
    render(<InvoiceUploadModal onClose={mockOnClose} />);

    const file = new File(["invoice data"], "invoices.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const input = screen
      .getByText("Browse Files")
      .closest("label")
      ?.querySelector("input[type='file']");

    expect(input).toBeInTheDocument();

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText("invoices.xlsx")).toBeInTheDocument();
    });
  });

  it("accepts CSV files", async () => {
    render(<InvoiceUploadModal onClose={mockOnClose} />);

    const file = new File(["invoice,amount\nINV-001,1000"], "invoices.csv", {
      type: "text/csv",
    });

    const input = screen
      .getByText("Browse Files")
      .closest("label")
      ?.querySelector("input[type='file']");

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText("invoices.csv")).toBeInTheDocument();
    });
  });

  it("rejects files that are too large", async () => {
    render(<InvoiceUploadModal onClose={mockOnClose} />);

    // Create a file larger than 10MB
    const largeContent = "x".repeat(11 * 1024 * 1024);
    const file = new File([largeContent], "large.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const input = screen
      .getByText("Browse Files")
      .closest("label")
      ?.querySelector("input[type='file']");

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(
        screen.getByText(/File size must be less than 10MB/i)
      ).toBeInTheDocument();
    });
  });

  it("handles successful upload", async () => {
    const mockResponse = { imported: 50, skipped: 2 };
    vi.mocked(backend.uploadSalesRecords).mockResolvedValueOnce(mockResponse);

    render(<InvoiceUploadModal onClose={mockOnClose} />);

    const file = new File(["invoice data"], "invoices.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const input = screen
      .getByText("Browse Files")
      .closest("label")
      ?.querySelector("input[type='file']");

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText("invoices.xlsx")).toBeInTheDocument();
    });

    const uploadButton = screen.getByRole("button", { name: /upload/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Sales records uploaded successfully/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Imported: 50 records/i)).toBeInTheDocument();
      expect(screen.getByText(/Skipped: 2 records/i)).toBeInTheDocument();
    });

    // Should auto-close after success
    await waitFor(
      () => {
        expect(mockOnClose).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it("handles upload errors", async () => {
    vi.mocked(backend.uploadSalesRecords).mockRejectedValueOnce(
      new Error("Network error")
    );

    render(<InvoiceUploadModal onClose={mockOnClose} />);

    const file = new File(["invoice data"], "invoices.csv", {
      type: "text/csv",
    });

    const input = screen
      .getByText("Browse Files")
      .closest("label")
      ?.querySelector("input[type='file']");

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText("invoices.csv")).toBeInTheDocument();
    });

    const uploadButton = screen.getByRole("button", { name: /upload/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });

    // Should NOT auto-close on error
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("allows closing the modal with Cancel button", () => {
    render(<InvoiceUploadModal onClose={mockOnClose} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("allows closing the modal with X button", () => {
    render(<InvoiceUploadModal onClose={mockOnClose} />);

    // Find the X button in the header
    const closeButtons = screen.getAllByRole("button");
    const xButton = closeButtons.find((btn) =>
      btn.querySelector("svg")?.classList.contains("lucide-x")
    );

    if (xButton) {
      fireEvent.click(xButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });
});
