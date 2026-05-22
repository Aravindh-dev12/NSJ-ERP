/**
 * Playwright E2E Testing Configuration
 *
 * Optimized for speed with single browser and parallel execution
 */

import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT || 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true, // Run tests in parallel for speed
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Reduced retries for speed
  workers: process.env.CI ? 2 : undefined, // Use 2 workers in CI for faster execution
  reporter: "html",
  timeout: 30000, // 30 seconds per test (reduced from default 30s)

  use: {
    baseURL,
    trace: "retain-on-failure", // Only keep traces on failure
    screenshot: "only-on-failure", // Only capture screenshots on failure
    video: "retain-on-failure", // Only keep videos on failure
  },

  // Run only on chromium for speed (can enable others if needed)
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  // Auto-start dev server before tests
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start server
  },
});
