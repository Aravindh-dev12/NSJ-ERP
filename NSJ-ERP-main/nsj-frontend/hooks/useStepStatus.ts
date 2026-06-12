"use client";

import { useState, useEffect } from "react";
import { getStepStatus, saveProcessStepData } from "@/lib/backend";

interface UseStepStatusOptions {
  orderId: string | null;
  stepName: string;
  editId?: string | null;
}

interface StepStatusData {
  step_id: string | null;
  step_name: string;
  status: string;
  is_locked: boolean;
  reference_id: string | null;
  has_been_saved: boolean;
  saved_at: string | null;
  marked_done_at: string | null;
  notes?: string | null;
  is_draft?: boolean;
}

interface UseStepStatusReturn {
  stepStatus: StepStatusData | null;
  isLoading: boolean;
  error: string | null;
  recordIdToLoad: string | null;
  shouldShowDraft: boolean;
  shouldShowReadOnly: boolean;
  shouldShowBlankForm: boolean;
  linkRecordToStep: (recordId: string) => Promise<void>;
}

/**
 * Hook to check step status before loading a form.
 *
 * This ensures that:
 * 1. If a draft exists, it loads the draft
 * 2. If a final save exists, it loads that record
 * 3. If nothing exists, it shows a blank form
 * 4. If step is locked, it shows read-only view
 */
export function useStepStatus({
  orderId,
  stepName,
  editId,
}: UseStepStatusOptions): UseStepStatusReturn {
  const [stepStatus, setStepStatus] = useState<StepStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !stepName) {
      setIsLoading(false);
      return;
    }

    const checkStepStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Call step status API
        const status = await getStepStatus(orderId, stepName);
        setStepStatus(status);
      } catch (err: any) {
        console.error("[useStepStatus] Failed to check step status:", err);
        setError(err?.message || "Failed to load step status");
      } finally {
        setIsLoading(false);
      }
    };

    checkStepStatus();
  }, [orderId, stepName]);

  // Determine what to show based on step status
  const recordIdToLoad = editId || stepStatus?.reference_id || null;
  const shouldShowReadOnly = stepStatus?.is_locked === true;
  const shouldShowBlankForm = !recordIdToLoad && !stepStatus?.has_been_saved;
  const shouldShowDraft = stepStatus?.is_draft === true && !shouldShowReadOnly;

  // Function to link a newly created record to the step
  const linkRecordToStep = async (recordId: string) => {
    if (!orderId || !stepName) return;

    try {
      await saveProcessStepData(
        orderId,
        stepName,
        recordId,
        `Linked ${stepName} record: ${recordId}`
      );

      // Update local state
      setStepStatus((prev) =>
        prev ? { ...prev, reference_id: recordId, has_been_saved: true } : null
      );
    } catch (err: any) {
      console.error("[useStepStatus] Failed to link record to step:", err);
      throw err;
    }
  };

  return {
    stepStatus,
    isLoading,
    error,
    recordIdToLoad,
    shouldShowDraft,
    shouldShowReadOnly,
    shouldShowBlankForm,
    linkRecordToStep,
  };
}
