"use client";

import { use } from "react";
import OrderIssueForm from "@/components/issues/OrderIssueForm";
import { VouchersHeader } from "@/components/vouchers/VouchersHeader";

type Params = {
  id: string;
};

export default function EditOrderIssuePage({ params }: { params: Params }) {
  const { id } = params;

  return (
    <div className="space-y-6">
      <VouchersHeader
        title="Edit order issue"
        description="Update order issue details."
      />
      <OrderIssueForm id={id} />
    </div>
  );
}
