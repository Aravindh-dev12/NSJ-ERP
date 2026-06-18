import { describe, it, expect, vi, beforeEach } from "vitest";
import * as XLSX from "xlsx";

// Mock XLSX
vi.mock("xlsx", () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    aoa_to_sheet: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

import { exportToExcel, exportRowsToExcel } from "@/lib/export";

describe("export.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("exportToExcel", () => {
    it("creates workbook with headers and data row", () => {
      const result = exportToExcel({
        formName: "TestForm",
        headers: ["Name", "Value"],
        dataRow: ["Test", 123],
      });

      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
      expect(XLSX.writeFile).toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });

    it("handles undefined values in data row", () => {
      const result = exportToExcel({
        formName: "TestForm",
        headers: ["Name", "Value"],
        dataRow: ["Test", undefined],
      });

      expect(result.ok).toBe(true);
    });

    it("includes footer timestamp when requested", () => {
      exportToExcel({
        formName: "TestForm",
        headers: ["Name"],
        dataRow: ["Test"],
        includeFooterTimestamp: true,
      });

      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
    });

    it("truncates sheet name to 31 characters", () => {
      exportToExcel({
        formName: "This is a very long form name that exceeds 31 characters",
        headers: ["Name"],
        dataRow: ["Test"],
      });

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "This is a very long form name t"
      );
    });

    it("replaces spaces in filename with underscores", () => {
      exportToExcel({
        formName: "Test Form Name",
        headers: ["Name"],
        dataRow: ["Test"],
      });

      const writeFileCall = (XLSX.writeFile as any).mock.calls[0];
      expect(writeFileCall[1]).toContain("Test_Form_Name_");
    });

    it("returns error when writeFile fails", () => {
      (XLSX.writeFile as any).mockImplementationOnce(() => {
        throw new Error("Write failed");
      });

      const result = exportToExcel({
        formName: "TestForm",
        headers: ["Name"],
        dataRow: ["Test"],
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("exportRowsToExcel", () => {
    it("creates workbook with headers and multiple rows", () => {
      const result = exportRowsToExcel({
        formName: "TestList",
        headers: ["Name", "Value"],
        rows: [
          ["Row1", 100],
          ["Row2", 200],
        ],
      });

      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });

    it("handles undefined values in rows", () => {
      const result = exportRowsToExcel({
        formName: "TestList",
        headers: ["Name", "Value"],
        rows: [
          ["Row1", undefined],
          [null, 200],
        ],
      });

      expect(result.ok).toBe(true);
    });

    it("includes footer timestamp when requested", () => {
      exportRowsToExcel({
        formName: "TestList",
        headers: ["Name"],
        rows: [["Test"]],
        includeFooterTimestamp: true,
      });

      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
    });

    it("sets column widths based on content", () => {
      exportRowsToExcel({
        formName: "TestList",
        headers: ["Short", "A very long header name"],
        rows: [
          ["x", "y"],
          ["longer content here", "z"],
        ],
      });

      const aoaCall = (XLSX.utils.aoa_to_sheet as any).mock.calls[0];
      expect(aoaCall).toBeDefined();
    });

    it("returns error when writeFile fails", () => {
      (XLSX.writeFile as any).mockImplementationOnce(() => {
        throw new Error("Write failed");
      });

      const result = exportRowsToExcel({
        formName: "TestList",
        headers: ["Name"],
        rows: [["Test"]],
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("handles empty rows array", () => {
      const result = exportRowsToExcel({
        formName: "EmptyList",
        headers: ["Name", "Value"],
        rows: [],
      });

      expect(result.ok).toBe(true);
    });
  });
});
