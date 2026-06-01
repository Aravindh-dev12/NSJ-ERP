"use client";

import { VouchersList } from "@/components/vouchers/VouchersList";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function VouchersListPage() {
  return (
    <div className="p-6">
      <div className="mb-4">
        <PreviousBackButton />
      </div>
      <VouchersList />
    </div>
  );
}
