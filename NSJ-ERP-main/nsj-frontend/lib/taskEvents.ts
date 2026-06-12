/**
 * Task Events - Custom event system for real-time task updates
 *
 * This allows different components to communicate task changes
 * without prop drilling or complex state management.
 */

// Event types
export const TASK_EVENTS = {
  TASK_CREATED: "task:created",
  TASK_UPDATED: "task:updated",
  TASK_STATUS_CHANGED: "task:status_changed",
  TASK_DELETED: "task:deleted",
} as const;

type TaskEventType = (typeof TASK_EVENTS)[keyof typeof TASK_EVENTS];

interface TaskEventDetail {
  taskId?: string;
  status?: string;
  previousStatus?: string;
  assignedTo?: string;
  department?: string;
}

// Emit a task event
export function emitTaskEvent(
  eventType: TaskEventType,
  detail?: TaskEventDetail
) {
  if (typeof window !== "undefined") {
    const event = new CustomEvent(eventType, { detail });
    window.dispatchEvent(event);
  }
}

// Subscribe to task events
export function subscribeToTaskEvents(
  eventType: TaskEventType | TaskEventType[],
  callback: (detail?: TaskEventDetail) => void
) {
  if (typeof window === "undefined") return () => {};

  const types = Array.isArray(eventType) ? eventType : [eventType];

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<TaskEventDetail>;
    callback(customEvent.detail);
  };

  types.forEach((type) => {
    window.addEventListener(type, handler);
  });

  // Return unsubscribe function
  return () => {
    types.forEach((type) => {
      window.removeEventListener(type, handler);
    });
  };
}

// Subscribe to all task events
export function subscribeToAllTaskEvents(
  callback: (detail?: TaskEventDetail) => void
) {
  return subscribeToTaskEvents(Object.values(TASK_EVENTS), callback);
}
