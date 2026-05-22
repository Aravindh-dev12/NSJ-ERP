# Copilot Ground Rules for `jsc-frontend`

## Architecture & Context

- Next.js App Router (`app/`) with static export (`next.config.mjs` uses `output: "export"`), so anything requiring SSR, middleware, or APIs is out of scope.
- Root layout wires global providers: `ThemeProvider`, `AuthProvider`, and `Toaster`. Client hooks (`useAuth`, `useToast`) assume that structure—never bypass it.
- Data access goes through `lib/api.ts`; the `api` helper wraps `fetch` with typed generics and automatic token refresh. Always import endpoints from `lib/constants.ts`.
- Auth state lives in `lib/auth.tsx`; components rely on `useAuth()` (re-exported from `hooks/useAuth.ts`). Guard protected pages with the existing pattern (check `user`, redirect via `router`).
- Until backend endpoints arrive, dashboards parse `/Raw data dump-June to August sales.csv` on the client (`useSalesData`, `lib/csvFilterData.ts`). Prefer reusing those helpers instead of duplicating CSV logic.
- `components/` is segmented by domain (`owner/`, `payment/`, `admin/`) and shared widgets; UI primitives reside under `components/ui/` (shadcn + Tailwind).

## Development Workflow

- Use Node 20 + pnpm 8 (`.nvmrc`, `package.json` engines). Install deps with `pnpm install` and start locally via `pnpm dev` (port 3000).
- Static build outputs to `out/` via `pnpm build`; CloudFront/S3 deployment assumes pure static assets.
- Primary quality gates: `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, and `pnpm test:e2e` (Playwright auto-spawns `pnpm dev`). Keep coverage thresholds ≥70% (see `vitest.config.ts`).
- Tests boot MSW handlers from `tests/setup.ts`; don’t mutate real fetch in tests—add handlers in `tests/mocks/server.ts` or within the spec.
- For CSV-dependent components, prefer injecting data via hooks/mocks in tests rather than hitting the network (MSW or hook overrides).

## Coding Conventions

- Path alias `@/*` points to repo root; favor it for imports to avoid relative climbs.
- Client components must start with `"use client"`; server components should avoid hooks. When adding hooks/UI state, convert the component to a client module.
- Tailwind is the styling default; leverage `cn` from `lib/utils.ts` for dynamic class composition. Keep component spacing and semantics aligned with existing shadcn patterns.
- Handle auth-aware flows by checking `useAuth().loading` before referencing `user`. Follow redirect patterns in `app/page.tsx` and `app/dashboard/page.tsx`.
- Use environment toggles carefully: `NEXT_PUBLIC_DASHBOARD_DEV_MODE` short-circuits auth/redirect logic for local dashboard work; keep this flag respected in new flows.
- When extending API interactions, surface typed errors via `ApiError` so UI layers can display toast feedback (see login page example).

## Contribution Tips

- Centralize shared logic in `lib/` or domain folders instead of scattering utilities.
- Update documentation when workflows change—`README.md`, `ONBOARDING.md`, and `DEPLOYMENT.md` are the canonical sources.
- After changes that touch build or tests, run the relevant pnpm scripts yourself; CI expects green lint, types, vitest, and playwright suites.
- Maintain accessibility: use shadcn components and lucide icons as demonstrated, ensure buttons/inputs carry labels, and reuse existing patterns for dropdowns and tables.
