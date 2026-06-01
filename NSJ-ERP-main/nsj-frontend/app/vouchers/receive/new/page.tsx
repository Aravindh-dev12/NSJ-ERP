"use client";

import { ReceiveForm } from "@/components/vouchers/ReceiveForm";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function ReceiveNewPage() {
  return (
    <div className="p-6">
      <div className="mb-4">
        <PreviousBackButton />
      </div>
      <ReceiveForm />
    </div>
  );
}
