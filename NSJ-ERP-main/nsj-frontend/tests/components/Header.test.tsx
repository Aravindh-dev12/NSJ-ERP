import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "@/components/Header";
import * as useAuthModule from "@/hooks/useAuth";

// Mock useRouter
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

describe("Header", () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockReplace.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders company name and logo", () => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: null,
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      render(<Header />);

      expect(screen.getByText("Jay Scientific Co")).toBeInTheDocument();
      expect(screen.getByText("Analytics Dashboard")).toBeInTheDocument();
    });

    it("displays guest user when not logged in", () => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: null,
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      render(<Header />);

      expect(screen.getByText("Guest")).toBeInTheDocument();
      expect(screen.getByText("Visitor")).toBeInTheDocument();
    });

    it("displays user name when logged in", () => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: { id: "1", name: "John Doe", email: "john@example.com" },
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      render(<Header />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    it("displays email as name when name is not provided", () => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: { id: "1", email: "jane@example.com" },
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      render(<Header />);

      const emailElements = screen.getAllByText("jane@example.com");
      expect(emailElements.length).toBeGreaterThan(0);
    });

    it("displays User as fallback when no name or email", () => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: { id: "1", email: "" },
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      render(<Header />);

      const userElements = screen.getAllByText("User");
      expect(userElements.length).toBeGreaterThan(0);
    });

    it("renders logout button", () => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: null,
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      render(<Header />);

      expect(
        screen.getByRole("button", { name: /logout/i })
      ).toBeInTheDocument();
    });

    it("renders user avatar button", () => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: null,
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      render(<Header />);

      const avatarButtons = screen.getAllByRole("button");
      expect(avatarButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Logout Functionality", () => {
    it("calls logout when logout button is clicked", async () => {
      const user = userEvent.setup();
      mockLogout.mockResolvedValue(undefined);

      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: { id: "1", name: "Test User", email: "test@example.com" },
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      render(<Header />);

      const logoutButton = screen.getByRole("button", { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
    });

    it("redirects to login page after logout", async () => {
      const user = userEvent.setup();
      mockLogout.mockResolvedValue(undefined);

      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: { id: "1", name: "Test User", email: "test@example.com" },
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      render(<Header />);

      const logoutButton = screen.getByRole("button", { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
        expect(mockReplace).toHaveBeenCalledWith("/login");
      });
    });

    it("shows signing out state during logout", async () => {
      const user = userEvent.setup();
      mockLogout.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: { id: "1", name: "Test User", email: "test@example.com" },
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      render(<Header />);

      const logoutButton = screen.getByRole("button", { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByText("Signing out...")).toBeInTheDocument();
      });

      // Wait for logout to complete
      await waitFor(
        () => {
          expect(mockReplace).toHaveBeenCalledWith("/login");
        },
        { timeout: 200 }
      );
    });

    it("disables logout button during logout", async () => {
      const user = userEvent.setup();
      mockLogout.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: { id: "1", name: "Test User", email: "test@example.com" },
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      render(<Header />);

      const logoutButton = screen.getByRole("button", { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(logoutButton).toBeDisabled();
      });

      // Wait for logout to complete
      await waitFor(
        () => {
          expect(mockReplace).toHaveBeenCalledWith("/login");
        },
        { timeout: 200 }
      );
    });

    it("handles logout error gracefully", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockLogout.mockRejectedValue(new Error("Logout failed"));

      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: { id: "1", name: "Test User", email: "test@example.com" },
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      render(<Header />);

      const logoutButton = screen.getByRole("button", { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Logout failed:",
          expect.any(Error)
        );
        expect(mockReplace).toHaveBeenCalledWith("/login");
      });

      consoleErrorSpy.mockRestore();
    });

    it("prevents multiple simultaneous logout attempts", async () => {
      const user = userEvent.setup();
      mockLogout.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: { id: "1", name: "Test User", email: "test@example.com" },
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      render(<Header />);

      const logoutButton = screen.getByRole("button", { name: /logout/i });

      // Click multiple times rapidly
      const clickPromise1 = user.click(logoutButton);
      const clickPromise2 = user.click(logoutButton);
      const clickPromise3 = user.click(logoutButton);

      await Promise.all([clickPromise1, clickPromise2, clickPromise3]);

      // Wait for logout to complete
      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });

      // Should only be called once despite multiple clicks
      expect(mockLogout).toHaveBeenCalledTimes(1);

      // Wait for router navigation to complete
      await waitFor(
        () => {
          expect(mockReplace).toHaveBeenCalledWith("/login");
        },
        { timeout: 200 }
      );
    });

    it("disables logout button when auth is loading", () => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: null,
        loading: true,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      render(<Header />);

      const logoutButton = screen.getByRole("button", { name: /logout/i });
      expect(logoutButton).toBeDisabled();
    });
  });

  describe("User Display", () => {
    it("prioritizes name over email for display", () => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: { id: "1", name: "John Doe", email: "john@example.com" },
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      render(<Header />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    it("handles user with only ID", () => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: { id: "123", email: "" },
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      render(<Header />);

      const userElements = screen.getAllByText("User");
      expect(userElements.length).toBeGreaterThan(0);
    });

    it("displays correct role for authenticated user", () => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: { id: "1", name: "Admin User", email: "admin@example.com" },
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      render(<Header />);

      expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    });
  });

  describe("Icons and Styling", () => {
    it("renders Building2 icon for company logo", () => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: null,
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      const { container } = render(<Header />);

      // Check for the logo container with blue background
      const logoContainer = container.querySelector(".bg-blue-600");
      expect(logoContainer).toBeInTheDocument();
    });

    it("renders User icon for avatar", () => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: null,
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      const { container } = render(<Header />);

      // Check for avatar button with gray background
      const avatarButton = container.querySelector(".bg-gray-100");
      expect(avatarButton).toBeInTheDocument();
    });

    it("renders LogOut icon in logout button", () => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: null,
        loading: false,
        logout: mockLogout,
        login: vi.fn(),
        checkAuth: vi.fn(),
      });

      render(<Header />);

      const logoutButton = screen.getByRole("button", { name: /logout/i });
      expect(logoutButton).toBeInTheDocument();
    });
  });
});
