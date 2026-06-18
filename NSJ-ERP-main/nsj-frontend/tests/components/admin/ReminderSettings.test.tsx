import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ReminderSettings } from "@/components/admin/ReminderSettings";

describe("ReminderSettings", () => {
  it("renders without crashing", () => {
    render(<ReminderSettings />);
    // Look for a heading or unique text
    expect(
      screen.getByRole("heading", { name: /reminder settings/i })
    ).toBeInTheDocument();
  });
});
