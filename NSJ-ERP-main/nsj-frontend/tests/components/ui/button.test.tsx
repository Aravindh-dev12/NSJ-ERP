import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button component", () => {
  it("renders button element", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("handles click event", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText("Click"));
    expect(handleClick).toHaveBeenCalled();
  });

  it("accepts disabled prop", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText("Disabled")).toBeDisabled();
  });

  it("applies variant styles", () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    expect(container.querySelector("button")).toHaveClass("border");
  });

  it("applies size styles", () => {
    const { container } = render(<Button size="lg">Large</Button>);
    expect(container.querySelector("button")).toHaveClass("h-11");
  });

  it("applies custom className", () => {
    const { container } = render(<Button className="custom">Custom</Button>);
    expect(container.querySelector("button")).toHaveClass("custom");
  });

  it("renders with children", () => {
    render(
      <Button>
        <span>Icon</span>
        <span>Text</span>
      </Button>
    );
    expect(screen.getByText("Icon")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
  });

  it("handles different variants", () => {
    const variants = [
      "default",
      "secondary",
      "destructive",
      "outline",
      "ghost",
      "link",
    ];
    variants.forEach((variant) => {
      const { container } = render(
        <Button variant={variant as any}>{variant}</Button>
      );
      expect(container.querySelector("button")).toBeInTheDocument();
    });
  });

  it("handles different sizes", () => {
    const sizes = ["sm", "default", "lg"];
    sizes.forEach((size) => {
      const { container } = render(<Button size={size as any}>{size}</Button>);
      expect(container.querySelector("button")).toBeInTheDocument();
    });
  });

  it("handles asChild prop", () => {
    const { container } = render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    expect(container.querySelector("a")).toBeInTheDocument();
  });
});
