import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuditLog } from "../../components/admin/AuditLog";

describe("AuditLog", () => {
  it("renders audit log table and filters", () => {
    render(<AuditLog />);
    // Check for filter input and selects
    expect(screen.getByPlaceholderText(/Search user/i)).toBeInTheDocument();
    expect(screen.getAllByRole("combobox").length).toBeGreaterThanOrEqual(2); // action/entity selects
    // Check for table headers (disambiguate by tag and order)
    const headers = screen.getAllByRole("columnheader");
    expect(headers[0]).toHaveTextContent(/Timestamp/i);
    expect(headers[1]).toHaveTextContent(/^User$/i);
    expect(headers[2]).toHaveTextContent(/^Action$/i);
    expect(headers[3]).toHaveTextContent(/^Entity$/i);
    expect(headers[4]).toHaveTextContent(/Entity ID/i);
    expect(headers[5]).toHaveTextContent(/Actions/i);
  });

  it("shows audit log entries", () => {
    render(<AuditLog />);
    // There are multiple John Admin rows, so use getAllByText
    expect(screen.getAllByText(/John Admin/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Sarah Manager/i).length).toBeGreaterThanOrEqual(
      1
    );
    // For actions, check that at least one cell contains the action text (not just the select option)
    const updateCells = screen
      .getAllByText(/UPDATE/i)
      .filter((el) => el.tagName !== "OPTION");
    expect(updateCells.length).toBeGreaterThanOrEqual(1);
    const createCells = screen
      .getAllByText(/CREATE/i)
      .filter((el) => el.tagName !== "OPTION");
    expect(createCells.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by user name", async () => {
    render(<AuditLog />);
    const userInput = screen.getByPlaceholderText(/Search user/i);
    fireEvent.change(userInput, { target: { value: "Sarah" } });
    const table = screen.getByRole("table");
    await waitFor(() => {
      const bodyRows = table.querySelectorAll("tbody tr");
      expect(bodyRows.length).toBeGreaterThan(0);
      bodyRows.forEach((row) => {
        const text = row.textContent || "";
        expect(text).toMatch(/Sarah Manager/i);
        expect(text).not.toMatch(/John Admin/i);
      });
    });
  });
});
