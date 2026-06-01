"use client";

import { EstimateList } from "@/components/vouchers/EstimateList";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function EstimateListPage() {
  return (
    <div className="space-y-8 p-6">
      <PreviousBackButton fallbackHref="/vouchers" />
      <EstimateList />
    </div>
  );
}
