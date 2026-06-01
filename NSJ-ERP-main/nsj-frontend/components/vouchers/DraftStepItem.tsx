"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Info, CheckCircle2 } from "lucide-react";
import { OrderProcessStep } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DraftStepItemProps {
  step: OrderProcessStep;
  onEdit?: (step: OrderProcessStep) => void;
  onRemove?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  isLocked?: boolean;
  canUpdateStatus?: boolean;
}

export function DraftStepItem({
  step,
  onEdit,
  onRemove,
  onStatusChange,
  isLocked,
  canUpdateStatus = true,
}: DraftStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-200";
      case "IN_PROGRESS":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        grid grid-cols-12 gap-4 p-3 items-center bg-white
        ${isDragging ? "shadow-lg ring-1 ring-primary border-primary z-50 scale-[1.01] opacity-90" : "hover:bg-gray-50/80"}
        transition-all duration-200 border-b
      `}
    >
      <div className="col-span-1 flex items-center gap-2">
        {!isLocked && (
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-primary transition-colors p-1"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <span className="font-bold text-sm text-muted-foreground w-6">
          {step.position}
        </span>
      </div>

      <div className="col-span-4 flex flex-col gap-1">
        <span className="font-bold text-sm text-primary tracking-tight">
          {step.step_name || step.task_name}
        </span>
        <div className="flex items-center gap-2">
          {step.department && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
              {step.department}
            </span>
          )}

          <select
            value={step.status}
            onChange={(e) => onStatusChange?.(step.id, e.target.value)}
            className={`text-[9px] font-bold h-6 rounded px-1.5 border outline-none cursor-pointer transition-colors ${getStatusColor(step.status)}`}
            disabled={!canUpdateStatus}
          >
            <option value="PENDING">PENDING</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>
      <div className="col-span-5 pr-2">
        <span className="text-xs text-muted-foreground leading-relaxed italic block border-l-2 border-muted pl-2">
          {step.description || "No specific instructions."}
        </span>
      </div>

      <div className="col-span-2 flex justify-end gap-1.5">
        {!isLocked && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 border opacity-70"
              onClick={() => onRemove?.(step.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
        {isLocked && (
          <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2 py-1 rounded-full border">
            <Info className="h-3 w-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">
              Locked
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
