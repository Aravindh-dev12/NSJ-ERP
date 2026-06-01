"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReceiptIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to list by default
    router.replace("/voucher/receipt/list");
  }, [router]);

  return <div className="p-6">Redirecting to Receipts…</div>;
}
