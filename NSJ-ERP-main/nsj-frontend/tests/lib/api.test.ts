/**
 * Integration tests for the api.ts fetch wrapper and endpoint helpers.
 * Covers GET/POST requests and response handling using MSW.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { apiFetch, api } from "@/lib/api";
import { server } from "../mocks/server";
import { http, HttpResponse } from "msw";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.example.com";

describe("api.ts endpoint integration", () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it("makes a successful GET request and receives expected response", async () => {
    server.use(
      http.get(`${API_BASE_URL}/test`, () => {
        return HttpResponse.json({ data: "test" });
      })
    );
    const result = await apiFetch("/test");
    expect(result).toEqual({ data: "test" });
  });

  it("api.get makes GET request and receives expected response", async () => {
    server.use(
      http.get(`${API_BASE_URL}/users`, () => {
        return HttpResponse.json({ users: ["John", "Jane"] });
      })
    );
    const result = await api.get("/users");
    expect(result).toEqual({ users: ["John", "Jane"] });
  });

  it("api.post makes POST request and receives expected response", async () => {
    server.use(
      http.post(`${API_BASE_URL}/users`, () => {
        return HttpResponse.json({ success: true });
      })
    );
    const result = await api.post("/users", { name: "John" });
    expect(result).toEqual({ success: true });
  });
});
