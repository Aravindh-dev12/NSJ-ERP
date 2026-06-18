import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../tests/mocks/server";
import { AuthProvider } from "@/lib/auth";
import DashboardPage from "../app/dashboard/page";
import { vi } from "vitest";

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

// Mock next/navigation for Next.js app router context
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("DashboardPage Backend Integration", () => {
  beforeEach(() => {
    server.use(
      http.get("http://localhost:8000/api/dashboard/stats/", () => {
        return HttpResponse.json(MOCK_DASHBOARD_STATS);
      }),
      http.get("http://localhost:8000/api/gold-rate/", () => {
        return HttpResponse.json(MOCK_GOLD_RATE);
      })
    );
  });

  it("renders KPIs from backend mock", async () => {
    render(
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    );

    // Wait for KPI cards to appear
    expect(await screen.findByText(/active orders/i)).toBeInTheDocument();

    // Check for KPI labels
    await waitFor(() => {
      expect(screen.getByText(/active orders/i)).toBeInTheDocument();
      const ordersCompletedElements = screen.getAllByText(/orders completed/i);
      expect(ordersCompletedElements.length).toBeGreaterThan(0);
    });

    // Check for total sales - appears multiple times
    const totalSalesElements = await screen.findAllByText(/total sales/i);
    expect(totalSalesElements.length).toBeGreaterThanOrEqual(1);

    // Check for gold rate
    const goldRateElements = await screen.findAllByText(/gold rate/i);
    expect(goldRateElements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders overview section with chart", async () => {
    render(
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    );

    // Wait for overview section
    expect(await screen.findByText(/overview/i)).toBeInTheDocument();

    // Check for chart months
    await waitFor(() => {
      expect(screen.getByText("Jan")).toBeInTheDocument();
      expect(screen.getByText("Dec")).toBeInTheDocument();
    });
  });

  it("displays trend percentages", async () => {
    render(
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    );

    // Wait for trend badges - check for any percentage format
    await waitFor(() => {
      // Look for any percentage badge (the dashboard shows various percentages)
      const percentElements = screen.getAllByText(/%/);
      expect(percentElements.length).toBeGreaterThan(0);
    });
  });
});
