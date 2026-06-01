"use client";

import { ContraForm } from "@/components/vouchers/ContraForm";
import { SalesHeader } from "@/components/vouchers/SalesHeader";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function ContraNewPage() {
  return (
    <div className="space-y-8 p-6">
      <PreviousBackButton />
      <SalesHeader
        title="Add Contra"
        description="Create a new contra entry."
        links={[
          { label: "Overview", href: "/vouchers/contra" },
          { label: "List", href: "/vouchers/contra/list" },
          { label: "Add New", href: "/vouchers/contra/new" },
        ]}
      />
      <div className="mt-6">
        <ContraForm />
      </div>
    </div>
  );
}
