"use client";

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  ProcessTask,
  markTaskCompleted,
  markTaskInProgress,
} from "@/lib/processTasksApi";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface TaskItemProps {
  task: ProcessTask;
  isReordered: boolean;
  salesQueryId?: string;
  onTaskUpdate?: (updatedTask: ProcessTask) => void;
}

// Map task names to their ERP routes
const TASK_ROUTES: Record<string, string> = {
  "Advance Received": "/accounts",
  "Generate Order ID": "/vouchers/sales-leads/new",
  "2D Design Approval": "/vouchers/sales-leads",
  "Estimate Approval": "/vouchers/estimates",
  "Order Issue to Karigar": "/vouchers/list",
  "3D Design": "/vouchers/sales-leads",
  "3D Design Approval": "/vouchers/sales-leads",
  "3D Printing/CAM Piece": "/vouchers/list",
  "CAM Piece QC": "/vouchers/list",
  "CAM Piece Trial Approval": "/vouchers/sales-leads",
  "Stone Demand to Bagging": "/vouchers/list",
  "Metal Issue": "/raw-material-purchase/inventory",
  Casting: "/vouchers/list",
  "Ghat QC": "/vouchers/list",
  "Ghat Trial Approval": "/vouchers/sales-leads",
  "Bagging Ready": "/raw-material-purchase/inventory",
  "Diamond Purchase/Issue": "/raw-material-purchase/new",
  "Gemstone Purchase/Issue": "/raw-material-purchase/new",
  "Stone Setting": "/vouchers/list",
  "Pre Rhodium QC": "/vouchers/list",
  "Rhodium + Stamping": "/vouchers/list",
  "Item with Final Packing List In": "/vouchers/list",
  "Raw Material Tally": "/process/raw-material-tally",
  "Photo/Video for Catalogue": "/vouchers/list",
  Tagging: "/vouchers/list",
  Certification: "/vouchers/sales-leads",
  Invoice: "/vouchers/list",
  Payment: "/accounts",
  Delivery: "/vouchers/list",
};

export function TaskItem({
  task,
  isReordered,
  salesQueryId,
  onTaskUpdate,
}: TaskItemProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.custom_position });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Determine background color based on status
  const getBackgroundColor = () => {
    if (isDragging) return "bg-blue-50";
    if (task.status === "completed") return "bg-green-50";
    if (task.status === "in_progress") return "bg-yellow-50";
    if (isReordered) return "bg-orange-50";
    return "hover:bg-gray-50";
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (task.status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get status badge color
  const getStatusBadgeColor = () => {
    switch (task.status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "blocked":
        return "bg-red-100 text-red-800 border-red-200";
      case "skipped":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  // Handle task click - navigate to the appropriate route
  const handleTaskClick = () => {
    const route = TASK_ROUTES[task.task_name];
    if (route) {
      router.push(route);
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation

    if (!salesQueryId || !task.id) return;

    setIsUpdating(true);
    try {
      let response;
      if (task.status === "completed") {
        // If completed, mark as pending
        response = await markTaskInProgress(salesQueryId, task.id);
      } else if (task.status === "in_progress") {
        // If in progress, mark as completed
        response = await markTaskCompleted(salesQueryId, task.id);
      } else {
        // If pending, mark as in progress
        response = await markTaskInProgress(salesQueryId, task.id);
      }

      // Notify parent component of update
      if (onTaskUpdate && response.task) {
        onTaskUpdate(response.task);
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        grid grid-cols-12 gap-4 p-4 items-center
        ${getBackgroundColor()}
        transition-colors
        border-l-4 ${task.status === "completed" ? "border-green-500" : "border-transparent"}
      `}
    >
      {/* Drag Handle + Position + Status Icon */}
      <div className="col-span-1 flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()} // Prevent navigation when dragging
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          <span
            className={`
              font-medium text-sm
              ${isReordered ? "text-orange-600" : "text-gray-700"}
              ${task.status === "completed" ? "text-green-700" : ""}
            `}
          >
            {task.custom_position}
          </span>
        </div>
      </div>

      {/* Task Name - Clickable */}
      <div className="col-span-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleTaskClick}
            className={`font-medium text-sm hover:text-blue-600 hover:underline cursor-pointer flex items-center gap-1 ${
              task.status === "completed" ? "text-green-700" : ""
            }`}
          >
            {task.task_name}
            {TASK_ROUTES[task.task_name] && (
              <ExternalLink className="h-3 w-3" />
            )}
          </button>
          {isReordered && (
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded border border-orange-200">
              Moved from #{task.original_position}
            </span>
          )}
          {task.status && task.status !== "pending" && (
            <span
              className={`text-xs px-2 py-0.5 rounded border ${getStatusBadgeColor()}`}
            >
              {task.status.replace("_", " ").toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Department */}
      <div className="col-span-2">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            task.status === "completed"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {task.department}
        </span>
      </div>

      {/* Description */}
      <div className="col-span-4">
        <span
          className={`text-sm ${
            task.status === "completed" ? "text-green-700" : "text-gray-600"
          }`}
        >
          {task.description}
        </span>
      </div>

      {/* Status Toggle Button */}
      <div className="col-span-1 flex justify-end">
        {salesQueryId && task.id && (
          <Button
            type="button"
            size="sm"
            variant={task.status === "completed" ? "outline" : "default"}
            onClick={handleStatusToggle}
            disabled={isUpdating}
            className={`
              ${task.status === "completed" ? "bg-green-50 hover:bg-green-100 text-green-700" : ""}
              ${task.status === "in_progress" ? "bg-yellow-50 hover:bg-yellow-100 text-yellow-700" : ""}
            `}
          >
            {isUpdating ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
            ) : task.status === "completed" ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : task.status === "in_progress" ? (
              <Clock className="h-3 w-3" />
            ) : (
              <Circle className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
