import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";
import { AuthProvider } from "@/lib/auth";
import { describe, it, beforeEach, vi, expect } from "vitest";

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

describe("DashboardPage Overview section", () => {
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

  const renderDashboardPage = () =>
    render(
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    );

  it("renders overview section with monthly chart", async () => {
    renderDashboardPage();

    // Wait for the Overview section to render
    expect(await screen.findByText(/overview/i)).toBeInTheDocument();

    // Check for chart months
    expect(await screen.findByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Feb")).toBeInTheDocument();
    expect(screen.getByText("Dec")).toBeInTheDocument();
  });

  it("renders latest updates section with order info", async () => {
    renderDashboardPage();

    // Wait for latest updates section
    expect(await screen.findByText(/latest updates/i)).toBeInTheDocument();

    // Check for order-related updates
    const bodyText = document.body.textContent || "";
    expect(bodyText).toContain("total orders processed");
    expect(bodyText).toContain("currently active");
  });

  it("displays summary balances correctly", async () => {
    renderDashboardPage();

    // Wait for summary balances in overview section - use getAllByText since text appears multiple times
    const totalOrdersElements = await screen.findAllByText(/total orders/i);
    expect(totalOrdersElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/avg order value/i)).toBeInTheDocument();
  });

  it("renders export button in overview", async () => {
    renderDashboardPage();

    // Wait for export button
    expect(await screen.findByText(/export/i)).toBeInTheDocument();
  });

  it("displays orders legend in chart", async () => {
    renderDashboardPage();

    // Wait for orders legend
    expect(await screen.findByText("Orders")).toBeInTheDocument();
  });
});
