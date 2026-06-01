"use client";

import { use } from "react";
import { ContraForm } from "@/components/vouchers/ContraForm";
import { SalesHeader } from "@/components/vouchers/SalesHeader";

export default function ContraEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  return (
    <div className="space-y-8 p-6">
      <SalesHeader
        title={`Edit Contra #${resolvedParams.id}`}
        description="Update contra entry."
        links={[
          { label: "Overview", href: "/vouchers/contra" },
          { label: "List", href: "/vouchers/contra/list" },
          { label: "Add New", href: "/vouchers/contra/new" },
        ]}
      />
      <div className="mt-6">
        <ContraForm id={resolvedParams.id} />
      </div>
    </div>
  );
}
