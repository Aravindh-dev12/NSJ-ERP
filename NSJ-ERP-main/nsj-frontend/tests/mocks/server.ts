import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const API_BASE_URL =
  // Use nullish coalescing so an explicit empty string set in tests
  // (NEXT_PUBLIC_API_BASE_URL = "") is respected. This matches the
  // behavior in `lib/constants.ts` which uses ??, and prevents handlers
  // from being registered with an absolute host when tests intentionally
  // set an empty base URL.
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.example.com";

// Regex and fallback handlers for handshake/auth endpoints
const fallbackHandlers = [
  http.get(/.*\/auth\/me$/, () => {
    console.log("MSW responding to /auth/me (regex)");
    return HttpResponse.json({
      id: "1",
      email: "test@example.com",
      name: "Test User",
    });
  }),
  http.post(/.*\/auth\/logout$/, () => {
    console.log("MSW responding to /auth/logout (regex)");
    return HttpResponse.json({ success: true });
  }),
  http.get(/.*\/test$/, () => {
    console.log("MSW responding to /test (regex)");
    return HttpResponse.json({ data: "test" });
  }),
  http.get(/.*\/users$/, () => {
    console.log("MSW responding to /users (regex)");
    return HttpResponse.json({ users: ["John", "Jane"] });
  }),
  http.post(/.*\/users$/, async ({ request }) => {
    const body = await request.json();
    const safeBody = typeof body === "object" && body !== null ? body : {};
    console.log("MSW responding to /users (regex)", safeBody);
    return HttpResponse.json({ success: true });
  }),
];

export const handlers = [
  ...fallbackHandlers,
  // Login endpoint (regex, matches any base URL)
  http.post(/.*\/auth\/login$/, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (body.email === "test@example.com" && body.password === "password123") {
      return HttpResponse.json({
        access_token: "mock-access-token",
        token_type: "bearer",
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test User",
        },
      });
    }

    return HttpResponse.json(
      { code: "INVALID_CREDENTIALS", message: "Invalid credentials" },
      { status: 401 }
    );
  }),

  // Me endpoint
  http.get(`${API_BASE_URL}/auth/me`, () => {
    return HttpResponse.json({
      id: "1",
      email: "test@example.com",
      name: "Test User",
    });
  }),

  // Logout endpoint
  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Refresh endpoint
  http.post(`${API_BASE_URL}/auth/refresh`, () => {
    return HttpResponse.json({
      access_token: "refreshed-mock-token",
      token_type: "bearer",
    });
  }),

  // Dashboard summary
  http.get(`${API_BASE_URL}/dashboard/summary`, () => {
    return HttpResponse.json({
      totalUsers: 1234,
      activeProjects: 56,
      revenue: 98765,
      growth: 23.5,
    });
  }),
  // CSRF endpoint (some client code requests this during non-GET flows)
  http.get(/.*\/auth\/csrf$/, () => {
    return HttpResponse.json({ csrf: "mock-csrf" });
  }),
];

// Simulate backend filter and KPI endpoints
const mockKPIs = {
  totalSales: 29000,
  totalQuantity: 50,
  topProduct: "Filters",
  topCustomer: "ABC Labs",
};

const mockFilters = {
  invoiceDates: ["2025-06-01", "2025-06-02", "2025-06-03", "2025-06-04"],
  partyNames: ["ABC Labs", "XYZ Chemicals", "LabTech"],
  cities: ["Mumbai", "Delhi", "Bangalore"],
  states: ["Maharashtra", "Delhi", "Karnataka"],
  productCategories: ["Filters", "Thimbles"],
  salesPersons: ["Rahul", "Shishir", "Elumalai"],
};

export const server = setupServer(...handlers);
// Fallback handlers for unmatched /auth/me and /auth/logout requests
// Note: lifecycle (server.listen/reset/close) is handled from tests/setup.ts
// to allow the test harness to control MSW options (e.g. onUnhandledRequest).

server.use(
  http.get("/api/dashboard/kpis", () => {
    return HttpResponse.json(mockKPIs);
  }),
  http.get("/api/dashboard/filters", () => {
    return HttpResponse.json(mockFilters);
  }),
  // Intercept /auth/me and /auth/logout with and without API_BASE_URL
  http.get(/.*\/auth\/me$/, () => {
    return HttpResponse.json({
      id: "1",
      email: "test@example.com",
      name: "Test User",
    });
  }),
  http.post(/.*\/auth\/logout$/, () => {
    return HttpResponse.json({ success: true });
  }),
  // Handshake test endpoints (both /api/* and /*)
  http.get(/.*\/test$/, () => {
    return HttpResponse.json({ message: "ok" });
  }),
  http.get(/.*\/users$/, () => {
    return HttpResponse.json([{ id: 1, name: "John" }]);
  }),
  http.post(/.*\/users$/, async ({ request }) => {
    const body = await request.json();
    const safeBody = typeof body === "object" && body !== null ? body : {};
    return HttpResponse.json({ id: 2, ...safeBody });
  }),
  http.get("/api/test", () => {
    return HttpResponse.json({ message: "ok" });
  }),
  http.get("/api/users", () => {
    return HttpResponse.json([{ id: 1, name: "John" }]);
  }),
  http.post("/api/users", async ({ request }) => {
    const body = await request.json();
    const safeBody = typeof body === "object" && body !== null ? body : {};
    return HttpResponse.json({ id: 2, ...safeBody });
  })
);

// Generic fallback handlers to avoid test flakes when new endpoints are
// touched by code but not specifically mocked. These run last and return
// safe defaults. Specific handlers above take precedence.
server.use(
  http.get(/.*/, ({ request }) => {
    // Return an empty JSON object for unknown GETs
    return HttpResponse.json({});
  }),
  http.post(/.*/, async ({ request }) => {
    // Echo back JSON body when possible
    try {
      const body = await request.json();
      return HttpResponse.json(body ?? {});
    } catch {
      return HttpResponse.json({});
    }
  }),
  http.put(/.*/, async ({ request }) => {
    try {
      const body = await request.json();
      return HttpResponse.json(body ?? {});
    } catch {
      return HttpResponse.json({});
    }
  }),
  http.patch(/.*/, async ({ request }) => {
    try {
      const body = await request.json();
      return HttpResponse.json(body ?? {});
    } catch {
      return HttpResponse.json({});
    }
  }),
  http.delete(/.*/, () => {
    return HttpResponse.text("");
  })
);
