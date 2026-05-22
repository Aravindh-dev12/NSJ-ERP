# NSJ Frontend

A production-grade Next.js 14+ frontend application with TypeScript, App Router, and modern best practices. The UI talks to the Django-based NSJ backend over HTTPS using cookie sessions (Django `sessionid`) and CSRF protection.

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Dashboard Overview](#-dashboard-overview)
- [Accounts Module](#-accounts-module)
- [API Playground](#-api-playground)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture

```
┌─────────────┐      HTTPS/CSRF      ┌─────────────┐
│             │  ←──────────────→    │             │
│  Next.js    │   (session cookies)  │   Django    │
│  Frontend   │                     │   Backend   │
│             │                     │             │
└─────────────┘                     └─────────────┘
  │
  ├─ App Router (SSG/Static Export)
  ├─ Tailwind CSS + shadcn/ui
  ├─ React Hook Form + Zod
  └─ Session refresh + CSRF bootstrap on demand
```

## 🚀 Tech Stack

### Core

- **Next.js 14+** - App Router with static export for CloudFront
- **TypeScript** - Strict mode enabled
- **React 18** - Server and client components

### UI & Styling

- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **lucide-react** - Icon library
- **next-themes** - Dark mode support (system default)

### Forms & Validation

- **react-hook-form** - Form state management
- **zod** - Schema validation

### Data Fetching & Auth

- **Custom fetch wrapper** - Typed API client in `lib/api.ts`
- **Session refresh & CSRF** - Handles 401 responses and primes the CSRF cookie automatically
- **Context-based auth** - `useAuth` hook for authentication state

### Testing

- **Vitest** - Unit and component tests
- **@testing-library/react** - React component testing
- **Playwright** - End-to-end testing
- **MSW (Mock Service Worker)** - API mocking

### Code Quality

- **ESLint** - next/core-web-vitals config
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting
- **commitlint** - Conventional commits

### Package Management

- **pnpm** - Fast, disk space efficient package manager
- **Node 20** - LTS version

## 🔐 Environment Variables

Create a `.env.local` file in the root directory (see `.env.example`):

| Variable                         | Description                  | Required | Default                     |
| -------------------------------- | ---------------------------- | -------- | --------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`       | Backend API base URL         | Yes      | `http://localhost:8000/api` |
| `NEXT_PUBLIC_DASHBOARD_DEV_MODE` | Bypass auth redirect locally | No       | `false`                     |
| `NODE_ENV`                       | Environment mode             | No       | `development`               |

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## 🏃 Getting Started

### Prerequisites

- Node.js 20+ (use `.nvmrc` for version management)
- pnpm 8+

### Installation

```bash
# Use the correct Node version
nvm use

# Install pnpm if not already installed
npm install -g pnpm

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your API URL
```

### Development

```bash
# Start development server
pnpm dev

# Open http://localhost:3000
```

## 📜 Available Scripts

| Script                  | Description                              |
| ----------------------- | ---------------------------------------- |
| `pnpm dev`              | Start development server on port 3000    |
| `pnpm build`            | Build for production (static export)     |
| `pnpm start`            | Start production server (local preview)  |
| `pnpm lint`             | Run ESLint                               |
| `pnpm format`           | Format code with Prettier                |
| `pnpm format:check`     | Check code formatting                    |
| `pnpm typecheck`        | Run TypeScript compiler check            |
| `pnpm test`             | Run all tests                            |
| `pnpm test:unit`        | Run unit/component tests                 |
| `pnpm test:e2e`         | Run Playwright e2e tests                 |
| `pnpm test:e2e:ui`      | Run Playwright in UI mode                |
| `pnpm test:e2e:install` | Install Playwright browsers (first time) |
| `pnpm test:watch`       | Run tests in watch mode                  |
| `pnpm coverage`         | Generate test coverage report            |

## � Dashboard Overview

The sales dashboard is fully **backend-driven** and pulls live metrics from the FastAPI service.

- **Filters sync with the API** – Amount, date, salesperson, city, and state inputs are forwarded to `/sales-records` through `backend.listSalesRecords`. Filter changes refresh both the table and the export payload.
- **Aggregate KPIs** – Summary tiles and ranking charts query `/sales-records/aggregates`, normalizing the response to surface top vendors, products, and salespeople alongside totals.
- **CSV export** – The **Export CSV** button issues a `POST /sales-records/export` request with the active filters flattened into the request body. Successful responses trigger a browser download and toast notification; failures bubble up typed `ApiError` messages.
- **Import-ready design** – The **Import Data** modal uploads CSV/XLSX files via the backend uploader endpoint using multipart form data.

> Development tip: set `NEXT_PUBLIC_DASHBOARD_DEV_MODE=true` in `.env.local` to bypass auth redirects while iterating locally.

## � Accounts Module

The accounts workspace delivers CRUD tooling for ledger masters backed by the Django API documented in `docs/api_accounts.md`.

- **Overview (`/accounts`)** – Quick stats (total, active, inactive) plus the five most recent accounts. Uses three `GET /api/accounts/` calls with different filter combinations.
- **List (`/accounts/list`)** – Paginated table with search, group, and status filters. Data comes from `GET /api/accounts/` and respects `page`, `page_size`, `group`, `status`, and `search` query params. Deletions call `DELETE /api/accounts/<id>/` with CSRF headers supplied by `apiFetch`.
- **Create (`/accounts/new`)** – Multi-section form powered by React Hook Form + Zod. The form loads masters from `GET /api/accounts/masters/` and submits to `POST /api/accounts/`. Only populated fields are sent—empty values are stripped before posting.

Implementation details:

1. `lib/constants.ts` registers the accounts endpoints, while `lib/backend.ts` exposes typed helpers (`accountsList`, `accountCreate`, `accountsMasters`, etc.).
2. `lib/api.ts` automatically primes the CSRF cookie (`GET /api/auth/csrf`) whenever a mutating request is issued and retries 401s via `POST /api/auth/refresh`.
3. UI components live in `components/accounts/` and share a consistent sub-nav (`AccountsHeader`) so deep-linking between overview, list, and form pages feels cohesive.
4. Toast notifications surface success and error states. When the backend returns validation errors, the top-level toast shows the message; extend the form to map field-level errors if needed.

Backend prerequisites:

- Your browser must allow third-party cookies when hitting a different backend port (e.g., `localhost:8000`).
- Call `GET /api/auth/csrf` (handled automatically) before any POST/PATCH/DELETE to satisfy Django CSRF requirements.
- Authenticate with `POST /api/auth/login` to receive the `sessionid` cookie. The frontend sends requests with `credentials: 'include'` so the session flows through transparently.

## �🧪 API Playground

Visit [`/api-test`](./app/api-test/page.tsx) to exercise the shared API client without leaving the app.

- Log in and fetch the current user with the same payloads used in production flows.
- Probe `GET /sales-records` and `GET /sales-records/aggregates` using the configurable filter form—the payload mirrors the dashboard’s filter contract.
- Trigger CSV exports through `POST /sales-records/export` and inspect response metadata. Each run captures status, message, and the request envelope for quick comparisons.
- Results are timestamped and stacked so you can diff backend fixes while iterating.

## �📁 Project Structure

```
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI pipeline
├── .husky/                     # Git hooks
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (providers + sidebar)
│   ├── page.tsx                # Home redirector
│   ├── accounts/
│   │   ├── page.tsx            # Accounts overview
│   │   ├── list/
│   │   │   └── page.tsx        # Accounts table view
│   │   └── new/
│   │       └── page.tsx        # Account creation form
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard shell
│   ├── login/
│   │   └── page.tsx            # Login page
│   └── logout/
│       └── page.tsx            # Logout confirmation
├── components/
│   ├── accounts/               # Accounts feature components
│   ├── dashboard-visuals.tsx   # Dashboard charts
│   ├── DashboardShell.tsx      # Dashboard layout
│   ├── SidebarNav.tsx          # Global sidebar
│   └── ui/                     # shadcn/ui primitives
├── e2e/                        # Playwright tests
│   ├── login.spec.ts
│   └── dashboard.spec.ts
├── hooks/
│   ├── useAuth.ts              # Auth hook
│   └── use-toast.ts            # Toast notifications
├── lib/
│   ├── api.ts                  # Typed fetch client with auto-refresh
│   ├── auth.tsx                # Auth context & provider
│   ├── constants.ts            # App constants
│   └── utils.ts                # Utility functions
├── public/                     # Static assets
├── styles/
│   └── globals.css             # Global styles & Tailwind
├── tests/
│   ├── mocks/
│   │   └── server.ts           # MSW setup
│   ├── pages/
│   │   ├── login.test.tsx
│   │   └── dashboard.test.tsx
│   └── setup.ts                # Test setup
├── .editorconfig               # Editor configuration
├── .env.example                # Environment variables template
├── .eslintrc.json              # ESLint configuration
├── .gitignore                  # Git ignore rules
├── .lintstagedrc.json          # lint-staged configuration
├── .nvmrc                      # Node version
├── .prettierrc                 # Prettier configuration
├── commitlint.config.cjs       # Commitlint configuration
├── next.config.mjs             # Next.js configuration
├── package.json                # Dependencies & scripts
├── playwright.config.ts        # Playwright configuration
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── vitest.config.ts            # Vitest configuration
```

## 🧪 Testing

### Unit & Component Tests

```bash
# Run all unit tests
pnpm test:unit

# Run in watch mode
pnpm test:watch

# Generate coverage
pnpm coverage
```

**Coverage Thresholds:**

- Lines: 50%
- Functions: 50%
- Branches: 50%
- Statements: 50%

### E2E Tests

**First Time Setup:**

```bash
# Install Playwright browsers (required before first run)
pnpm test:e2e:install
```

**Running Tests:**

```bash
# Run e2e tests (headless)
pnpm test:e2e

# Run with UI (interactive mode)
pnpm test:e2e:ui
```

**Note:** E2E tests use Playwright and require browser binaries to be installed. The CI workflow automatically installs them. For local development, run `pnpm test:e2e:install` once before running tests.

### MSW API Mocking

API responses are mocked using MSW in tests. Mock handlers are defined in `tests/mocks/server.ts`.

## ✨ Code Quality

### Linting & Formatting

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Check formatting
pnpm format:check

# Type check
pnpm typecheck
```

### Git Hooks

- **pre-commit**: Runs lint-staged (formats & lints staged files)
- **commit-msg**: Validates commit messages (conventional commits)

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
```

Examples:

```bash
git commit -m "feat(auth): add login page with validation"
git commit -m "fix(api): handle 401 token refresh properly"
git commit -m "docs: update deployment guide"
```

## 🚀 Deployment

### CloudFront + S3 (Recommended)

This is the **primary deployment method** for this static Next.js application. Docker is **NOT required** for CloudFront deployment as it serves pre-built static files.

#### Prerequisites

- AWS Account with S3 and CloudFront access
- AWS CLI configured with appropriate credentials

#### Build for Static Export

```bash
# Build static files (output in /out directory)
pnpm build
```

#### Deploy to S3 + CloudFront

1. **Create S3 Bucket**

   ```bash
   # Create bucket
   aws s3 mb s3://your-bucket-name --region us-east-1

   # Configure for static website hosting
   aws s3 website s3://your-bucket-name \
     --index-document index.html \
     --error-document index.html
   ```

2. **Upload Built Files**

   ```bash
   # Sync build output to S3 (--delete removes old files)
   aws s3 sync ./out s3://your-bucket-name --delete
   ```

3. **Create CloudFront Distribution**
   - **Origin**: S3 bucket website endpoint
   - **Default root object**: `index.html`
   - **Error pages**: Configure 404 → `/index.html` (200 response) for SPA routing
   - **Compression**: Enable gzip/brotli
   - **Security headers**: Configure in CloudFront Functions or Lambda@Edge:
     ```
     X-Frame-Options: SAMEORIGIN
     X-Content-Type-Options: nosniff
     X-XSS-Protection: 1; mode=block
     Strict-Transport-Security: max-age=31536000
     ```

4. **Invalidate Cache After Deploy**
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id YOUR_DIST_ID \
     --paths "/*"
   ```

#### CI/CD Pipeline Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to CloudFront
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Deploy to S3
        run: aws s3 sync ./out s3://${{ secrets.S3_BUCKET }} --delete
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CF_DIST_ID }} \
            --paths "/*"
```

#### Static Export Constraints

When using `output: "export"` mode:

- ❌ No server-side rendering (SSR)
- ❌ No API routes in Next.js
- ❌ No dynamic routes with `getServerSideProps`
- ❌ No middleware
- ✅ All rendering happens at build time or client-side

### Alternative: SSR with AWS Amplify or Vercel

For server-side features, consider:

1. **AWS Amplify Hosting** - Fully managed Next.js hosting with SSR support
2. **Vercel** - Official Next.js platform with zero-config deployment
3. **SST (Serverless Stack)** - Deploy to AWS Lambda with CDK

See respective platform documentation for SSR deployment.

## 🔒 Security

### Headers

Configure CloudFront/nginx with security headers:

```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';
```

### CORS

Backend must allow credentials:

```python
# FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Cookies

- `httpOnly`: Prevents XSS attacks
- `secure`: HTTPS only
- `sameSite`: CSRF protection

### Environment Variables

- Never commit `.env.local` or `.env`
- Use GitHub Secrets for CI/CD
- Rotate API keys regularly

## 🤝 Contributing

### PR Checklist

- [ ] Code follows project style guide
- [ ] All tests pass (`pnpm test`)
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Commit messages follow conventional commits
- [ ] Documentation updated if needed
- [ ] No sensitive data in commits

### Branch Strategy

- `main` - Production branch
- `develop` - Development branch
- Feature branches: `feat/feature-name`
- Bug fixes: `fix/bug-name`

### Code Review Process

1. Create PR to `develop` (or `main`)
2. CI must pass (quality, unit, build, e2e)
3. Require at least 1 approval
4. Squash and merge

## 🐛 Troubleshooting

### Common Issues

**Issue:** `pnpm install` fails

```bash
# Clear pnpm cache
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Issue:** Type errors after dependency update

```bash
# Rebuild TypeScript
pnpm typecheck
rm -rf .next
pnpm dev
```

**Issue:** Tests fail with network errors

```bash
# Ensure MSW is properly initialized
# Check tests/setup.ts and tests/mocks/server.ts
```

**Issue:** Build fails for static export

```bash
# Remove server-only features:
# - getServerSideProps
# - API routes
# - middleware
# Use getStaticProps or client-side fetching instead
```

**Issue:** 401 errors not triggering refresh

```bash
# Check lib/api.ts refresh logic
# Ensure backend /auth/refresh endpoint works
# Verify cookies are being sent (credentials: 'include')
```

### Getting Help

- Check [ONBOARDING.md](./ONBOARDING.md) for setup guidance
- Review backend API documentation
- Check GitHub Issues
- Contact the team in Slack/Discord

## 📄 License

[Add your license here]

## 👥 Team

See [CODEOWNERS](./CODEOWNERS) for team structure.

---

**Happy Coding! 🚀**
