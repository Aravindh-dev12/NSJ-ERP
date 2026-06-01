"use client";

import { VouchersHeader } from "@/components/vouchers/VouchersHeader";
import RepairIssueForm from "@/components/issues/RepairIssueForm";

export default function IssuesNewPage() {
  return (
    <div className="space-y-8">
      <VouchersHeader
        title="Add repair issue"
        description="Create a new repair issue."
        subLinks={[
          { label: "Overview", href: "/vouchers/issues/overview" },
          { label: "List", href: "/vouchers/issues/list" },
          { label: "Add New", href: "/vouchers/issues/add" },
        ]}
      />

      <RepairIssueForm />
    </div>
  );
}
