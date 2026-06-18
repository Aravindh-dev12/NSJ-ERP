import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TemplateManagement } from "@/components/admin/TemplateManagement";

describe("TemplateManagement", () => {
  it("renders without crashing", () => {
    render(<TemplateManagement />);
    // Look for a heading or unique text
    expect(
      screen.getByRole("heading", { name: /template management/i })
    ).toBeInTheDocument();
  });
});
