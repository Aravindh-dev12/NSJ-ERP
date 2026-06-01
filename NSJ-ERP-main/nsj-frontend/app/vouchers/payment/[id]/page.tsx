"use client";

import { use } from "react";
import { PaymentForm } from "@/components/vouchers/PaymentForm";
import { SalesHeader } from "@/components/vouchers/SalesHeader";

export default function PaymentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  return (
    <div className="space-y-8 p-6">
      <SalesHeader
        title={`Edit Payment #${resolvedParams.id}`}
        description="Update payment entry."
        links={[
          { label: "Overview", href: "/vouchers/payment" },
          { label: "List", href: "/vouchers/payment/list" },
          { label: "Add New", href: "/vouchers/payment/new" },
        ]}
      />
      <div className="mt-6">
        <PaymentForm id={resolvedParams.id} />
      </div>
    </div>
  );
}
