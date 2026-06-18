import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { PaymentTable } from "@/components/payment/PaymentTable";
describe("PaymentTable", () => {
  it("renders invoice rows and selection checkboxes", () => {
    render(<PaymentTable selectedInvoices={[]} onSelectionChange={() => {}} />);
    expect(screen.getByText(/Acme Corp/i)).toBeInTheDocument();
    expect(screen.getByText(/TechStart Ltd/i)).toBeInTheDocument();
    expect(screen.getByText(/Global Solutions Inc/i)).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(1);
  });
  it("calls onSelectionChange when a row is selected", async () => {
    const onSelectionChange = vi.fn();
    render(
      <PaymentTable
        selectedInvoices={[]}
        onSelectionChange={onSelectionChange}
      />
    );
    const checkboxes = screen.getAllByRole("checkbox");
    await userEvent.click(checkboxes[1]);
    expect(onSelectionChange).toHaveBeenCalled();
  });
});
