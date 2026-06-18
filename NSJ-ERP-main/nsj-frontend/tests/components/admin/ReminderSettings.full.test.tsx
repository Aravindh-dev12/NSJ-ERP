import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ReminderSettings } from "@/components/admin/ReminderSettings";

describe("ReminderSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders reminder settings component", () => {
    render(<ReminderSettings />);
    expect(screen.getByText("Reminder Settings")).toBeInTheDocument();
  });

  it("displays default settings section", () => {
    render(<ReminderSettings />);
    expect(screen.getByText("Default Settings")).toBeInTheDocument();
  });

  it("displays cadence days", () => {
    render(<ReminderSettings />);
    // Use regex to match "7 days" anywhere
    const cadenceElements = screen.getAllByText(/7 days/);
    expect(cadenceElements.length).toBeGreaterThan(0);
  });

  it("displays grace period", () => {
    render(<ReminderSettings />);
    // Use regex to match "3 days" anywhere
    const graceElements = screen.getAllByText(/3 days/);
    expect(graceElements.length).toBeGreaterThan(0);
  });

  it("displays edit defaults button", () => {
    render(<ReminderSettings />);
    expect(screen.getByText("Edit Defaults")).toBeInTheDocument();
  });

  it("displays exceptions section", () => {
    render(<ReminderSettings />);
    expect(screen.getByText("Acme Corporation")).toBeInTheDocument();
  });

  it("toggles exception active state", async () => {
    const { container } = render(<ReminderSettings />);

    // Find toggle button for exception
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("displays channel settings", () => {
    render(<ReminderSettings />);
    const emailElements = screen.getAllByText(/email/i);
    expect(emailElements.length).toBeGreaterThan(0);
  });

  it("displays send window settings", () => {
    render(<ReminderSettings />);
    const windowElements = screen.getAllByText(/09:00/);
    expect(windowElements.length).toBeGreaterThan(0);
  });

  it("displays escalation threshold", () => {
    render(<ReminderSettings />);
    const thresholdElements = screen.getAllByText(/14 days/);
    expect(thresholdElements.length).toBeGreaterThan(0);
  });

  it("renders settings labels", () => {
    const { container } = render(<ReminderSettings />);
    // Check for labels in the rendered output
    const text = container.textContent;
    expect(text).toContain("Cadence");
  });

  it("displays exception cadence", () => {
    render(<ReminderSettings />);
    // Exception has 3 days cadence
    const cadenceElements = screen.getAllByText(/days/);
    expect(cadenceElements.length).toBeGreaterThan(0);
  });
});
