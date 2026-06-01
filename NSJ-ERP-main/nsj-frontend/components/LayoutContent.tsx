"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { SidebarNav } from "@/components/SidebarNav";
import { AIChatWrapper } from "@/components/AIChatWrapper";

// Pages that should not show sidebar and AI chat
const publicPages = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  // Check if current page is a public page (login, register, etc.)
  const isPublicPage = publicPages.some(
    (page) => pathname === page || pathname?.startsWith(page + "/")
  );

  // Redirect to login if not authenticated and not on a public page
  useEffect(() => {
    if (!loading && !user && !isPublicPage) {
      router.replace("/login");
    }
  }, [loading, user, isPublicPage, router]);

  // On public pages, always show simple layout (no sidebar)
  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    );
  }

  // While loading auth state on protected pages, show loading spinner
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated on protected page, show loading while redirecting
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show full layout with sidebar and AI chat for authenticated users
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="fixed inset-y-0 left-0 z-40 w-64 lg:w-72 hidden lg:block">
        <SidebarNav hideMobileHeader={true} />
      </div>
      <main className="flex-1 lg:ml-64 lg:w-[calc(100%-16rem)] overflow-x-hidden overflow-y-auto bg-secondary">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 lg:px-12 lg:py-10 pb-24">
          {children}
        </div>
      </main>
      <AIChatWrapper />
      {/* Mobile header - only shown on mobile */}
      <div className="lg:hidden">
        <SidebarNav />
      </div>
    </div>
  );
}
