import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "@/app/page";
import { AuthProvider } from "@/lib/auth";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";

const mockPush = vi.fn();
const mockReplace = vi.fn();

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
  }),
}));

// Mock useAuth to always return authenticated user for this test
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "1", email: "test@example.com" },
    loading: false,
    login: async () => {},
    logout: async () => {},
    checkAuth: async () => {},
  }),
}));

describe("HomePage", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  const renderHomePage = () => {
    return render(
      <AuthProvider>
        <HomePage />
      </AuthProvider>
    );
  };

  it("shows loading state initially", () => {
    renderHomePage();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("redirects authenticated user to dashboard", async () => {
    // Mock authenticated user response
    server.use(
      http.get("*/auth/me", () => {
        return HttpResponse.json({
          id: "1",
          email: "test@example.com",
          name: "Test User",
        });
      })
    );

    renderHomePage();

    await waitFor(
      () => {
        expect(mockReplace).toHaveBeenCalledWith("/dashboard");
      },
      { timeout: 3000 }
    );
  });
});
