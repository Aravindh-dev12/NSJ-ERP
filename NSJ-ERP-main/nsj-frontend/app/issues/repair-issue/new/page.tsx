"use client";

import RepairIssueForm from "@/components/issues/RepairIssueForm";
import { VouchersHeader } from "@/components/vouchers/VouchersHeader";

export default function RepairIssueNewPage() {
  return (
    <div className="space-y-8">
      <VouchersHeader
        title="Add repair issue"
        description="Create a new repair issue."
        subLinks={[
          { label: "Overview", href: "/issues" },
          { label: "List", href: "/issues/list" },
          { label: "Add New", href: "/issues/new" },
        ]}
      />

      <RepairIssueForm />
    </div>
  );
}
