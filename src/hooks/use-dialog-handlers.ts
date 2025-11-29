"use strict";

/**
 * File: use-dialog-handlers.ts
 * Description: Reusable React hook for managing CRUD dialog state and operations.
 * Provides a consistent interface for opening, closing, editing, viewing, and deleting items in dialogs.
 * Responsibilities:
 *   - Manage dialog open/closed state
 *   - Track editing item (for edit mode)
 *   - Track selected item (for view mode)
 *   - Provide handlers for opening dialog in add/edit/view modes
 *   - Handle item deletion with confirmation and error handling
 *   - Display toast notifications for success/error states
 *   - Reload items after successful operations
 * Called by:
 *   - exercises.tsx (managing exercise CRUD dialogs)
 *   - methods.tsx (managing method CRUD dialogs)
 *   - WorkoutSheets.tsx (managing workout sheet CRUD dialogs)
 *   - Any page/component with list view and CRUD operations
 * Notes:
 *   - Generic type T must extend { id: number }
 *   - Delete operation requires user confirmation via window.confirm
 *   - Automatically calls onLoadItems after successful deletion
 *   - Optional onDeleteError callback for custom error handling
 *   - State is managed internally with useState
 *   - All handlers are memoized with useCallback for performance
 */

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useState } from "react";
import { apiDelete } from "@/lib/api-client";
import { useToast } from "./use-toast";

/**
 * Internal dialog state structure.
 * Tracks dialog visibility and current item context.
 */
interface DialogState<T> {
  /** Whether the dialog is currently open */
  isOpen: boolean;
  /** Item being edited (null if adding new or viewing) */
  editingItem: T | null;
  /** Item being viewed in read-only mode (null if adding or editing) */
  selectedItem: T | null;
}

/**
 * Configuration options for the dialog handlers hook.
 */
interface DialogHandlerConfig<T> {
  /** Display name of the item type (e.g., "exercício", "método") for messages */
  itemName: string;
  /** Async function to reload items list after operations */
  onLoadItems: () => Promise<void>;
  /** Optional error handler called when deletion fails */
  onDeleteError?: (item: T, error: Error) => void;
}

/**
 * Return type for the useDialogHandlers hook.
 * Provides all state values and handler functions.
 */
interface DialogHandlers<T> {
  /** Whether the dialog is currently open */
  isOpen: boolean;
  /** Item currently being edited (null if not editing) */
  editingItem: T | null;
  /** Item currently selected for viewing (null if not viewing) */
  selectedItem: T | null;
  /** True if dialog is in edit mode */
  isEditing: boolean;
  /** True if dialog is in view mode (viewing but not editing) */
  isViewing: boolean;
  /** Opens dialog in edit mode with the specified item */
  openEditDialog: (item: T) => void;
  /** Opens dialog in view mode with the specified item */
  openViewDialog: (item: T) => void;
  /** Opens dialog in add mode (no item selected) */
  openAddDialog: () => void;
  /** Closes the dialog and resets state */
  closeDialog: () => void;
  /** Deletes an item with confirmation and error handling */
  handleDelete: (id: number, apiEndpoint: string) => Promise<void>;
  /** Manually sets the editing item */
  setEditingItem: (item: T | null) => void;
  /** Manually sets the selected item */
  setSelectedItem: (item: T | null) => void;
}

/**
 * Validates if a value is a valid positive number ID.
 * @param id - Value to validate
 * @returns True if id is a valid positive number
 */
function isValidId(id: unknown): id is number {
  return typeof id === "number" && !isNaN(id) && id > 0 && Number.isFinite(id);
}

/**
 * Validates if a string is non-empty after trimming.
 * @param value - String to validate
 * @returns True if string is valid and non-empty
 */
function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates if an API endpoint string is properly formatted.
 * @param endpoint - API endpoint to validate
 * @returns True if endpoint is valid
 */
function isValidEndpoint(endpoint: unknown): endpoint is string {
  return (
    typeof endpoint === "string" &&
    endpoint.trim().length > 0 &&
    endpoint.startsWith("/")
  );
}

/**
 * Capitalizes the first letter of a string.
 * @param str - String to capitalize
 * @returns Capitalized string
 */
function capitalizeFirst(str: string): string {
  if (!isValidString(str)) {
    return "";
  }

  const trimmed = str.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Extracts error message from unknown error object.
 * @param error - Error object (any type)
 * @returns Error message string
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Erro desconhecido";
}

/**
 * Custom React hook for managing CRUD dialog state and operations.
 * Provides a consistent interface for dialog management across different entity types.
 *
 * @template T - Entity type that must have an id property
 * @param config - Configuration object with item name and callbacks
 * @returns Object containing state values and handler functions
 *
 * @example
 * ```tsx
 * const {
 *   isOpen,
 *   editingItem,
 *   openEditDialog,
 *   closeDialog,
 *   handleDelete
 * } = useDialogHandlers({
 *   itemName: "exercício",
 *   onLoadItems: fetchExercises,
 *   onDeleteError: (item, error) => console.error(error)
 * });
 * ```
 */
export function useDialogHandlers<T extends { id: number }>(
  config: DialogHandlerConfig<T>
): DialogHandlers<T> {
  // Validate config on mount (development checks)
  if (!isValidString(config.itemName)) {
    console.warn("useDialogHandlers: itemName must be a non-empty string");
  }

  if (typeof config.onLoadItems !== "function") {
    console.warn("useDialogHandlers: onLoadItems must be a function");
  }

  const { toast } = useToast();
  const [state, setState] = useState<DialogState<T>>({
    isOpen: false,
    editingItem: null,
    selectedItem: null,
  });

  /**
   * Opens the dialog in edit mode with the specified item.
   * @param item - Item to edit
   */
  const openEditDialog = useCallback((item: T): void => {
    if (!item || !isValidId(item.id)) {
      console.error("openEditDialog: Invalid item provided", item);
      return;
    }

    setState({ isOpen: true, editingItem: item, selectedItem: null });
  }, []);

  /**
   * Opens the dialog in view mode with the specified item.
   * @param item - Item to view
   */
  const openViewDialog = useCallback((item: T): void => {
    if (!item || !isValidId(item.id)) {
      console.error("openViewDialog: Invalid item provided", item);
      return;
    }

    setState({ isOpen: true, editingItem: null, selectedItem: item });
  }, []);

  /**
   * Opens the dialog in add mode (no item selected).
   * Used for creating new items.
   */
  const openAddDialog = useCallback((): void => {
    setState({ isOpen: true, editingItem: null, selectedItem: null });
  }, []);

  /**
   * Closes the dialog and resets all state.
   * Clears editing and selected items.
   */
  const closeDialog = useCallback((): void => {
    setState({ isOpen: false, editingItem: null, selectedItem: null });
  }, []);

  /**
   * Handles item deletion with confirmation and error handling.
   * Shows confirmation dialog, performs deletion, reloads list, and shows notifications.
   *
   * @param id - ID of the item to delete
   * @param apiEndpoint - API endpoint for deletion
   */
  const handleDelete = useCallback(
    async (id: number, apiEndpoint: string): Promise<void> => {
      // Validate inputs
      if (!isValidId(id)) {
        console.error("handleDelete: Invalid id provided", id);
        toast({
          title: "Erro",
          description: "ID inválido para exclusão.",
          variant: "destructive",
        });
        return;
      }

      if (!isValidEndpoint(apiEndpoint)) {
        console.error("handleDelete: Invalid API endpoint", apiEndpoint);
        toast({
          title: "Erro",
          description: "Endpoint de API inválido.",
          variant: "destructive",
        });
        return;
      }

      const itemLabel = config.itemName || "item";
      const capitalizedLabel = capitalizeFirst(itemLabel);

      // Confirm deletion with user
      const confirmed =
        typeof window !== "undefined" &&
        window.confirm(`Tem certeza que deseja deletar este ${itemLabel}?`);

      if (!confirmed) {
        return;
      }

      try {
        // Perform deletion
        await apiDelete(apiEndpoint);

        // Reload items list
        if (typeof config.onLoadItems === "function") {
          await config.onLoadItems();
        }

        // Show success notification
        toast({
          title: `${capitalizedLabel} deletado`,
          description: `O ${itemLabel} foi removido com sucesso.`,
        });
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        console.error(`Error deleting ${itemLabel}:`, errorMessage, error);

        // Call custom error handler if provided
        const currentItem = state.editingItem || state.selectedItem;
        if (currentItem && typeof config.onDeleteError === "function") {
          config.onDeleteError(currentItem, error as Error);
        }

        // Show error notification
        toast({
          title: "Erro",
          description: `Não foi possível deletar o ${itemLabel}.`,
          variant: "destructive",
        });
      }
    },
    [state.editingItem, state.selectedItem, config, toast]
  );

  /**
   * Manually sets the editing item.
   * Updates state to reflect the new editing context.
   *
   * @param item - Item to set as editing (or null to clear)
   */
  const setEditingItem = useCallback((item: T | null): void => {
    if (item !== null && !isValidId(item.id)) {
      console.error("setEditingItem: Invalid item provided", item);
      return;
    }

    setState((prev) => ({ ...prev, editingItem: item }));
  }, []);

  /**
   * Manually sets the selected item for viewing.
   * Updates state to reflect the new selected context.
   *
   * @param item - Item to set as selected (or null to clear)
   */
  const setSelectedItem = useCallback((item: T | null): void => {
    if (item !== null && !isValidId(item.id)) {
      console.error("setSelectedItem: Invalid item provided", item);
      return;
    }

    setState((prev) => ({ ...prev, selectedItem: item }));
  }, []);

  // Return all state and handlers
  return {
    isOpen: state.isOpen,
    editingItem: state.editingItem,
    selectedItem: state.selectedItem,
    isEditing: state.editingItem !== null,
    isViewing: state.selectedItem !== null && state.editingItem === null,
    openEditDialog,
    openViewDialog,
    openAddDialog,
    closeDialog,
    handleDelete,
    setEditingItem,
    setSelectedItem,
  };
}
