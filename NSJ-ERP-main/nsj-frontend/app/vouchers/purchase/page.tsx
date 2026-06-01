"use client";

import React, { useState } from "react";
// VouchersHeader intentionally omitted for Purchase page (in-page tabs only)
import ApprovalLooseForm from "@/components/vouchers/ApprovalLooseForm";
import ApprovalTagForm from "@/components/vouchers/ApprovalTagForm";
import PurAndApprovalForm from "@/components/vouchers/PurAndApprovalForm";
import PurchaseDiamondForm from "@/components/vouchers/PurchaseDiamondForm";
import PurchaseMForm from "@/components/vouchers/PurchaseMForm";
import PurchaseTagwiseForm from "@/components/vouchers/PurchaseTagwiseForm";
import PurchaseMList from "@/components/vouchers/PurchaseMList";
import PurchaseTagwiseList from "@/components/vouchers/PurchaseTagwiseList";
import Link from "next/link";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

const TABS = [
  "Approval Loose M",
  "Approval Tag M",
  "Pur and Approval M",
  "Purchase Diamond",
  "Purchase M",
  "Purchase Tagwise M",
];

export default function VouchersPurchasePage() {
  const [active, setActive] = useState<string>(TABS[0]);

  return (
    <div className="space-y-8">
      <PreviousBackButton />
      {/* Header removed: Purchase page renders in-page tabs only */}

      <div className="rounded-lg border border-border bg-background p-6">
        <nav className="flex flex-wrap items-center gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${active === t ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:border-primary/40 hover:text-primary"}`}
            >
              {t}
            </button>
          ))}
        </nav>

        <div>
          {active === "Approval Loose M" && <ApprovalLooseForm />}
          {active === "Approval Tag M" && <ApprovalTagForm />}
          {active === "Pur and Approval M" && <PurAndApprovalForm />}
          {active === "Purchase Diamond" && <PurchaseDiamondForm />}
          {active === "Purchase M" && (
            <>
              <PurchaseMForm />
            </>
          )}
          {active === "Purchase Tagwise M" && (
            <>
              <PurchaseTagwiseForm />
            </>
          )}
          {active !== "Approval Loose M" &&
            active !== "Approval Tag M" &&
            active !== "Pur and Approval M" &&
            active !== "Purchase Diamond" &&
            active !== "Purchase M" &&
            active !== "Purchase Tagwise M" && (
              <div className="text-sm text-muted-foreground">
                This section is not implemented yet.
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
