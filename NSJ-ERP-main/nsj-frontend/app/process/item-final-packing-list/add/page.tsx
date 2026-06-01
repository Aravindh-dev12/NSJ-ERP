"use client";

import { ItemFinalPackingListForm } from "@/components/process/ItemFinalPackingListForm";
import { PreviousBackButton } from "@/components/ui/PreviousBackButton";

export default function AddItemFinalPackingListPage() {
  return (
    <div className="p-6">
      <div className="mb-4">
        <PreviousBackButton />
      </div>
      <ItemFinalPackingListForm mode="create" />
    </div>
  );
}
