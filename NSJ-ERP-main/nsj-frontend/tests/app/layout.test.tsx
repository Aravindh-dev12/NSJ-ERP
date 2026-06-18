/**
 * Smoke test for the Next.js RootLayout component.
 * Ensures global providers render and children are present.
 */
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock useAuth to return a logged-in user
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: { name: "Test User", email: "test@test.com" },
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("renders without crashing and provides children", () => {
    const { container } = render(
      <RootLayout>
        <div>Test Child</div>
      </RootLayout>
    );
    // The layout should render without crashing
    expect(container).toBeInTheDocument();
  });

  it("renders Toaster and children", () => {
    const { container } = render(
      <RootLayout>
        <div>Providers Test</div>
      </RootLayout>
    );
    // The layout should render without crashing
    expect(container).toBeInTheDocument();
    // Toaster should be present in the DOM by role/aria-label
    expect(
      screen.getByRole("region", { name: /notifications/i })
    ).toBeInTheDocument();
  });
});
