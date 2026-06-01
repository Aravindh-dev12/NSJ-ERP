"use client";

import { useAuth } from "@/lib/auth";
import { AIChatOverlay } from "./AIChatOverlay";

export function AIChatWrapper() {
  const { user } = useAuth();

  // Only show for Niti (Founder)
  const isFounder =
    user &&
    (user.name === "Niti" ||
      user.email === "niti@nsj.com" ||
      (user as any).task_role === "FOUNDER");

  return <AIChatOverlay isVisible={!!isFounder} />;
}
