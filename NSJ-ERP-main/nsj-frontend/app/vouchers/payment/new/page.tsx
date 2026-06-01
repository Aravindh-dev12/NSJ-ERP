"use client";

import { PaymentForm } from "@/components/vouchers/PaymentForm";
import { SalesHeader } from "@/components/vouchers/SalesHeader";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function PaymentNewPage() {
  return (
    <div className="space-y-8 p-6">
      <PreviousBackButton />
      <SalesHeader
        title="Add Payment"
        description="Create a new payment entry."
        links={[
          { label: "Overview", href: "/vouchers/payment" },
          { label: "List", href: "/vouchers/payment/list" },
          { label: "Add New", href: "/vouchers/payment/new" },
        ]}
      />
      <div className="mt-6">
        <PaymentForm />
      </div>
    </div>
  );
}
