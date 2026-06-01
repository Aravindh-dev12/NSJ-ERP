"use client";

import { useEffect, useState } from "react";
import { PaymentDetail } from "@/components/payment/PaymentDetail";

export default function PaymentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [id, setId] = useState<string>("");

  useEffect(() => {
    // In newer Next.js versions, params is already resolved
    setId(params.id);
  }, [params]);

  if (!id) return null;

  return <PaymentDetail id={id} />;
}
