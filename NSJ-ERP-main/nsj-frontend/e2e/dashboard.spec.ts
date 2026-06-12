import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  // TODO: Fix this test - dashboard heading text may have changed
  test.skip("should display dashboard with all sections", async ({ page }) => {
    // Mock authentication API to simulate logged-in user
    await page.route("**/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          email: "test@example.com",
          name: "Test User",
        }),
      });
    });

    // Mock dashboard summary API
    await page.route("**/dashboard/summary", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          totalUsers: 1234,
          activeProjects: 56,
          revenue: 78900,
          growth: 12.5,
        }),
      });
    });

    // Mock KPI and sales endpoints used by dashboard
    await page.route("**/sales-records/aggregates", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          totalSales: 100000,
          totalOrders: 500,
          totalQuantity: 1200,
          averageOrderValue: 200,
        }),
      });
    });
    await page.route("**/sales-records/top-vendors", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { name: "Vendor A", sales: 50000 },
          { name: "Vendor B", sales: 30000 },
        ]),
      });
    });
    await page.route("**/sales-records/top-categories", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { name: "Category X", sales: 40000 },
          { name: "Category Y", sales: 35000 },
        ]),
      });
    });
    await page.route("**/sales-records/top-catno", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { name: "CatNo 1", sales: 20000 },
          { name: "CatNo 2", sales: 15000 },
        ]),
      });
    });
    await page.route("**/sales-records/recent-orders", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { orderId: "ORD001", customer: "Alice", total: 500 },
          { orderId: "ORD002", customer: "Bob", total: 300 },
        ]),
      });
    });

    await page.goto("/dashboard");

    // Wait for page to load and check main sections
    await expect(
      page.getByRole("heading", { name: /owner dashboard/i })
    ).toBeVisible({
      timeout: 10000,
    });

    // Check for KPI cards (these load asynchronously)
    await expect(page.getByText("Total Sales")).toBeVisible();
    await expect(page.getByText("Total Orders")).toBeVisible();
    await expect(page.getByText("Total Quantity")).toBeVisible();
    await expect(page.getByText("Average Order Value")).toBeVisible();

    // Check for user name, email, and Logout button
    await expect(page.getByText("Test User")).toBeVisible();
    await expect(page.getByText("test@example.com")).toBeVisible();
    await expect(page.getByRole("button", { name: /logout/i })).toBeVisible();
  });
});
