import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { DashboardRecentOrders } from "@/components/DashboardRecentOrders";
import { backend } from "@/lib/backend";

vi.mock("@/lib/backend", () => ({
  backend: {
    listSalesRecords: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string
    ) {
      super(message);
    }
  },
}));

describe("DashboardRecentOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays loading skeleton initially", () => {
    (backend.listSalesRecords as any).mockImplementation(
      () => new Promise(() => {})
    );
    render(<DashboardRecentOrders />);

    expect(screen.getByText("Recent Orders")).toBeInTheDocument();
    // Check for skeleton loading elements
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("displays sales records in table when data loads", async () => {
    const mockResponse = {
      items: [
        {
          id: "1",
          invoice_number: "INV-001",
          total_amt: 50000,
          invoice_date: "2024-01-15",
          sales_person_name: "John Doe",
        },
        {
          id: "2",
          invoice_number: "INV-002",
          total_amt: 75000,
          invoice_date: "2024-01-16",
          sales_person_name: "Jane Smith",
        },
      ],
      page: 1,
      total_pages: 1,
      total: 2,
    };

    (backend.listSalesRecords as any).mockResolvedValue(mockResponse);

    render(<DashboardRecentOrders />);

    await waitFor(() => {
      expect(screen.getByText("INV-001")).toBeInTheDocument();
      expect(screen.getByText("INV-002")).toBeInTheDocument();
    });

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("displays error message when fetch fails", async () => {
    (backend.listSalesRecords as any).mockRejectedValue(
      new Error("Network error")
    );

    render(<DashboardRecentOrders />);

    await waitFor(() => {
      expect(
        screen.getByText(/unable to load sales records/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("displays 'no records' message when empty array returned", async () => {
    const mockResponse = {
      items: [],
      page: 1,
      total_pages: 1,
      total: 0,
    };

    (backend.listSalesRecords as any).mockResolvedValue(mockResponse);

    render(<DashboardRecentOrders />);

    await waitFor(() => {
      expect(screen.getByText(/no sales records match/i)).toBeInTheDocument();
    });
  });

  it("formats currency values correctly", async () => {
    const mockResponse = {
      items: [
        {
          id: "1",
          invoice_number: "INV-001",
          total_amt: 50000,
        },
      ],
      page: 1,
      total_pages: 1,
      total: 1,
    };

    (backend.listSalesRecords as any).mockResolvedValue(mockResponse);

    render(<DashboardRecentOrders />);

    await waitFor(() => {
      // Should format as Indian currency
      expect(screen.getByText(/50,000/)).toBeInTheDocument();
    });
  });

  it("formats date values correctly", async () => {
    const mockResponse = {
      items: [
        {
          id: "1",
          invoice_date: "2024-01-15",
        },
      ],
      page: 1,
      total_pages: 1,
      total: 1,
    };

    (backend.listSalesRecords as any).mockResolvedValue(mockResponse);

    render(<DashboardRecentOrders />);

    await waitFor(() => {
      // Date should be formatted
      expect(screen.getByText(/Jan/)).toBeInTheDocument();
    });
  });

  it("renders filter inputs", async () => {
    const mockResponse = {
      items: [],
      page: 1,
      total_pages: 1,
      total: 0,
    };

    (backend.listSalesRecords as any).mockResolvedValue(mockResponse);

    render(<DashboardRecentOrders />);

    await waitFor(() => {
      expect(screen.getByLabelText(/minimum amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/maximum amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/salesperson name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    });
  });

  it("applies filters when Go button is clicked", async () => {
    const mockResponse = {
      items: [],
      page: 1,
      total_pages: 1,
      total: 0,
    };

    (backend.listSalesRecords as any).mockResolvedValue(mockResponse);

    render(<DashboardRecentOrders />);

    await waitFor(() => {
      expect(screen.getByLabelText(/minimum amount/i)).toBeInTheDocument();
    });

    const minAmountInput = screen.getByLabelText(/minimum amount/i);
    fireEvent.change(minAmountInput, { target: { value: "10000" } });

    const goButton = screen.getByText("Go");
    fireEvent.click(goButton);

    await waitFor(() => {
      expect(backend.listSalesRecords).toHaveBeenCalledWith(
        expect.objectContaining({
          total_amt_min: 10000,
        })
      );
    });
  });

  it("resets filters when Reset button is clicked", async () => {
    const mockResponse = {
      items: [],
      page: 1,
      total_pages: 1,
      total: 0,
    };

    (backend.listSalesRecords as any).mockResolvedValue(mockResponse);

    render(<DashboardRecentOrders />);

    await waitFor(() => {
      expect(screen.getByLabelText(/minimum amount/i)).toBeInTheDocument();
    });

    const minAmountInput = screen.getByLabelText(
      /minimum amount/i
    ) as HTMLInputElement;
    fireEvent.change(minAmountInput, { target: { value: "10000" } });

    expect(minAmountInput.value).toBe("10000");

    const resetButton = screen.getByText("Reset");
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(minAmountInput.value).toBe("");
    });
  });

  it("displays Load more button when there are more records", async () => {
    const mockResponse = {
      items: [{ id: "1", invoice_number: "INV-001" }],
      page: 1,
      total_pages: 3,
      total: 30,
    };

    (backend.listSalesRecords as any).mockResolvedValue(mockResponse);

    render(<DashboardRecentOrders />);

    await waitFor(() => {
      expect(screen.getByText("Load more")).toBeInTheDocument();
    });
  });

  it("does not display Load more button when all records loaded", async () => {
    const mockResponse = {
      items: [{ id: "1", invoice_number: "INV-001" }],
      page: 1,
      total_pages: 1,
      total: 1,
    };

    (backend.listSalesRecords as any).mockResolvedValue(mockResponse);

    render(<DashboardRecentOrders />);

    await waitFor(() => {
      expect(screen.getByText("INV-001")).toBeInTheDocument();
    });

    expect(screen.queryByText("Load more")).not.toBeInTheDocument();
  });

  it("renders status badge with correct styling", async () => {
    const mockResponse = {
      items: [
        {
          id: "1",
          status: "paid",
        },
      ],
      page: 1,
      total_pages: 1,
      total: 1,
    };

    (backend.listSalesRecords as any).mockResolvedValue(mockResponse);

    render(<DashboardRecentOrders />);

    await waitFor(() => {
      const statusBadge = screen.getByText("PAID");
      expect(statusBadge).toHaveClass("bg-green-100");
      expect(statusBadge).toHaveClass("text-green-700");
    });
  });

  it("displays record count correctly", async () => {
    const mockResponse = {
      items: [
        { id: "1", invoice_number: "INV-001" },
        { id: "2", invoice_number: "INV-002" },
      ],
      page: 1,
      total_pages: 1,
      total: 2,
    };

    (backend.listSalesRecords as any).mockResolvedValue(mockResponse);

    render(<DashboardRecentOrders />);

    await waitFor(() => {
      expect(screen.getByText(/showing 2 of 2 records/i)).toBeInTheDocument();
    });
  });

  it("calls onFiltersChanged callback when filters are applied", async () => {
    const mockResponse = {
      items: [],
      page: 1,
      total_pages: 1,
      total: 0,
    };

    (backend.listSalesRecords as any).mockResolvedValue(mockResponse);

    const onFiltersChanged = vi.fn();
    render(<DashboardRecentOrders onFiltersChanged={onFiltersChanged} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/minimum amount/i)).toBeInTheDocument();
    });

    const minAmountInput = screen.getByLabelText(/minimum amount/i);
    fireEvent.change(minAmountInput, { target: { value: "10000" } });

    const goButton = screen.getByText("Go");
    fireEvent.click(goButton);

    await waitFor(() => {
      expect(onFiltersChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          total_amt_min: 10000,
        })
      );
    });
  });

  it("refetches data when refreshKey changes", async () => {
    const mockResponse = {
      items: [{ id: "1", invoice_number: "INV-001" }],
      page: 1,
      total_pages: 1,
      total: 1,
    };

    (backend.listSalesRecords as any).mockResolvedValue(mockResponse);

    const { rerender } = render(<DashboardRecentOrders refreshKey={1} />);

    await waitFor(() => {
      expect(backend.listSalesRecords).toHaveBeenCalledTimes(1);
    });

    rerender(<DashboardRecentOrders refreshKey={2} />);

    await waitFor(() => {
      expect(backend.listSalesRecords).toHaveBeenCalledTimes(2);
    });
  });
});
