import { VouchersHeader } from "@/components/vouchers/VouchersHeader";
import RepairIssueList from "@/components/issues/RepairIssueList";

export default function RepairIssueOverview() {
  return (
    <div className="space-y-8">
      <VouchersHeader
        title="Repair Issue"
        description="Repair Issue overview"
        subLinks={[
          { label: "Overview", href: "/vouchers/issues/overview" },
          { label: "List", href: "/vouchers/issues/list" },
          { label: "Add New", href: "/vouchers/issues/add" },
        ]}
      />

      <RepairIssueList showHeader={false} />
    </div>
  );
}
