import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { InvoiceManagement } from "@/components/admin/InvoiceManagement";

// Basic smoke test for rendering

describe("InvoiceManagement", () => {
  it("renders without crashing", () => {
    render(<InvoiceManagement />);
    // Look for the main heading
    expect(
      screen.getByRole("heading", { name: /invoice management/i })
    ).toBeInTheDocument();
  });
});
