import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Select } from "@/components/ui/select";

describe("Select", () => {
  it("renders select element", () => {
    render(
      <Select data-testid="select">
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </Select>
    );

    const select = screen.getByTestId("select");
    expect(select).toBeInTheDocument();
  });

  it("renders options", () => {
    render(
      <Select>
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </Select>
    );

    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();
  });

  it("handles value changes", () => {
    const handleChange = vi.fn();

    render(
      <Select onChange={handleChange} data-testid="select">
        <option value="1">One</option>
        <option value="2">Two</option>
      </Select>
    );

    const select = screen.getByTestId("select");
    fireEvent.change(select, { target: { value: "2" } });

    expect(handleChange).toHaveBeenCalled();
  });

  it("can be disabled", () => {
    render(
      <Select disabled data-testid="select">
        <option value="a">A</option>
      </Select>
    );

    const select = screen.getByTestId("select");
    expect(select).toBeDisabled();
  });

  it("applies custom className", () => {
    render(
      <Select className="custom-select" data-testid="select">
        <option value="a">A</option>
      </Select>
    );

    const select = screen.getByTestId("select");
    expect(select).toHaveClass("custom-select");
  });

  it("displays selected value", () => {
    render(
      <Select value="selected" data-testid="select" onChange={() => {}}>
        <option value="selected">Selected Option</option>
        <option value="other">Other</option>
      </Select>
    );

    const select = screen.getByTestId("select") as HTMLSelectElement;
    expect(select.value).toBe("selected");
  });
});
