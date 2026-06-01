"use client";

import { EstimateVoucherForm } from "@/components/vouchers/EstimateVoucherForm";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function EstimateVoucherPage() {
  return (
    <div className="space-y-8">
      <PreviousBackButton fallbackHref="/vouchers/estimate/list" />
      <EstimateVoucherForm />
    </div>
  );
}
