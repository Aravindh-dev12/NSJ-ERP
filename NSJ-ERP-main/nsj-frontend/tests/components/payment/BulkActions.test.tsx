import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { BulkActions } from "@/components/payment/BulkActions";
describe("BulkActions", () => {
  it("renders selected count and all action buttons", () => {
    render(<BulkActions selectedCount={2} onScheduleBuilder={() => {}} />);
    expect(screen.getByText(/2 invoices selected/i)).toBeInTheDocument();
    expect(screen.getByText(/Send Reminder/i)).toBeInTheDocument();
    expect(screen.getByText(/WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByText(/Snooze/i)).toBeInTheDocument();
    expect(screen.getByText(/Escalate/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule/i)).toBeInTheDocument();
  });
  it("calls onScheduleBuilder when Schedule is clicked", async () => {
    const onScheduleBuilder = vi.fn();
    render(
      <BulkActions selectedCount={1} onScheduleBuilder={onScheduleBuilder} />
    );
    await userEvent.click(screen.getByText(/Schedule/i));
    expect(onScheduleBuilder).toHaveBeenCalled();
  });
});
