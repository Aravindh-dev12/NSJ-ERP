"use client";

import { use } from "react";
import { JournalForm } from "@/components/vouchers/JournalForm";
import { SalesHeader } from "@/components/vouchers/SalesHeader";

export default function JournalEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  return (
    <div className="space-y-8 p-6">
      <SalesHeader
        title={`Edit Journal #${resolvedParams.id}`}
        description="Update journal entry."
        links={[
          { label: "Overview", href: "/vouchers/journal" },
          { label: "List", href: "/vouchers/journal/list" },
          { label: "Add New", href: "/vouchers/journal/new" },
        ]}
      />
      <div className="mt-6">
        <JournalForm id={resolvedParams.id} />
      </div>
    </div>
  );
}
