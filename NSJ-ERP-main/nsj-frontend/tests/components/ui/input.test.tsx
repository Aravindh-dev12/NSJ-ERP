import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { Input } from "@/components/ui/input";

describe("Input component", () => {
  it("renders input element", () => {
    const { container } = render(<Input />);
    expect(container.querySelector("input")).toBeInTheDocument();
  });

  it("accepts placeholder prop", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("accepts type prop", () => {
    const { container } = render(<Input type="email" />);
    expect(container.querySelector('input[type="email"]')).toBeInTheDocument();
  });

  it("accepts disabled prop", () => {
    const { container } = render(<Input disabled />);
    expect(container.querySelector("input")).toBeDisabled();
  });

  it("accepts value prop", () => {
    const { container } = render(<Input value="test value" readOnly />);
    expect(container.querySelector("input")).toHaveValue("test value");
  });

  it("handles onChange event", () => {
    const handleChange = vi.fn();
    const { container } = render(<Input onChange={handleChange} />);
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "new value" } });
    expect(handleChange).toHaveBeenCalled();
  });

  it("applies custom className", () => {
    const { container } = render(<Input className="custom-class" />);
    expect(container.querySelector("input")).toHaveClass("custom-class");
  });

  it("handles focus event", () => {
    const handleFocus = vi.fn();
    const { container } = render(<Input onFocus={handleFocus} />);
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalled();
  });

  it("handles blur event", () => {
    const handleBlur = vi.fn();
    const { container } = render(<Input onBlur={handleBlur} />);
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalled();
  });

  it("handles different input types", () => {
    const types = ["text", "email", "password", "number", "date"];
    types.forEach((type) => {
      const { container } = render(<Input type={type as any} />);
      expect(
        container.querySelector(`input[type="${type}"]`)
      ).toBeInTheDocument();
    });
  });
});
