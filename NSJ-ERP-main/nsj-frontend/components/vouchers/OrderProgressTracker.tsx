"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  AlertTriangle,
  FileDown,
  Loader2,
  CheckCircle2,
  Lock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { generateProcessPDF } from "@/lib/processPDF";
import {
  getOrderProcessSteps,
  updateOrderStepStatus,
  markOrderCourierDispatched,
  markDoneStep,
  markStepDone,
  markStepDoneWithAssignment,
  saveProcessStepData,
  voucherDetail,
  accountDetail,
  OrderProcess,
  OrderProcessStepStatus,
  Voucher,
} from "@/lib/backend";
import { OrderStepItem } from "./OrderStepItem";
import { AssignNextStepDialog } from "@/components/process/AssignNextStepDialog";

// Helper function to find step department from steps array
function findStepDepartment(
  stepName: string,
  steps?: any[]
): string | undefined {
  if (!steps || !stepName) return undefined;
  const step = steps.find(
    (s) => s.step_name === stepName || s.task_name === stepName
  );
  return step?.department;
}

interface OrderProgressTrackerProps {
  orderId: string;
}

export function OrderProgressTracker({ orderId }: OrderProgressTrackerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [data, setData] = useState<OrderProcess | null>(null);
  const [orderDetails, setOrderDetails] = useState<Voucher | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [showLockConfirm, setShowLockConfirm] = useState(false);

  // Mark as Done state
  const [showMarkDoneDialog, setShowMarkDoneDialog] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [markingDone, setMarkingDone] = useState(false);

  // Assign Next Step state
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [nextStepName, setNextStepName] = useState("");
  const [nextStepDepartment, setNextStepDepartment] = useState<
    string | undefined
  >(undefined);
  const [pendingStepId, setPendingStepId] = useState<string | null>(null);

  const handleExportPDF = async () => {
    if (!data || !orderDetails) return;
    setIsExporting(true);
    try {
      // Extract account ID and name
      let accountId: string | null = null;
      let accountName = "Unknown";

      if (orderDetails.account && typeof orderDetails.account === "object") {
        accountId = (orderDetails.account as any).id;
        accountName =
          (orderDetails.account as any).account_name ||
          (orderDetails.account as any).name ||
          "Unknown";
      } else if (typeof orderDetails.account === "string") {
        accountId = orderDetails.account;
        accountName = orderDetails.account;
      }

      // Fetch account details to get phone number
      let phoneNumber = "";
      if (accountId) {
        try {
          const accountData = await accountDetail(accountId);
          phoneNumber =
            accountData.contact?.phone || accountData.contact?.mobile || "";
        } catch (err) {
          console.warn("Could not fetch account details:", err);
        }
      }

      // Prepare data for PDF
      const pdfData = {
        orderId: orderDetails.bill_no || orderDetails.id || orderId,
        queryInDate:
          orderDetails.date || new Date().toISOString().split("T")[0],
        accountName,
        subaccount: (orderDetails as any).subaccount || "",
        itemName: (orderDetails as any).item_name || "—",
        goldCarat:
          orderDetails.stamp || (orderDetails as any).gold_carat || "—",
        size: orderDetails.size || "—",
        location: (orderDetails as any).location || "",
        deliveryType: (orderDetails as any).delivery_type || "",
        phoneNumber,
        referenceImage: (orderDetails as any).upload_file || undefined,
        referenceImageType: (orderDetails as any).upload_file
          ? "image/jpeg"
          : undefined,
        steps: data.process_steps,
        progressPercentage,
      };

      // Generate PDF
      await generateProcessPDF(pdfData);

      toast({
        title: "Process tracking sheet generated",
      });
    } catch (err) {
      console.error("Export error:", err);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [processData, orderData] = await Promise.all([
          getOrderProcessSteps(orderId),
          voucherDetail(orderId),
        ]);
        setData(processData);
        setOrderDetails(orderData);
        setErrorStatus(null);
      } catch (err: any) {
        const status = err.status || (err.response && err.response.status);
        setErrorStatus(status || 500);
        if (status !== 404) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load progress tracking.",
          });
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [orderId, toast]);

  const progressPercentage = useMemo(() => {
    if (!data || !data.process_steps || data.process_steps.length === 0)
      return 0;
    const completed = data.process_steps.filter(
      (s) => s.status === "COMPLETED"
    ).length;
    return Math.round((completed / data.process_steps.length) * 100);
  }, [data]);

  const handleStatusChange = async (
    stepId: string,
    status: OrderProcessStepStatus
  ) => {
    if (!data) return;
    setProcessing(true);
    try {
      const result = await updateOrderStepStatus(orderId, stepId, { status });
      // Backend auto-recalculates all statuses, so we must refetch the full list.
      const processData = await getOrderProcessSteps(orderId);
      setData(processData);

      toast({
        title: "Status Updated",
        description: `${result.step.step_name || (result.step as any).task_name} is now ${status.replace("_", " ")}.`,
      });
    } catch (err) {
      console.error("Status update error:", err);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not sync status with server.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCourierDispatch = async () => {
    setShowLockConfirm(true);
  };

  const handleMarkAsDone = async (stepId: string) => {
    setSelectedStepId(stepId);
    setShowMarkDoneDialog(true);
  };

  const confirmMarkAsDone = async () => {
    if (!selectedStepId) return;

    setShowMarkDoneDialog(false);
    setMarkingDone(true);

    try {
      // Step 1: Call mark-done without deadline/assignee
      const result = await markStepDone(orderId, selectedStepId, "");

      // Check if backend requires confirmation (needs deadline + assignee)
      if ((result as any).requires_confirmation) {
        // Show the assign next step dialog
        setNextStepName((result as any).next_step_name || "Next Step");

        // Get department from the response or look it up from steps
        const dept =
          (result as any).next_step_department ||
          findStepDepartment(
            (result as any).next_step_name,
            data?.process_steps
          );
        setNextStepDepartment(dept);

        setPendingStepId(selectedStepId);
        setShowAssignDialog(true);
        setMarkingDone(false);
        return;
      }

      // If success, handle auto-completion of linked steps
      await handleLinkedStepsCompletion(selectedStepId);

      toast({
        title: "Step Completed",
        description: "Step has been marked as done and is now locked.",
      });

      // Refresh the process steps
      const processData = await getOrderProcessSteps(orderId);
      setData(processData);
    } catch (err: any) {
      console.error("Mark as done error:", err);

      // ApiError stores data directly on the error object, not in err.response
      const errorData = err?.data || err?.response?.data;
      const errorStatus = err?.status || err?.response?.status;

      // Check if error is validation error (missing fields)
      if (errorStatus === 400 && errorData) {
        // Case 1: requires_confirmation → show assignment popup (NO toast)
        if (errorData.requires_confirmation === true) {
          setNextStepName(errorData.next_step_name || "Next Step");

          // Get department from the response or look it up from steps
          const dept =
            errorData.next_step_department ||
            findStepDepartment(errorData.next_step_name, data?.process_steps);
          setNextStepDepartment(dept);

          setPendingStepId(selectedStepId);
          setShowAssignDialog(true);
          setMarkingDone(false);
          return;
        }

        // Case 2: missing_fields → show validation error toast
        if (
          errorData.missing_fields &&
          Array.isArray(errorData.missing_fields)
        ) {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: `Missing required fields: ${errorData.missing_fields.join(", ")}`,
          });
          return;
        }
      }

      // Case 3: any other error → show generic error toast
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.message || "Failed to mark step as done",
      });
    } finally {
      setMarkingDone(false);
    }
  };

  const handleLinkedStepsCompletion = async (stepId: string) => {
    // Check if this step has linked steps that should also be auto-completed
    const AUTO_APPROVAL_TRIGGERS: Record<string, string[]> = {
      "3D Design": ["3D Design Approval"],
      "3D Design Approval": ["3D Design"],
      "3D Printing/CAM Piece": ["CAM Piece QC"],
      "CAM Piece QC": ["3D Printing/CAM Piece"],
      "Ghat QC": ["Ghat Trial Approval"],
      "Ghat Trial Approval": ["Ghat QC"],
      "Ghat Approval": ["Ghat Trial Approval"],
    };

    // Get the current steps to find the step name and linked steps
    const processData = await getOrderProcessSteps(orderId);
    const selectedStep = processData.process_steps?.find(
      (s) => s.id === stepId
    );
    const stepName = (
      selectedStep?.step_name ||
      selectedStep?.task_name ||
      ""
    ).trim();

    console.log("[Auto-Complete] Checking step:", {
      stepId,
      stepName,
      hasMapping: !!AUTO_APPROVAL_TRIGGERS[stepName],
    });

    // Find linked steps to auto-complete
    if (AUTO_APPROVAL_TRIGGERS[stepName]) {
      const linkedStepNames = AUTO_APPROVAL_TRIGGERS[stepName];
      const linkedSteps =
        processData.process_steps?.filter(
          (s) =>
            linkedStepNames.includes(
              (s.step_name || s.task_name || "").trim()
            ) &&
            s.status !== "COMPLETED" &&
            !s.is_locked
        ) || [];

      console.log("[Auto-Complete] Found linked steps:", {
        stepName,
        linkedStepCount: linkedSteps.length,
        linkedSteps: linkedSteps.map((s) => ({
          name: s.step_name || s.task_name,
          status: s.status,
          isLocked: s.is_locked,
        })),
      });

      // Auto-complete linked steps
      for (const linkedStep of linkedSteps) {
        try {
          // If the selected step has a reference_id, copy it to the linked step
          if (selectedStep?.reference_id) {
            await saveProcessStepData(
              orderId,
              linkedStep.step_name || linkedStep.task_name || "",
              selectedStep.reference_id,
              `Auto-completed: Linked to ${stepName}`
            );
            console.log(
              `[Auto-Complete] Copied reference_id to "${linkedStep.step_name}"`
            );
          }

          // Mark the linked step as done
          await markDoneStep(
            orderId,
            linkedStep.id,
            `Auto-completed: Linked to ${stepName}`
          );
          console.log(
            `[Auto-Complete] Marked "${linkedStep.step_name}" as done`
          );
        } catch (err) {
          console.error(
            `[Auto-Complete] Failed to mark "${linkedStep.step_name}":`,
            err
          );
        }
      }

      if (linkedSteps.length > 0) {
        toast({
          title: "Steps Completed",
          description: `${stepName} and ${linkedSteps.length} linked step(s) have been marked as done.`,
        });
      } else {
        // Log if no linked steps were found even though the mapping exists
        console.log(
          "[Auto-Complete] No pending linked steps to mark (already completed or locked)"
        );
      }
    }
  };

  const handleAssignNextStep = async (
    deadline: string,
    assigneeId: string,
    assigneeName: string
  ) => {
    if (!pendingStepId) {
      console.error("[Assign Next Step] No pendingStepId found!");
      return;
    }

    console.log("[Assign Next Step] Calling markDoneWithAssignment:", {
      orderId,
      stepId: pendingStepId,
      deadline,
      assigneeId,
      assigneeName,
    });

    // Don't wrap in try/catch here - let the dialog handle errors locally
    // This prevents the global error handler from showing a toast

    // Step 2: Call mark-done with deadline and assignee
    const result = await markStepDoneWithAssignment(
      orderId,
      pendingStepId,
      "",
      deadline,
      assigneeId
    );

    console.log("[Assign Next Step] Success response:", result);

    // Save the step ID before clearing it
    const completedStepId = pendingStepId;

    // Close the dialog
    setShowAssignDialog(false);
    setPendingStepId(null);

    // Handle auto-completion of linked steps
    await handleLinkedStepsCompletion(completedStepId);

    // Show success toast with next step info
    const nextStepDeadline = result.next_step?.deadline || deadline;
    toast({
      title: "Step Completed",
      description: `Step marked as done. ${nextStepName} assigned to ${assigneeName} with deadline ${nextStepDeadline}.`,
    });

    // Refresh the process steps
    const processData = await getOrderProcessSteps(orderId);
    setData(processData);
  };

  const handleConfirmLock = async () => {
    setProcessing(true);
    try {
      await markOrderCourierDispatched(orderId);
      setData((prev) =>
        prev ? { ...prev, lock_level: "FULLY_LOCKED" } : null
      );
      toast({
        title: "Courier Dispatched",
        description: "This order is now fully locked.",
      });
      setShowLockConfirm(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to lock order.",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="p-12 text-center text-muted-foreground animate-pulse">
        Initializing progress tracker...
      </div>
    );

  if (errorStatus === 404) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-amber-900">
              Tracking Not Available
            </CardTitle>
            <CardDescription className="text-amber-700 text-base">
              This order doesn&apos;t have a production workflow attached.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-amber-800/80 leading-relaxed">
              Only orders created through the new conversion workflow (Query →
              Sale → Order) include process step tracking. Legacy orders or
              directly created sales may not have these details.
            </p>
            <Button
              variant="outline"
              className="border-amber-300 hover:bg-amber-100/50"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data)
    return (
      <div className="p-12 text-center text-destructive">
        Error loading production data.
      </div>
    );

  const isLocked =
    data.lock_level === "FULLY_LOCKED" || data.can_update_status === false;

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Simple Header */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
            <p className="text-sm text-gray-600 mt-1">Order #{orderId}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="no-print font-bold"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              Export PDF
            </Button>
            {isLocked && (
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded">
                🔒 Locked
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">
              {progressPercentage}% Complete
            </span>
            <span className="text-gray-500">
              {data?.process_steps
                ? data.process_steps.filter((s) => s.status === "COMPLETED")
                    .length
                : 0}{" "}
              of {data?.process_steps ? data.process_steps.length : 0} steps
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Completion Action */}
      {!isLocked && progressPercentage === 100 && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center justify-between">
          <div>
            <p className="font-medium text-green-900">Production Complete</p>
            <p className="text-sm text-green-700">Ready for dispatch</p>
          </div>
          <Button
            onClick={handleCourierDispatch}
            disabled={processing}
            className="bg-green-600 hover:bg-green-700"
          >
            Mark as Dispatched
          </Button>
        </div>
      )}

      {/* Locked Warning */}
      {isLocked && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Locked:</strong> This order has been dispatched. No further
            changes allowed.
          </p>
        </div>
      )}

      {/* Query Orders */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Query Orders
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.process_steps.map((step) => (
            <OrderStepItem
              key={step.id}
              step={step}
              orderId={orderId}
              orderDetails={orderDetails}
              isLocked={isLocked || processing}
              refId={step.reference_id}
              allSteps={data.process_steps}
              onStatusChange={(status) => handleStatusChange(step.id, status)}
              onMarkAsDone={handleMarkAsDone}
            />
          ))}
        </div>
      </div>

      {/* Lock Confirmation Popup */}
      <Dialog open={showLockConfirm} onOpenChange={setShowLockConfirm}>
        <DialogContent className="sm:max-w-[400px] rounded-xl p-0 overflow-hidden">
          <div className="bg-red-500 p-6 text-white flex items-center gap-4">
            <AlertTriangle className="h-10 w-10 shrink-0" />
            <div>
              <DialogTitle className="text-xl font-bold">
                Lock Order & Dispatch?
              </DialogTitle>
              <DialogDescription className="text-red-50 text-xs mt-1">
                Critical security action.
              </DialogDescription>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Are you sure you want to mark this order as{" "}
                <strong>Courier Dispatched</strong>?
              </p>
              <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 font-semibold">
                ⚠️ This action will FULLY LOCK the order. You will not be able
                to update any more query orders.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-10 font-bold"
                onClick={() => setShowLockConfirm(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmLock}
                disabled={processing}
                className="flex-1 h-10 bg-red-600 hover:bg-red-700 font-bold text-white shadow-md border-red-700 border-b-4 active:border-b-0 active:translate-y-1 transition-all"
              >
                {processing ? "Locking..." : "Confirm & Lock"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark as Done Confirmation Dialog */}
      <AlertDialog
        open={showMarkDoneDialog}
        onOpenChange={setShowMarkDoneDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Step as Done?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this step as done? This will lock
              the step and no further edits will be allowed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowMarkDoneDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMarkAsDone}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {markingDone ? "Marking..." : "Yes, Mark as Done"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Next Step Dialog */}
      <AssignNextStepDialog
        isOpen={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        nextStepName={nextStepName}
        nextStepDepartment={nextStepDepartment}
        onConfirm={handleAssignNextStep}
      />
    </div>
  );
}
