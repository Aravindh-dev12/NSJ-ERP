import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import CompaniesCrud from "@/components/CompaniesCrud";

// Mock backend
vi.mock("@/lib/backend", () => ({
  backend: {
    companiesList: vi.fn(),
    companyCreate: vi.fn(),
    companyUpdate: vi.fn(),
    companyDelete: vi.fn(),
  },
}));

import { backend } from "@/lib/backend";

const mockCompanies = [
  {
    id: "1",
    name: "Company A",
    display_name: "Company A Display",
    is_active: true,
    address: "123 Main St",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Company B",
    display_name: null,
    is_active: false,
    address: "456 Oak Ave",
    created_at: "2024-02-01T00:00:00Z",
  },
];

describe("CompaniesCrud", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (backend.companiesList as any).mockResolvedValue(mockCompanies);
    (backend.companyCreate as any).mockResolvedValue({});
    (backend.companyUpdate as any).mockResolvedValue({});
    (backend.companyDelete as any).mockResolvedValue({});
  });

  it("shows loading state initially", () => {
    (backend.companiesList as any).mockImplementation(
      () => new Promise(() => {})
    );
    render(<CompaniesCrud />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("displays companies after loading", async () => {
    render(<CompaniesCrud />);

    await waitFor(() => {
      expect(screen.getByText("Company A")).toBeInTheDocument();
    });

    expect(screen.getByText("Company B")).toBeInTheDocument();
  });

  it("shows error message when fetch fails", async () => {
    (backend.companiesList as any).mockRejectedValue(
      new Error("Network error")
    );

    render(<CompaniesCrud />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("renders create company form", async () => {
    render(<CompaniesCrud />);

    await waitFor(() => {
      expect(screen.getByText("Create Company")).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText("name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("display_name")).toBeInTheDocument();
    expect(screen.getByText("Add")).toBeInTheDocument();
  });

  it("creates a new company", async () => {
    render(<CompaniesCrud />);

    await waitFor(() => {
      expect(screen.getByText("Create Company")).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText("name");
    const displayNameInput = screen.getByPlaceholderText("display_name");
    const addButton = screen.getByText("Add");

    fireEvent.change(nameInput, { target: { value: "New Company" } });
    fireEvent.change(displayNameInput, { target: { value: "New Display" } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(backend.companyCreate).toHaveBeenCalledWith({
        name: "New Company",
        display_name: "New Display",
        is_active: true,
        address: "",
      });
    });
  });

  it("does not create company with empty name", async () => {
    render(<CompaniesCrud />);

    await waitFor(() => {
      expect(screen.getByText("Create Company")).toBeInTheDocument();
    });

    const addButton = screen.getByText("Add");
    fireEvent.click(addButton);

    expect(backend.companyCreate).not.toHaveBeenCalled();
  });

  it("displays active status correctly", async () => {
    render(<CompaniesCrud />);

    await waitFor(() => {
      expect(screen.getByText("Yes")).toBeInTheDocument();
      expect(screen.getByText("No")).toBeInTheDocument();
    });
  });

  it("shows edit and delete buttons", async () => {
    render(<CompaniesCrud />);

    await waitFor(() => {
      expect(screen.getAllByText("Edit").length).toBe(2);
      expect(screen.getAllByText("Delete").length).toBe(2);
    });
  });

  it("enters edit mode when Edit is clicked", async () => {
    render(<CompaniesCrud />);

    await waitFor(() => {
      expect(screen.getByText("Company A")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Save")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
  });

  it("cancels edit mode", async () => {
    render(<CompaniesCrud />);

    await waitFor(() => {
      expect(screen.getByText("Company A")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(screen.queryByText("Save")).not.toBeInTheDocument();
    });
  });

  it("deletes company after confirmation", async () => {
    window.confirm = vi.fn(() => true);

    render(<CompaniesCrud />);

    await waitFor(() => {
      expect(screen.getByText("Company A")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(backend.companyDelete).toHaveBeenCalledWith("1");
    });
  });

  it("does not delete company when confirmation is cancelled", async () => {
    window.confirm = vi.fn(() => false);

    render(<CompaniesCrud />);

    await waitFor(() => {
      expect(screen.getByText("Company A")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    expect(backend.companyDelete).not.toHaveBeenCalled();
  });

  it("displays dash for null display_name", async () => {
    render(<CompaniesCrud />);

    await waitFor(() => {
      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });

  it("toggles active checkbox in create form", async () => {
    render(<CompaniesCrud />);

    await waitFor(() => {
      expect(screen.getByText("Create Company")).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText("active");
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});
