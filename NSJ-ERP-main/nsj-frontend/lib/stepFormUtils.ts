/**
 * Utility functions for loading step forms with proper error handling
 */

import { ApiError } from "@/lib/api";

/**
 * Result of initializing a step form
 */
export interface FormInitializationResult<T = any> {
  mode: "create" | "edit" | "view";
  record: T | null;
  isDraft: boolean;
  isLocked: boolean;
}

/**
 * Initialize a step form by checking step status and loading the existing record.
 * Handles 404 errors gracefully by returning create mode if record doesn't exist.
 *
 * @param orderId - The order UUID
 * @param stepName - The step name (e.g., "Ghat Trial Approval")
 * @param recordId - The record UUID to load
 * @param fetchRecord - Function to fetch the record details
 *
 * @returns Form initialization result with mode and record data
 *
 * @example
 * const result = await initializeStepForm(
 *   orderId,
 *   "Ghat Trial Approval",
 *   recordId,
 *   (id) => ghatApprovalDetail(id)
 * );
 *
 * if (result.mode === "create") {
 *   // Show empty form or redirect to /add
 * } else if (result.mode === "edit") {
 *   // Load form with result.record
 * } else if (result.mode === "view") {
 *   // Load read-only detail view
 * }
 */
export async function initializeStepForm<T = any>(
  orderId: string,
  stepName: string,
  recordId: string,
  fetchRecord: (id: string) => Promise<T>
): Promise<FormInitializationResult<T>> {
  console.log(`[Step Form] Initializing: ${stepName}`, { recordId });

  try {
    // Try to load the existing record
    const record = await fetchRecord(recordId);

    // Extract draft and lock status from record if available
    const isDraft = (record as any)?.is_draft || false;
    const isLocked = (record as any)?.is_locked || false;

    console.log(`[Step Form] Record loaded successfully: ${stepName}`, {
      isDraft,
      isLocked,
    });

    return {
      mode: isLocked ? "view" : "edit",
      record,
      isDraft,
      isLocked,
    };
  } catch (err: any) {
    // Handle 404 - record doesn't exist or was deleted
    if (err?.response?.status === 404 || err?.status === 404) {
      console.warn(`[Step Form] Record not found (404): ${stepName}`, {
        recordId,
      });

      return {
        mode: "create",
        record: null,
        isDraft: false,
        isLocked: false,
      };
    }

    // Re-throw other errors
    console.error(`[Step Form] Failed to load record: ${stepName}`, err);
    throw err;
  }
}

/**
 * Handle form initialization error with user-friendly message and redirect
 *
 * @param err - The error object
 * @param stepName - The step name for logging
 * @param router - Next.js router for redirect
 * @param fallbackUrl - URL to redirect to on 404
 *
 * @example
 * try {
 *   const record = await ghatApprovalDetail(id);
 *   // ... use record
 * } catch (err) {
 *   handleFormInitError(err, "Ghat Approval", router, "/process/ghat-approval/add");
 * }
 */
export function handleFormInitError(
  err: any,
  stepName: string,
  router: any,
  fallbackUrl: string
): void {
  // Handle 404 - record doesn't exist
  if (err?.response?.status === 404 || err?.status === 404) {
    console.warn(`[Step Form] Record not found, redirecting: ${stepName}`);

    // Show toast notification
    if (router?.toast) {
      router.toast({
        variant: "destructive",
        title: "Record Not Found",
        description: `The saved ${stepName.toLowerCase()} record could not be found. Starting a new form.`,
      });
    }

    // Redirect to create mode
    router.replace?.(fallbackUrl);
    return;
  }

  // Log other errors
  console.error(`[Step Form] Failed to load ${stepName}:`, err);
}

/**
 * Check if a reference_id is valid before attempting to load the record
 *
 * @param referenceId - The reference_id from step status
 * @param stepName - The step name for logging
 *
 * @returns true if reference_id is valid, false otherwise
 */
export function isValidReferenceId(
  referenceId: string | null | undefined,
  stepName: string
): boolean {
  if (!referenceId) {
    console.log(`[Step Form] No reference_id for ${stepName} - new form`);
    return false;
  }

  // Check if it looks like a valid UUID
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(referenceId)) {
    console.warn(
      `[Step Form] Invalid reference_id format for ${stepName}:`,
      referenceId
    );
    return false;
  }

  return true;
}
