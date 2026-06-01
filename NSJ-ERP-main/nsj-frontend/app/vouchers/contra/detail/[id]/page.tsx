"use client";

import { ContraDetail } from "@/components/vouchers/ContraDetail";

export default function ContraDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <ContraDetail id={params.id} />;
}
