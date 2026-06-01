"use client";

import { SalesLeadsForm } from "@/components/vouchers/SalesLeadsForm";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function NewSalesQueryPage() {
  return (
    <div className="p-6">
      <div className="mb-4">
        <PreviousBackButton />
      </div>
      <SalesLeadsForm />
    </div>
  );
}
