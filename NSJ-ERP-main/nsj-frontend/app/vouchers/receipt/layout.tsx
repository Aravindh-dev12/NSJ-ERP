"use client";

import React from "react";
import { SalesHeader } from "@/components/vouchers/SalesHeader";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function ReceiptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const links = [
    { label: "Overview", href: "/vouchers/receipt" },
    { label: "List", href: "/vouchers/receipt/list" },
    { label: "Add New", href: "/vouchers/receipt/new" },
  ];

  return (
    <div className="space-y-6 p-6">
      <PreviousBackButton />
      <SalesHeader
        title="Receipt"
        description="Credit / Debit receipts"
        links={links}
      />
      <div>{children}</div>
    </div>
  );
}
