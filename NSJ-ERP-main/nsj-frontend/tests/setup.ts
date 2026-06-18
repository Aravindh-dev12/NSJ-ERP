// Ensure test environment uses path-only API endpoints so MSW handlers that
// register path-only routes (e.g. "/auth/login") match requests. Set
// NEXT_PUBLIC_API_BASE_URL to empty BEFORE importing `lib/constants`.
process.env.NEXT_PUBLIC_API_BASE_URL = "";
// Always run dashboard in non-dev mode for tests
process.env.NEXT_PUBLIC_DASHBOARD_DEV_MODE = "false";
import { API_BASE_URL } from "../lib/constants";
console.log("TEST SETUP: API_BASE_URL:", API_BASE_URL);
console.log("TEST SETUP: NODE_ENV:", process.env.NODE_ENV);
import "@testing-library/jest-dom";
import { server } from "./mocks/server";
import { beforeAll, afterEach, afterAll, vi } from "vitest";

// Mock window.matchMedia for next-themes
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
