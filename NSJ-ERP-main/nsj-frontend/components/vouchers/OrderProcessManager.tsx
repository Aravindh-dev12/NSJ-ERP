"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Save,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getOrderDraft,
  getOrderProcessSteps,
  updateDraftSteps,
  updateOrderStepStatus,
  confirmOrderCreation,
  autoCompleteStep,
  OrderProcessStep,
} from "@/lib/backend";
import { validateWorkflow } from "@/lib/goldRateApi";

import { DraftStepItem } from "./DraftStepItem";

interface OrderProcessManagerProps {
  draftId: string;
  isOrder?: boolean;
}

export function OrderProcessManager({
  draftId,
  isOrder,
}: OrderProcessManagerProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [steps, setSteps] = useState<OrderProcessStep[]>([]);
  const [saleId, setSaleId] = useState<string | null>(null);
  const [salesQueryId, setSalesQueryId] = useState<string | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<OrderProcessStep | null>(null);
  const [newStepData, setNewStepData] = useState({
    step_name: "",
    description: "",
    department: "",
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [history, setHistory] = useState<{ action: string; timestamp: Date }[]>(
    []
  );

  const addHistory = (action: string) => {
    setHistory((prev) =>
      [{ action, timestamp: new Date() }, ...prev].slice(0, 10)
    );
  };

  const [canModify, setCanModify] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"IDLE" | "SAVING" | "SAVED">(
    "IDLE"
  );

  const [orderId, setOrderId] = useState<string | null>(null);
  const [lockLevel, setLockLevel] = useState<string>("UNLOCKED");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchProcessData = async () => {
    try {
      let data: any;
      if (isOrder) {
        // Fetch Order Process (Locked)
        data = await getOrderProcessSteps(draftId);
        setCanModify(data.can_modify_steps === true);
        setOrderId(data.order_id || draftId);
        setLockLevel(data.lock_level || "LOCKED_FOR_EDIT");
      } else {
        // Fetch Draft (Unlocked)
        data = await getOrderDraft(draftId);
        const modifiable = data.can_modify !== false;
        setCanModify(modifiable);
        setOrderId(data.order_id || null);
        setSalesQueryId(data.sales_query_id || data.query_id || null);
        setLockLevel(
          data.lock_level || (modifiable ? "UNLOCKED" : "LOCKED_FOR_EDIT")
        );

        // CRITICAL FIX: If draft is already confirmed, redirect to order view
        if (data.order_id) {
          router.push(
            `/vouchers/orders/${data.order_id}/process-confirmation/`
          );
          return;
        }
      }

      if (!data) throw new Error("Data is null");

      // Normalize steps (ensure step_name and status exist)
      const rawSteps = data.process_steps || data.steps || [];
      const normalizedSteps = rawSteps
        .map((s: any) => {
          let status = s.status || "PENDING";

          // User request: Don't automatically mark as COMPLETED when clicking create order draft
          // If it's a draft (not an order) and it's the "Advance Received" step, default to PENDING
          // unless it was manually changed (which we can't fully know here, but PENDING is safer for new drafts)
          if (
            !isOrder &&
            (s.step_name === "Advance Received" ||
              s.task_name === "Advance Received") &&
            status === "COMPLETED"
          ) {
            console.log(
              "[DEBUG] Overriding Advance Received status to PENDING for draft view"
            );
            status = "PENDING";
          }

          return {
            ...s,
            status,
            step_name: s.step_name || s.task_name || s.name || "Unnamed Step",
            position: parseInt(s.position) || 0,
          };
        })
        .sort((a: any, b: any) => a.position - b.position || 0);

      setSteps(normalizedSteps);
      if (!isOrder) {
        setSaleId(data.sale_id);
        setSalesQueryId(data.sales_query_id || data.query_id || null);
      }
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error("[DEBUG] Failed to load process data:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load process data: ${err.message || "Unknown error"}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProcessData();
  }, [draftId, isOrder, toast]);

  // Warn before leaving page if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!canModify) return;
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((i) => i.id === active.id);
      const newIndex = steps.findIndex((i) => i.id === over.id);

      const newSteps = arrayMove(steps, oldIndex, newIndex).map(
        (item, index) => ({
          ...item,
          position: index + 1,
        })
      );

      setSteps(newSteps);
      setHasUnsavedChanges(true);

      // Auto-save reorder
      try {
        setSaveStatus("SAVING");
        const result = await updateDraftSteps(draftId, newSteps);
        if (result.process_steps) {
          setSteps(
            result.process_steps.sort((a, b) => a.position - b.position)
          );
        }
        setHasUnsavedChanges(false);
        setSaveStatus("SAVED");
        setTimeout(() => setSaveStatus("IDLE"), 3000);
      } catch (err) {
        setSaveStatus("IDLE");
        toast({
          variant: "destructive",
          title: "Sync Failed",
          description: "Reordering not saved to server.",
        });
      }
    }
  };

  const handleAddStep = async () => {
    if (!canModify) return;
    const newStep: OrderProcessStep = {
      id: `temp-${Date.now()}`,
      step_name: newStepData.step_name,
      description: newStepData.description,
      department: newStepData.department,
      status: "PENDING",
      position: steps.length + 1,
      notes: "",
      completed_at: undefined,
    };
    const updatedSteps = [...steps, newStep];
    setSteps(updatedSteps);
    setHasUnsavedChanges(true);
    setIsAddDialogOpen(false);
    setNewStepData({ step_name: "", description: "", department: "" });

    // Auto-save add
    try {
      setSaveStatus("SAVING");
      const result = await updateDraftSteps(draftId, updatedSteps);
      if (result.process_steps) {
        setSteps(result.process_steps.sort((a, b) => a.position - b.position));
      }
      setHasUnsavedChanges(false);
      setSaveStatus("SAVED");
      setTimeout(() => setSaveStatus("IDLE"), 3000);
      toast({ title: "Step Added", description: "Process updated on server." });
    } catch (err) {
      setSaveStatus("IDLE");
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "New step not saved.",
      });
    }
  };

  const handleUpdateStep = async () => {
    if (!canModify || !editingStep) return;
    const updatedSteps = steps.map((s) =>
      s.id === editingStep.id ? { ...s, ...newStepData } : s
    );
    setSteps(updatedSteps);
    setHasUnsavedChanges(true);
    setEditingStep(null);
    setNewStepData({ step_name: "", description: "", department: "" });

    // Auto-save update
    try {
      setSaveStatus("SAVING");
      const result = await updateDraftSteps(draftId, updatedSteps);
      if (result.process_steps) {
        setSteps(result.process_steps.sort((a, b) => a.position - b.position));
      }
      setHasUnsavedChanges(false);
      setSaveStatus("SAVED");
      setTimeout(() => setSaveStatus("IDLE"), 3000);
      toast({ title: "Step Updated", description: "Changes saved to server." });
    } catch (err) {
      setSaveStatus("IDLE");
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Changes not saved.",
      });
    }
  };

  const handleRemoveStep = async (id: string) => {
    if (!canModify) return;
    const updatedSteps = steps.map((s) =>
      s.id === id ? { ...s, status: "REMOVED" as any } : s
    );
    setSteps(updatedSteps);
    setHasUnsavedChanges(true);

    // Auto-save remove
    try {
      setSaveStatus("SAVING");
      const result = await updateDraftSteps(draftId, updatedSteps);
      if (result.process_steps) {
        setSteps(result.process_steps.sort((a, b) => a.position - b.position));
      }
      setHasUnsavedChanges(false);
      setSaveStatus("SAVED");
      setTimeout(() => setSaveStatus("IDLE"), 3000);
      toast({
        title: "Step Removed",
        description: "Process updated on server.",
      });
    } catch (err) {
      setSaveStatus("IDLE");
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Removal not saved.",
      });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    // Define auto-approval triggers: when one step is completed, auto-complete its linked steps
    const AUTO_APPROVAL_TRIGGERS: Record<string, string[]> = {
      "3D Design": ["3D Design Approval"],
      "3D Design Approval": ["3D Design"],
      "3D Printing/CAM Piece": ["CAM Piece QC", "Stone Demand to Bagging"],
      "CAM Piece QC": ["3D Printing/CAM Piece"],
      "Stone Demand to Bagging": ["3D Printing/CAM Piece"],
      "Ghat QC": ["Ghat Trial Approval"],
      "Ghat Trial Approval": ["Ghat QC"],
    };

    const updatedSteps = steps.map((s) =>
      s.id === id ? { ...s, status: status as any } : s
    );
    setSteps(updatedSteps);

    // Get the step that was just updated
    const updatedStep = steps.find((s) => s.id === id);
    const stepName = updatedStep?.step_name || updatedStep?.task_name || "";

    // Check if this step has linked steps and if status is COMPLETED
    let linkedStepsToUpdate: OrderProcessStep[] = [];
    if (status === "COMPLETED" && AUTO_APPROVAL_TRIGGERS[stepName]) {
      const linkedStepNames = AUTO_APPROVAL_TRIGGERS[stepName];
      linkedStepsToUpdate = steps.filter(
        (s) =>
          linkedStepNames.includes(s.step_name || s.task_name || "") &&
          s.status !== "COMPLETED"
      );
    }

    if (isOrder) {
      // Order mode: individual status update
      try {
        setSaveStatus("SAVING");
        const result = await updateOrderStepStatus(orderId!, id, {
          status: status as any,
        });

        if (result && result.step) {
          setSteps(
            steps.map((s) => (s.id === id ? { ...s, ...result.step } : s))
          );
        }

        // Auto-approve linked steps (silent completion for missing steps)
        for (const linkedStep of linkedStepsToUpdate) {
          try {
            const linkedResult = await updateOrderStepStatus(
              orderId!,
              linkedStep.id,
              {
                status: "COMPLETED" as any,
              }
            );

            if (linkedResult && linkedResult.step) {
              setSteps((prevSteps) =>
                prevSteps.map((s) =>
                  s.id === linkedStep.id ? { ...s, ...linkedResult.step } : s
                )
              );
            }

            // Only show toast for successful auto-approval if it's a user-initiated action
            // For background auto-approval, keep it silent
            console.log(
              `[Auto-Approval] Successfully completed "${linkedStep.step_name || linkedStep.task_name}"`
            );
          } catch (pairErr) {
            // Silent handling of missing or failed auto-approvals
            console.warn(
              `[Auto-Approval] Step "${linkedStep.step_name || linkedStep.task_name}" not found or failed to auto-complete:`,
              pairErr
            );
            // Continue processing other linked steps without interrupting the flow
          }
        }

        setSaveStatus("SAVED");
        setTimeout(() => setSaveStatus("IDLE"), 3000);
        toast({
          title: "Status Updated",
          description:
            linkedStepsToUpdate.length > 0
              ? `Progress synced. ${linkedStepsToUpdate.length} linked step(s) auto-approved.`
              : "Progress synced with server.",
        });
      } catch (err) {
        setSaveStatus("IDLE");
        toast({
          variant: "destructive",
          title: "Sync Failed",
          description: "Status change not saved.",
        });
      }
    } else {
      // Draft mode: update full list
      setHasUnsavedChanges(true);

      // If there are linked steps, update them too
      let finalUpdatedSteps = updatedSteps;
      if (linkedStepsToUpdate.length > 0) {
        const linkedIds = linkedStepsToUpdate.map((s) => s.id);
        finalUpdatedSteps = updatedSteps.map((s) =>
          linkedIds.includes(s.id) ? { ...s, status: "COMPLETED" as any } : s
        );
        setSteps(finalUpdatedSteps);
      }

      try {
        setSaveStatus("SAVING");
        const result = await updateDraftSteps(draftId, finalUpdatedSteps);
        if (result.process_steps) {
          setSteps(
            result.process_steps.sort((a, b) => a.position - b.position || 0)
          );
        }
        setHasUnsavedChanges(false);
        setSaveStatus("SAVED");
        setTimeout(() => setSaveStatus("IDLE"), 3000);

        // Silent auto-approval for draft mode - no user notifications
        if (linkedStepsToUpdate.length > 0) {
          console.log(
            `[Auto-Approval] Draft mode: ${linkedStepsToUpdate.length} linked step(s) automatically completed.`
          );
        }
      } catch (err) {
        setSaveStatus("IDLE");
        toast({
          variant: "destructive",
          title: "Sync Failed",
          description: "Status change not saved.",
        });
      }
    }
  };

  const handleSaveSteps = async () => {
    if (!canModify) return;
    setIsSaving(true);
    setSaveStatus("SAVING");
    try {
      const result = await updateDraftSteps(draftId, steps);
      if (result.process_steps) {
        setSteps(result.process_steps.sort((a, b) => a.position - b.position));
      }
      setHasUnsavedChanges(false);
      setSaveStatus("SAVED");
      setTimeout(() => setSaveStatus("IDLE"), 3000);
      toast({
        title: "Steps Saved",
        description: "Production process updated.",
      });
    } catch (err) {
      setSaveStatus("IDLE");
      console.error("[DEBUG] Save failed:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save steps.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalConfirm = async () => {
    if (!canModify) return;
    setIsConfirming(true);
    try {
      // Workflow Validation Check
      try {
        const validation = await validateWorkflow({
          workflow_type: "order_creation",
          allow_draft: false,
        });

        if (!validation.can_proceed) {
          toast({
            variant: "destructive",
            title: "Action Blocked",
            description:
              validation.message ||
              validation.reason ||
              "Please update the daily gold rate to proceed.",
          });
          setIsConfirming(false);
          setShowConfirmModal(false);
          return;
        }
      } catch (validationErr) {
        console.error("Workflow validation failed to check:", validationErr);
        // Continue if API fails to avoid breaking flow entirely, or you could block it
      }

      setSaveStatus("SAVING");

      // 1. Ensure latest steps are saved to backend first
      // Filter out REMOVED steps so they are not included in the final order
      const activeSteps = steps.filter((step) => step.status !== "REMOVED");

      // Re-index positions to be sequential
      const reindexedSteps = activeSteps.map((step, index) => ({
        ...step,
        position: index + 1,
      }));

      await updateDraftSteps(draftId, reindexedSteps);
      setHasUnsavedChanges(false);
      setSaveStatus("SAVED");

      // 2. Finalize order creation
      const response = await confirmOrderCreation(draftId);

      toast({
        title: "Order Confirmed!",
        description: "Production workflow is now locked.",
      });

      // 2.5 Auto-complete "Generate Order ID" and "Estimate Approval" (if from query)
      if (response.order_id) {
        try {
          // 1. Generate Order ID
          await autoCompleteStep(
            response.order_id,
            "Generate Order ID",
            response.order_id,
            "Order confirmed and ID generated"
          );

          // 2. Estimate Approval — only when order has a pre-linked estimate
          if (salesQueryId && response.has_linked_estimate) {
            await autoCompleteStep(
              response.order_id,
              "Estimate Approval",
              salesQueryId,
              "Automatically approved from linked estimate"
            );
          }

          console.log("[Auto-Complete] Steps processed");
        } catch (autoCompleteError) {
          console.warn(
            "[Auto-Complete] Error processing steps:",
            autoCompleteError
          );
        }
      }

      // 3. CRITICAL: Redirect logic based on source
      if (response.order_id) {
        // Determine if this is a conversion from a Sales Lead
        // We strictly show popup ONLY for direct orders (no query)
        const isFromQuery = !!salesQueryId;

        if (isFromQuery) {
          console.log(
            "[DEBUG] From Sales Lead: Redirecting to vouchers list:",
            response.order_id
          );
          // Redirect to vouchers list page after successful order confirmation from sales lead
          router.push(`/vouchers/list`);
        } else {
          console.log(
            "[DEBUG] Direct Flow: Redirecting to list with export popup:",
            response.order_id
          );
          // Show export popup by redirecting to list with query param
          router.push(`/orders?new_order=${response.order_id}`);
        }
      } else {
        router.push(`/orders/`);
      }
    } catch (err) {
      console.error("Confirmation error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Final confirmation failed. Please try saving manually first.",
      });
    } finally {
      setIsConfirming(false);
      setShowConfirmModal(false);
      setTimeout(() => setSaveStatus("IDLE"), 3000);
    }
  };

  if (isLoading)
    return (
      <div className="p-20 text-center animate-pulse text-muted-foreground text-sm font-bold">
        Loading...
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-4 animate-in fade-in duration-500">
      {/* Lock Status Banner */}
      {!canModify && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-2">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-900">
                🔒 Process Locked
              </h3>
              <p className="text-xs text-amber-700 font-medium">
                This order has already been confirmed. Steps cannot be modified.
              </p>
            </div>
          </div>
          {orderId && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0"
              onClick={() =>
                router.push(`/vouchers/orders/${orderId}/tracking/`)
              }
            >
              Go to Tracking
            </Button>
          )}
        </div>
      )}

      {/* Header Section */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-primary">
            Stage 4: Process Confirmation
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3 text-orange-500" />
              Finalize production sequence.
            </p>

            {/* Save Status indicators */}
            <div className="h-4 border-l pl-3 flex items-center">
              {saveStatus === "SAVING" && (
                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 animate-pulse">
                  <Save className="h-3 w-3" /> Saving...
                </span>
              )}
              {saveStatus === "SAVED" && (
                <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> ✓ All changes saved
                </span>
              )}
              {hasUnsavedChanges && saveStatus === "IDLE" && (
                <span className="text-[10px] font-bold text-orange-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> ⚠️ Unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => setShowConfirmModal(true)}
            disabled={!canModify}
            className="gap-1.5 h-8 px-4 bg-green-600 hover:bg-green-700 text-xs font-bold shadow-sm"
          >
            <CheckCircle className="h-3.5 w-3.5" /> Confirm Order
          </Button>
        </div>
      </div>

      {/* Main Process Content */}
      <Card className="shadow-sm border rounded-xl overflow-hidden">
        <CardHeader className="bg-muted/20 border-b py-3 px-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Production Sequence
            </CardTitle>
          </div>
          {/* Manual Add Step Button Removed to favor automated process steps */}
          {/* Removed Manual Add/Save Buttons */}
        </CardHeader>
        <CardContent className="p-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={steps
                .filter((s) => s.status !== "REMOVED")
                .map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col divide-y">
                {steps
                  .filter((step) => step.status !== "REMOVED")
                  .map((step) => (
                    <DraftStepItem
                      key={step.id}
                      step={step}
                      isLocked={!canModify || lockLevel !== "UNLOCKED"}
                      canUpdateStatus={lockLevel !== "FULLY_LOCKED"}
                      onEdit={(s) => {
                        setEditingStep(s);
                        setNewStepData({
                          step_name: s.step_name || s.task_name || "",
                          description: s.description || "",
                          department: s.department || "",
                        });
                      }}
                      onRemove={handleRemoveStep}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
              </div>
            </SortableContext>
          </DndContext>
          {steps.filter((s) => s.status !== "REMOVED").length === 0 && (
            <div className="p-12 text-center text-muted-foreground italic text-[11px] font-medium">
              No steps defined yet.
            </div>
          )}
        </CardContent>
        {/* Removed Steps Section (History) */}
        {steps.some((s) => s.status === "REMOVED") && (
          <div className="border-t bg-slate-50/50">
            <div className="px-4 py-3 border-b bg-slate-100/50 flex items-center justify-between">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="h-3 w-3" /> History / Removed Steps
              </div>
              <span className="text-[9px] font-medium text-slate-400">
                {steps.filter((s) => s.status === "REMOVED").length} step(s)
                removed
              </span>
            </div>
            <div className="divide-y divide-border/30">
              {steps
                .filter((s) => s.status === "REMOVED")
                .map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center justify-between px-4 py-3 bg-white/40 group hover:bg-white/80 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-slate-50 flex items-center justify-center border border-dashed border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400">
                          {step.position}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-500 line-through decoration-slate-300">
                          {step.step_name || step.task_name}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                          {step.department || "No Department"}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-[10px] font-bold gap-1.5 text-primary hover:bg-primary/5 hover:text-primary transition-colors border border-dashed"
                      onClick={() => handleStatusChange(step.id, "PENDING")}
                      disabled={!canModify}
                    >
                      <Plus className="h-3 w-3" /> Revert Step
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Card>

      {/* Dialogs */}
      <Dialog
        open={isAddDialogOpen || !!editingStep}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingStep(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingStep ? "Edit Step" : "Add Step"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Task Name
              </Label>
              <Input
                value={newStepData.step_name}
                onChange={(e) =>
                  setNewStepData((prev) => ({
                    ...prev,
                    step_name: e.target.value,
                  }))
                }
                placeholder="e.g. Laser Engraving"
                disabled={!canModify}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Department
              </Label>
              <Input
                value={newStepData.department}
                onChange={(e) =>
                  setNewStepData((prev) => ({
                    ...prev,
                    department: e.target.value,
                  }))
                }
                placeholder="e.g. Production"
                disabled={!canModify}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Instructions
              </Label>
              <Textarea
                value={newStepData.description}
                onChange={(e) =>
                  setNewStepData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Instructions..."
                disabled={!canModify}
                className="min-h-[60px] text-xs"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              className="text-xs h-9 px-4"
              onClick={() => {
                setIsAddDialogOpen(false);
                setEditingStep(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-9 px-4 text-xs font-bold"
              disabled={!canModify}
              onClick={editingStep ? handleUpdateStep : handleAddStep}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[400px] rounded-xl p-0 overflow-hidden">
          <div className="bg-orange-500 p-4 text-white flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 shrink-0" />
            <div>
              <h2 className="text-lg font-bold">Confirm Production?</h2>
              <p className="text-xs opacity-90">Permanent action.</p>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Once confirmed, the production workflow will be frozen. No further
              modifications will be possible.
            </p>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 h-9 font-bold text-xs"
                onClick={() => setShowConfirmModal(false)}
              >
                Back
              </Button>
              <Button
                onClick={handleFinalConfirm}
                disabled={isConfirming || !canModify}
                className="flex-1 h-9 bg-green-600 hover:bg-green-700 font-bold text-xs shadow-md"
              >
                {isConfirming ? "Confirming..." : "Confirm & Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
