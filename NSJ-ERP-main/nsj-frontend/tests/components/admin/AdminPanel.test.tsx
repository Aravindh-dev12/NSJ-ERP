import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { AdminPanel } from "@/components/admin/AdminPanel";

// Mock all child components
vi.mock("@/components/admin/VendorManagement", () => ({
  VendorManagement: () => (
    <div data-testid="vendor-management">Vendor Management</div>
  ),
}));

vi.mock("@/components/admin/InvoiceManagement", () => ({
  InvoiceManagement: () => (
    <div data-testid="invoice-management">Invoice Management</div>
  ),
}));

vi.mock("@/components/admin/ReminderSettings", () => ({
  ReminderSettings: () => (
    <div data-testid="reminder-settings">Reminder Settings Content</div>
  ),
}));

vi.mock("@/components/admin/TemplateManagement", () => ({
  TemplateManagement: () => (
    <div data-testid="template-management">Template Management</div>
  ),
}));

vi.mock("@/components/admin/StakeholderManagement", () => ({
  StakeholderManagement: () => (
    <div data-testid="stakeholder-management">Stakeholder Management</div>
  ),
}));

vi.mock("@/components/admin/AuditLog", () => ({
  AuditLog: () => <div data-testid="audit-log">Audit Log</div>,
}));

describe("AdminPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders admin panel with title", () => {
    render(<AdminPanel />);
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });

  it("displays description text", () => {
    render(<AdminPanel />);
    expect(
      screen.getByText("Manage system settings and configurations")
    ).toBeInTheDocument();
  });

  it("renders navigation sections", () => {
    render(<AdminPanel />);
    expect(screen.getByText("Vendors")).toBeInTheDocument();
    expect(screen.getByText("Invoices")).toBeInTheDocument();
    expect(screen.getByText("Reminder Settings")).toBeInTheDocument();
    expect(screen.getByText("Templates")).toBeInTheDocument();
    expect(screen.getByText("Stakeholders")).toBeInTheDocument();
    expect(screen.getByText("Audit Log")).toBeInTheDocument();
  });

  it("shows VendorManagement by default", () => {
    render(<AdminPanel />);
    expect(screen.getByTestId("vendor-management")).toBeInTheDocument();
  });

  it("switches to InvoiceManagement when clicked", async () => {
    render(<AdminPanel />);
    fireEvent.click(screen.getByText("Invoices"));

    await waitFor(() => {
      expect(screen.getByTestId("invoice-management")).toBeInTheDocument();
    });
  });

  it("switches to ReminderSettings when clicked", async () => {
    render(<AdminPanel />);
    fireEvent.click(screen.getByText("Reminder Settings"));

    await waitFor(() => {
      expect(screen.getByTestId("reminder-settings")).toBeInTheDocument();
    });
  });

  it("switches to TemplateManagement when clicked", async () => {
    render(<AdminPanel />);
    fireEvent.click(screen.getByText("Templates"));

    await waitFor(() => {
      expect(screen.getByTestId("template-management")).toBeInTheDocument();
    });
  });

  it("switches to StakeholderManagement when clicked", async () => {
    render(<AdminPanel />);
    fireEvent.click(screen.getByText("Stakeholders"));

    await waitFor(() => {
      expect(screen.getByTestId("stakeholder-management")).toBeInTheDocument();
    });
  });

  it("switches to AuditLog when clicked", async () => {
    render(<AdminPanel />);
    fireEvent.click(screen.getByText("Audit Log"));

    await waitFor(() => {
      expect(screen.getByTestId("audit-log")).toBeInTheDocument();
    });
  });
});
