"use client";

import { JournalDetail } from "@/components/vouchers/JournalDetail";

export default function JournalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <JournalDetail id={params.id} />;
}
