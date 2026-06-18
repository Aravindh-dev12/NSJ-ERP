import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DashboardCards } from "@/components/DashboardCards";

describe("DashboardCards", () => {
  it("renders all three dashboard cards", () => {
    render(<DashboardCards />);

    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("Gross Margin")).toBeInTheDocument();
    expect(screen.getByText("Open Backlog")).toBeInTheDocument();
  });

  it("displays card values", () => {
    render(<DashboardCards />);

    expect(screen.getByText("$2,847,392")).toBeInTheDocument();
    expect(screen.getByText("34.2%")).toBeInTheDocument();
    expect(screen.getByText("$1,234,567")).toBeInTheDocument();
  });

  it("displays change percentages", () => {
    render(<DashboardCards />);

    expect(screen.getByText("+12.5%")).toBeInTheDocument();
    expect(screen.getByText("+2.1%")).toBeInTheDocument();
    expect(screen.getByText("-3.2%")).toBeInTheDocument();
  });

  it("renders trend icons", () => {
    render(<DashboardCards />);

    // Should have SVG elements for trend lines
    const svgs = document.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("applies correct styling for up trends", () => {
    render(<DashboardCards />);

    // Up trends should have green styling
    const greenBadges = document.querySelectorAll(".bg-green-100");
    expect(greenBadges.length).toBeGreaterThan(0);
  });

  it("applies correct styling for down trends", () => {
    render(<DashboardCards />);

    // Down trends should have red styling
    const redBadges = document.querySelectorAll(".bg-red-100");
    expect(redBadges.length).toBeGreaterThan(0);
  });

  it("renders card icons with correct colors", () => {
    render(<DashboardCards />);

    expect(document.querySelector(".bg-blue-500")).toBeInTheDocument();
    expect(document.querySelector(".bg-green-500")).toBeInTheDocument();
    expect(document.querySelector(".bg-orange-500")).toBeInTheDocument();
  });

  it("renders in a grid layout", () => {
    render(<DashboardCards />);

    const grid = document.querySelector(".grid");
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass("grid-cols-1", "md:grid-cols-3");
  });
});
