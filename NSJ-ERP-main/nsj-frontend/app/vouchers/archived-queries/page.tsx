"use client";

import { VouchersHeader } from "@/components/vouchers/VouchersHeader";
import { ArchivedQueriesList } from "@/components/queries/ArchivedQueriesList";

export default function VouchersArchivedQueriesPage() {
  return (
    <div className="space-y-6">
      <VouchersHeader
        title="Archived Queries"
        description="View and manage archived customer queries"
      />
      <ArchivedQueriesList />
    </div>
  );
}
