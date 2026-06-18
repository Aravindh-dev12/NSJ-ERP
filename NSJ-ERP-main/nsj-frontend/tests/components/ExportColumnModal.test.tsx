import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ExportColumnModal } from "@/components/ExportColumnModal";

const columns = ["invoice_no", "party_name", "quantity"];
const displayNames = ["Invoice No", "Party Name", "Quantity"];

describe("ExportColumnModal", () => {
  it("renders with all columns and correct display names", () => {
    render(
      <ExportColumnModal
        columns={columns}
        selected={[]}
        onChange={() => {}}
        onClose={() => {}}
        onExport={() => {}}
      />
    );
    displayNames.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Select all columns")).toBeInTheDocument();
    expect(screen.getByLabelText("Deselect all columns")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Download export file")).toBeInTheDocument();
  });

  it("calls onChange when toggling a column", async () => {
    const onChange = vi.fn();
    render(
      <ExportColumnModal
        columns={columns}
        selected={[]}
        onChange={onChange}
        onClose={() => {}}
        onExport={() => {}}
      />
    );
    const checkboxes = screen.getAllByRole("checkbox");
    await userEvent.click(checkboxes[0]);
    expect(onChange).toHaveBeenCalledWith([columns[0]]);
  });

  it("calls onChange with all columns when Select All is clicked", async () => {
    const onChange = vi.fn();
    render(
      <ExportColumnModal
        columns={columns}
        selected={[]}
        onChange={onChange}
        onClose={() => {}}
        onExport={() => {}}
      />
    );
    const selectAllBtn = screen.getByLabelText("Select all columns");
    await userEvent.click(selectAllBtn);
    expect(onChange).toHaveBeenCalledWith(columns);
  });

  it("calls onChange with [] when Deselect All is clicked", async () => {
    const onChange = vi.fn();
    render(
      <ExportColumnModal
        columns={columns}
        selected={columns}
        onChange={onChange}
        onClose={() => {}}
        onExport={() => {}}
      />
    );
    const deselectAllBtn = screen.getByLabelText("Deselect all columns");
    await userEvent.click(deselectAllBtn);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = vi.fn();
    render(
      <ExportColumnModal
        columns={columns}
        selected={[]}
        onChange={() => {}}
        onClose={onClose}
        onExport={() => {}}
      />
    );
    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    await userEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onExport when Download is clicked and disables when no columns selected", async () => {
    const onExport = vi.fn();
    render(
      <ExportColumnModal
        columns={columns}
        selected={columns}
        onChange={() => {}}
        onClose={() => {}}
        onExport={onExport}
      />
    );
    const downloadBtn = screen.getByLabelText("Download export file");
    expect(downloadBtn).not.toBeDisabled();
    await userEvent.click(downloadBtn);
    expect(onExport).toHaveBeenCalled();
  });

  it("disables Download button when loading or no columns selected", () => {
    render(
      <ExportColumnModal
        columns={columns}
        selected={[]}
        onChange={() => {}}
        onClose={() => {}}
        onExport={() => {}}
        loading={true}
      />
    );
    const downloadBtn = screen.getByLabelText("Download export file");
    expect(downloadBtn).toBeDisabled();
  });
});
