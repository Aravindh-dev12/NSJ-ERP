import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StakeholderManagement } from "@/components/admin/StakeholderManagement";

describe("StakeholderManagement", () => {
  it("renders without crashing", () => {
    render(<StakeholderManagement />);
    expect(
      screen.getByRole("heading", { name: /stakeholder management/i })
    ).toBeInTheDocument();
  });

  it("renders edit and delete buttons for each stakeholder and clicks them", async () => {
    render(<StakeholderManagement />);
    const editButtons = screen.getAllByLabelText(/edit stakeholder/i);
    const deleteButtons = screen.getAllByLabelText(/delete stakeholder/i);
    expect(editButtons.length).toBe(2);
    expect(deleteButtons.length).toBe(2);
    for (const btn of editButtons) {
      await btn.click();
    }
    for (const btn of deleteButtons) {
      await btn.click();
    }
  });
});
