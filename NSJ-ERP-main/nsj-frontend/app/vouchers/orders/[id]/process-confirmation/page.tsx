"use client";

import React from "react";
import { OrderProcessManager } from "@/components/vouchers/OrderProcessManager";
import { useParams } from "next/navigation";

export default function OrderProcessConfirmationPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="w-full px-6 py-8">
      <OrderProcessManager draftId={id} isOrder={true} />
    </div>
  );
}
