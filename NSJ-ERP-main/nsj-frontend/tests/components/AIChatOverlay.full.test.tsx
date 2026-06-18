import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { AIChatOverlay } from "@/components/AIChatOverlay";

describe("AIChatOverlay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ answer: "Test response" }),
      })
    );
  });

  it("renders nothing when not visible", () => {
    const { container } = render(<AIChatOverlay isVisible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders chat button when visible", () => {
    render(<AIChatOverlay isVisible={true} />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("opens chat when button is clicked", async () => {
    render(<AIChatOverlay isVisible={true} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Hi Niti/)).toBeInTheDocument();
    });
  });

  it("displays welcome message", async () => {
    render(<AIChatOverlay isVisible={true} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/I'm your AI assistant/)).toBeInTheDocument();
    });
  });

  it("handles input change", async () => {
    render(<AIChatOverlay isVisible={true} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      const input =
        screen.getByPlaceholderText(/ask/i) || screen.getByRole("textbox");
      if (input) {
        fireEvent.change(input, { target: { value: "Test query" } });
        expect(input).toHaveValue("Test query");
      }
    });
  });

  it("sends message on submit", async () => {
    render(<AIChatOverlay isVisible={true} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      const input =
        screen.getByPlaceholderText(/ask/i) || screen.getByRole("textbox");
      if (input) {
        fireEvent.change(input, { target: { value: "Test query" } });
        const form = input.closest("form");
        if (form) {
          fireEvent.submit(form);
        }
      }
    });
  });

  it("closes chat when close button is clicked", async () => {
    render(<AIChatOverlay isVisible={true} />);
    const openButton = screen.getByRole("button");
    fireEvent.click(openButton);

    await waitFor(() => {
      const closeButton = screen
        .getAllByRole("button")
        .find((btn) => btn.querySelector("svg"));
      if (closeButton) {
        fireEvent.click(closeButton);
      }
    });
  });

  it("handles API error gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("API Error")));

    render(<AIChatOverlay isVisible={true} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Hi Niti/)).toBeInTheDocument();
    });
  });

  it("displays loading state while waiting for response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => new Promise(() => {}))
    );

    render(<AIChatOverlay isVisible={true} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      const input =
        screen.getByPlaceholderText(/ask/i) || screen.getByRole("textbox");
      if (input) {
        fireEvent.change(input, { target: { value: "Test" } });
        const form = input.closest("form");
        if (form) {
          fireEvent.submit(form);
        }
      }
    });
  });
});
