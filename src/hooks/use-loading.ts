"use strict";

/**
 * File: use-loading.ts
 * Description: Global loading state management using Zustand store.
 * Provides a centralized way to track loading operations across the application using a reference counter.
 * Responsibilities:
 *   - Maintain global loading state (isLoading boolean)
 *   - Track number of concurrent loading operations (loadingCount)
 *   - Provide startLoading() to increment loading counter
 *   - Provide stopLoading() to decrement loading counter
 *   - Automatically set isLoading to true when any operation starts
 *   - Automatically set isLoading to false when all operations complete
 *   - Prevent negative loading counts (minimum 0)
 * Called by:
 *   - LoadingBar.tsx (displays progress bar based on isLoading state)
 *   - api-client.ts (tracks API request loading states)
 *   - Any component that needs to show loading state
 *   - Multiple components can call startLoading/stopLoading concurrently
 * Notes:
 *   - Uses reference counting pattern (multiple start/stop calls supported)
 *   - isLoading remains true until ALL loading operations complete
 *   - loadingCount starts at 0 and cannot go below 0
 *   - Store is global singleton - shared across entire application
 *   - Zustand provides React hook interface automatically
 *   - No manual unsubscribe needed (handled by Zustand)
 */

import { create } from "zustand";

/**
 * Zustand store interface for loading state management.
 * Tracks loading operations using a reference counter pattern.
 */
interface LoadingStore {
  /** Whether any loading operation is currently active */
  isLoading: boolean;
  /** Number of concurrent loading operations (reference counter) */
  loadingCount: number;
  /** Increments loading counter and sets isLoading to true */
  startLoading: () => void;
  /** Decrements loading counter and sets isLoading to false when count reaches 0 */
  stopLoading: () => void;
}

/**
 * Minimum allowed loading count (prevents negative values).
 */
const MIN_LOADING_COUNT = 0;

/**
 * Safely increments loading count by 1.
 * @param currentCount - Current loading count
 * @returns New loading count (always positive)
 */
function incrementLoadingCount(currentCount: number): number {
  const safeCount =
    typeof currentCount === "number" && !isNaN(currentCount)
      ? currentCount
      : MIN_LOADING_COUNT;

  return safeCount + 1;
}

/**
 * Safely decrements loading count by 1.
 * Prevents negative values (minimum is 0).
 * @param currentCount - Current loading count
 * @returns New loading count (always >= 0)
 */
function decrementLoadingCount(currentCount: number): number {
  const safeCount =
    typeof currentCount === "number" && !isNaN(currentCount)
      ? currentCount
      : MIN_LOADING_COUNT;

  return Math.max(MIN_LOADING_COUNT, safeCount - 1);
}

/**
 * Determines if loading should be active based on count.
 * @param count - Current loading count
 * @returns True if count is greater than 0
 */
function shouldBeLoading(count: number): boolean {
  return typeof count === "number" && !isNaN(count) && count > 0;
}

/**
 * Global loading state store using Zustand.
 * Provides reference-counted loading state management.
 *
 * @example
 * ```tsx
 * // In a component
 * const { isLoading, startLoading, stopLoading } = useLoading();
 *
 * async function fetchData() {
 *   startLoading();
 *   try {
 *     await api.getData();
 *   } finally {
 *     stopLoading();
 *   }
 * }
 * ```
 */
export const useLoading = create<LoadingStore>((set) => ({
  isLoading: false,
  loadingCount: MIN_LOADING_COUNT,

  /**
   * Starts a loading operation.
   * Increments the loading counter and sets isLoading to true.
   * Safe to call multiple times concurrently.
   */
  startLoading: (): void => {
    set((state): Partial<LoadingStore> => {
      const newCount = incrementLoadingCount(state.loadingCount);
      return {
        loadingCount: newCount,
        isLoading: true,
      };
    });
  },

  /**
   * Stops a loading operation.
   * Decrements the loading counter and sets isLoading to false when count reaches 0.
   * Safe to call multiple times - will never go below 0.
   */
  stopLoading: (): void => {
    set((state): Partial<LoadingStore> => {
      const newCount = decrementLoadingCount(state.loadingCount);
      return {
        loadingCount: newCount,
        isLoading: shouldBeLoading(newCount),
      };
    });
  },
}));
