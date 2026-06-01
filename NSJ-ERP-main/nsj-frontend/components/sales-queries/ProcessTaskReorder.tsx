"use client";

import React, { useState, useEffect } from "react";
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
import { TaskItem } from "./TaskItem";
import {
  ProcessTask,
  getDefaultProcessTasks,
  getProcessOrder,
  saveProcessOrder,
  resetProcessOrder,
} from "@/lib/processTasksApi";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw, Save, X } from "lucide-react";

interface ProcessTaskReorderProps {
  salesQueryId?: string;
  onSave: (tasks: ProcessTask[], isCustom: boolean) => void;
  onCancel: () => void;
}

export function ProcessTaskReorder({
  salesQueryId,
  onSave,
  onCancel,
}: ProcessTaskReorderProps) {
  const [tasks, setTasks] = useState<ProcessTask[]>([]);
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesQueryId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      if (salesQueryId) {
        // Load existing process order for this sales query
        const response = await getProcessOrder(salesQueryId);
        if (response.process_order && response.process_order.tasks) {
          setTasks(response.process_order.tasks);
          setIsCustom(response.process_order.is_custom);
        } else if (response.default_tasks) {
          setTasks(response.default_tasks);
          setIsCustom(false);
        }
      } else {
        // Load default tasks for new sales query
        const response = await getDefaultProcessTasks();
        const defaultTasks: ProcessTask[] = response.tasks.map((task) => ({
          task_name: task.name,
          description: task.description,
          department: task.department,
          original_position: task.position,
          custom_position: task.position,
          status: "pending",
        }));
        setTasks(defaultTasks);
        setIsCustom(false);
      }
    } catch (err) {
      console.error("Error loading tasks:", err);
      setError((err as Error).message || "Failed to load process tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex(
          (item) => item.custom_position === active.id
        );
        const newIndex = items.findIndex(
          (item) => item.custom_position === over.id
        );

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update custom_position for all tasks
        const reorderedItems = newItems.map((item, index) => ({
          ...item,
          custom_position: index + 1,
        }));

        // Check if order is different from original
        const isDifferent = reorderedItems.some(
          (item) => item.custom_position !== item.original_position
        );
        setIsCustom(isDifferent);
        setHasChanges(true);

        return reorderedItems;
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate all 29 tasks are present
      if (tasks.length !== 29) {
        throw new Error(`Expected 29 tasks, got ${tasks.length}`);
      }

      // Validate no duplicate positions
      const positions = tasks.map((t) => t.custom_position);
      if (new Set(positions).size !== positions.length) {
        throw new Error("Duplicate task positions found");
      }

      // Validate positions are 1-29
      const sortedPositions = [...positions].sort((a, b) => a - b);
      for (let i = 0; i < 29; i++) {
        if (sortedPositions[i] !== i + 1) {
          throw new Error("Task positions must be 1-29 with no gaps");
        }
      }

      // Prepare data for API
      const tasksData = tasks.map((task) => ({
        task_name: task.task_name,
        description: task.description,
        department: task.department,
        original_position: task.original_position,
        custom_position: task.custom_position,
      }));

      if (salesQueryId) {
        // Save to backend
        await saveProcessOrder(salesQueryId, {
          tasks: tasksData,
          is_custom: isCustom,
        });
      }

      // Call parent onSave
      onSave(tasks, isCustom);
    } catch (err) {
      console.error("Error saving process order:", err);
      setError((err as Error).message || "Failed to save process order");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setError(null);

      if (salesQueryId) {
        // Reset on backend
        const response = await resetProcessOrder(salesQueryId);
        setTasks(response.process_order.tasks);
        setIsCustom(false);
      } else {
        // Reset to default locally
        const response = await getDefaultProcessTasks();
        const defaultTasks: ProcessTask[] = response.tasks.map((task) => ({
          task_name: task.name,
          description: task.description,
          department: task.department,
          original_position: task.position,
          custom_position: task.position,
          status: "pending",
        }));
        setTasks(defaultTasks);
        setIsCustom(false);
      }

      setHasChanges(false);
    } catch (err) {
      console.error("Error resetting process order:", err);
      setError((err as Error).message || "Failed to reset process order");
    }
  };

  const handleTaskUpdate = (updatedTask: ProcessTask) => {
    // Update the task in the local state
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === updatedTask.id ? { ...t, ...updatedTask } : t
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading process tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Production Process Order</h2>
          <p className="text-sm text-gray-600 mt-1">
            {isCustom
              ? "Custom order - Drag tasks to reorder based on jewelry type"
              : "Default order - 80% of items use this standard sequence"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isCustom && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              Custom Order
            </span>
          )}
          {hasChanges && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
              Unsaved Changes
            </span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          💡 How to use:
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Drag and drop tasks to reorder them</li>
          <li>
            • For Solitaire rings: Move &quot;Diamond Purchase/Issue&quot; to
            the top
          </li>
          <li>• For standard items: Keep the default order</li>
          <li>
            • Click &quot;Reset to Default&quot; to restore original order
          </li>
        </ul>
      </div>

      {/* Task List */}
      <div className="border rounded-lg bg-white">
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-700">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Task Name</div>
          <div className="col-span-2">Department</div>
          <div className="col-span-4">Description</div>
          <div className="col-span-1 text-right">Status</div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tasks.map((t) => t.custom_position)}
            strategy={verticalListSortingStrategy}
          >
            <div className="divide-y">
              {tasks
                .sort((a, b) => a.custom_position - b.custom_position)
                .map((task) => (
                  <TaskItem
                    key={task.custom_position}
                    task={task}
                    isReordered={
                      task.custom_position !== task.original_position
                    }
                    salesQueryId={salesQueryId}
                    onTaskUpdate={handleTaskUpdate}
                  />
                ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Default
        </Button>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Order
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Task Count */}
      <div className="text-sm text-gray-600 text-center">
        {tasks.length} of 29 tasks configured
      </div>
    </div>
  );
}
