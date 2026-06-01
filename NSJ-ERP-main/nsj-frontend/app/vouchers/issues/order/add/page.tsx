"use client";

import { useRouter } from "next/navigation";
import OrderIssueForm from "@/components/issues/OrderIssueForm";
import { VouchersHeader } from "@/components/vouchers/VouchersHeader";

export default function AddOrderIssuePage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <VouchersHeader
        title="Add order issue"
        description="Create a new order issue."
      />
      <OrderIssueForm />
    </div>
  );
}
