# Onboarding Guide

Welcome to the JSC Frontend team! This guide will help you get up and running quickly.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 20+** - [Download](https://nodejs.org/)
- **pnpm 8+** - Install with `npm install -g pnpm`
- **Git** - [Download](https://git-scm.com/)
- **nvm** (optional but recommended) - [Install](https://github.com/nvm-sh/nvm)
- **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

## 🚀 First Day Setup

### 1. Clone the Repository

```bash
git clone git@github.com:Loam-ai/jsc-frontend.git
cd jsc-frontend
```

### 2. Set Up Node Version

```bash
# If using nvm
nvm use

# This will use Node 20 as specified in .nvmrc
```

### 3. Install Dependencies

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 4. Set Up Environment Variables

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your values
# You'll need the backend API URL from your team lead
```

### 5. Start Development Server

```bash
# Start the dev server
pnpm dev

# Open http://localhost:3000
```

### 6. Run Tests

```bash
# Run all tests
pnpm test

# Run unit tests in watch mode
pnpm test:watch

# Install Playwright browsers (first time only)
pnpm test:e2e:install

# Run e2e tests
pnpm test:e2e
```

### 7. Verify Setup

- [ ] Dev server starts without errors
- [ ] You can access http://localhost:3000
- [ ] Login page renders correctly
- [ ] All tests pass
- [ ] Code formatting works (`pnpm format`)

## 🏗️ How Authentication Works

### Overview

Our app uses JWT-based authentication with httpOnly cookies for security.

```
1. User submits login form
   ↓
2. POST /auth/login to backend
   ↓
3. Backend sets httpOnly cookies (access + refresh tokens)
   ↓
4. Frontend stores user in context
   ↓
5. All API calls include cookies automatically
   ↓
6. On 401, auto-refresh tokens and retry
```

### Key Files

- **`lib/auth.ts`** - Auth context and provider
- **`lib/api.ts`** - API client with auto-refresh logic
- **`hooks/useAuth.ts`** - Auth hook for components
- **`app/login/page.tsx`** - Login page

### Using Auth in Components

```tsx
"use client";

import { useAuth } from "@/hooks/useAuth";

export default function MyComponent() {
  const { user, loading, logout } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protected Routes

To protect a route, check auth in the component:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return <div>Loading...</div>;

  return <div>Protected content</div>;
}
```

## 📄 How to Add a New Page

### 1. Create the Page File

```bash
# For a new route /about
mkdir -p app/about
touch app/about/page.tsx
```

### 2. Implement the Page

```tsx
// app/about/page.tsx
export default function AboutPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">About Us</h1>
      <p>Welcome to our about page</p>
    </div>
  );
}
```

### 3. Add Navigation (if needed)

Update the nav in `app/dashboard/page.tsx` or create a shared nav component.

### 4. Add Tests

```tsx
// tests/pages/about.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import AboutPage from "@/app/about/page";

describe("AboutPage", () => {
  it("renders heading", () => {
    render(<AboutPage />);
    expect(screen.getByText("About Us")).toBeInTheDocument();
  });
});
```

### 5. Add E2E Test

```ts
// e2e/about.spec.ts
import { test, expect } from "@playwright/test";

test("about page renders", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByText("About Us")).toBeVisible();
});
```

## 🎨 Component Conventions

### File Organization

- **Server Components** - Default in App Router (no "use client")
- **Client Components** - Add "use client" at top when needed
- **Shared Components** - Place in `components/`
- **UI Components** - shadcn/ui components in `components/ui/`

### Naming Conventions

- **Components** - PascalCase: `MyComponent.tsx`
- **Utilities** - camelCase: `formatDate.ts`
- **Hooks** - camelCase starting with "use": `useMyHook.ts`
- **Constants** - UPPER_SNAKE_CASE

### Component Template

```tsx
"use client"; // Only if needed

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MyComponentProps {
  title: string;
  className?: string;
}

export function MyComponent({ title, className }: MyComponentProps) {
  const [count, setCount] = useState(0);

  return (
    <div className={cn("p-4", className)}>
      <h2 className="text-2xl font-bold">{title}</h2>
      <Button onClick={() => setCount(count + 1)}>Count: {count}</Button>
    </div>
  );
}
```

### Using shadcn/ui Components

We use shadcn/ui for our component library. Components are in `components/ui/`.

```bash
# To add a new shadcn component (if needed)
# Install the CLI first
npx shadcn-ui@latest init

# Add a component
npx shadcn-ui@latest add dialog
```

Common components already available:

- Button
- Input
- Label
- Card
- Toast
- Dropdown Menu
- Skeleton

## 🧪 Testing Workflow

### Writing Unit Tests

1. Create test file: `tests/pages/my-page.test.tsx`
2. Import test utilities
3. Write test cases
4. Run: `pnpm test:unit`

### Writing E2E Tests

1. Create spec file: `e2e/my-flow.spec.ts`
2. Use Playwright API
3. Install browsers (first time): `pnpm test:e2e:install`
4. Run: `pnpm test:e2e`

### Test Best Practices

- Test user behavior, not implementation
- Use accessible queries (getByRole, getByLabel)
- Mock API calls with MSW
- Keep tests focused and simple
- Aim for 80%+ coverage

### Running Tests

```bash
# All tests
pnpm test

# Unit tests only
pnpm test:unit

# Install Playwright browsers (first time only)
pnpm test:e2e:install

# E2E tests
pnpm test:e2e

# E2E with UI
pnpm test:e2e:ui

# Watch mode
pnpm test:watch

# Coverage
pnpm coverage
```

## 🔧 Making Your First PR

### 1. Create a Feature Branch

```bash
git checkout -b feat/my-feature
```

### 2. Make Changes

- Write code
- Add tests
- Update docs if needed

### 3. Run Quality Checks

```bash
# Format code
pnpm format

# Lint
pnpm lint

# Type check
pnpm typecheck

# Test
pnpm test
```

### 4. Commit Changes

Use conventional commits:

```bash
git add .
git commit -m "feat(component): add new feature"

# Husky will auto-format and lint your code
```

### 5. Push and Create PR

```bash
git push origin feat/my-feature
```

Then create a PR on GitHub.

### 6. PR Checklist

- [ ] All tests pass locally
- [ ] Code is formatted and linted
- [ ] Commit messages follow conventions
- [ ] PR description explains changes
- [ ] Screenshots for UI changes
- [ ] Documentation updated if needed

## 💡 Common Gotchas

### 1. "Module not found" Errors

Make sure you use path aliases:

```tsx
// ✅ Good
import { Button } from "@/components/ui/button";

// ❌ Bad
import { Button } from "../../../components/ui/button";
```

### 2. Hydration Errors

Be careful with client/server component boundaries:

```tsx
// ❌ This will cause hydration errors
export default function Page() {
  return <div>{new Date().toString()}</div>;
}

// ✅ Use client component for dynamic content
("use client");
export default function Page() {
  return <div>{new Date().toString()}</div>;
}
```

### 3. Static Export Limitations

Since we use `output: 'export'`:

- No server-side props
- No API routes in Next.js
- All data fetching is client-side

### 4. Environment Variables

- Must prefix with `NEXT_PUBLIC_` for browser access
- Restart dev server after changing `.env.local`
- Never commit `.env.local`

### 5. TypeScript Errors

```bash
# Clear cache and rebuild
rm -rf .next
pnpm dev
```

### 6. E2E Tests Not Running

If you get "Executable doesn't exist" error when running e2e tests:

```bash
# Install Playwright browsers
pnpm test:e2e:install

# Then run tests
pnpm test:e2e
```

This is required once before running e2e tests locally. CI automatically installs browsers.

## 🎯 Useful Commands

```bash
# Development
pnpm dev                 # Start dev server
pnpm build              # Build for production
pnpm start              # Start production server

# Code Quality
pnpm lint               # Lint code
pnpm format             # Format code
pnpm typecheck          # Type check

# Testing
pnpm test               # Run all tests
pnpm test:unit          # Unit tests
pnpm test:e2e           # E2E tests
pnpm coverage           # Coverage report

# Git
git status              # Check status
git add .               # Stage all
git commit              # Commit (triggers hooks)
git push                # Push changes
```

## 📚 Key Resources

### Internal Docs

- [README.md](./README.md) - Project overview
- [API Documentation](link-to-api-docs) - Backend API contracts

### External Links

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)

### Design & Tokens

- Design System: [Link to Figma/Storybook]
- Color Palette: See `tailwind.config.ts`
- Typography: Inter font from Google Fonts

## 🆘 Getting Help

### Where to Ask Questions

1. **Team Chat** - Slack/Discord channel
2. **GitHub Discussions** - For feature requests
3. **GitHub Issues** - For bugs
4. **Code Review** - Tag team members in PRs

### Who to Contact

- **Frontend Lead** - [Name] (@username)
- **Backend Lead** - [Name] (@username)
- **DevOps** - [Name] (@username)
- **Design** - [Name] (@username)

## 🎉 Welcome Aboard!

You're all set! If you run into issues, don't hesitate to ask questions. We're here to help.

Happy coding! 🚀
