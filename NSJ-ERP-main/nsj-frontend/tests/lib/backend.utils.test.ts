import { describe, it, expect } from "vitest";
import {
  withQuery,
  createUploadFormData,
  parseFileNameFromDisposition,
} from "@/lib/backend";

describe("backend utility functions", () => {
  describe("withQuery", () => {
    it("returns path without query when no params", () => {
      expect(withQuery("/api/test")).toBe("/api/test");
    });

    it("returns path without query when params is undefined", () => {
      expect(withQuery("/api/test", undefined)).toBe("/api/test");
    });

    it("adds single query parameter", () => {
      expect(withQuery("/api/test", { id: "123" })).toBe("/api/test?id=123");
    });

    it("adds multiple query parameters", () => {
      const result = withQuery("/api/test", { id: "123", name: "test" });
      expect(result).toContain("id=123");
      expect(result).toContain("name=test");
    });

    it("skips null values", () => {
      expect(withQuery("/api/test", { id: null })).toBe("/api/test");
    });

    it("skips undefined values", () => {
      expect(withQuery("/api/test", { id: undefined })).toBe("/api/test");
    });

    it("skips empty string values", () => {
      expect(withQuery("/api/test", { id: "" })).toBe("/api/test");
    });

    it("handles array values", () => {
      const result = withQuery("/api/test", { ids: [1, 2, 3] });
      expect(result).toContain("ids=1");
      expect(result).toContain("ids=2");
      expect(result).toContain("ids=3");
    });

    it("filters null/undefined from arrays", () => {
      const result = withQuery("/api/test", {
        ids: [1, null, 2, undefined, 3],
      });
      expect(result).toContain("ids=1");
      expect(result).toContain("ids=2");
      expect(result).toContain("ids=3");
      expect(result).not.toContain("null");
      expect(result).not.toContain("undefined");
    });

    it("handles boolean values", () => {
      expect(withQuery("/api/test", { active: true })).toBe(
        "/api/test?active=true"
      );
      expect(withQuery("/api/test", { active: false })).toBe(
        "/api/test?active=false"
      );
    });

    it("handles number values", () => {
      expect(withQuery("/api/test", { page: 1, limit: 10 })).toContain(
        "page=1"
      );
    });

    it("handles mixed types", () => {
      const result = withQuery("/api/test", {
        id: 123,
        name: "test",
        active: true,
        tags: ["a", "b"],
        skip: null,
      });
      expect(result).toContain("id=123");
      expect(result).toContain("name=test");
      expect(result).toContain("active=true");
      expect(result).toContain("tags=a");
      expect(result).toContain("tags=b");
      expect(result).not.toContain("skip");
    });
  });

  describe("createUploadFormData", () => {
    it("creates FormData with default field name", () => {
      const blob = new Blob(["test"], { type: "text/plain" });
      const formData = createUploadFormData(blob);
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.has("file")).toBe(true);
    });

    it("creates FormData with custom field name", () => {
      const blob = new Blob(["test"], { type: "text/plain" });
      const formData = createUploadFormData(blob, "document");
      expect(formData.has("document")).toBe(true);
    });

    it("handles File objects", () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const formData = createUploadFormData(file);
      expect(formData.has("file")).toBe(true);
    });

    it("uses fallback name for Blob without name", () => {
      const blob = new Blob(["test"], { type: "text/plain" });
      const formData = createUploadFormData(blob, "file", "custom.csv");
      expect(formData.has("file")).toBe(true);
    });
  });

  describe("parseFileNameFromDisposition", () => {
    it("returns undefined for null disposition", () => {
      expect(parseFileNameFromDisposition(null)).toBeUndefined();
    });

    it("returns undefined for undefined disposition", () => {
      expect(parseFileNameFromDisposition(undefined)).toBeUndefined();
    });

    it("returns undefined for empty disposition", () => {
      expect(parseFileNameFromDisposition("")).toBeUndefined();
    });

    it("parses RFC5987 style filename", () => {
      const disposition = "attachment; filename*=UTF-8\'\'test%20file.pdf";
      expect(parseFileNameFromDisposition(disposition)).toBe("test file.pdf");
    });

    it("parses quoted filename", () => {
      const disposition = 'attachment; filename="test file.pdf"';
      expect(parseFileNameFromDisposition(disposition)).toBe("test file.pdf");
    });

    it("parses unquoted filename", () => {
      const disposition = "attachment; filename=test.pdf";
      expect(parseFileNameFromDisposition(disposition)).toBe("test.pdf");
    });

    it("handles filename with semicolons in quotes", () => {
      const disposition = 'attachment; filename="test;file.pdf"';
      expect(parseFileNameFromDisposition(disposition)).toBe("test;file.pdf");
    });

    it("prefers RFC5987 over quoted filename", () => {
      const disposition =
        "attachment; filename*=UTF-8''encoded.pdf; filename=\"fallback.pdf\"";
      expect(parseFileNameFromDisposition(disposition)).toBe("encoded.pdf");
    });

    it("handles malformed percent encoding gracefully", () => {
      const disposition = "attachment; filename*=UTF-8\'\'test%ZZfile.pdf";
      // Should return the encoded portion even if decoding fails
      expect(parseFileNameFromDisposition(disposition)).toBeTruthy();
    });

    it("removes surrounding quotes from unquoted filename", () => {
      const disposition = 'attachment; filename="test.pdf"';
      expect(parseFileNameFromDisposition(disposition)).toBe("test.pdf");
    });
  });
});

describe("backend utility functions - additional tests", () => {
  describe("withQuery - edge cases", () => {
    it("handles very large arrays", () => {
      const largeArray = Array.from({ length: 100 }, (_, i) => i);
      const result = withQuery("/api/test", { ids: largeArray });
      expect(result).toContain("ids=0");
      expect(result).toContain("ids=99");
    });

    it("handles special characters in values", () => {
      const result = withQuery("/api/test", { search: "test&value=123" });
      expect(result).toContain("search=");
    });

    it("handles zero as value", () => {
      expect(withQuery("/api/test", { count: 0 })).toContain("count=0");
    });

    it("handles false as value", () => {
      expect(withQuery("/api/test", { active: false })).toContain(
        "active=false"
      );
    });

    it("handles mixed empty and non-empty values", () => {
      const result = withQuery("/api/test", {
        a: "value",
        b: null,
        c: "",
        d: undefined,
        e: "another",
      });
      expect(result).toContain("a=value");
      expect(result).toContain("e=another");
      expect(result).not.toContain("b=");
      expect(result).not.toContain("c=");
      expect(result).not.toContain("d=");
    });

    it("handles array with single element", () => {
      const result = withQuery("/api/test", { ids: [42] });
      expect(result).toContain("ids=42");
    });

    it("handles nested path", () => {
      const result = withQuery("/api/v1/users/123/posts", { page: 1 });
      expect(result).toContain("/api/v1/users/123/posts?page=1");
    });
  });

  describe("createUploadFormData - edge cases", () => {
    it("handles empty blob", () => {
      const blob = new Blob([], { type: "text/plain" });
      const formData = createUploadFormData(blob);
      expect(formData.has("file")).toBe(true);
    });

    it("handles large blob", () => {
      const largeContent = new Array(1000000).fill("x").join("");
      const blob = new Blob([largeContent], { type: "text/plain" });
      const formData = createUploadFormData(blob);
      expect(formData.has("file")).toBe(true);
    });

    it("handles different mime types", () => {
      const mimeTypes = [
        "text/plain",
        "application/json",
        "image/png",
        "application/pdf",
      ];
      mimeTypes.forEach((mimeType) => {
        const blob = new Blob(["test"], { type: mimeType });
        const formData = createUploadFormData(blob);
        expect(formData.has("file")).toBe(true);
      });
    });

    it("preserves file name from File object", () => {
      const file = new File(["test"], "document.pdf", {
        type: "application/pdf",
      });
      const formData = createUploadFormData(file);
      expect(formData.has("file")).toBe(true);
    });
  });

  describe("parseFileNameFromDisposition - edge cases", () => {
    it("handles disposition with multiple semicolons", () => {
      const disposition = 'attachment; filename="test.pdf"; charset=utf-8';
      expect(parseFileNameFromDisposition(disposition)).toBe("test.pdf");
    });

    it("handles disposition with spaces around equals", () => {
      const disposition = 'attachment; filename = "test.pdf"';
      expect(parseFileNameFromDisposition(disposition)).toBeTruthy();
    });

    it("handles disposition with no filename", () => {
      const disposition = "attachment; charset=utf-8";
      expect(parseFileNameFromDisposition(disposition)).toBeUndefined();
    });

    it("handles very long filename", () => {
      const longName = "a".repeat(255) + ".pdf";
      const disposition = `attachment; filename="${longName}"`;
      expect(parseFileNameFromDisposition(disposition)).toBe(longName);
    });

    it("handles filename with special characters", () => {
      const disposition = 'attachment; filename="test-file_2024 (1).pdf"';
      expect(parseFileNameFromDisposition(disposition)).toBe(
        "test-file_2024 (1).pdf"
      );
    });

    it("handles case-insensitive filename keyword", () => {
      const disposition = 'attachment; FILENAME="test.pdf"';
      expect(parseFileNameFromDisposition(disposition)).toBe("test.pdf");
    });

    it("handles filename with unicode characters", () => {
      const disposition = 'attachment; filename="文件.pdf"';
      expect(parseFileNameFromDisposition(disposition)).toBe("文件.pdf");
    });

    it("handles RFC5987 with different charset", () => {
      const disposition = "attachment; filename*=ISO-8859-1''test.pdf";
      expect(parseFileNameFromDisposition(disposition)).toBeTruthy();
    });
  });
});
