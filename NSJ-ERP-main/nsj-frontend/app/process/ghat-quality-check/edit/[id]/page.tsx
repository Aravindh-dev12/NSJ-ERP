"use client";

import { useEffect, useState } from "react";
import { GhatQualityCheckForm } from "@/components/process/GhatQualityCheckForm";

export default function EditGhatQualityCheckPage({
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

  return <GhatQualityCheckForm recordId={id} />;
}
