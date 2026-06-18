import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import CompaniesList from "@/components/CompaniesList";
import { backend } from "@/lib/backend";

vi.mock("@/lib/backend", () => ({
  backend: {
    companiesList: vi.fn(),
  },
}));

describe("CompaniesList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays loading state initially", () => {
    (backend.companiesList as any).mockImplementation(
      () => new Promise(() => {})
    );
    render(<CompaniesList />);
    expect(screen.getByText(/loading companies/i)).toBeInTheDocument();
  });

  it("displays companies in a table when data loads", async () => {
    const mockCompanies = [
      {
        id: "1",
        name: "Company A",
        display_name: "Display A",
        is_active: true,
        created_at: "2024-01-15T10:00:00Z",
      },
      {
        id: "2",
        name: "Company B",
        display_name: "Display B",
        is_active: false,
        created_at: "2024-02-20T15:30:00Z",
      },
    ];

    (backend.companiesList as any).mockResolvedValue(mockCompanies);

    render(<CompaniesList />);

    await waitFor(() => {
      expect(screen.getByText("Company A")).toBeInTheDocument();
      expect(screen.getByText("Company B")).toBeInTheDocument();
    });

    expect(screen.getByText("Display A")).toBeInTheDocument();
    expect(screen.getByText("Display B")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("displays error message when fetch fails", async () => {
    (backend.companiesList as any).mockRejectedValue(
      new Error("Network error")
    );

    render(<CompaniesList />);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it("displays 'no companies found' when empty array returned", async () => {
    (backend.companiesList as any).mockResolvedValue([]);

    render(<CompaniesList />);

    await waitFor(() => {
      expect(screen.getByText(/no companies found/i)).toBeInTheDocument();
    });
  });

  it("displays company ID in the table", async () => {
    const mockCompanies = [
      {
        id: "comp-123",
        name: "Test Company",
        display_name: "Test Display",
        is_active: true,
        created_at: "2024-01-15T10:00:00Z",
      },
    ];

    (backend.companiesList as any).mockResolvedValue(mockCompanies);

    render(<CompaniesList />);

    await waitFor(() => {
      expect(screen.getByText("comp-123")).toBeInTheDocument();
    });
  });

  it("formats created_at date correctly", async () => {
    const mockCompanies = [
      {
        id: "1",
        name: "Company A",
        display_name: "Display A",
        is_active: true,
        created_at: "2024-01-15T10:00:00Z",
      },
    ];

    (backend.companiesList as any).mockResolvedValue(mockCompanies);

    render(<CompaniesList />);

    await waitFor(() => {
      expect(screen.getByText("Company A")).toBeInTheDocument();
    });

    // Date should be formatted using toLocaleString
    const dateCell = screen.getByText(/2024/);
    expect(dateCell).toBeInTheDocument();
  });

  it("displays dash for missing display_name", async () => {
    const mockCompanies = [
      {
        id: "1",
        name: "Company A",
        display_name: null,
        is_active: true,
        created_at: "2024-01-15T10:00:00Z",
      },
    ];

    (backend.companiesList as any).mockResolvedValue(mockCompanies);

    render(<CompaniesList />);

    await waitFor(() => {
      expect(screen.getByText("Company A")).toBeInTheDocument();
    });

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders table headers correctly", async () => {
    const mockCompanies = [
      {
        id: "1",
        name: "Company A",
        display_name: "Display A",
        is_active: true,
        created_at: "2024-01-15T10:00:00Z",
      },
    ];

    (backend.companiesList as any).mockResolvedValue(mockCompanies);

    render(<CompaniesList />);

    await waitFor(() => {
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Display Name")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Created")).toBeInTheDocument();
      expect(screen.getByText("ID")).toBeInTheDocument();
    });
  });

  it("applies correct CSS classes for active status", async () => {
    const mockCompanies = [
      {
        id: "1",
        name: "Active Company",
        display_name: "Active Display",
        is_active: true,
        created_at: "2024-01-15T10:00:00Z",
      },
    ];

    (backend.companiesList as any).mockResolvedValue(mockCompanies);

    render(<CompaniesList />);

    await waitFor(() => {
      const statusElements = screen.getAllByText("Active");
      const activeStatus = statusElements.find((el) => el.tagName === "SPAN");
      expect(activeStatus).toHaveClass("bg-green-100");
      expect(activeStatus).toHaveClass("text-green-700");
    });
  });

  it("applies correct CSS classes for inactive status", async () => {
    const mockCompanies = [
      {
        id: "1",
        name: "Inactive Company",
        display_name: "Inactive Display",
        is_active: false,
        created_at: "2024-01-15T10:00:00Z",
      },
    ];

    (backend.companiesList as any).mockResolvedValue(mockCompanies);

    render(<CompaniesList />);

    await waitFor(() => {
      const statusElements = screen.getAllByText("Inactive");
      const inactiveStatus = statusElements.find((el) => el.tagName === "SPAN");
      expect(inactiveStatus).toHaveClass("bg-gray-100");
      expect(inactiveStatus).toHaveClass("text-gray-600");
    });
  });
});
