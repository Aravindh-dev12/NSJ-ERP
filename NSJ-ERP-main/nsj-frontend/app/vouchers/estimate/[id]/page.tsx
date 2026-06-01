"use client";

import { EstimateVoucherForm } from "@/components/vouchers/EstimateVoucherForm";
import { useParams, useSearchParams } from "next/navigation";

export default function EditEstimatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const estimateId = params.id as string;
  const salesQueryId = searchParams.get("sales_query_id") || undefined;

  return (
    <EstimateVoucherForm estimateId={estimateId} salesQueryId={salesQueryId} />
  );
}
