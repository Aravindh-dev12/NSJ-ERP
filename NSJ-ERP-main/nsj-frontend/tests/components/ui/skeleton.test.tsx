import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Skeleton } from "@/components/ui/skeleton";

describe("Skeleton component", () => {
  it("renders skeleton element", () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("applies skeleton animation class", () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector("div")).toHaveClass("animate-pulse");
  });

  it("applies custom className", () => {
    const { container } = render(<Skeleton className="custom-class" />);
    expect(container.querySelector("div")).toHaveClass("custom-class");
  });

  it("applies custom width", () => {
    const { container } = render(<Skeleton className="w-32" />);
    expect(container.querySelector("div")).toHaveClass("w-32");
  });

  it("applies custom height", () => {
    const { container } = render(<Skeleton className="h-12" />);
    expect(container.querySelector("div")).toHaveClass("h-12");
  });

  it("renders multiple skeletons", () => {
    const { container } = render(
      <>
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </>
    );
    const skeletons = container.querySelectorAll("div");
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it("applies rounded class", () => {
    const { container } = render(<Skeleton className="rounded-md" />);
    expect(container.querySelector("div")).toHaveClass("rounded-md");
  });

  it("applies background color", () => {
    const { container } = render(<Skeleton className="bg-gray-200" />);
    expect(container.querySelector("div")).toHaveClass("bg-gray-200");
  });
});
