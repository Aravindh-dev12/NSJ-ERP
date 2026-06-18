import { describe, it, expect } from "vitest";
import {
  withQuery,
  createUploadFormData,
  parseFileNameFromDisposition,
  normalizePaginated,
} from "@/lib/backend";

describe("backend.ts utility functions", () => {
  describe("withQuery", () => {
    it("returns path unchanged when no params provided", () => {
      expect(withQuery("/api/test")).toBe("/api/test");
    });

    it("returns path unchanged when params is undefined", () => {
      expect(withQuery("/api/test", undefined)).toBe("/api/test");
    });

    it("appends single query parameter", () => {
      expect(withQuery("/api/test", { page: 1 })).toBe("/api/test?page=1");
    });

    it("appends multiple query parameters", () => {
      const result = withQuery("/api/test", { page: 1, limit: 10 });
      expect(result).toContain("page=1");
      expect(result).toContain("limit=10");
    });

    it("handles string parameters", () => {
      expect(withQuery("/api/test", { name: "john" })).toBe(
        "/api/test?name=john"
      );
    });

    it("handles boolean parameters", () => {
      expect(withQuery("/api/test", { active: true })).toBe(
        "/api/test?active=true"
      );
      expect(withQuery("/api/test", { active: false })).toBe(
        "/api/test?active=false"
      );
    });

    it("ignores null values", () => {
      expect(withQuery("/api/test", { page: 1, name: null })).toBe(
        "/api/test?page=1"
      );
    });

    it("ignores undefined values", () => {
      expect(withQuery("/api/test", { page: 1, name: undefined })).toBe(
        "/api/test?page=1"
      );
    });

    it("ignores empty string values", () => {
      expect(withQuery("/api/test", { page: 1, name: "" })).toBe(
        "/api/test?page=1"
      );
    });

    it("handles array parameters", () => {
      const result = withQuery("/api/test", { ids: [1, 2, 3] });
      expect(result).toBe("/api/test?ids=1&ids=2&ids=3");
    });

    it("filters null/undefined/empty from arrays", () => {
      const result = withQuery("/api/test", {
        ids: [1, null, 2, undefined, "", 3] as any,
      });
      expect(result).toBe("/api/test?ids=1&ids=2&ids=3");
    });

    it("returns path when all params are empty/null/undefined", () => {
      expect(withQuery("/api/test", { a: null, b: undefined, c: "" })).toBe(
        "/api/test"
      );
    });
  });

  describe("createUploadFormData", () => {
    it("creates FormData with file", () => {
      const file = new File(["test content"], "test.csv", { type: "text/csv" });
      const formData = createUploadFormData(file);

      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get("file")).toBeTruthy();
    });

    it("uses custom field name", () => {
      const file = new File(["test"], "test.csv", { type: "text/csv" });
      const formData = createUploadFormData(file, "document");

      expect(formData.get("document")).toBeTruthy();
      expect(formData.get("file")).toBeNull();
    });

    it("handles Blob without name", () => {
      const blob = new Blob(["test content"], { type: "text/plain" });
      const formData = createUploadFormData(blob, "file", "fallback.txt");

      expect(formData.get("file")).toBeTruthy();
    });

    it("uses fallback name for unnamed blobs", () => {
      const blob = new Blob(["test"], { type: "application/octet-stream" });
      const formData = createUploadFormData(blob, "upload", "default.bin");

      expect(formData.get("upload")).toBeTruthy();
    });
  });

  describe("parseFileNameFromDisposition", () => {
    it("returns undefined for null input", () => {
      expect(parseFileNameFromDisposition(null)).toBeUndefined();
    });

    it("returns undefined for undefined input", () => {
      expect(parseFileNameFromDisposition(undefined)).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      expect(parseFileNameFromDisposition("")).toBeUndefined();
    });

    it("parses quoted filename", () => {
      const disposition = 'attachment; filename="report.pdf"';
      expect(parseFileNameFromDisposition(disposition)).toBe("report.pdf");
    });

    it("parses unquoted filename", () => {
      const disposition = "attachment; filename=report.pdf";
      expect(parseFileNameFromDisposition(disposition)).toBe("report.pdf");
    });

    it("parses RFC5987 encoded filename", () => {
      const disposition = "attachment; filename*=UTF-8''report%20file.pdf";
      expect(parseFileNameFromDisposition(disposition)).toBe("report file.pdf");
    });

    it("handles filename with spaces in quotes", () => {
      const disposition = 'attachment; filename="my report.pdf"';
      expect(parseFileNameFromDisposition(disposition)).toBe("my report.pdf");
    });

    it("handles filename with special characters", () => {
      const disposition = 'attachment; filename="report_2024-01-15.pdf"';
      expect(parseFileNameFromDisposition(disposition)).toBe(
        "report_2024-01-15.pdf"
      );
    });

    it("returns undefined when no filename present", () => {
      const disposition = "attachment";
      expect(parseFileNameFromDisposition(disposition)).toBeUndefined();
    });

    it("handles case-insensitive filename", () => {
      const disposition = 'attachment; FILENAME="test.pdf"';
      expect(parseFileNameFromDisposition(disposition)).toBe("test.pdf");
    });

    it("handles filename* with charset prefix", () => {
      const disposition = "attachment; filename*=iso-8859-1''test%20file.txt";
      expect(parseFileNameFromDisposition(disposition)).toBe("test file.txt");
    });

    it("prefers filename* over filename when both present", () => {
      const disposition =
        "attachment; filename=\"fallback.pdf\"; filename*=UTF-8''preferred.pdf";
      expect(parseFileNameFromDisposition(disposition)).toBe("preferred.pdf");
    });
  });
});

describe("backend API functions - extended tests", () => {
  describe("normalizePaginated", () => {
    it("normalizes array to paginated response", () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = normalizePaginated(data);
      expect(result.items).toEqual(data);
      expect(result.total).toBe(2);
    });

    it("returns paginated response with items as-is", () => {
      const data = {
        items: [{ id: 1 }],
        total: 1,
      };
      const result = normalizePaginated(data);
      expect(result.items).toEqual([{ id: 1 }]);
    });

    it("handles undefined data", () => {
      const result = normalizePaginated(undefined);
      expect(result.items).toEqual([]);
    });

    it("handles empty array", () => {
      const result = normalizePaginated([]);
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("converts results to items for DRF shape", () => {
      const data = {
        results: [{ id: 1 }, { id: 2 }],
        count: 2,
        next: null,
        previous: null,
      };
      const result = normalizePaginated(data as any);
      expect(result.items).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });
});
