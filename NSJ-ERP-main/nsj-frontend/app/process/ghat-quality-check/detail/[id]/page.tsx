"use client";

import { useEffect, useState } from "react";
import { GhatQualityCheckDetail } from "@/components/process/GhatQualityCheckDetail";

export default function GhatQualityCheckDetailPage({
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

  return <GhatQualityCheckDetail id={id} />;
}
