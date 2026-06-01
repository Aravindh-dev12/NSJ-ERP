"use client";

import { useState, useEffect } from "react";
import { PreRhodiumQualityCheckForm } from "@/components/process/PreRhodiumQualityCheckForm";
import {
  preRhodiumQualityCheckDetail,
  type PreRhodiumQualityCheck,
} from "@/lib/backend";

export default function EditPreRhodiumQualityCheckPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [initialData, setInitialData] = useState<PreRhodiumQualityCheck | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await preRhodiumQualityCheckDetail(id);
        setInitialData(data);
      } catch (err) {
        console.error("Failed to load pre-rhodium QC data:", err);
        setError("Failed to load record details");
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="p-8 text-center text-destructive">
        {error || "Record not found"}
      </div>
    );
  }

  return (
    <PreRhodiumQualityCheckForm mode="edit" id={id} initialData={initialData} />
  );
}
