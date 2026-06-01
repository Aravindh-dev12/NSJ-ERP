"use client";

import { GhatQualityCheckForm } from "@/components/process/GhatQualityCheckForm";

export default function EditGhatQualityCheckPage({
  params,
}: {
  params: { id: string };
}) {
  return <GhatQualityCheckForm recordId={params.id} />;
}
