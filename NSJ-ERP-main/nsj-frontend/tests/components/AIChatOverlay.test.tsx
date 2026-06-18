import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { AIChatOverlay } from "@/components/AIChatOverlay";

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("AIChatOverlay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when isVisible is false", () => {
    const { container } = render(<AIChatOverlay isVisible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders chat button when isVisible is true", () => {
    render(<AIChatOverlay isVisible={true} />);
    // Should render the floating button
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("opens chat panel when button is clicked", async () => {
    render(<AIChatOverlay isVisible={true} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Should show welcome message
    await waitFor(() => {
      expect(screen.getByText(/Hi Niti!/)).toBeInTheDocument();
    });
  });

  it("shows AI Assistant header when chat is open", async () => {
    render(<AIChatOverlay isVisible={true} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("AI Assistant")).toBeInTheDocument();
    });
  });

  it("shows quick question buttons when chat is open", async () => {
    render(<AIChatOverlay isVisible={true} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Who's the top performer?")).toBeInTheDocument();
      expect(screen.getByText("Orders this month")).toBeInTheDocument();
    });
  });

  it("shows input field when chat is open", async () => {
    render(<AIChatOverlay isVisible={true} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/ask about tasks/i);
      expect(input).toBeInTheDocument();
    });
  });

  it("allows typing in input field", async () => {
    render(<AIChatOverlay isVisible={true} />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText(/Hi Niti!/)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/ask about tasks/i);
    fireEvent.change(input, { target: { value: "Test message" } });
    expect(input).toHaveValue("Test message");
  });

  it("has send button", async () => {
    render(<AIChatOverlay isVisible={true} />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText(/Hi Niti!/)).toBeInTheDocument();
    });

    // Should have multiple buttons including send
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(1);
  });

  it("shows close button when chat is open", async () => {
    render(<AIChatOverlay isVisible={true} />);
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText(/Hi Niti!/)).toBeInTheDocument();
    });

    // The X icon should be present
    const closeIcon = document.querySelector("svg.lucide-x");
    expect(closeIcon).toBeInTheDocument();
  });
});
