"use client";

import { StoneDemandToBaggingList } from "@/components/process/StoneDemandToBaggingList";
import { useSearchParams } from "next/navigation";

export default function StoneDemandToBaggingListPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  return <StoneDemandToBaggingList initialSearch={initialSearch} />;
}
