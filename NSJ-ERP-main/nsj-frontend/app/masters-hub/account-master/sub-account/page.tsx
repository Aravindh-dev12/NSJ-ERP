"use client";

import SubAccountForm from "@/components/accounts/SubAccountForm";
import { AccountsHeader } from "@/components/accounts/AccountsHeader";

export default function SubAccountPage() {
  return (
    <div className="space-y-8">
      <AccountsHeader
        title="Sub Accounts"
        description="Manage and create sub-accounts linked to main ledger accounts."
      />
      <div className="p-6">
        <SubAccountForm />
      </div>
    </div>
  );
}
