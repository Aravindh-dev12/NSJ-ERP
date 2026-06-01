"use client";

import { AccountsHeader } from "@/components/accounts/AccountsHeader";
import { SubAccountsList } from "@/components/accounts/SubAccountsList";

export default function SubAccountsListPage() {
  return (
    <div className="space-y-8">
      <AccountsHeader
        title="Sub Accounts List"
        description="List and manage sub accounts."
      />
      <div className="p-6">
        <SubAccountsList />
      </div>
    </div>
  );
}
