import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardPage from "@/app/dashboard/page";
import { AuthProvider } from "@/lib/auth";

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

describe("DashboardPage", () => {
  // Helper to render the dashboard page with providers
  const renderDashboardPage = () => {
    // Set up auth token for tests
    localStorage.setItem("auth_token", "mock-token");

    return render(
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    );
  };

  // Register MSW handlers for dashboard endpoints before each test
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

  it("renders dashboard with KPI cards", async () => {
    renderDashboardPage();

    // Wait for KPI cards to appear - use getAllByText since text appears multiple times
    expect(await screen.findByText(/active orders/i)).toBeInTheDocument();
    // Orders completed appears in KPI and latest updates
    const ordersCompletedElements =
      await screen.findAllByText(/orders completed/i);
    expect(ordersCompletedElements.length).toBeGreaterThanOrEqual(1);
    // Total sales appears multiple times, use getAllByText
    const totalSalesElements = await screen.findAllByText(/total sales/i);
    expect(totalSalesElements.length).toBeGreaterThanOrEqual(1);
    // Gold rate appears multiple times
    const goldRateElements = await screen.findAllByText(/gold rate/i);
    expect(goldRateElements.length).toBeGreaterThanOrEqual(1);
    // Average order value appears multiple times
    const avgOrderElements = await screen.findAllByText(/average order value/i);
    expect(avgOrderElements.length).toBeGreaterThanOrEqual(1);
  });

  it("displays user information", async () => {
    renderDashboardPage();

    // Wait for user info to appear (Guest when not authenticated in test)
    const guestElements = await screen.findAllByText(/guest/i);
    expect(guestElements.length).toBeGreaterThanOrEqual(1);
    const guestHandleElements = await screen.findAllByText(/@guest/i);
    expect(guestHandleElements.length).toBeGreaterThanOrEqual(1);
  });

  it("displays KPI values from API", async () => {
    renderDashboardPage();

    // Wait for data to load and check values - use getAllByText since values appear in chart too
    await waitFor(() => {
      // Check for active orders count (5 appears in KPI and chart)
      const fiveElements = screen.getAllByText("5");
      expect(fiveElements.length).toBeGreaterThanOrEqual(1);
      // Check for completed orders count
      expect(screen.getByText("23")).toBeInTheDocument();
    });
  });

  it("displays gold rate card with price", async () => {
    renderDashboardPage();

    // Wait for gold rate to appear - use getAllByText since it appears multiple times
    const goldRateLabels = await screen.findAllByText(/gold rate/i);
    expect(goldRateLabels.length).toBeGreaterThanOrEqual(1);
    // Check for gold rate value (₹7,900/g) - appears in KPI and latest updates
    await waitFor(() => {
      const goldRateValues = screen.getAllByText(/₹7,900/);
      expect(goldRateValues.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("displays overview section with chart", async () => {
    renderDashboardPage();

    // Wait for overview section
    expect(await screen.findByText(/overview/i)).toBeInTheDocument();
    // Check for export button
    expect(screen.getByText(/export/i)).toBeInTheDocument();
  });

  it("displays latest updates section", async () => {
    renderDashboardPage();

    // Wait for latest updates section
    expect(await screen.findByText(/latest updates/i)).toBeInTheDocument();
  });

  it("displays monthly chart data", async () => {
    renderDashboardPage();

    // Wait for chart months to appear
    await waitFor(() => {
      expect(screen.getByText("Jan")).toBeInTheDocument();
      expect(screen.getByText("Feb")).toBeInTheDocument();
      expect(screen.getByText("Dec")).toBeInTheDocument();
    });
  });

  it("shows trend percentage in KPI cards", async () => {
    renderDashboardPage();

    // Wait for trend badges to appear
    await waitFor(() => {
      // Check for orders trend percentage (orders_trend from API is 12.5)
      expect(screen.getByText(/\+12.5%/)).toBeInTheDocument();
    });
  });

  it("handles API error gracefully with fallback values", async () => {
    // Override handlers to return errors
    server.use(
      http.get("http://localhost:8000/api/dashboard/stats/", () => {
        return HttpResponse.error();
      }),
      http.get("http://localhost:8000/api/gold-rate/", () => {
        return HttpResponse.error();
      })
    );

    renderDashboardPage();

    // Should still render with fallback/zero values
    expect(await screen.findByText(/active orders/i)).toBeInTheDocument();
    // Gold Rate appears in multiple places, use getAllByText
    const goldRateElements = await screen.findAllByText(/gold rate/i);
    expect(goldRateElements.length).toBeGreaterThanOrEqual(1);
  });

  it("displays summary balances in overview", async () => {
    renderDashboardPage();

    // Wait for summary balances - use getAllByText since text appears multiple times
    await waitFor(() => {
      const totalOrdersElements = screen.getAllByText(/total orders/i);
      expect(totalOrdersElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/avg order value/i)).toBeInTheDocument();
      // Total sales appears in multiple places
      const totalSalesElements = screen.getAllByText(/total sales/i);
      expect(totalSalesElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders user initials avatar", async () => {
    renderDashboardPage();

    // Wait for user initials to appear (GU for Guest)
    expect(await screen.findByText("GU")).toBeInTheDocument();
  });

  it("displays gold rate change percentage", async () => {
    renderDashboardPage();

    // Wait for gold rate change to appear
    await waitFor(() => {
      // Check for positive change indicator
      expect(screen.getByText(/\+0\.64%/)).toBeInTheDocument();
    });
  });

  it("shows correct badge colors for positive trends", async () => {
    renderDashboardPage();

    // Wait for badges to render
    await waitFor(() => {
      // Find gold rate badge with green color for positive change
      const goldBadge = screen.getByText(/\+0\.64%/);
      expect(goldBadge.className).toContain("bg-green");
    });
  });

  it("handles zero values correctly", async () => {
    server.use(
      http.get(/.*\/dashboard\/stats\/$/, () => {
        return HttpResponse.json({
          ...MOCK_DASHBOARD_STATS,
          active_orders: 0,
          total_sales: 0,
        });
      })
    );

    renderDashboardPage();

    // Should display zero values properly
    await waitFor(() => {
      // Check for "0" active orders
      expect(screen.getByText("Active Orders")).toBeInTheDocument();
      // The component shows "0" for active orders
      const activeOrdersCard = screen
        .getByText("Active Orders")
        .closest("div")?.parentElement;
      expect(activeOrdersCard).toHaveTextContent("0");
    });
  });

  it("displays orders legend in chart section", async () => {
    renderDashboardPage();

    // Wait for orders legend
    expect(await screen.findByText("Orders")).toBeInTheDocument();
  });
});
