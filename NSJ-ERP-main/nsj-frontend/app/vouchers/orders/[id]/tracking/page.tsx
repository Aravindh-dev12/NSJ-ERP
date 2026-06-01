"use client";

import { use } from "react";
import { OrderProgressTracker } from "@/components/vouchers/OrderProgressTracker";
import { VouchersHeader } from "@/components/vouchers/VouchersHeader";

export default function OrderTrackingPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  return (
    <div className="space-y-6 container mx-auto px-4 py-8">
      <VouchersHeader
        title={`Order Tracking`}
        description={`Monitor and update production progress for order #${id}`}
      />
      <OrderProgressTracker orderId={id} />
    </div>
  );
}
