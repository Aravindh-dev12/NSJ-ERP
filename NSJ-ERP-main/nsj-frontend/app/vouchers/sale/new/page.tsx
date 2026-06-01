"use client";

import { SalesForm } from "@/components/vouchers/SalesForm";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function SaleNewPage() {
  return (
    <div className="p-6">
      <div className="mb-4">
        <PreviousBackButton />
      </div>
      <SalesForm />
    </div>
  );
}
