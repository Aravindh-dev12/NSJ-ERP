import { render, screen } from "@testing-library/react";
import { ActivityLog } from "@/components/payment/ActivityLog";
describe("ActivityLog", () => {
  it("renders all activity rows and icons", () => {
    render(<ActivityLog />);
    expect(screen.getByText(/Email Reminder Sent/i)).toBeInTheDocument();
    expect(screen.getByText(/WhatsApp Reminder Sent/i)).toBeInTheDocument();
    expect(screen.getByText(/Payment Received/i)).toBeInTheDocument();
    expect(screen.getByText(/Escalation Triggered/i)).toBeInTheDocument();
  });
});
