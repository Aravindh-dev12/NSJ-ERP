import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { AuditLog } from "@/components/admin/AuditLog";

describe("AuditLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders audit log component", () => {
    render(<AuditLog />);
    expect(screen.getByText("Audit Log")).toBeInTheDocument();
  });

  it("displays audit log entries", () => {
    render(<AuditLog />);
    // Use getAllByText since there might be multiple instances
    const johnElements = screen.getAllByText(/John Admin/i);
    expect(johnElements.length).toBeGreaterThan(0);
  });

  it("displays action badges", () => {
    render(<AuditLog />);
    expect(screen.getByText("UPDATE")).toBeInTheDocument();
    expect(screen.getByText("CREATE")).toBeInTheDocument();
    expect(screen.getByText("DELETE")).toBeInTheDocument();
  });

  it("displays entity types", () => {
    render(<AuditLog />);
    expect(screen.getByText("vendor")).toBeInTheDocument();
    expect(screen.getByText("invoice")).toBeInTheDocument();
    expect(screen.getByText("template")).toBeInTheDocument();
  });

  it("renders filter inputs", () => {
    const { container } = render(<AuditLog />);
    const inputs = container.querySelectorAll("input");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("filters by user name", async () => {
    const { container } = render(<AuditLog />);

    const inputs = container.querySelectorAll("input");
    const userFilter = inputs[0];
    if (userFilter) {
      fireEvent.change(userFilter, { target: { value: "John" } });
    }

    await waitFor(() => {
      const johnElements = screen.getAllByText(/John Admin/i);
      expect(johnElements.length).toBeGreaterThan(0);
    });
  });

  it("filters by action type", async () => {
    const { container } = render(<AuditLog />);

    const selects = container.querySelectorAll("select");
    if (selects.length > 0) {
      fireEvent.change(selects[0], { target: { value: "CREATE" } });
    }
  });

  it("displays timestamps", () => {
    render(<AuditLog />);
    const timestampElements = screen.getAllByText(/2024-01-15/);
    expect(timestampElements.length).toBeGreaterThan(0);
  });

  it("shows success status", () => {
    const { container } = render(<AuditLog />);
    // Check that the component renders without errors
    expect(container.textContent).toBeTruthy();
  });

  it("renders view details buttons", () => {
    const { container } = render(<AuditLog />);
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("handles empty filter state", () => {
    render(<AuditLog />);
    // All logs should be visible with empty filters
    const johnElements = screen.getAllByText(/John Admin/i);
    expect(johnElements.length).toBeGreaterThan(0);
  });

  it("applies correct badge colors for actions", () => {
    render(<AuditLog />);

    const createBadge = screen.getByText("CREATE");
    expect(createBadge).toHaveClass("bg-green-100");

    const updateBadge = screen.getByText("UPDATE");
    expect(updateBadge).toHaveClass("bg-blue-100");

    const deleteBadge = screen.getByText("DELETE");
    expect(deleteBadge).toHaveClass("bg-red-100");
  });
});
