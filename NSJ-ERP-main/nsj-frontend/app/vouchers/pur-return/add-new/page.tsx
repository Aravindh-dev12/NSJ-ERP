"use client";

import { PurReturnForm } from "@/components/vouchers/PurReturnForm";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function PurReturnAddPage() {
  return (
    <div className="space-y-8 p-6">
      <PreviousBackButton />
      <PurReturnForm />
    </div>
  );
}
