"use client";

import { VouchersHeader } from "@/components/vouchers/VouchersHeader";
import { PendingQueriesList } from "@/components/queries/PendingQueriesList";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function VouchersPendingQueriesPage() {
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <PreviousBackButton />
      </div>
      <VouchersHeader
        title="Pending Queries"
        description="Track customer inquiries before advance payments and order creation"
      />
      <PendingQueriesList />
    </div>
  );
}
