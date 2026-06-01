"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StoneDemandToBaggingForm } from "@/components/process/StoneDemandToBaggingForm";
import { stoneDemandToBaggingDetail } from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";

interface EditStoneDemandToBaggingFormProps {
  params: Promise<{ id: string }>;
}

export function EditStoneDemandToBaggingForm({
  params,
}: EditStoneDemandToBaggingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    const loadRecord = async () => {
      try {
        const { id: resolvedId } = await params;
        setId(resolvedId);

        console.log("[Stone Demand Edit] Loading record:", resolvedId);
        const data = await stoneDemandToBaggingDetail(resolvedId);
        console.log("[Stone Demand Edit] FULL record loaded:", data);
        console.log("[Stone Demand Edit] Record images:", {
          hasImages: !!data?.images,
          imageCount: data?.images?.length || 0,
          images: data?.images,
        });
        console.log("[Stone Demand Edit] Record basic info:", {
          id: data.id,
          is_draft: data.is_draft,
          account_order_id: data.account_order_id,
        });
        setInitialData(data);
      } catch (err: any) {
        console.error("[Stone Demand Edit] Failed to load record:", err);

        // Handle 404 - record doesn't exist or was deleted
        if (err?.response?.status === 404 || err?.status === 404) {
          console.warn(
            "[Stone Demand Edit] Record not found, redirecting to create mode"
          );
          toast({
            variant: "destructive",
            title: "Record Not Found",
            description:
              "The saved Stone Demand record could not be found. Starting a new form.",
          });

          // Redirect to create mode
          router.replace("/process/stone-demand-to-bagging/add");
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    loadRecord();
  }, [params, router, toast]);

  if (loading) {
    return <div className="p-6">Loading record...</div>;
  }

  if (!initialData) {
    return <div className="p-6">Record not found</div>;
  }

  return (
    <StoneDemandToBaggingForm mode="edit" initialData={initialData} id={id} />
  );
}
