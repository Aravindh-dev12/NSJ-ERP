"use client";

import { Suspense } from "react";
import RepairForm from "@/components/vouchers/RepairForm";
import { useSearchParams } from "next/navigation";
import { VouchersHeader } from "@/components/vouchers/VouchersHeader";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

function RepairContent() {
  const search = useSearchParams();
  const id = search?.get("id") ?? undefined;
  return (
    <div className="space-y-8">
      <PreviousBackButton />
      <VouchersHeader
        title="Add repair"
        description="Create a new repair."
        subLinks={[
          { label: "Overview", href: "/vouchers/repair" },
          { label: "List", href: "/vouchers/repair/list" },
          { label: "Add New", href: "/vouchers/repair/new" },
        ]}
      />

      <RepairForm id={id} />
    </div>
  );
}

export default function RepairNewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RepairContent />
    </Suspense>
  );
}
