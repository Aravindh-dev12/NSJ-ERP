import RepairIssueList from "@/components/issues/RepairIssueList";
import { VouchersHeader } from "@/components/vouchers/VouchersHeader";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function RepairIssueOverview() {
  return (
    <div className="space-y-8">
      <PreviousBackButton />
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
