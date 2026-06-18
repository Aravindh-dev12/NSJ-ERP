import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  TASK_EVENTS,
  emitTaskEvent,
  subscribeToTaskEvents,
  subscribeToAllTaskEvents,
} from "@/lib/taskEvents";

describe("Task Events", () => {
  beforeEach(() => {
    // Clear any existing event listeners
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("TASK_EVENTS constants", () => {
    it("defines all task event types", () => {
      expect(TASK_EVENTS.TASK_CREATED).toBe("task:created");
      expect(TASK_EVENTS.TASK_UPDATED).toBe("task:updated");
      expect(TASK_EVENTS.TASK_STATUS_CHANGED).toBe("task:status_changed");
      expect(TASK_EVENTS.TASK_DELETED).toBe("task:deleted");
    });

    it("has exactly 4 event types", () => {
      expect(Object.keys(TASK_EVENTS)).toHaveLength(4);
    });
  });

  describe("emitTaskEvent", () => {
    it("emits task created event without detail", () => {
      const spy = vi.fn();
      window.addEventListener(TASK_EVENTS.TASK_CREATED, spy);

      emitTaskEvent(TASK_EVENTS.TASK_CREATED);

      expect(spy).toHaveBeenCalledTimes(1);
      window.removeEventListener(TASK_EVENTS.TASK_CREATED, spy);
    });

    it("emits task created event with detail", () => {
      const spy = vi.fn();
      window.addEventListener(TASK_EVENTS.TASK_CREATED, spy);

      const detail = { taskId: "123", status: "pending" };
      emitTaskEvent(TASK_EVENTS.TASK_CREATED, detail);

      expect(spy).toHaveBeenCalledTimes(1);
      const event = spy.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual(detail);
      window.removeEventListener(TASK_EVENTS.TASK_CREATED, spy);
    });

    it("emits task updated event", () => {
      const spy = vi.fn();
      window.addEventListener(TASK_EVENTS.TASK_UPDATED, spy);

      const detail = { taskId: "456", assignedTo: "user@example.com" };
      emitTaskEvent(TASK_EVENTS.TASK_UPDATED, detail);

      expect(spy).toHaveBeenCalledTimes(1);
      const event = spy.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual(detail);
      window.removeEventListener(TASK_EVENTS.TASK_UPDATED, spy);
    });

    it("emits task status changed event", () => {
      const spy = vi.fn();
      window.addEventListener(TASK_EVENTS.TASK_STATUS_CHANGED, spy);

      const detail = {
        taskId: "789",
        status: "completed",
        previousStatus: "in_progress",
      };
      emitTaskEvent(TASK_EVENTS.TASK_STATUS_CHANGED, detail);

      expect(spy).toHaveBeenCalledTimes(1);
      const event = spy.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual(detail);
      window.removeEventListener(TASK_EVENTS.TASK_STATUS_CHANGED, spy);
    });

    it("emits task deleted event", () => {
      const spy = vi.fn();
      window.addEventListener(TASK_EVENTS.TASK_DELETED, spy);

      const detail = { taskId: "999" };
      emitTaskEvent(TASK_EVENTS.TASK_DELETED, detail);

      expect(spy).toHaveBeenCalledTimes(1);
      const event = spy.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual(detail);
      window.removeEventListener(TASK_EVENTS.TASK_DELETED, spy);
    });

    it("emits event with department detail", () => {
      const spy = vi.fn();
      window.addEventListener(TASK_EVENTS.TASK_CREATED, spy);

      const detail = { taskId: "111", department: "Engineering" };
      emitTaskEvent(TASK_EVENTS.TASK_CREATED, detail);

      expect(spy).toHaveBeenCalledTimes(1);
      const event = spy.mock.calls[0][0] as CustomEvent;
      expect(event.detail.department).toBe("Engineering");
      window.removeEventListener(TASK_EVENTS.TASK_CREATED, spy);
    });
  });

  describe("subscribeToTaskEvents", () => {
    it("subscribes to single event type", () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToTaskEvents(
        TASK_EVENTS.TASK_CREATED,
        callback
      );

      emitTaskEvent(TASK_EVENTS.TASK_CREATED, { taskId: "123" });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ taskId: "123" });

      unsubscribe();
    });

    it("subscribes to multiple event types", () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToTaskEvents(
        [TASK_EVENTS.TASK_CREATED, TASK_EVENTS.TASK_UPDATED],
        callback
      );

      emitTaskEvent(TASK_EVENTS.TASK_CREATED, { taskId: "123" });
      emitTaskEvent(TASK_EVENTS.TASK_UPDATED, { taskId: "456" });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(1, { taskId: "123" });
      expect(callback).toHaveBeenNthCalledWith(2, { taskId: "456" });

      unsubscribe();
    });

    it("unsubscribes correctly", () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToTaskEvents(
        TASK_EVENTS.TASK_CREATED,
        callback
      );

      emitTaskEvent(TASK_EVENTS.TASK_CREATED, { taskId: "123" });
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      emitTaskEvent(TASK_EVENTS.TASK_CREATED, { taskId: "456" });
      expect(callback).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it("handles multiple subscribers", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = subscribeToTaskEvents(
        TASK_EVENTS.TASK_CREATED,
        callback1
      );
      const unsubscribe2 = subscribeToTaskEvents(
        TASK_EVENTS.TASK_CREATED,
        callback2
      );

      emitTaskEvent(TASK_EVENTS.TASK_CREATED, { taskId: "123" });

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      unsubscribe1();
      unsubscribe2();
    });

    it("does not trigger callback for different event types", () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToTaskEvents(
        TASK_EVENTS.TASK_CREATED,
        callback
      );

      emitTaskEvent(TASK_EVENTS.TASK_UPDATED, { taskId: "123" });

      expect(callback).not.toHaveBeenCalled();

      unsubscribe();
    });

    it("handles event without detail", () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToTaskEvents(
        TASK_EVENTS.TASK_CREATED,
        callback
      );

      emitTaskEvent(TASK_EVENTS.TASK_CREATED);

      expect(callback).toHaveBeenCalledTimes(1);
      // CustomEvent detail is null when not provided, not undefined
      const callArg = callback.mock.calls[0][0];
      expect(callArg === undefined || callArg === null).toBe(true);

      unsubscribe();
    });
  });

  describe("subscribeToAllTaskEvents", () => {
    it("subscribes to all task events", () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToAllTaskEvents(callback);

      emitTaskEvent(TASK_EVENTS.TASK_CREATED, { taskId: "1" });
      emitTaskEvent(TASK_EVENTS.TASK_UPDATED, { taskId: "2" });
      emitTaskEvent(TASK_EVENTS.TASK_STATUS_CHANGED, { taskId: "3" });
      emitTaskEvent(TASK_EVENTS.TASK_DELETED, { taskId: "4" });

      expect(callback).toHaveBeenCalledTimes(4);
      expect(callback).toHaveBeenNthCalledWith(1, { taskId: "1" });
      expect(callback).toHaveBeenNthCalledWith(2, { taskId: "2" });
      expect(callback).toHaveBeenNthCalledWith(3, { taskId: "3" });
      expect(callback).toHaveBeenNthCalledWith(4, { taskId: "4" });

      unsubscribe();
    });

    it("unsubscribes from all events", () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToAllTaskEvents(callback);

      emitTaskEvent(TASK_EVENTS.TASK_CREATED, { taskId: "1" });
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      emitTaskEvent(TASK_EVENTS.TASK_CREATED, { taskId: "2" });
      emitTaskEvent(TASK_EVENTS.TASK_UPDATED, { taskId: "3" });
      emitTaskEvent(TASK_EVENTS.TASK_STATUS_CHANGED, { taskId: "4" });
      emitTaskEvent(TASK_EVENTS.TASK_DELETED, { taskId: "5" });

      expect(callback).toHaveBeenCalledTimes(1); // Still 1
    });

    it("handles multiple all-event subscribers", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = subscribeToAllTaskEvents(callback1);
      const unsubscribe2 = subscribeToAllTaskEvents(callback2);

      emitTaskEvent(TASK_EVENTS.TASK_CREATED, { taskId: "1" });

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      unsubscribe1();
      unsubscribe2();
    });
  });

  describe("Edge cases", () => {
    it("handles rapid event emissions", () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToTaskEvents(
        TASK_EVENTS.TASK_CREATED,
        callback
      );

      for (let i = 0; i < 100; i++) {
        emitTaskEvent(TASK_EVENTS.TASK_CREATED, { taskId: `${i}` });
      }

      expect(callback).toHaveBeenCalledTimes(100);

      unsubscribe();
    });

    it("handles complex event detail objects", () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToTaskEvents(
        TASK_EVENTS.TASK_STATUS_CHANGED,
        callback
      );

      const complexDetail = {
        taskId: "complex-123",
        status: "completed",
        previousStatus: "in_progress",
        assignedTo: "user@example.com",
        department: "Engineering",
      };

      emitTaskEvent(TASK_EVENTS.TASK_STATUS_CHANGED, complexDetail);

      expect(callback).toHaveBeenCalledWith(complexDetail);

      unsubscribe();
    });

    it("handles unsubscribe called multiple times", () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToTaskEvents(
        TASK_EVENTS.TASK_CREATED,
        callback
      );

      unsubscribe();
      unsubscribe(); // Should not throw

      emitTaskEvent(TASK_EVENTS.TASK_CREATED, { taskId: "123" });

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
