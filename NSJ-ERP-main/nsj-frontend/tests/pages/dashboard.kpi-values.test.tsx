import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";
import { AuthProvider } from "@/lib/auth";
import { describe, it, beforeEach, vi, expect } from "vitest";

// Mock next/navigation at module level
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: "/dashboard",
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-themes at module level
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
  }),
}));

// Mock responses for dashboard API endpoints
const MOCK_DASHBOARD_STATS = {
  active_orders: 5,
  completed_orders: 23,
  total_orders: 28,
  total_sales: 150000,
  avg_order_value: 6521.74,
  orders_trend: 12.5,
  monthly_data: [
    { month: "Jan", orders: 2 },
    { month: "Feb", orders: 3 },
    { month: "Mar", orders: 4 },
    { month: "Apr", orders: 2 },
    { month: "May", orders: 5 },
    { month: "Jun", orders: 3 },
    { month: "Jul", orders: 2 },
    { month: "Aug", orders: 4 },
    { month: "Sep", orders: 1 },
    { month: "Oct", orders: 0 },
    { month: "Nov", orders: 1 },
    { month: "Dec", orders: 1 },
  ],
};

const MOCK_GOLD_RATE = {
  price_per_gram_24k: 7900,
  change: 50,
  change_percent: 0.64,
  source: "goldapi.io",
  cached: false,
};

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
  }),
}));

describe("DashboardPage KPI card values", () => {
  beforeEach(() => {
    localStorage.clear();
    server.use(
      http.get(/.*\/dashboard\/stats\/$/, () => {
        return HttpResponse.json(MOCK_DASHBOARD_STATS);
      }),
      http.get(/.*\/gold-rate\/$/, () => {
        return HttpResponse.json(MOCK_GOLD_RATE);
      })
    );
  });

  const renderDashboardPage = () => {
    // Set up auth token for tests
    localStorage.setItem("auth_token", "mock-token");

    return render(
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    );
  };

  it("renders correct values in KPI cards", async () => {
    renderDashboardPage();

    // Wait for values to appear (Indian currency/number formatting)
    await waitFor(() => {
      // Active orders - 5 appears in KPI and chart, use getAllByText
      const fiveElements = screen.getAllByText("5");
      expect(fiveElements.length).toBeGreaterThanOrEqual(1);

      // Completed orders
      expect(screen.getByText("23")).toBeInTheDocument();

      // Total sales (₹1,50,000) - appears multiple times
      const salesElements = screen.getAllByText("₹1,50,000");
      expect(salesElements.length).toBeGreaterThanOrEqual(1);

      // Gold rate (₹7,900/g) - appears multiple times
      const goldRateElements = screen.getAllByText(/₹7,900/);
      expect(goldRateElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("displays trend percentages correctly", async () => {
    renderDashboardPage();

    await waitFor(() => {
      // Orders trend (+12.5% from orders_trend in API)
      expect(screen.getByText(/\+12.5%/)).toBeInTheDocument();

      // Gold rate change (+0.64%)
      expect(screen.getByText(/\+0\.64%/)).toBeInTheDocument();
    });
  });

  it("displays average order value", async () => {
    renderDashboardPage();

    await waitFor(() => {
      // Average order value (₹6,522) - appears multiple times
      const avgElements = screen.getAllByText("₹6,522");
      expect(avgElements.length).toBeGreaterThanOrEqual(1);
    });
  });
});
