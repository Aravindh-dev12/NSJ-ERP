"use client";

import { SalesReturnForm } from "@/components/vouchers/SalesReturnForm";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function SalesReturnAddPage() {
  return (
    <div className="space-y-8 p-6">
      <PreviousBackButton />
      <SalesReturnForm />
    </div>
  );
}
