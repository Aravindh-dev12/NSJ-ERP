import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

// Vitest configuration for unit and component testing
// Uses jsdom environment to simulate browser environment for React components
export default defineConfig({
  // @ts-ignore - Type mismatch between vite versions in dependencies
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true, // Enable global test APIs (describe, it, expect)
    environment: "jsdom", // Simulate browser environment for React testing
    setupFiles: ["./tests/setup.ts"], // Test setup file with MSW configuration
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
      "**/e2e/**", // E2E tests are handled by Playwright
    ],
    coverage: {
      provider: "v8", // Fast coverage provider
      reporter: ["text", "json", "html"], // Multiple coverage report formats
      exclude: [
        "node_modules/",
        "tests/",
        "e2e/",
        "*.config.*",
        ".next/",
        "out/",
        "playwright-report/",
        "**/*.d.ts",
        "**/*.config.ts",
        "**/*.config.js",
        "**/middleware.ts",
        "app/**", // Exclude Next.js app directory (mostly routing)
        "lib/constants.ts", // Exclude constants files
        "lib/types/**", // Exclude type definitions
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
  },
});
