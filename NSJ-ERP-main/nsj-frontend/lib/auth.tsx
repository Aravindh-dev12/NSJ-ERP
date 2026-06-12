"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import { backend, User } from "./backend";
import { getAuthToken, forceLogout } from "./api";

type Ctx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
};

const AuthContext = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const checkAuth = useCallback(async () => {
    // Skip auth check if there's no token stored - user is definitely not logged in
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const me = await backend.me();
      setUser(me);

      // If we successfully got user info, clear any simulated user
      // This handles the case where user was already logged in
      localStorage.removeItem("currentTaskUser");
      localStorage.removeItem("currentTaskUserName");
      localStorage.removeItem("currentTaskUserRole");
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      await backend.login({ email, password }); // sets cookie and token
      const me = await backend.me();
      setUser(me);

      // Clear any simulated user when real login happens
      localStorage.removeItem("currentTaskUser");
      localStorage.removeItem("currentTaskUserName");
      localStorage.removeItem("currentTaskUserRole");
    } catch (error) {
      // If login fails, ensure we don't leave user in a bad state
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await backend.logout();
    } catch (error) {
      // Silently handle logout errors - the important part is clearing local state
      // 401 errors are expected when the token is already invalid
    } finally {
      setUser(null);
    }
  }, []);

  // Initial auth check on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (pathname?.startsWith("/login")) return;
    const token = getAuthToken();
    if (!token) {
      forceLogout();
    }
  }, [pathname]);

  const value = useMemo(
    () => ({ user, loading, login, logout, checkAuth }),
    [user, loading, login, logout, checkAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
