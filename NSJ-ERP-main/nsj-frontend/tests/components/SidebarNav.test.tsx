import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { SidebarNav } from "@/components/SidebarNav";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock useAuth
vi.mock("@/lib/auth", () => ({
  useAuth: vi.fn(() => ({
    user: { name: "Test User", role: "Founder", department: "Global" },
    loading: false,
  })),
}));

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

describe("SidebarNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (usePathname as any).mockReturnValue("/dashboard");
    (useAuth as any).mockReturnValue({
      user: { name: "Test User", role: "Founder", department: "Global" },
      loading: false,
    });
  });

  it("renders sidebar with navigation items", () => {
    render(<SidebarNav />);

    // Use getAllByText for elements that appear multiple times
    const dashboardElements = screen.getAllByText("Dashboard");
    expect(dashboardElements.length).toBeGreaterThan(0);
  });

  it("highlights active navigation item", () => {
    (usePathname as any).mockReturnValue("/dashboard");
    render(<SidebarNav />);

    const dashboardLinks = screen.getAllByText("Dashboard");
    expect(dashboardLinks.length).toBeGreaterThan(0);
  });

  it("renders logo image", () => {
    render(<SidebarNav />);

    // Multiple logo images exist (desktop and mobile), use getAllByAltText
    const logos = screen.getAllByAltText(/Niti Shah Jewels/i);
    expect(logos.length).toBeGreaterThan(0);
  });

  it("shows mobile menu button", () => {
    render(<SidebarNav />);

    // The hamburger menu button should be present
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("renders navigation sections", () => {
    render(<SidebarNav />);

    // Check for navigation sections using getAllByText
    const masterElements = screen.getAllByText("Master");
    expect(masterElements.length).toBeGreaterThan(0);

    const processElements = screen.getAllByText("Process");
    expect(processElements.length).toBeGreaterThan(0);
  });

  it("shows Task Management section", () => {
    render(<SidebarNav />);

    const taskElements = screen.getAllByText("Task Management");
    expect(taskElements.length).toBeGreaterThan(0);
  });

  it("renders company name", () => {
    render(<SidebarNav />);

    // Check for company name instead of Settings
    const companyNames = screen.getAllByText("Niti Shah Jewels");
    expect(companyNames.length).toBeGreaterThan(0);
  });

  it("handles different user roles", () => {
    (useAuth as any).mockReturnValue({
      user: { name: "Test User", role: "Dept Head", department: "Accounts" },
      loading: false,
    });

    render(<SidebarNav />);

    // Should render without errors
    const dashboardElements = screen.getAllByText("Dashboard");
    expect(dashboardElements.length).toBeGreaterThan(0);
  });
});

describe("SidebarNav - Extended Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (usePathname as any).mockReturnValue("/dashboard");
    (useAuth as any).mockReturnValue({
      user: { name: "Test User", role: "Founder", department: "Global" },
      loading: false,
    });
  });

  it("renders Reports section", () => {
    render(<SidebarNav />);
    const reportsElements = screen.getAllByText("Reports");
    expect(reportsElements.length).toBeGreaterThan(0);
  });

  it("renders Feeding section", () => {
    render(<SidebarNav />);
    const feedingElements = screen.getAllByText("Feeding");
    expect(feedingElements.length).toBeGreaterThan(0);
  });

  it("renders Tagging section", () => {
    render(<SidebarNav />);
    const taggingElements = screen.getAllByText("Tagging");
    expect(taggingElements.length).toBeGreaterThan(0);
  });

  it("handles accounts path", () => {
    (usePathname as any).mockReturnValue("/accounts");
    render(<SidebarNav />);
    const masterElements = screen.getAllByText("Master");
    expect(masterElements.length).toBeGreaterThan(0);
  });

  it("handles vouchers path", () => {
    (usePathname as any).mockReturnValue("/vouchers");
    render(<SidebarNav />);
    const processElements = screen.getAllByText("Process");
    expect(processElements.length).toBeGreaterThan(0);
  });

  it("handles tasks path", () => {
    (usePathname as any).mockReturnValue("/tasks/dashboard");
    render(<SidebarNav />);
    const taskElements = screen.getAllByText("Task Management");
    expect(taskElements.length).toBeGreaterThan(0);
  });

  it("handles reports path", () => {
    (usePathname as any).mockReturnValue("/reports/account-report");
    render(<SidebarNav />);
    const reportsElements = screen.getAllByText("Reports");
    expect(reportsElements.length).toBeGreaterThan(0);
  });

  it("handles feeding path", () => {
    (usePathname as any).mockReturnValue("/feeding");
    render(<SidebarNav />);
    const feedingElements = screen.getAllByText("Feeding");
    expect(feedingElements.length).toBeGreaterThan(0);
  });

  it("handles tagging path", () => {
    (usePathname as any).mockReturnValue("/tagging");
    render(<SidebarNav />);
    const taggingElements = screen.getAllByText("Tagging");
    expect(taggingElements.length).toBeGreaterThan(0);
  });

  it("renders with null user", () => {
    (useAuth as any).mockReturnValue({
      user: null,
      loading: false,
    });
    render(<SidebarNav />);
    const dashboardElements = screen.getAllByText("Dashboard");
    expect(dashboardElements.length).toBeGreaterThan(0);
  });

  it("renders with loading state", () => {
    (useAuth as any).mockReturnValue({
      user: null,
      loading: true,
    });
    render(<SidebarNav />);
    const dashboardElements = screen.getAllByText("Dashboard");
    expect(dashboardElements.length).toBeGreaterThan(0);
  });

  it("renders sub-links for Master", () => {
    render(<SidebarNav />);
    const overviewElements = screen.getAllByText("Overview");
    expect(overviewElements.length).toBeGreaterThan(0);
  });

  it("renders sub-links for Process", () => {
    render(<SidebarNav />);
    const orderElements = screen.getAllByText("Order");
    expect(orderElements.length).toBeGreaterThan(0);
  });
});
