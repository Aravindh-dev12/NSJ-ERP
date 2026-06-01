"use client";

import { useState, useEffect } from "react";
import { ItemFinalPackingListForm } from "@/components/process/ItemFinalPackingListForm";
import { itemFinalPackingListDetail } from "@/lib/backend";

interface EditItemFinalPackingListFormProps {
  params: Promise<{ id: string }>;
}

export function EditItemFinalPackingListForm({
  params,
}: EditItemFinalPackingListFormProps) {
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    const loadRecord = async () => {
      try {
        const { id: resolvedId } = await params;
        setId(resolvedId);

        const data = await itemFinalPackingListDetail(resolvedId);
        setInitialData(data);
      } catch (err) {
        console.error("Failed to load record:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRecord();
  }, [params]);

  if (loading) {
    return <div className="p-6">Loading record...</div>;
  }

  if (!initialData) {
    return <div className="p-6">Record not found</div>;
  }

  return (
    <ItemFinalPackingListForm mode="edit" initialData={initialData} id={id} />
  );
}
