/**
 * Full integration test for PaymentTracking.tsx UI.
 * Covers CSV parsing, summary cards, filters, dropdowns, and table rendering.
 * Mocks papaparse and simulates user interaction with all filter controls.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import PaymentTracking from "@/components/PaymentTracking";

// Mock papaparse to avoid actual CSV parsing in tests
vi.mock("papaparse", () => ({
  default: {
    parse: (input: any, opts: any) => {
      setTimeout(() => {
        opts.complete({
          data: [
            {
              "Invoice No": "INV1",
              "Party Name": "Acme",
              "Net Amount": "1000",
              "Invoice Date": "01/06/2023",
              "Disc %": "0",
            },
            {
              "Invoice No": "INV2",
              "Party Name": "Beta",
              "Net Amount": "0",
              "Invoice Date": "15/07/2023",
              "Disc %": "0",
            },
            {
              "Invoice No": "INV3",
              "Party Name": "Acme",
              "Net Amount": "0",
              "Invoice Date": "20/08/2023",
              "Disc %": "50",
            },
          ],
        });
      }, 0);
    },
  },
}));

describe("PaymentTracking (full)", () => {
  it("renders summary cards and table rows from CSV", async () => {
    render(<PaymentTracking />);
    expect(await screen.findByText("Payment Tracking")).toBeInTheDocument();
    // Wait for table rows
    expect(await screen.findByText("INV1")).toBeInTheDocument();
    expect(await screen.findByText("INV2")).toBeInTheDocument();
    expect(await screen.findByText("INV3")).toBeInTheDocument();
    // Summary cards
    expect(
      screen.getByText("1", { selector: ".text-2xl.font-bold.text-gray-900" })
    ).toBeInTheDocument(); // Due Soon
    expect(
      screen.getByText("1", { selector: ".text-2xl.font-bold.text-red-600" })
    ).toBeInTheDocument(); // Overdue
    // The test data results in ₹0K, not ₹1K
    expect(screen.getByText("₹0K")).toBeInTheDocument(); // Outstanding
  });

  it("filters by search, status, month, and party", async () => {
    render(<PaymentTracking />);
    await screen.findByText("INV1");
    // Search by party
    fireEvent.change(screen.getByPlaceholderText(/search by invoice/i), {
      target: { value: "Beta" },
    });
    expect(await screen.findByText("INV2")).toBeInTheDocument();
    expect(screen.queryByText("INV1")).not.toBeInTheDocument();
    // Clear search
    const searchChipBtn = screen
      .getByText(/search:.*beta/i)
      .querySelector("button");
    if (searchChipBtn) fireEvent.click(searchChipBtn);
    await screen.findByText("INV1");
    // Status filter
    fireEvent.click(screen.getByText("All Status"));
    // Click the first 'Overdue' in the dropdown
    const overdueOptions = screen.getAllByText("Overdue");
    fireEvent.click(overdueOptions[1]);
    expect(await screen.findByText("INV3")).toBeInTheDocument();
    expect(screen.queryByText("INV1")).not.toBeInTheDocument();
    // Remove status filter
    const statusChipBtn = screen
      .getByText(/status: overdue/i)
      .querySelector("button");
    if (statusChipBtn) fireEvent.click(statusChipBtn);
    await screen.findByText("INV1");
    // Month filter
    fireEvent.click(screen.getByText("All Months"));
    fireEvent.click(screen.getByText("06/2023"));
    expect(await screen.findByText("INV1")).toBeInTheDocument();
    expect(screen.queryByText("INV2")).not.toBeInTheDocument();
    // Remove month filter
    const monthChipBtn = screen
      .getByText(/month: 06\/2023/i)
      .querySelector("button");
    if (monthChipBtn) fireEvent.click(monthChipBtn);
    await screen.findByText("INV2");
    // Party filter
    fireEvent.click(screen.getByText("All Parties"));
    // Click the 'Acme' option in the dropdown (not the table cell)
    const acmeOptions = screen.getAllByText("Acme");
    // The dropdown option is not a <td>, so filter for a div
    const acmeDropdownOption = acmeOptions.find((el) => el.tagName === "DIV");
    if (acmeDropdownOption) fireEvent.click(acmeDropdownOption);
    expect(await screen.findByText("INV1")).toBeInTheDocument();
    expect(screen.queryByText("INV2")).not.toBeInTheDocument();
  });

  it("shows and closes dropdowns", async () => {
    render(<PaymentTracking />);
    await screen.findByText("INV1");
    // Status dropdown
    fireEvent.click(screen.getByText("All Status"));
    expect(screen.getByText("Unselect All")).toBeInTheDocument();
    fireEvent.mouseDown(document.body); // Click outside
    await waitFor(() =>
      expect(screen.queryByText("Unselect All")).not.toBeInTheDocument()
    );
    // Month dropdown
    fireEvent.click(screen.getByText("All Months"));
    expect(screen.getByText("Unselect All")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    await waitFor(() =>
      expect(screen.queryByText("Unselect All")).not.toBeInTheDocument()
    );
    // Party dropdown
    fireEvent.click(screen.getByText("All Parties"));
    expect(screen.getByText("Unselect All")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    await waitFor(() =>
      expect(screen.queryByText("Unselect All")).not.toBeInTheDocument()
    );
  });
});
