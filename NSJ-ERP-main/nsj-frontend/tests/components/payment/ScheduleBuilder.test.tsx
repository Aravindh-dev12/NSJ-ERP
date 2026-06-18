import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ScheduleBuilder } from "@/components/payment/ScheduleBuilder";
describe("ScheduleBuilder", () => {
  it("renders form and calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    render(<ScheduleBuilder onClose={onClose} />);
    expect(screen.getByText(/Schedule Builder/i)).toBeInTheDocument();
    // Find the close button by its aria-label or title if available, otherwise by its SVG icon
    const closeButton =
      screen.getAllByRole("button").find((btn) => {
        return (
          btn.getAttribute("aria-label") === "Close" ||
          btn.title === "Close" ||
          btn.innerHTML.includes("lucide-x")
        );
      }) || screen.getAllByRole("button")[0];
    await userEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it("submits the form and closes", async () => {
    const onClose = vi.fn();
    render(<ScheduleBuilder onClose={onClose} />);
    // Fill out all number inputs (spinbutton role)
    const numberInputs = screen.getAllByRole("spinbutton");
    // cadence_days, grace_days, escalation_threshold_days
    await userEvent.clear(numberInputs[0]);
    await userEvent.type(numberInputs[0], "10");
    expect((numberInputs[0] as HTMLInputElement).value).toBe("10");

    await userEvent.clear(numberInputs[1]);
    await userEvent.type(numberInputs[1], "5");
    expect((numberInputs[1] as HTMLInputElement).value).toBe("5");

    await userEvent.clear(numberInputs[2]);
    await userEvent.type(numberInputs[2], "21");
    expect((numberInputs[2] as HTMLInputElement).value).toBe("21");

    // Channels (checkboxes)
    const checkboxes = screen.getAllByRole("checkbox");
    if (checkboxes.length > 1) {
      await userEvent.click(checkboxes[1]); // toggle WhatsApp
      expect((checkboxes[1] as HTMLInputElement).checked).toBe(true);
    }

    // Time inputs (textbox role, type="time")
    const timeInputs = screen.getAllByDisplayValue(/\d{2}:\d{2}/);
    await userEvent.clear(timeInputs[0]);
    await userEvent.type(timeInputs[0], "08:00");
    expect((timeInputs[0] as HTMLInputElement).value).toBe("08:00");

    await userEvent.clear(timeInputs[1]);
    await userEvent.type(timeInputs[1], "18:00");
    expect((timeInputs[1] as HTMLInputElement).value).toBe("18:00");

    // Test recipient
    const testRecipientInput = screen.getByPlaceholderText(/test@example.com/i);
    await userEvent.type(testRecipientInput, "test@demo.com");
    expect((testRecipientInput as HTMLInputElement).value).toBe(
      "test@demo.com"
    );

    // Submit form
    const submitBtn = screen.getByRole("button", { name: /Create Schedule/i });
    await userEvent.click(submitBtn);
    // onClose should be called
    expect(onClose).toHaveBeenCalled();
  }, 15000); // Increase timeout to 15 seconds for this complex test
});
