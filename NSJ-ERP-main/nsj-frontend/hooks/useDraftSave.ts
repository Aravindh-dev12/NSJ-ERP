"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseDraftSaveOptions {
  stepName: string;
  orderId: string | null;
  savedRecordId: string | null;
  mode: "create" | "edit";
  saveFunction: (formData: FormData, isDraft: boolean) => Promise<any>;
  saveProcessStepData?: (
    orderId: string,
    stepName: string,
    referenceId: string,
    notes: string
  ) => Promise<any>;
}

interface UseDraftSaveReturn {
  isDraft: boolean;
  hasSaved: boolean;
  isCompleted: boolean;
  loading: boolean;
  showMissingFieldsModal: boolean;
  missingFields: string[];
  handleSaveDraft: (formData: FormData) => Promise<void>;
  handleFinalSave: (formData: FormData) => Promise<boolean>;
  handleMarkAsDone: (markDoneFunction: () => Promise<void>) => Promise<void>;
  setShowMissingFieldsModal: (value: boolean) => void;
  setIsDraft: (value: boolean) => void;
  setHasSaved: (value: boolean) => void;
  setIsCompleted: (value: boolean) => void;
  setLoading: (value: boolean) => void;
}

export function useDraftSave({
  stepName,
  orderId,
  savedRecordId,
  mode,
  saveFunction,
  saveProcessStepData,
}: UseDraftSaveOptions): UseDraftSaveReturn {
  const { toast } = useToast();
  const [isDraft, setIsDraft] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const handleSaveDraft = useCallback(
    async (formData: FormData) => {
      // Add is_draft: true to form data - bypasses all validation
      formData.append("is_draft", "true");

      setLoading(true);
      try {
        const result = await saveFunction(formData, true);

        const recId = mode === "create" ? result?.id : savedRecordId;
        if (orderId && recId && saveProcessStepData) {
          try {
            await saveProcessStepData(
              orderId,
              stepName,
              recId,
              `${stepName} saved as draft: ${recId}`
            );
          } catch (saveErr) {
            console.warn("[Save Step] Failed:", saveErr);
          }
        }

        setIsDraft(true);
        setHasSaved(true);
        toast({
          title: "Draft Saved",
          description: `${stepName} has been saved as draft. You can continue editing.`,
        });
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: err?.message || "Failed to save draft",
        });
      } finally {
        setLoading(false);
      }
    },
    [
      stepName,
      orderId,
      savedRecordId,
      mode,
      saveFunction,
      saveProcessStepData,
      toast,
    ]
  );

  const handleFinalSave = useCallback(
    async (formData: FormData): Promise<boolean> => {
      // Add is_draft: false to form data
      formData.append("is_draft", "false");

      setLoading(true);
      try {
        const result = await saveFunction(formData, false);

        const recId = mode === "create" ? result?.id : savedRecordId;
        if (orderId && recId && saveProcessStepData) {
          try {
            await saveProcessStepData(
              orderId,
              stepName,
              recId,
              `${stepName} finalized: ${recId}`
            );
          } catch (saveErr) {
            console.warn("[Save Step] Failed:", saveErr);
          }
        }

        setIsDraft(false);
        setHasSaved(true);
        toast({
          title: mode === "create" ? "Record Created" : "Record Updated",
          description: `${stepName} saved successfully!`,
        });

        return true;
      } catch (err: any) {
        // Check if error is a 400 with missing_fields
        if (err?.response?.status === 400 && err?.response?.data?.errors) {
          const errors = err.response.data.errors;
          if (errors.missing_fields && Array.isArray(errors.missing_fields)) {
            setMissingFields(errors.missing_fields);
            setShowMissingFieldsModal(true);
            return false;
          }
        }

        toast({
          variant: "destructive",
          title: "Error",
          description: err?.message || `Failed to save ${stepName}`,
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [
      stepName,
      orderId,
      savedRecordId,
      mode,
      saveFunction,
      saveProcessStepData,
      toast,
    ]
  );

  const handleMarkAsDone = useCallback(
    async (markDoneFunction: () => Promise<void>) => {
      if (!hasSaved && mode === "create") {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please save the step first before marking as done",
        });
        return;
      }

      setLoading(true);
      try {
        await markDoneFunction();
        setIsCompleted(true);
        toast({
          title: "Step Completed",
          description: `${stepName} has been marked as done!`,
        });
      } catch (err: any) {
        // Check if error is a 400 with missing_fields
        if (err?.response?.status === 400 && err?.response?.data) {
          const data = err.response.data;
          if (data.missing_fields && Array.isArray(data.missing_fields)) {
            setMissingFields(data.missing_fields);
            setShowMissingFieldsModal(true);
            return;
          }
        }

        toast({
          variant: "destructive",
          title: "Error",
          description: err?.message || "Failed to mark step as done",
        });
      } finally {
        setLoading(false);
      }
    },
    [hasSaved, mode, stepName, toast]
  );

  return {
    isDraft,
    hasSaved,
    isCompleted,
    loading,
    showMissingFieldsModal,
    missingFields,
    handleSaveDraft,
    handleFinalSave,
    handleMarkAsDone,
    setShowMissingFieldsModal,
    setIsDraft,
    setHasSaved,
    setIsCompleted,
    setLoading,
  };
}
