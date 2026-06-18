/**
 * Tests for the AuthProvider context and useAuth hook in lib/auth.tsx.
 *
 * Covers:
 * - Error when useAuth is called outside provider
 * - Context exposure and loading state
 * - Login and logout flows updating user state
 *
 * These tests use a TestComponent to exercise the context API and simulate user actions.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/lib/auth";

function TestComponent() {
  const { user, loading, login, logout, checkAuth } = useAuth();
  return (
    <div>
      <span data-testid="user-email">{user?.email || "none"}</span>
      <span data-testid="loading">{loading ? "yes" : "no"}</span>
      <button onClick={() => login("test@example.com", "password123")}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
      <button onClick={checkAuth}>Check</button>
    </div>
  );
}

describe("auth.tsx context and flows", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("throws if useAuth is called outside provider", () => {
    // Should throw an error if useAuth is used without AuthProvider
    expect(() => useAuth()).toThrow();
  });

  it("renders AuthProvider and exposes context (loading state)", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    // Wait for loading to complete
    await waitFor(
      () => expect(screen.getByTestId("loading").textContent).toBe("no"),
      { timeout: 3000 }
    );
  });

  it("login and logout update user state (integration)", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    // Simulate login
    screen.getByText("Login").click();
    await waitFor(() =>
      expect(screen.getByTestId("user-email").textContent).not.toBe("none")
    );
    // Simulate logout
    screen.getByText("Logout").click();
    await waitFor(() =>
      expect(screen.getByTestId("user-email").textContent).toBe("none")
    );
  });
});
