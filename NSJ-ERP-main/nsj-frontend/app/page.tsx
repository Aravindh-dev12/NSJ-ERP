"use client";
// Toggle dashboard dev mode via environment variable
const DEV_MODE = process.env.NEXT_PUBLIC_DASHBOARD_DEV_MODE === "true";

/**
 * Home Page Component
 *
 * Acts as a router based on authentication status:
 * - Authenticated users → redirect to /dashboard
 * - Unauthenticated users → redirect to /login (handled by middleware)
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect based on auth status
  useEffect(() => {
    if (DEV_MODE) {
      router.replace("/dashboard");
      return;
    }

    // If user is authenticated, go to dashboard
    // If not authenticated, middleware will redirect to login
    if (!loading && user) {
      router.replace("/dashboard");
    } else if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Loading state - show minimal UI
  if (DEV_MODE) return null;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
