import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LogoutPage from "@/app/logout/page";
import { AuthProvider } from "@/lib/auth";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("LogoutPage", () => {
  const renderLogoutPage = () => {
    return render(
      <AuthProvider>
        <LogoutPage />
      </AuthProvider>
    );
  };

  it("renders signed out message", () => {
    renderLogoutPage();

    expect(screen.getByText("Signed Out")).toBeInTheDocument();
    expect(
      screen.getByText(/you have been successfully signed out/i)
    ).toBeInTheDocument();
  });

  it("shows return to login button", () => {
    renderLogoutPage();

    const loginLink = screen.getByRole("link", { name: /return to login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("calls logout function on mount", async () => {
    renderLogoutPage();

    await waitFor(() => {
      expect(screen.getByText("Signed Out")).toBeInTheDocument();
    });
  });
});
