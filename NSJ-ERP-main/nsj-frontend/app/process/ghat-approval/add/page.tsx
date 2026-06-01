"use client";

import { GhatApprovalForm } from "@/components/process/GhatApprovalForm";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function AddGhatApprovalPage() {
  return (
    <div className="p-6">
      <div className="mb-4">
        <PreviousBackButton />
      </div>
      <GhatApprovalForm mode="create" />
    </div>
  );
}
