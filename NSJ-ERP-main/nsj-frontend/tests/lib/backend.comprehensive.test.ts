/**
 * Comprehensive tests for backend API functions
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch
global.fetch = vi.fn();

describe("Backend API Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("vouchersList", () => {
    it("should fetch vouchers list", async () => {
      const mockResponse = {
        results: [{ id: "123", bill_no: "ORD-001" }],
        count: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { vouchersList } = await import("@/lib/backend");
      const result = await vouchersList({});

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/vouchers/"),
        expect.any(Object)
      );
    });

    it("should handle search parameter", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0 }),
      });

      const { vouchersList } = await import("@/lib/backend");
      await vouchersList({ search: "ORD-001" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("search=ORD-001"),
        expect.any(Object)
      );
    });

    it("should handle pagination parameters", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0 }),
      });

      const { vouchersList } = await import("@/lib/backend");
      await vouchersList({ page: 2, page_size: 20 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("page=2"),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("page_size=20"),
        expect.any(Object)
      );
    });
  });

  describe("voucherDetail", () => {
    it("should fetch single voucher", async () => {
      const mockVoucher = {
        id: "123",
        bill_no: "ORD-001",
        item_name: "Gold Ring",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoucher,
      });

      const { voucherDetail } = await import("@/lib/backend");
      const result = await voucherDetail("123");

      expect(result).toEqual(mockVoucher);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/vouchers/123/"),
        expect.any(Object)
      );
    });

    it("should throw error for non-existent voucher", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { voucherDetail } = await import("@/lib/backend");

      await expect(voucherDetail("999")).rejects.toThrow();
    });
  });

  describe("voucherDelete", () => {
    it("should delete voucher", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const { voucherDelete } = await import("@/lib/backend");
      await voucherDelete("123");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/vouchers/123/"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("accountsList", () => {
    it("should fetch accounts list", async () => {
      const mockResponse = {
        results: [{ id: "123", account_name: "John Doe" }],
        count: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { accountsList } = await import("@/lib/backend");
      const result = await accountsList({});

      expect(result).toEqual(mockResponse);
    });

    it("should handle search parameter", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0 }),
      });

      const { accountsList } = await import("@/lib/backend");
      await accountsList({ search: "John" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("search=John"),
        expect.any(Object)
      );
    });
  });

  describe("accountDetail", () => {
    it("should fetch single account", async () => {
      const mockAccount = {
        id: "123",
        account_name: "John Doe",
        contact: { phone: "1234567890" },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccount,
      });

      const { accountDetail } = await import("@/lib/backend");
      const result = await accountDetail("123");

      expect(result).toEqual(mockAccount);
    });
  });

  describe("salesQueryList", () => {
    it("should fetch sales queries list", async () => {
      const mockResponse = {
        results: [{ id: "123", item_name: "Gold Ring" }],
        count: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { salesQueryList } = await import("@/lib/backend");
      const result = await salesQueryList({});

      expect(result).toEqual(mockResponse);
    });
  });

  describe("exportVouchersAll", () => {
    it("should export all vouchers as Excel", async () => {
      const mockBlob = new Blob(["test"], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
        headers: {
          get: (name: string) => {
            if (name === "content-disposition") {
              return 'attachment; filename="orders_data.xlsx"';
            }
            return null;
          },
        },
      });

      const { exportVouchersAll } = await import("@/lib/backend");
      const result = await exportVouchersAll();

      expect(result.blob).toEqual(mockBlob);
      expect(result.fileName).toBe("orders_data.xlsx");
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const { vouchersList } = await import("@/lib/backend");

      await expect(vouchersList({})).rejects.toThrow("Network error");
    });

    it("should handle 401 unauthorized", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { vouchersList } = await import("@/lib/backend");

      await expect(vouchersList({})).rejects.toThrow();
    });

    it("should handle 500 server error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { vouchersList } = await import("@/lib/backend");

      await expect(vouchersList({})).rejects.toThrow();
    });
  });

  describe("Authentication Headers", () => {
    it("should include credentials in requests", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0 }),
      });

      const { vouchersList } = await import("@/lib/backend");
      await vouchersList({});

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        })
      );
    });

    it("should include content-type header for POST requests", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123" }),
      });

      const { accountCreate } = await import("@/lib/backend");
      await accountCreate({ account_name: "Test" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });
  });

  describe("Query Parameter Building", () => {
    it("should build query string correctly", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0 }),
      });

      const { vouchersList } = await import("@/lib/backend");
      await vouchersList({
        search: "test",
        page: 2,
        page_size: 20,
        status: "active",
      });

      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain("search=test");
      expect(callUrl).toContain("page=2");
      expect(callUrl).toContain("page_size=20");
      expect(callUrl).toContain("status=active");
    });

    it("should handle empty query parameters", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0 }),
      });

      const { vouchersList } = await import("@/lib/backend");
      await vouchersList({});

      const callUrl = (global.fetch as any).mock.calls[0][0];
      expect(callUrl).not.toContain("undefined");
      expect(callUrl).not.toContain("null");
    });
  });
});
