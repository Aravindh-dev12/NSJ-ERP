import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToast, toast, reducer } from "@/hooks/use-toast";

describe("useToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with empty toasts", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it("adds a toast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: "Test Toast",
        description: "This is a test",
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe("Test Toast");
    expect(result.current.toasts[0].description).toBe("This is a test");
  });

  it("dismisses a specific toast", () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      const t = result.current.toast({ title: "Test" });
      toastId = t.id;
    });

    expect(result.current.toasts[0].open).toBe(true);

    act(() => {
      result.current.dismiss(toastId!);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it("dismisses all toasts when no id provided", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "Toast 1" });
      result.current.toast({ title: "Toast 2" });
    });

    expect(result.current.toasts).toHaveLength(1); // TOAST_LIMIT is 1

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it("removes toast after delay", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "Test" });
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.dismiss(result.current.toasts[0].id);
    });

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it("limits number of toasts", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "Toast 1" });
      result.current.toast({ title: "Toast 2" });
      result.current.toast({ title: "Toast 3" });
    });

    // TOAST_LIMIT is 1, so only the last toast should be visible
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe("Toast 3");
  });

  it("toast function returns update and dismiss methods", () => {
    const { result } = renderHook(() => useToast());

    let toastObj: any;
    act(() => {
      toastObj = result.current.toast({ title: "Original" });
    });

    expect(toastObj).toHaveProperty("id");
    expect(toastObj).toHaveProperty("update");
    expect(toastObj).toHaveProperty("dismiss");

    act(() => {
      toastObj.update({ title: "Updated" });
    });

    expect(result.current.toasts[0].title).toBe("Updated");

    act(() => {
      toastObj.dismiss();
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it("standalone toast function works", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: "Standalone Toast" });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe("Standalone Toast");
  });
});

describe("reducer", () => {
  it("handles ADD_TOAST action", () => {
    const state = { toasts: [] };
    const newState = reducer(state, {
      type: "ADD_TOAST",
      toast: { id: "1", title: "Test", open: true },
    });

    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0].id).toBe("1");
  });

  it("handles UPDATE_TOAST action", () => {
    const state = {
      toasts: [{ id: "1", title: "Original", open: true }],
    };
    const newState = reducer(state, {
      type: "UPDATE_TOAST",
      toast: { id: "1", title: "Updated" },
    });

    expect(newState.toasts[0].title).toBe("Updated");
  });

  it("handles DISMISS_TOAST action", () => {
    const state = {
      toasts: [{ id: "1", title: "Test", open: true }],
    };
    const newState = reducer(state, {
      type: "DISMISS_TOAST",
      toastId: "1",
    });

    expect(newState.toasts[0].open).toBe(false);
  });

  it("handles REMOVE_TOAST action", () => {
    const state = {
      toasts: [{ id: "1", title: "Test", open: true }],
    };
    const newState = reducer(state, {
      type: "REMOVE_TOAST",
      toastId: "1",
    });

    expect(newState.toasts).toHaveLength(0);
  });

  it("removes all toasts when REMOVE_TOAST has no toastId", () => {
    const state = {
      toasts: [
        { id: "1", title: "Test 1", open: true },
        { id: "2", title: "Test 2", open: true },
      ],
    };
    const newState = reducer(state, {
      type: "REMOVE_TOAST",
      toastId: undefined,
    });

    expect(newState.toasts).toHaveLength(0);
  });
});
