"use client";

import { AIChatOverlay } from "./AIChatOverlay";

export function AIChatWrapper() {
  // Always visible across landing page and dashboard
  return <AIChatOverlay isVisible={true} />;
}
