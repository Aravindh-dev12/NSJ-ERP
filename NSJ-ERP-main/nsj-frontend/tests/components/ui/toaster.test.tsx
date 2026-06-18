import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { Toaster } from "@/components/ui/toaster";

// Mock useToast
vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(() => ({
    toasts: [],
  })),
}));

import { useToast } from "@/hooks/use-toast";

describe("Toaster", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without toasts", () => {
    (useToast as any).mockReturnValue({ toasts: [] });
    render(<Toaster />);
    // Should render the viewport even with no toasts
    expect(document.body).toBeInTheDocument();
  });

  it("renders a single toast with title", () => {
    (useToast as any).mockReturnValue({
      toasts: [{ id: "1", title: "Test Toast" }],
    });
    render(<Toaster />);
    expect(screen.getByText("Test Toast")).toBeInTheDocument();
  });

  it("renders a toast with description", () => {
    (useToast as any).mockReturnValue({
      toasts: [{ id: "1", title: "Title", description: "Description text" }],
    });
    render(<Toaster />);
    expect(screen.getByText("Description text")).toBeInTheDocument();
  });

  it("renders multiple toasts", () => {
    (useToast as any).mockReturnValue({
      toasts: [
        { id: "1", title: "Toast 1" },
        { id: "2", title: "Toast 2" },
        { id: "3", title: "Toast 3" },
      ],
    });
    render(<Toaster />);
    expect(screen.getByText("Toast 1")).toBeInTheDocument();
    expect(screen.getByText("Toast 2")).toBeInTheDocument();
    expect(screen.getByText("Toast 3")).toBeInTheDocument();
  });

  it("renders toast without title", () => {
    (useToast as any).mockReturnValue({
      toasts: [{ id: "1", description: "Only description" }],
    });
    render(<Toaster />);
    expect(screen.getByText("Only description")).toBeInTheDocument();
  });

  it("renders toast with action", () => {
    (useToast as any).mockReturnValue({
      toasts: [
        {
          id: "1",
          title: "With Action",
          action: <button>Click me</button>,
        },
      ],
    });
    render(<Toaster />);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("renders toast with variant", () => {
    (useToast as any).mockReturnValue({
      toasts: [{ id: "1", title: "Error", variant: "destructive" }],
    });
    render(<Toaster />);
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("renders close button for each toast", () => {
    (useToast as any).mockReturnValue({
      toasts: [
        { id: "1", title: "Toast 1" },
        { id: "2", title: "Toast 2" },
      ],
    });
    render(<Toaster />);
    // Each toast should have a close button
    const closeButtons = document.querySelectorAll("[toast-close]");
    expect(closeButtons.length).toBe(2);
  });
});
