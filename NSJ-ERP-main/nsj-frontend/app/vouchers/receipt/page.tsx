"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReceiptIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the receipt overview by default
    router.replace("/vouchers/receipt/overview");
  }, [router]);

  return <div className="p-6">Redirecting to Receipt overview…</div>;
}
