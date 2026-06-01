"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StoneDemandToBaggingForm } from "@/components/process/StoneDemandToBaggingForm";
import { getStepStatus, stoneDemandToBaggingDetail } from "@/lib/backend";
import type { StoneDemandToBagging } from "@/lib/backend";

export default function AddStoneDemandToBaggingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("order_id") || "";

  const [initialData, setInitialData] = useState<StoneDemandToBagging | null>(
    null
  );
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [recordId, setRecordId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Check step status and load existing draft if available
  useEffect(() => {
    const checkStepStatus = async () => {
      if (!orderIdParam) {
        setLoading(false);
        return;
      }

      try {
        console.log(
          "[Stone Demand Add] Checking step status for order:",
          orderIdParam
        );
        const status = await getStepStatus(
          orderIdParam,
          "Stone Demand to Bagging"
        );

        console.log("[Stone Demand Add] Step status:", status);

        // If reference_id exists and step is not locked, load the existing draft
        if (status.reference_id && !status.is_locked) {
          console.log(
            "[Stone Demand Add] Loading existing draft:",
            status.reference_id
          );
          setRecordId(status.reference_id);
          setMode("edit");

          try {
            const recordData = await stoneDemandToBaggingDetail(
              status.reference_id
            );
            console.log("[Stone Demand Add] Draft loaded:", {
              id: recordData.id,
              is_draft: recordData.is_draft,
              account_order_id: recordData.account_order_id,
            });
            setInitialData(recordData);
          } catch (err: any) {
            console.error("[Stone Demand Add] Failed to load draft:", err);

            // Handle 404 - record was deleted
            if (err?.response?.status === 404 || err?.status === 404) {
              console.warn(
                "[Stone Demand Add] Draft not found, starting fresh"
              );
              setMode("create");
              setInitialData(null);
            }
          }
        } else if (status.is_locked) {
          console.log("[Stone Demand Add] Step is locked");
        } else {
          console.log("[Stone Demand Add] No existing draft found");
        }
      } catch (err) {
        console.error("[Stone Demand Add] Failed to check step status:", err);
      } finally {
        setLoading(false);
      }
    };

    checkStepStatus();
  }, [orderIdParam]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (mode === "edit" && recordId) {
    console.log(
      "[Stone Demand Add] Rendering in edit mode with record:",
      recordId
    );
    return (
      <StoneDemandToBaggingForm
        mode="edit"
        initialData={initialData || undefined}
        id={recordId}
      />
    );
  }

  console.log(
    "[Stone Demand Add] Rendering in create mode with orderId:",
    orderIdParam
  );
  return (
    <StoneDemandToBaggingForm
      mode="create"
      orderIdFromUrl={orderIdParam}
      accountOrderIdFromUrl={searchParams.get("account_order_id") || ""}
    />
  );
}
