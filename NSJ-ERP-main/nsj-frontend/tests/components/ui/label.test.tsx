import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Label } from "@/components/ui/label";

describe("Label component", () => {
  it("renders label element", () => {
    render(<Label>Test Label</Label>);
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("accepts htmlFor prop", () => {
    const { container } = render(<Label htmlFor="input-id">Label</Label>);
    expect(container.querySelector("label")).toHaveAttribute("for", "input-id");
  });

  it("applies custom className", () => {
    const { container } = render(<Label className="custom-class">Label</Label>);
    expect(container.querySelector("label")).toHaveClass("custom-class");
  });

  it("renders with children", () => {
    render(
      <Label>
        <span>Required</span>
        <span>*</span>
      </Label>
    );
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("associates with input via htmlFor", () => {
    const { container } = render(
      <>
        <Label htmlFor="test-input">Test</Label>
        <input id="test-input" />
      </>
    );
    const label = container.querySelector("label");
    expect(label).toHaveAttribute("for", "test-input");
  });

  it("handles empty label", () => {
    const { container } = render(<Label />);
    expect(container.querySelector("label")).toBeInTheDocument();
  });

  it("renders with complex children", () => {
    render(
      <Label>
        <strong>Bold</strong> <em>Italic</em>
      </Label>
    );
    expect(screen.getByText("Bold")).toBeInTheDocument();
    expect(screen.getByText("Italic")).toBeInTheDocument();
  });
});
