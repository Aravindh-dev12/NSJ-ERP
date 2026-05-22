# Multi-stage build for Next.js frontend
# Stage 1: Dependencies
FROM node:20-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.1 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.1 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    DOCKER_BUILD=true

# Build arguments for API URL - Railway passes this via railway.toml buildArgs
ARG NEXT_PUBLIC_API_BASE_URL=https://nsj-backend-production-6642.up.railway.app/api
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# Build the application
RUN echo "Building with NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}" && pnpm build

# Stage 3: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment variables
# Railway will provide PORT via environment variable, default to 3000 for local
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port (Railway will use its own PORT variable)
EXPOSE 3000

# Health check - use PORT variable if set, otherwise default to 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/ || exit 1

# Start the application
CMD ["node", "server.js"]
