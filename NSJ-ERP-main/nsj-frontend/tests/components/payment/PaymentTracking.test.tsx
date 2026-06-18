import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PaymentTracking } from "@/components/payment/PaymentTracking";

describe("PaymentTracking", () => {
  it("renders summary cards, filters, table, and activity log", () => {
    render(<PaymentTracking />);
    expect(screen.getByText("Payment Tracking")).toBeInTheDocument();
    // 'Due Soon' appears in multiple places (card, option, badge), so use getAllByText
    expect(screen.getAllByText("Due Soon").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Overdue").length).toBeGreaterThan(0);
    expect(screen.getByText("Outstanding")).toBeInTheDocument();
    expect(
      screen.getByText("Monitor invoices and manage payment reminders")
    ).toBeInTheDocument();
    // Filters and ActivityLog presence (labels or headings)
    expect(screen.getByText(/vendor/i)).toBeInTheDocument();
    expect(screen.getByText(/activity log/i)).toBeInTheDocument();
  });

  it("updates filters when inputs change", async () => {
    render(<PaymentTracking />);
    const vendorInput = screen.getByPlaceholderText(/Search vendor/i);
    await userEvent.type(vendorInput, "Acme");
    expect((vendorInput as HTMLInputElement).value).toBe("Acme");

    const invoiceInput = screen.getByPlaceholderText(/Invoice number/i);
    await userEvent.type(invoiceInput, "INV123");
    expect((invoiceInput as HTMLInputElement).value).toBe("INV123");

    const statusSelect = screen.getByDisplayValue("All Status");
    await userEvent.selectOptions(statusSelect, "overdue");
    expect((statusSelect as HTMLSelectElement).value).toBe("overdue");

    const overdueInput = screen.getByPlaceholderText(/Overdue days/i);
    await userEvent.type(overdueInput, "5");
    expect((overdueInput as HTMLInputElement).value).toBe("5");
  });

  // To improve coverage, you could mock PaymentTable and BulkActions to simulate selection and modal logic.
  // For now, add a placeholder test for BulkActions logic:
  it("does not show BulkActions by default", () => {
    render(<PaymentTracking />);
    expect(screen.queryByText(/bulk actions/i)).not.toBeInTheDocument();
  });
});
