"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ReceiptClient from "@/components/receipt/ReceiptClient";

function ReceiptContent() {
  const sp = useSearchParams();
  const id = sp?.get("id") ?? "";
  return <ReceiptClient id={id} />;
}

export default function ReceiptIndexPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReceiptContent />
    </Suspense>
  );
}
