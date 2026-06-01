"use client";

import { ItemFinalPackingListList } from "@/components/process/ItemFinalPackingListList";
import { useSearchParams } from "next/navigation";

export default function ItemFinalPackingListListPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  return <ItemFinalPackingListList initialSearch={initialSearch} />;
}
