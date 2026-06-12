# Project Architecture & Flow Guide

This document captures the mental model you need to work effectively inside the `jsc-frontend` codebase. It complements `README.md` (getting started), `ONBOARDING.md` (new dev workflow), and `DEPLOYMENT.md` (CloudFront static export).

- [System Overview](#system-overview)
- [Runtime Flows](#runtime-flows)
- [Directory Map](#directory-map)
- [UI Composition Patterns](#ui-composition-patterns)
- [Data & API Layer](#data--api-layer)
- [State & Providers](#state--providers)
- [Styling System](#styling-system)
- [Testing Strategy](#testing-strategy)
- [Build & Deployment](#build--deployment)
- [Developer Workflow](#developer-workflow)
- [Extensibility Checklist](#extensibility-checklist)

## System Overview

```
Browser (Next.js App Router, client-side routing)
│
├─ Global Providers (`app/layout.tsx`)
│    ├─ `ThemeProvider` → theming via `next-themes`
│    ├─ `AuthProvider` → Session-backed auth context (Django cookies)
│    └─ `Toaster` → shadcn toast notifications
│
├─ Pages (`app/`)
│    ├─ `page.tsx` → Auth-aware root redirector
│    ├─ `dashboard/page.tsx` → Dashboard shell & widgets
│    ├─ `accounts/` → Overview, list, and creation flows for ledger masters
│    ├─ `login/page.tsx` → Credential-based login form
│    └─ `logout/page.tsx` → Clears auth and confirms sign-out
│
└─ Data Sources
  ├─ REST API (Django backend via HTTPS + session cookies)
  └─ CSV fallback (`public/Raw data dump-June to August sales.csv`) for dashboard analytics during backend bring-up
```

- The app runs in **static export mode** (`next.config.mjs` sets `output: "export"`). All dynamic work happens in the browser.
- Anything requiring server-side rendering, Middleware, or API routes is out of scope unless the static constraint is lifted.
- Node 20 + pnpm 8 are required (`.nvmrc`, `package.json` engines).

## Runtime Flows

### Authentication Lifecycle

1. `AuthProvider` (in `lib/auth.tsx`) loads on app start and hits `GET /api/auth/me` via `api.get`.
2. Responses are stored in local React state; missing/expired credentials clear the user.
3. Components gate UI by checking `const { user, loading } = useAuth()` via the re-exported hook (`hooks/useAuth.ts`).
4. Protected pages follow the pattern in `app/page.tsx` and `app/dashboard/page.tsx`:
   - Wait for `loading === false`.
   - Redirect to `/login` if `user` is null (unless `NEXT_PUBLIC_DASHBOARD_DEV_MODE === "true"`).
5. Logins post to `POST /api/auth/login`. The backend sets session cookies; the frontend only stores the returned user payload.
6. `apiFetch` auto-retries failed requests after running `POST /api/auth/refresh`, preventing duplicate refreshes via a shared promise (`lib/api.ts`). Mutating calls prime the CSRF token with `GET /api/auth/csrf` if required.

### Dashboard Data Flow

- Until the backend exposes analytics endpoints, charts and tables parse the bundled CSV.
- `components/useSalesData.ts` wraps Papa Parse with `header: true` and a `;` delimiter. Consumers filter the parsed `SalesRow` array.
- `lib/csvFilterData.ts` and `lib/csvPreview.ts` expose helper utilities for derived filters/columns to keep CSV parsing centralized.
- When the API becomes available, swap these helpers to call `api.get`—the rest of the components already consume shaped data.

### Navigation

- `components/SidebarNav.tsx` renders the left rail navigation with hover-based submenus. Active links highlight via pathname matching.
- `components/accounts/AccountsHeader.tsx` provides an intra-feature sub-nav (Overview/List/Add New) that keeps the accounts experience cohesive.
- `useRouter().replace(...)` still handles redirects in `app/page.tsx` (home) while `useRouter().push(...)` powers login/logout transitions.

## Directory Map

| Path             | Purpose                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| `app/`           | Next.js App Router tree (client components due to auth + hooks).                        |
| `components/`    | Reusable UI + domain modules (dashboard widgets, sidebar, accounts workspace).          |
| `components/ui/` | shadcn primitives (button, card, dropdown, input, toast, etc.).                         |
| `hooks/`         | Custom hooks; only `useAuth` and `use-toast` today.                                     |
| `lib/`           | Cross-cutting helpers: `api.ts`, `auth.tsx`, `constants.ts`, CSV utilities, `utils.ts`. |
| `tests/`         | Vitest unit/integration tests (React Testing Library + MSW).                            |
| `e2e/`           | Playwright specs. Dev server auto-spawns via `playwright.config.ts`.                    |
| `styles/`        | Global Tailwind stylesheet.                                                             |
| `public/`        | Static assets, including the CSV dataset.                                               |

## UI Composition Patterns

- **Root providers**: Always rely on `app/layout.tsx`; do not mount the theme, auth, or toaster providers manually inside components.
- **Domain separation**: Dashboard widgets live in `components/` at the root, while feature workspaces like accounts reside under their own folder (`components/accounts`).
- **CSV-driven visuals**: Shared charts live directly under `components/` (`RevenueOverTimeChart`, `TopCustomersBySalesChart`, etc.) and all read from `useSalesData`.
- **Accessibility**: Follow shadcn conventions—provide labels, use semantic tags, and keep icon buttons labelled (`aria-label` in login password toggle, etc.).

## Data & API Layer

- `lib/api.ts`
  - Wraps `fetch` with JSON serialization, cookie credentials, and typed generics.
  - Refreshes sessions on 401, retrying the original request after `POST /api/auth/refresh` succeeds.
  - Primes CSRF cookies on demand before mutating requests.
  - Throws `ApiError` with `status`, `code`, `message`. Surface messages in the UI via toasts when possible.
- `lib/constants.ts`
  - Centralizes `API_BASE_URL` (falls back to placeholder for local dev; returns empty string under test to let MSW intercept).
  - Houses endpoint strings (auth, accounts, dashboard summary). Always import from here.
- `lib/backend.ts`
  - Feature-specific helpers (accounts CRUD, invoice upload, etc.) that wrap the shared API client with typed payloads.
- Testing: `tests/mocks/server.ts` (MSW) mirrors the auth handshake, summary responses, and miscellaneous endpoints used in handshake tests.

## State & Providers

- `AuthProvider` manages user state with `React.useState`. `checkAuth` runs on mount and can be re-invoked after login/logout when needed.
- `use-toast` uses a reducer plus timeouts to manage a single active toast (`TOAST_LIMIT = 1`). UI components read from `components/ui/toaster` injected at the root.
- No global state management library—local component state + context cover current needs.

## Styling System

- Tailwind CSS with theme tokens defined in CSS variables (`styles/globals.css`).
- `lib/utils.ts` exposes `cn`, a thin wrapper around `clsx` + `tailwind-merge`, to combine class names without conflicts.
- Design tokens and animations live in `tailwind.config.ts`; container max-width is set to 1400px at `2xl`.
- shadcn/ui components under `components/ui/` define our baseline patterns; extend them before creating custom primitives.

## Testing Strategy

- **Unit/Component tests**: Vitest + React Testing Library (`tests/pages/**`, `tests/components/**`). Use the real providers, but mock navigation (`next/navigation`) to assert redirects.
- **Integration tests**: MSW intercepts network calls via `tests/setup.ts`. Do not stub `fetch` directly—add handlers to `tests/mocks/server.ts`.
- **Coverage thresholds**: 70% for lines, functions, branches, statements (`vitest.config.ts`).
- **E2E tests**: Playwright specs in `e2e/`. The config spins up `pnpm dev` automatically, runs Chromium only, and keeps artifacts on failure.

## Build & Deployment

- `pnpm build` triggers `next build` and static export → artifacts land in `/out`.
- Deploy by syncing `/out` to S3 and fronting with CloudFront (`DEPLOYMENT.md` includes scripts and GitHub Actions examples).
- Next image optimization is disabled (`images.unoptimized = true`). Perform CDN-level optimization if required.
- Security headers should be configured at the CDN layer (see docs for recommended values).

## Developer Workflow

- Ensure Node 20 (`nvm use`) and pnpm 8 (`pnpm --version`).
- Key scripts (`package.json`):
  - `pnpm dev` – dev server on port 3000.
  - `pnpm lint`, `pnpm typecheck` – CI gates.
  - `pnpm test:unit`, `pnpm test:e2e` – test suites.
  - `pnpm format`, `pnpm format:check` – Prettier.
- Husky hooks run lint-staged + commitlint. Follow Conventional Commit format (`feat(scope): message`).
- MSW logs API intercepts in tests; use them when debugging failing specs.
- `NEXT_PUBLIC_DASHBOARD_DEV_MODE` can be set to `true` to bypass auth redirects during local dashboard prototyping.

## Extensibility Checklist

Before adding a feature, sanity-check the following:

- [ ] **Auth awareness**: Does the page/component rely on `useAuth`? Handle `loading` state first, respect the dev mode flag, and never call hooks outside the provider tree.
- [ ] **Data access**: Can you reuse `api` or existing CSV utilities? If adding endpoints, register them in `lib/constants.ts` and write MSW handlers + Vitest coverage.
- [ ] **UI consistency**: Compose with shadcn primitives and follow domain separation (`components/owner`, etc.).
- [ ] **Tests**: Add unit specs in `tests/` and expand Playwright coverage when flows change. Leverage MSW rather than `fetch` mocks.
- [ ] **Docs & scripts**: Update `README.md`, `ONBOARDING.md`, or this file as workflows change.
- [ ] **Build constraints**: Confirm the feature works without server-side logic; static export is mandatory unless the deployment strategy changes.

For deeper onboarding steps, revisit `ONBOARDING.md`. For deployment specifics, use `DEPLOYMENT.md`. Keep this architecture guide updated as the system evolves.
