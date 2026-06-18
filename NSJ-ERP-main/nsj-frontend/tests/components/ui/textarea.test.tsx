import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Textarea } from "@/components/ui/textarea";

describe("Textarea", () => {
  it("renders textarea element", () => {
    render(<Textarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Textarea className="custom-class" data-testid="textarea" />);
    const textarea = screen.getByTestId("textarea");
    expect(textarea).toHaveClass("custom-class");
  });

  it("handles value changes", () => {
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} data-testid="textarea" />);

    const textarea = screen.getByTestId("textarea");
    fireEvent.change(textarea, { target: { value: "New text" } });

    expect(handleChange).toHaveBeenCalled();
  });

  it("displays controlled value", () => {
    render(
      <Textarea value="Controlled value" readOnly data-testid="textarea" />
    );
    const textarea = screen.getByTestId("textarea");
    expect(textarea).toHaveValue("Controlled value");
  });

  it("can be disabled", () => {
    render(<Textarea disabled data-testid="textarea" />);
    const textarea = screen.getByTestId("textarea");
    expect(textarea).toBeDisabled();
  });

  it("supports rows attribute", () => {
    render(<Textarea rows={5} data-testid="textarea" />);
    const textarea = screen.getByTestId("textarea");
    expect(textarea).toHaveAttribute("rows", "5");
  });

  it("supports required attribute", () => {
    render(<Textarea required data-testid="textarea" />);
    const textarea = screen.getByTestId("textarea");
    expect(textarea).toBeRequired();
  });

  it("forwards ref correctly", () => {
    const ref = vi.fn();
    render(<Textarea ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it("applies default styling classes", () => {
    render(<Textarea data-testid="textarea" />);
    const textarea = screen.getByTestId("textarea");
    expect(textarea).toHaveClass("flex");
    expect(textarea).toHaveClass("min-h-[80px]");
  });
});
