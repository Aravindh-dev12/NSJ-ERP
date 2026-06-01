"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SalesQueriesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/vouchers/sales-leads/list");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-muted-foreground">
        Redirecting to Sales Leads...
      </div>
    </div>
  );
}
