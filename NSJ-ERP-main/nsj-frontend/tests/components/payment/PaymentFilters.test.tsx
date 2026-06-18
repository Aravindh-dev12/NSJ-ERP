import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { PaymentFilters } from "@/components/payment/PaymentFilters";
describe("PaymentFilters", () => {
  it("renders all filter inputs and select", () => {
    const filters = {
      vendor: "",
      invoice_no: "",
      status: "all",
      overdue_days: "",
    };
    render(<PaymentFilters filters={filters} onFilterChange={() => {}} />);
    expect(screen.getByPlaceholderText(/Search vendor/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Invoice number/i)).toBeInTheDocument();
    expect(screen.getByText("All Status")).toBeInTheDocument();
  });

  it("calls onFilterChange for all fields", async () => {
    const onFilterChange = vi.fn();
    const filters = {
      vendor: "",
      invoice_no: "",
      status: "all",
      overdue_days: "",
    };
    render(
      <PaymentFilters filters={filters} onFilterChange={onFilterChange} />
    );

    // Vendor
    const vendorInput = screen.getByPlaceholderText(/Search vendor/i);
    await userEvent.type(vendorInput, "Acme");
    expect(onFilterChange).toHaveBeenCalledWith("vendor", expect.any(String));

    // Invoice number
    const invoiceInput = screen.getByPlaceholderText(/Invoice number/i);
    await userEvent.type(invoiceInput, "INV123");
    expect(onFilterChange).toHaveBeenCalledWith(
      "invoice_no",
      expect.any(String)
    );

    // Status select
    const statusSelect = screen.getByDisplayValue("All Status");
    await userEvent.selectOptions(statusSelect, "overdue");
    expect(onFilterChange).toHaveBeenCalledWith("status", "overdue");

    // Overdue days
    const overdueInput = screen.getByPlaceholderText(/Overdue days/i);
    await userEvent.type(overdueInput, "5");
    expect(onFilterChange).toHaveBeenCalledWith(
      "overdue_days",
      expect.any(String)
    );
  });
});
