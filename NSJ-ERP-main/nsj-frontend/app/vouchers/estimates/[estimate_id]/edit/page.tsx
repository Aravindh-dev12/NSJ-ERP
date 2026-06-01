"use client";

import { EstimateVoucherForm } from "@/components/vouchers/EstimateVoucherForm";
import { useParams, useSearchParams } from "next/navigation";

export default function EditEstimatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const estimateId = params.estimate_id as string;
  const salesQueryId = searchParams.get("sales_query_id") || undefined;

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-5xl">
      <EstimateVoucherForm
        estimateId={estimateId}
        salesQueryId={salesQueryId}
      />
    </div>
  );
}
