"use client";

import React from "react";
import { SalesHeader } from "@/components/vouchers/SalesHeader";

export default function ReceiptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const links = [
    { label: "Overview", href: "/voucher/receipt" },
    { label: "List", href: "/voucher/receipt/list" },
    { label: "Add New", href: "/voucher/receipt/new" },
  ];

  return (
    <div className="space-y-6">
      <SalesHeader
        title="Receipt"
        description="Credit / Debit receipts"
        links={links}
      />
      <div>{children}</div>
    </div>
  );
}
