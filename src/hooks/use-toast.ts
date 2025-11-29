"use strict";

/**
 * File: use-toast.ts
 * Description: Global toast notification system using observer pattern.
 * Manages toast notifications with queuing, auto-dismiss, and state synchronization across components.
 * Responsibilities:
 *   - Maintain global toast state (shared across all components)
 *   - Provide toast() function to show notifications
 *   - Limit concurrent toasts to TOAST_LIMIT (1 by default)
 *   - Auto-dismiss toasts after TOAST_REMOVE_DELAY
 *   - Support add, update, dismiss, and remove operations
 *   - Notify all subscribers when state changes (observer pattern)
 *   - Generate unique IDs for each toast
 *   - Manage timeout cleanup for dismissed toasts
 * Called by:
 *   - ProfileDialog.tsx (profile update success/error notifications)
 *   - use-dialog-handlers.ts (CRUD operation notifications)
 *   - exercises.tsx (exercise CRUD notifications)
 *   - methods.tsx (method CRUD notifications)
 *   - WorkoutSheets.tsx (workout sheet notifications)
 *   - Any component needing toast notifications
 *   - Toaster.tsx (renders toast UI based on state)
 * Notes:
 *   - State is stored in module-level memoryState (singleton pattern)
 *   - Multiple components can share same toast state via useToast()
 *   - TOAST_LIMIT controls max concurrent toasts (default: 1)
 *   - TOAST_REMOVE_DELAY is very long (1000000ms) - toasts stay until manually dismissed
 *   - Uses observer pattern: listeners array tracks all subscribers
 *   - Toast IDs are generated sequentially with wraparound at MAX_SAFE_INTEGER
 *   - Timeouts are tracked in Map to prevent duplicate scheduling
 */

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

/** Maximum number of concurrent toasts to display */
const TOAST_LIMIT = 1;

/** Delay in milliseconds before removing a dismissed toast (1000 seconds) */
const TOAST_REMOVE_DELAY = 1000000;

/** Starting value for toast ID counter */
const INITIAL_COUNT = 0;

/**
 * Extended toast properties including unique ID and optional content.
 */
type ToasterToast = ToastProps & {
  /** Unique identifier for the toast */
  id: string;
  /** Optional title content (can be string or React element) */
  title?: ReactNode;
  /** Optional description content (can be string or React element) */
  description?: ReactNode;
  /** Optional action button element */
  action?: ToastActionElement;
};

/**
 * Action type constants for toast state management.
 * Used in reducer pattern for state updates.
 */
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

/**
 * Counter for generating unique toast IDs.
 * Wraps around at MAX_SAFE_INTEGER to prevent overflow.
 */
let count = INITIAL_COUNT;

/**
 * Generates a unique ID for a toast.
 * IDs are sequential numbers that wrap around at MAX_SAFE_INTEGER.
 * @returns Unique string ID
 */
function genId(): string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

/**
 * Type alias for action type constants.
 */
type ActionType = typeof actionTypes;

/**
 * Union type for all possible toast actions.
 */
type Action =
  | { type: ActionType["ADD_TOAST"]; toast: ToasterToast }
  | { type: ActionType["UPDATE_TOAST"]; toast: Partial<ToasterToast> }
  | { type: ActionType["DISMISS_TOAST"]; toastId?: ToasterToast["id"] }
  | { type: ActionType["REMOVE_TOAST"]; toastId?: ToasterToast["id"] };

/**
 * Global toast state structure.
 */
interface State {
  /** Array of active toasts */
  toasts: ToasterToast[];
}

/**
 * Map tracking scheduled timeout IDs for toast removal.
 * Prevents duplicate timeout scheduling for the same toast.
 */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Validates if a toast ID is a valid non-empty string.
 * @param toastId - Toast ID to validate
 * @returns True if ID is valid
 */
function isValidToastId(toastId: unknown): toastId is string {
  return typeof toastId === "string" && toastId.length > 0;
}

/**
 * Schedules a toast for removal after TOAST_REMOVE_DELAY.
 * Prevents duplicate scheduling if toast is already queued.
 * @param toastId - ID of toast to remove
 */
function addToRemoveQueue(toastId: string): void {
  if (!isValidToastId(toastId)) {
    console.warn("Invalid toast ID provided to addToRemoveQueue:", toastId);
    return;
  }

  // Skip if already queued
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout((): void => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
}

/**
 * Reducer function for toast state management.
 * Handles add, update, dismiss, and remove actions.
 * @param state - Current toast state
 * @param action - Action to perform
 * @returns New toast state
 */
export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST": {
      const newToast = action.toast;

      if (!isValidToastId(newToast.id)) {
        console.error("Cannot add toast with invalid ID:", newToast);
        return state;
      }

      return {
        ...state,
        toasts: [newToast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    }

    case "UPDATE_TOAST": {
      const toastUpdate = action.toast;

      if (!isValidToastId(toastUpdate.id)) {
        console.error("Cannot update toast with invalid ID:", toastUpdate);
        return state;
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastUpdate.id ? { ...t, ...toastUpdate } : t
        ),
      };
    }

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // Dismiss specific toast or all toasts
      if (isValidToastId(toastId)) {
        addToRemoveQueue(toastId);
      } else {
        // Dismiss all toasts
        state.toasts.forEach((toast) => {
          if (isValidToastId(toast.id)) {
            addToRemoveQueue(toast.id);
          }
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined ? { ...t, open: false } : t
        ),
      };
    }

    case "REMOVE_TOAST": {
      const { toastId } = action;

      // Remove specific toast or all toasts
      if (toastId === undefined) {
        return { ...state, toasts: [] };
      }

      if (!isValidToastId(toastId)) {
        console.warn("Invalid toast ID for removal:", toastId);
        return state;
      }

      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== toastId),
      };
    }

    default: {
      // Exhaustiveness check
      const _exhaustive: never = action;
      console.error("Unknown action type:", _exhaustive);
      return state;
    }
  }
}

/**
 * Array of listener functions subscribed to toast state changes.
 * Each listener is called when state updates (observer pattern).
 */
const listeners: Array<(state: State) => void> = [];

/**
 * Module-level state storage (singleton).
 * Shared across all components using useToast().
 */
let memoryState: State = { toasts: [] };

/**
 * Dispatches an action to update toast state.
 * Notifies all subscribed listeners after state update.
 * @param action - Action to dispatch
 */
function dispatch(action: Action): void {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    try {
      listener(memoryState);
    } catch (error) {
      console.error("Error in toast listener:", error);
    }
  });
}

/**
 * Toast properties without the auto-generated ID.
 */
type Toast = Omit<ToasterToast, "id">;

/**
 * Creates and displays a toast notification.
 * Returns functions to update or dismiss the toast.
 *
 * @param props - Toast properties (title, description, variant, etc.)
 * @returns Object with toast ID and control functions
 *
 * @example
 * ```tsx
 * const { dismiss } = toast({
 *   title: "Success",
 *   description: "Item saved successfully",
 *   variant: "default"
 * });
 * ```
 */
function toast(props: Toast): {
  id: string;
  dismiss: () => void;
  update: (props: ToasterToast) => void;
} {
  const id = genId();

  /**
   * Updates the toast with new properties.
   * @param updateProps - New properties to merge
   */
  function update(updateProps: ToasterToast): void {
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...updateProps, id },
    });
  }

  /**
   * Dismisses the toast (sets open to false).
   */
  function dismiss(): void {
    dispatch({ type: "DISMISS_TOAST", toastId: id });
  }

  /**
   * Handler for toast open state changes.
   * Dismisses toast when open becomes false.
   * @param open - New open state
   */
  function handleOpenChange(open: boolean): void {
    if (!open) {
      dismiss();
    }
  }

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: handleOpenChange,
    },
  });

  return { id, dismiss, update };
}

/**
 * Return type for useToast hook.
 */
interface UseToastReturn extends State {
  /** Function to create and show a toast */
  toast: typeof toast;
  /** Function to dismiss a specific toast or all toasts */
  dismiss: (toastId?: string) => void;
}

/**
 * React hook for accessing toast state and functions.
 * Subscribes to global toast state and re-renders on updates.
 *
 * @returns Toast state and control functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { toast, toasts } = useToast();
 *
 *   function showNotification() {
 *     toast({
 *       title: "Hello",
 *       description: "This is a notification"
 *     });
 *   }
 *
 *   return <button onClick={showNotification}>Show Toast</button>;
 * }
 * ```
 */
function useToast(): UseToastReturn {
  const [state, setState] = useState<State>(memoryState);

  /**
   * Subscribes to toast state changes on mount.
   * Unsubscribes on unmount to prevent memory leaks.
   */
  useEffect(
    function subscribeToToastState(): () => void {
      listeners.push(setState);

      return (): void => {
        const index = listeners.indexOf(setState);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };
    },
    []
  );

  /**
   * Dismisses a specific toast by ID, or all toasts if no ID provided.
   * @param toastId - Optional toast ID to dismiss
   */
  function dismissToast(toastId?: string): void {
    dispatch({ type: "DISMISS_TOAST", toastId });
  }

  return {
    ...state,
    toast,
    dismiss: dismissToast,
  };
}

export { useToast, toast };
