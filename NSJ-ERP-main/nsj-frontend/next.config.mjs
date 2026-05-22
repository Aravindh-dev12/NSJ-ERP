/** @type {import('next').NextConfig} */

import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Next.js configuration
 *
 * Supports multiple deployment modes:
 * - Docker: Uses 'standalone' output for containerized deployment
 * - CloudFront: Uses 'export' for static site generation
 * - Development: No output specified for hot reloading
 */
const nextConfig = {
  // Output mode based on environment
  // DOCKER_BUILD=true -> standalone (for Docker containers)
  // For CI/production builds, use standalone since we have dynamic routes
  // Otherwise -> undefined (for development)
  output:
    process.env.DOCKER_BUILD === "true" || process.env.CI === "true"
      ? "standalone"
      : undefined,

  // Disable Next.js image optimization for static export
  // CloudFront can handle image optimization via Lambda@Edge if needed
  images: {
    unoptimized: true,
  },

  // Enable React strict mode for better development warnings
  reactStrictMode: true,

  // Remove X-Powered-By header for security
  poweredByHeader: false,

  // Add trailing slash to URLs for better static export compatibility
  trailingSlash: true,

  // Environment variables available to the browser
  // Note: NEXT_PUBLIC_ vars must be set at BUILD time for Docker
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  },

  // Temporarily ignore TypeScript and ESLint errors during build
  // TODO: Fix all type errors and re-enable type checking
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
