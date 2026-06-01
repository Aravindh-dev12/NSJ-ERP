"use client";

import { useEffect, useState } from "react";
import { GhatApprovalDetail } from "@/components/process/GhatApprovalDetail";

export default function GhatApprovalDetailPage({
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

  return <GhatApprovalDetail id={id} />;
}
