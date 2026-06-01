"use client";

import { useEffect, useState } from "react";
import { OrderProcessManager } from "@/components/vouchers/OrderProcessManager";
import { VouchersHeader } from "@/components/vouchers/VouchersHeader";
import { useParams } from "next/navigation";

export default function ProcessConfirmationPage() {
  const params = useParams();
  const draftId = params.draftId as string;

  if (!draftId) return <div>Invalid Draft ID</div>;

  return (
    <div className="space-y-6">
      <VouchersHeader
        title="Process Confirmation"
        description="Review and customize production steps before confirming the order."
      />
      <OrderProcessManager draftId={draftId} isOrder={false} />
    </div>
  );
}
