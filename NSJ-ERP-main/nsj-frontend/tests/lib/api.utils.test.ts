/**
 * Unit tests for api.ts utility functions and error handling.
 * Covers token helpers, ApiError, and apiFetch error cases.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as apiModule from "@/lib/api";

const ACCESS_TOKEN_STORAGE_KEY = apiModule.ACCESS_TOKEN_STORAGE_KEY;

describe("api.ts utility functions and error cases", () => {
  beforeEach(() => {
    // Reset token state
    apiModule.clearAuthToken();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    }
  });

  it("setAuthToken and getAuthToken work as expected", () => {
    apiModule.setAuthToken("abc");
    expect(apiModule.getAuthToken()).toBe("abc");
    apiModule.clearAuthToken();
    expect(apiModule.getAuthToken()).toBeNull();
  });

  it("setAuthToken stores token in localStorage if window is defined", () => {
    if (typeof window !== "undefined") {
      apiModule.setAuthToken("xyz");
      expect(window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe("xyz");
      apiModule.clearAuthToken();
      expect(window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
    }
  });

  it("ApiError sets properties correctly", () => {
    const err = new apiModule.ApiError(401, "ERR", "fail");
    expect(err.status).toBe(401);
    expect(err.code).toBe("ERR");
    expect(err.message).toBe("fail");
    expect(err.name).toBe("ApiError");
  });

  it("apiFetch throws ApiError on network error", async () => {
    // Simulate fetch throwing
    const origFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error("fail"));
    await expect(apiModule.apiFetch("/fail")).rejects.toThrow(
      apiModule.ApiError
    );
    global.fetch = origFetch;
  });

  it("apiFetch throws ApiError on non-JSON error response", async () => {
    const origFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("fail")),
      headers: { get: () => "text/plain" },
    });
    await expect(apiModule.apiFetch("/fail")).rejects.toThrow(
      apiModule.ApiError
    );
    global.fetch = origFetch;
  });

  it("apiFetch returns empty object for non-JSON response", async () => {
    const origFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "text/plain" },
      json: () => Promise.resolve({}),
    });
    const result = await apiModule.apiFetch("/plain");
    expect(result).toEqual({});
    global.fetch = origFetch;
  });
});
