"use client";

import { AccountsHeader } from "@/components/accounts/AccountsHeader";
import { ACGroupMastersList } from "@/components/accounts/ACGroupMastersList";

export default function ACGroupPage() {
  return (
    <div className="space-y-8">
      <AccountsHeader
        title="A/C Groups"
        description="View all Spark Account Groups with Tally mapping fields."
      />

      <ACGroupMastersList />
    </div>
  );
}
