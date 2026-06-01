"use client";

import { PreRhodiumQualityCheckDetail } from "@/components/process/PreRhodiumQualityCheckDetail";
import { notFound } from "next/navigation";

export default function PreRhodiumQualityCheckDetailPage({
  params,
}: {
  params: { id: string };
}) {
  if (!params.id) {
    notFound();
  }

  return <PreRhodiumQualityCheckDetail id={params.id} />;
}
