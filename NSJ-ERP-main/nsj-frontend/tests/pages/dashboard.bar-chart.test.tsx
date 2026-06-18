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

describe("DashboardPage monthly chart content", () => {
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

  it("renders monthly chart with correct data and labels", async () => {
    renderDashboardPage();

    // Wait for the chart to appear (look for month labels)
    expect(await screen.findByText("Jan")).toBeInTheDocument();

    // Check all month labels
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    for (const month of months) {
      expect(screen.getByText(month)).toBeInTheDocument();
    }
  });

  it("displays orders legend", async () => {
    renderDashboardPage();

    // Wait for orders legend
    expect(await screen.findByText("Orders")).toBeInTheDocument();
  });

  it("displays chart values from API data", async () => {
    renderDashboardPage();

    // Wait for chart values to appear
    await waitFor(() => {
      // Check for some order values from the monthly data
      // May has 5 orders (highest)
      const fiveElements = screen.getAllByText("5");
      expect(fiveElements.length).toBeGreaterThanOrEqual(1);

      // Several months have 2 orders
      const twoElements = screen.getAllByText("2");
      expect(twoElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("displays export button", async () => {
    renderDashboardPage();

    // Wait for export button
    expect(await screen.findByText(/export/i)).toBeInTheDocument();
  });
});
