"use client";

import { PreRhodiumQualityCheckForm } from "@/components/process/PreRhodiumQualityCheckForm";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function AddPreRhodiumQualityCheckPage() {
  return (
    <div className="p-6">
      <div className="mb-4">
        <PreviousBackButton />
      </div>
      <PreRhodiumQualityCheckForm mode="create" />
    </div>
  );
}
