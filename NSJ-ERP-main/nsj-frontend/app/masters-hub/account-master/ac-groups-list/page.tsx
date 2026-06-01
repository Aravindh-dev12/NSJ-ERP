"use client";

import { AccountsHeader } from "@/components/accounts/AccountsHeader";
import { ACGroupExportSection } from "@/components/accounts/ACGroupExportSection";
import { TallyGroupsList } from "@/components/accounts/ACGroupsList";

export default function TallyGroupsListPage() {
  return (
    <div className="space-y-8">
      <AccountsHeader
        title="Account Master Transactions"
        description="View all transactions linked to Account Masters and export in Tally format."
      />

      <div className="px-6 pb-6">
        <ACGroupExportSection />
      </div>

      <div className="px-6 pb-6">
        <TallyGroupsList />
      </div>
    </div>
  );
}
