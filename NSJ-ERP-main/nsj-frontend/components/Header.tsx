import React, { useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Building2, User, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const loggingOutRef = useRef(false);

  const handleLogout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setLoggingOut(true);

    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      router.replace("/login");
    } finally {
      setLoggingOut(false);
      loggingOutRef.current = false;
    }
  }, [logout, router]);
  // Determine display name and role
  let displayName = "Guest";
  let displayRole = "Visitor";
  if (user) {
    displayName = user.name || user.email || "User";
    displayRole = user.email || "User";
  }
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Company Name */}
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 rounded-lg p-2">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Jay Scientific Co
            </h1>
            <p className="text-sm text-gray-500">Analytics Dashboard</p>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500">{displayRole}</p>
            </div>
            <button className="bg-gray-100 rounded-full p-2 hover:bg-gray-200 transition-colors">
              <User className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={loading || loggingOut}
            className="flex items-center gap-2"
          >
            {loggingOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Logout
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
