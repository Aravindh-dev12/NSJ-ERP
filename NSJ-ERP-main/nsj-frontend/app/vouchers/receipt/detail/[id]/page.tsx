"use client";

import { useEffect, useState } from "react";
import { ReceiptDetail } from "@/components/vouchers/ReceiptDetail";

export default function ReceiptDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [id, setId] = useState<string>("");

  useEffect(() => {
    // Handling dynamic extraction from route params
    if (params && params.id) {
       setId(params.id);
    }
  }, [params]);

  if (!id) return null;

  return (
    <div className="p-4 md:p-8">
      <ReceiptDetail id={id} />
    </div>
  );
}
