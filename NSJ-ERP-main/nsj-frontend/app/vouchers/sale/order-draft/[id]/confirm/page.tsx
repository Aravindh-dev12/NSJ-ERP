"use client";

import { use } from "react";
import { OrderProcessManager } from "@/components/vouchers/OrderProcessManager";

export default function OrderProcessConfirmPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  return (
    <div className="container mx-auto">
      <OrderProcessManager draftId={id} />
    </div>
  );
}
