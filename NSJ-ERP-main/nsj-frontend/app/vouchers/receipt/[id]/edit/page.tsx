"use client";

import { ReceiptForm } from "@/components/vouchers/ReceiptForm";

export default function ReceiptEditPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-rose-900 px-4">Edit Receipt Voucher</h1>
      <ReceiptForm id={id} />
    </div>
  );
}
