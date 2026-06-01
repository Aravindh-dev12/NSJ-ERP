"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink, CheckCircle2, Info, Lock, FileText } from "lucide-react";
import {
  OrderProcessStep,
  OrderProcessStepStatus,
  Voucher,
  getStepStatus,
} from "@/lib/backend";
import { Button } from "@/components/ui/button";

interface OrderStepItemProps {
  step: OrderProcessStep;
  orderId?: string;
  orderDetails?: Voucher | null;
  isLocked: boolean;
  refId?: string;
  allSteps?: OrderProcessStep[];
  onStatusChange: (status: OrderProcessStepStatus) => void;
  onMarkAsDone?: (stepId: string) => void;
}

export function OrderStepItem({
  step,
  orderId,
  orderDetails,
  isLocked,
  refId,
  allSteps = [],
  onStatusChange,
  onMarkAsDone,
}: OrderStepItemProps) {
  const [isDraft, setIsDraft] = useState(false);

  // Check if step has a draft record
  useEffect(() => {
    const checkDraftStatus = async () => {
      if (
        !orderId ||
        !step.step_name ||
        step.status === "COMPLETED" ||
        step.is_locked
      )
        return;

      try {
        const statusData = await getStepStatus(orderId, step.step_name);
        // Only log when draft status changes
        if (statusData.is_draft !== isDraft) {
          console.log("[OrderStepItem] Draft status:", {
            stepName: step.step_name,
            isDraft: statusData.is_draft,
          });
        }
        setIsDraft(statusData.is_draft || false);
      } catch (err) {
        console.error("[OrderStepItem] Failed to check draft status:", err);
      }
    };

    checkDraftStatus();
  }, [orderId, step.step_name, step.status, step.is_locked]);
  const getStatusColor = (status: OrderProcessStepStatus) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-50 border-green-200 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const getStatusBadge = (status: OrderProcessStepStatus) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStepLink = (stepName: string, refId?: string) => {
    const name = stepName.trim();

    // Debug logging to see what step name we're getting
    console.log("[OrderStepItem] Processing step:", {
      originalStepName: stepName,
      trimmedName: name,
      refId,
    });

    // Mapping of step names to their respective module routes
    const routes: Record<string, string> = {
      "Generate Order ID": "/vouchers/sales-leads/new",
      "2D Design Approval": "/process/2d-design",
      "3D Design Approval": "/process/3d-design",
      "Estimate Approval": "/orders/[orderId]/estimate-approval",
      "3D Design": "/process/3d-design",
      "3D Printing/CAM Piece": "/process/3d-printing-cam",
      "CAM Piece QC": "/process/3d-printing-cam",
      "Metal Issue": "/process/metal-issue",
      "Ghat Approval": "/process/ghat-approval",
      "Ghat QC": "/process/ghat-quality-check",
      "Ghat Trial Approval": "/process/ghat-approval",
      "Stone Demand to Bagging": "/process/stone-demand-to-bagging",
      "Pre Rhodium QC": "/process/pre-rhodium-quality-check",
      "Raw Material Tally": "/process/raw-material-tally",
      "Final QC": "/process/final-quality-check",
      "Item with Final Packing List In": "/process/item-final-packing-list",
      Payment: "/vouchers/payment/new",
    };

    const basePath = routes[name];
    if (!basePath) return null;

    // Special handling for 3D Design steps
    if (
      (name === "3D Design" || name === "3D Design Approval") &&
      orderId &&
      orderDetails
    ) {
      const referenceId =
        refId || (step as any).ref_id || (step as any).design_id || null;

      console.log("3D Design step detected:", {
        name,
        status: step.status,
        isLocked: step.is_locked,
        refId: referenceId,
        orderId,
      });

      // If step is LOCKED, go to detail page (READ-ONLY)
      if (step.is_locked && referenceId) {
        console.log("[3D Design] Step is LOCKED - redirecting to detail page");
        return `/process/3d-design/detail/${referenceId}`;
      }

      // If step has reference_id but NOT locked, go to EDIT page
      if (referenceId) {
        console.log(
          "[3D Design] Step has data but NOT locked - redirecting to EDIT page"
        );
        return `/process/3d-design/add/?edit=${referenceId}&order_id=${orderId}&account_order_id=${orderDetails.order_no || ""}`;
      }

      // No reference_id - go to add page (NEW)
      console.log("[3D Design] No data yet - redirecting to ADD page");
      return `/process/3d-design/add?order_id=${orderId}&account_order_id=${orderDetails.order_no || ""}`;
    }

    // Special handling for 2D Design Approval step
    if (name === "2D Design Approval" && orderId && orderDetails) {
      const referenceId =
        refId || (step as any).ref_id || (step as any).design_id || null;

      console.log("2D Design step detected:", {
        name,
        status: step.status,
        isLocked: step.is_locked,
        refId: referenceId,
        orderId,
      });

      // If step is LOCKED, go to detail page (READ-ONLY)
      if (step.is_locked && referenceId) {
        console.log("[2D Design] Step is LOCKED - redirecting to detail page");
        return `/process/2d-design/detail/${referenceId}`;
      }

      // If step has reference_id but NOT locked, go to EDIT page
      if (referenceId) {
        console.log(
          "[2D Design] Step has data but NOT locked - redirecting to EDIT page"
        );
        return `/process/2d-design/add/?edit=${referenceId}&order_id=${orderId}&account_order_id=${orderDetails.order_no || ""}`;
      }

      // No reference_id - go to add page (NEW)
      console.log("[2D Design] No data yet - redirecting to ADD page");
      return `/process/2d-design/add?order_id=${orderId}&account_order_id=${orderDetails.order_no || ""}`;
    }

    // Special handling for Stone Demand to Bagging steps
    if (name === "Stone Demand to Bagging" && orderId && orderDetails) {
      const referenceId =
        refId || (step as any).ref_id || (step as any).stone_demand_id || null;

      console.log("Stone Demand to Bagging step detected:", {
        name,
        status: step.status,
        isLocked: step.is_locked,
        refId: referenceId,
        orderId,
      });

      // If step is LOCKED, go to detail page (READ-ONLY)
      if (step.is_locked && referenceId) {
        return `/process/stone-demand-to-bagging/detail/${referenceId}?locked=true`;
      }

      // If step has reference_id but NOT locked, go to EDIT page
      if (referenceId) {
        return `/process/stone-demand-to-bagging/edit/${referenceId}`;
      }

      // No reference_id - go to add page (NEW)
      return `/process/stone-demand-to-bagging/add?order_id=${orderId}&account_order_id=${orderDetails.order_no || ""}`;
    }

    // Special handling for Pre Rhodium QC steps
    if (name === "Pre Rhodium QC" && orderId && orderDetails) {
      const referenceId =
        refId ||
        (step as any).ref_id ||
        (step as any).pre_rhodium_qc_id ||
        null;

      console.log("Pre Rhodium QC step detected:", {
        name,
        status: step.status,
        isLocked: step.is_locked,
        refId: referenceId,
        orderId,
      });

      // If step is LOCKED, go to detail page (READ-ONLY)
      if (step.is_locked && referenceId) {
        console.log(
          "[Pre Rhodium QC] Step is LOCKED - redirecting to detail page"
        );
        return `/process/pre-rhodium-quality-check/detail/${referenceId}?locked=true`;
      }

      // If step has reference_id but NOT locked, go to EDIT page
      if (referenceId) {
        console.log(
          "[Pre Rhodium QC] Step has data but NOT locked - redirecting to EDIT page"
        );
        return `/process/pre-rhodium-quality-check/edit/${referenceId}`;
      }

      // No reference_id - go to add page (NEW)
      console.log("[Pre Rhodium QC] No data yet - redirecting to ADD page");
      return `/process/pre-rhodium-quality-check/add?order_id=${orderId}&account_order_id=${orderDetails.order_no || ""}`;
    }

    // Special handling for Item Final Packing List steps
    if (name === "Invoice") {
      return null;
    }

    if (name === "Item with Final Packing List In" && orderId && orderDetails) {
      const referenceId =
        refId || (step as any).ref_id || (step as any).packing_list_id || null;

      console.log("Item Final Packing List step detected:", {
        name,
        status: step.status,
        isLocked: step.is_locked,
        refId: referenceId,
        orderId,
      });

      // If step is LOCKED, go to detail page (READ-ONLY)
      if (step.is_locked && referenceId) {
        console.log(
          "[Item Final Packing List] Step is LOCKED - redirecting to detail page"
        );
        return `/process/item-final-packing-list/detail/${referenceId}?locked=true`;
      }

      // If step has reference_id but NOT locked, go to EDIT page
      if (referenceId) {
        console.log(
          "[Item Final Packing List] Step has data but NOT locked - redirecting to EDIT page"
        );
        return `/process/item-final-packing-list/edit/${referenceId}`;
      }

      // No reference_id - go to add page (NEW)
      console.log(
        "[Item Final Packing List] No data yet - redirecting to ADD page"
      );
      return `/process/item-final-packing-list/add?order_id=${orderId}&account_order_id=${orderDetails.order_no || ""}`;
    }

    // Special handling for 3D Printing/CAM Piece steps
    if (
      (name === "3D Printing/CAM Piece" || name === "CAM Piece QC") &&
      orderId &&
      orderDetails
    ) {
      // For linked steps (3D Printing/CAM Piece and CAM Piece QC), they share the same reference_id
      // So we need to find the reference_id from EITHER step
      let referenceId =
        refId || (step as any).ref_id || (step as any).cam_id || null;

      // If this step doesn't have a reference_id, check if the OTHER step has one
      // by looking at all steps in the order
      if (!referenceId && allSteps.length > 0) {
        const otherStepName =
          name === "3D Printing/CAM Piece"
            ? "CAM Piece QC"
            : "3D Printing/CAM Piece";
        const otherStep = allSteps.find(
          (s) => (s.step_name || s.task_name) === otherStepName
        );
        if (otherStep?.reference_id) {
          referenceId = otherStep.reference_id;
          console.log(
            `[CAM Piece] Using reference_id from ${otherStepName}:`,
            referenceId
          );
        }
      }

      console.log("[CAM Piece Step] Navigation debug:", {
        stepName: name,
        isLocked: step.is_locked,
        status: step.status,
        referenceId,
        refId,
        stepRefId: (step as any).ref_id,
        stepCamId: (step as any).cam_id,
      });

      // If step is LOCKED, go to detail page (READ-ONLY)
      if (step.is_locked && referenceId) {
        console.log("[CAM Piece] Step is LOCKED - redirecting to DETAIL page");
        return `/process/3d-printing-cam/detail/${referenceId}`;
      }

      // If step has reference_id but NOT locked, go to EDIT page
      if (referenceId) {
        console.log(
          "[CAM Piece] Step has data but NOT locked - redirecting to EDIT page"
        );
        return `/process/3d-printing-cam/add/?edit=${referenceId}&order_id=${orderId}&account_order_id=${orderDetails.order_no || ""}`;
      }

      // No reference_id - go to add page (NEW)
      console.log("[CAM Piece] No data yet - redirecting to ADD page");
      return `/process/3d-printing-cam/add?order_id=${orderId}&account_order_id=${orderDetails.order_no || ""}`;
    }

    // Special handling for Pre Rhodium QC step (DUPLICATE - REMOVE)
    // This block is already handled above at lines 182-214
    if (name === "Pre Rhodium QC" && orderId && orderDetails) {
      const referenceId =
        refId ||
        (step as any).ref_id ||
        (step as any).pre_rhodium_qc_id ||
        null;

      // If step is LOCKED, go to detail page (READ-ONLY)
      if (step.is_locked && referenceId) {
        return `/process/pre-rhodium-quality-check/detail/${referenceId}?locked=true`;
      }

      // If step has reference_id but NOT locked, go to EDIT page
      if (referenceId) {
        return `/process/pre-rhodium-quality-check/edit/${referenceId}`;
      }

      // No reference_id - go to add page (NEW)
      return `/process/pre-rhodium-quality-check/add?order_id=${orderId}&account_order_id=${orderDetails.order_no || ""}`;
    }

    // Special handling for Item Final Packing List step (DUPLICATE - REMOVE)
    // This block is already handled above at lines 216-248
    if (name === "Item with Final Packing List In" && orderId && orderDetails) {
      const referenceId =
        refId || (step as any).ref_id || (step as any).packing_list_id || null;

      // If step is LOCKED, go to detail page (READ-ONLY)
      if (step.is_locked && referenceId) {
        return `/process/item-final-packing-list/detail/${referenceId}`;
      }

      // If step has reference_id but NOT locked, go to EDIT page
      if (referenceId) {
        return `/process/item-final-packing-list/edit/${referenceId}`;
      }

      // No reference_id - go to add page (NEW)
      return `/process/item-final-packing-list/add?order_id=${orderId}&account_order_id=${orderDetails.order_no || ""}`;
    }

    // Special handling for Ghat QC step (DUPLICATE - REMOVE)
    // This block needs proper edit route
    if (name === "Ghat QC" && orderId && orderDetails) {
      const referenceId =
        refId || (step as any).ref_id || (step as any).ghat_qc_id || null;

      // If step is LOCKED, go to detail page (READ-ONLY)
      if (step.is_locked && referenceId) {
        return `/process/ghat-quality-check/detail/${referenceId}?locked=true`;
      }

      // If step has reference_id but NOT locked, go to EDIT page
      if (referenceId) {
        return `/process/ghat-quality-check/edit/${referenceId}`;
      }

      // No reference_id - go to add page (NEW)
      return `/process/ghat-quality-check/add?order_id=${orderId}&account_order_id=${orderDetails.order_no || ""}`;
    }

    // Special handling for Ghat Approval step (DUPLICATE - REMOVE)
    // Note: This is "Ghat Trial Approval" step name
    if (name === "Ghat Trial Approval" && orderId && orderDetails) {
      const referenceId =
        refId || (step as any).ref_id || (step as any).ghat_approval_id || null;

      // If step is LOCKED, go to detail page (READ-ONLY)
      if (step.is_locked && referenceId) {
        return `/process/ghat-approval/detail/${referenceId}?locked=true`;
      }

      // If step has reference_id but NOT locked, go to EDIT page
      if (referenceId) {
        return `/process/ghat-approval/edit/${referenceId}`;
      }

      // No reference_id - go to add page (NEW)
      return `/process/ghat-approval/add?order_id=${orderId}&account_order_id=${orderDetails.order_no || ""}`;
    }

    // Special handling for Payment step
    if (name === "Payment" && orderId && orderDetails) {
      const referenceId =
        refId || (step as any).ref_id || (step as any).payment_id || null;

      // If step is LOCKED, go to detail page (READ-ONLY)
      if (step.is_locked && referenceId) {
        return `/vouchers/payment/detail/${referenceId}`;
      }

      // If step has reference_id but NOT locked, go to EDIT page
      if (referenceId) {
        return `/vouchers/payment/new?edit=${referenceId}&order_id=${orderId}&account_order_id=${orderDetails.order_no || ""}`;
      }

      // No reference_id - go to add page (NEW)
      return `/vouchers/payment/new?order_id=${orderId}&account_order_id=${orderDetails.order_no || ""}`;
    }

    // Special handling for Raw Material Tally step (DUPLICATE - REMOVE)
    // This block needs proper edit route
    if (name === "Raw Material Tally" && orderId && orderDetails) {
      const referenceId =
        refId ||
        (step as any).ref_id ||
        (step as any).raw_material_tally_id ||
        null;

      // If step is LOCKED, go to detail page (READ-ONLY)
      if (step.is_locked && referenceId) {
        return `/process/raw-material-tally/detail/${referenceId}?locked=true`;
      }

      // If step has reference_id but NOT locked, go to EDIT page
      if (referenceId) {
        return `/process/raw-material-tally/edit/${referenceId}`;
      }

      // No reference_id - go to add page (NEW)
      return `/process/raw-material-tally/add?order_id=${orderId}&account_order_id=${orderDetails.order_no || ""}`;
    }

    // Special handling for Estimate Approval step
    if (name === "Estimate Approval" && orderId) {
      console.log("Estimate Approval step detected:", {
        name,
        status: step.status,
        isLocked: step.is_locked,
        orderId,
      });

      // Always redirect to the dedicated estimate approval page
      return `/orders/${orderId}/estimate-approval`;
    }

    // Universal logic to pass order info if available
    if (orderId && orderDetails) {
      const params = new URLSearchParams();
      params.set("order_id", orderId);

      // Pass the display order number as well
      if (orderDetails.order_no) {
        params.set("account_order_id", orderDetails.order_no);
      }

      // Custom logic for Payment to pre-fill data
      if (name === "Payment") {
        // Extract and pre-fill account info
        if (orderDetails.account && typeof orderDetails.account !== "string") {
          const acc = orderDetails.account as any;
          params.set("account_id", acc.id || "");
          params.set("account_name", acc.account_name || acc.name || "");
          params.set("party_id", acc.id || "");
        }

        // Extract and pre-fill item info
        if (orderDetails.item_name) {
          params.set("item_name", orderDetails.item_name);
        }
      }

      return `${basePath}?${params.toString()}`;
    }

    return basePath;
  };

  const stepLink = getStepLink(step.step_name || step.task_name || "", refId);

  return (
    <div
      className={`border rounded-lg p-4 transition-all ${getStatusColor(step.status)}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/50 text-[11px] font-bold shadow-sm shrink-0 border">
            {step.position}
          </span>
          <div>
            <h3 className="font-bold text-sm tracking-tight leading-none mb-1">
              {step.step_name || step.task_name}
            </h3>
            {step.department && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-white/40 px-1.5 py-0.5 rounded border">
                {step.department}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Draft Badge */}
          {isDraft && step.status !== "COMPLETED" && !step.is_locked && (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 border border-amber-300 rounded-full">
              <FileText className="h-3 w-3 text-amber-700" />
              <span className="text-[10px] font-bold text-amber-800 uppercase">
                Draft
              </span>
            </div>
          )}
          <div
            className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest border shadow-sm ${getStatusBadge(step.status)}`}
          >
            {step.status.replace("_", " ")}
          </div>
        </div>
      </div>

      {step.description && (
        <p className="text-xs opacity-80 mb-4 italic leading-relaxed pl-2 border-l-2 border-current/20">
          {step.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-current/5 no-print">
        <div className="flex-1">
          {stepLink && (
            <Link href={stepLink} className="w-full">
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-full px-2 text-[10px] gap-1.5 font-bold bg-white shadow-sm hover:bg-slate-50 border-slate-200 transition-all flex flex-row items-center justify-center overflow-hidden"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="truncate">
                  View{" "}
                  {orderDetails?.order_no ||
                    orderDetails?.bill_no ||
                    orderId ||
                    "Order"}{" "}
                  in {step.step_name || step.task_name}
                </span>
              </Button>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mark as Done button - only show if step has a linked form and is not completed */}
          {stepLink &&
            step.status !== "COMPLETED" &&
            !step.is_locked &&
            onMarkAsDone && (
              <Button
                onClick={() => onMarkAsDone(step.id)}
                size="sm"
                className="h-9 px-3 text-[10px] gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark as Done
              </Button>
            )}

          {/* Status badge or dropdown removed */}
          {(step.status === "COMPLETED" || step.is_locked) && (
            <div className="flex items-center gap-1.5 text-green-700 bg-green-100/50 px-3 py-1.5 rounded-lg border border-green-200 text-[10px] font-bold uppercase tracking-widest">
              <Lock className="h-3.5 w-3.5" /> Locked
            </div>
          )}
        </div>
      </div>

      {step.notes && (
        <div className="mt-3 text-[10px] opacity-70 italic flex items-start gap-1.5">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          <span>{step.notes}</span>
        </div>
      )}
    </div>
  );
}
