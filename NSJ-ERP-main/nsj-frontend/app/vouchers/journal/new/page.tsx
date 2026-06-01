"use client";

import { JournalForm } from "@/components/vouchers/JournalForm";
import { SalesHeader } from "@/components/vouchers/SalesHeader";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function JournalNewPage() {
  return (
    <div className="space-y-8 p-6">
      <PreviousBackButton />
      <SalesHeader
        title="Add Journal"
        description="Create a new journal entry."
        links={[
          { label: "Overview", href: "/vouchers/journal" },
          { label: "List", href: "/vouchers/journal/list" },
          { label: "Add New", href: "/vouchers/journal/new" },
        ]}
      />
      <div className="mt-6">
        <JournalForm />
      </div>
    </div>
  );
}
