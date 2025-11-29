"use strict";

/**
 * File: use-workout-sheets-filter.ts
 * Description: React hook for fetching and filtering workout sheets with category and pagination support.
 * Provides complete state management for workout sheets list with filtering, pagination, and refresh capabilities.
 * Responsibilities:
 *   - Fetch workout sheets from API with pagination
 *   - Fetch available categories for filtering
 *   - Filter sheets by selected category
 *   - Manage pagination state (current page, page size, total count)
 *   - Handle loading and error states
 *   - Provide refresh function to reload data
 *   - Reset to page 1 when category filter changes
 *   - Support custom page size configuration
 * Called by:
 *   - WorkoutSheets.tsx (main workout sheets list page)
 *   - Any component needing filtered workout sheets data
 * Notes:
 *   - Default page size is 12 items per page
 *   - Page numbers are 1-indexed
 *   - Category filter is optional (null means show all)
 *   - Uses /api/categories and /api/exercise-groups endpoints
 *   - Automatically refetches when category, page, or refresh trigger changes
 *   - Categories are fetched once on mount
 *   - WorkoutSheet type includes optional exerciseMethods array
 */

import { useCallback, useEffect, useState } from "react";

/**
 * Category data structure.
 */
export interface Category {
  /** Unique category identifier */
  id: number;
  /** Category display name */
  name: string;
}

/**
 * Workout sheet data structure.
 */
export interface WorkoutSheet {
  /** Unique workout sheet identifier */
  id: number;
  /** Internal sheet name */
  name: string;
  /** Public-facing sheet name (nullable) */
  publicName: string | null;
  /** Associated category ID */
  categoryId: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Optional array of exercise methods */
  exerciseMethods?: unknown[];
}

/**
 * Return type for useWorkoutSheetsFilter hook.
 */
interface UseWorkoutSheetsFilterResult {
  /** Array of workout sheets for current page and filter */
  sheets: WorkoutSheet[];
  /** Array of available categories */
  categories: Category[];
  /** Currently selected category ID (null means all) */
  selectedCategoryId: number | null;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Error message if fetch failed (null if no error) */
  error: string | null;
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of sheets across all pages */
  totalCount: number;
  /** Number of items per page */
  pageSize: number;
  /** Function to set category filter */
  setSelectedCategoryId: (categoryId: number | null) => void;
  /** Function to set current page */
  setCurrentPage: (page: number) => void;
  /** Function to trigger data refresh */
  refreshSheets: () => void;
}

/**
 * API response structure for categories endpoint.
 */
interface CategoriesApiResponse {
  data?: Category[];
}

/**
 * API response structure for exercise groups endpoint.
 */
interface ExerciseGroupsApiResponse {
  data?: WorkoutSheet[];
  meta?: {
    total?: number;
  };
}

/** Default page size when none specified */
const DEFAULT_PAGE_SIZE = 12;

/** First page number (1-indexed) */
const FIRST_PAGE = 1;

/** Initial refresh trigger value */
const INITIAL_REFRESH_TRIGGER = 0;

/** Minimum valid page size */
const MIN_PAGE_SIZE = 1;

/** Maximum valid page size (prevent excessive API requests) */
const MAX_PAGE_SIZE = 100;

/**
 * Validates and normalizes page size value.
 * @param pageSize - Page size to validate
 * @returns Valid page size within bounds
 */
function normalizePageSize(pageSize: number | undefined): number {
  if (
    pageSize === undefined ||
    typeof pageSize !== "number" ||
    isNaN(pageSize) ||
    !Number.isFinite(pageSize)
  ) {
    return DEFAULT_PAGE_SIZE;
  }

  const clampedSize = Math.floor(pageSize);

  if (clampedSize < MIN_PAGE_SIZE) {
    return MIN_PAGE_SIZE;
  }

  if (clampedSize > MAX_PAGE_SIZE) {
    console.warn(
      `Page size ${clampedSize} exceeds maximum ${MAX_PAGE_SIZE}, using maximum`
    );
    return MAX_PAGE_SIZE;
  }

  return clampedSize;
}

/**
 * Validates if a category ID is valid.
 * @param categoryId - Category ID to validate
 * @returns True if valid positive number or null
 */
function isValidCategoryId(
  categoryId: number | null | undefined
): categoryId is number | null {
  if (categoryId === null || categoryId === undefined) {
    return true;
  }

  return (
    typeof categoryId === "number" &&
    !isNaN(categoryId) &&
    Number.isFinite(categoryId) &&
    Number.isInteger(categoryId) &&
    categoryId > 0
  );
}

/**
 * Validates if a page number is valid.
 * @param page - Page number to validate
 * @returns True if valid positive integer
 */
function isValidPageNumber(page: number): boolean {
  return (
    typeof page === "number" &&
    !isNaN(page) &&
    Number.isFinite(page) &&
    Number.isInteger(page) &&
    page >= FIRST_PAGE
  );
}

/**
 * Safely extracts categories from API response.
 * @param data - API response data
 * @returns Array of categories (empty if invalid)
 */
function extractCategories(data: unknown): Category[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  const response = data as CategoriesApiResponse;

  if (!Array.isArray(response.data)) {
    return [];
  }

  return response.data.filter(
    (cat): cat is Category =>
      cat !== null &&
      typeof cat === "object" &&
      typeof cat.id === "number" &&
      typeof cat.name === "string"
  );
}

/**
 * Safely extracts workout sheets from API response.
 * @param data - API response data
 * @returns Array of workout sheets (empty if invalid)
 */
function extractWorkoutSheets(data: unknown): WorkoutSheet[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  const response = data as ExerciseGroupsApiResponse;

  // Try response.data first, fallback to data itself (for compatibility)
  const sheetsArray = Array.isArray(response.data)
    ? response.data
    : Array.isArray(data)
      ? (data as WorkoutSheet[])
      : [];

  return sheetsArray.filter(
    (sheet): sheet is WorkoutSheet =>
      sheet !== null &&
      typeof sheet === "object" &&
      typeof sheet.id === "number" &&
      typeof sheet.name === "string"
  );
}

/**
 * Safely extracts total count from API response.
 * @param data - API response data
 * @returns Total count (0 if not found)
 */
function extractTotalCount(data: unknown): number {
  if (!data || typeof data !== "object") {
    return 0;
  }

  const response = data as ExerciseGroupsApiResponse;

  if (
    response.meta &&
    typeof response.meta === "object" &&
    typeof response.meta.total === "number"
  ) {
    return Math.max(0, response.meta.total);
  }

  return 0;
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

  return "Unknown error occurred";
}

/**
 * Builds URL for exercise groups API with query parameters.
 * @param page - Current page number
 * @param pageSize - Items per page
 * @param categoryId - Optional category filter
 * @returns Complete API URL
 */
function buildExerciseGroupsUrl(
  page: number,
  pageSize: number,
  categoryId: number | null
): string {
  let url = `/api/exercise-groups?page=${page}&pageSize=${pageSize}`;

  if (categoryId !== null && isValidCategoryId(categoryId)) {
    url += `&categoryId=${categoryId}`;
  }

  return url;
}

/**
 * Custom React hook for managing workout sheets with filtering and pagination.
 * Fetches categories and workout sheets, handles filtering by category, and manages pagination state.
 *
 * @param customPageSize - Optional custom page size (defaults to 12)
 * @returns Object containing sheets, categories, state, and control functions
 *
 * @example
 * ```tsx
 * const {
 *   sheets,
 *   categories,
 *   selectedCategoryId,
 *   setSelectedCategoryId,
 *   currentPage,
 *   setCurrentPage,
 *   isLoading,
 *   error
 * } = useWorkoutSheetsFilter(12);
 * ```
 */
export function useWorkoutSheetsFilter(
  customPageSize?: number
): UseWorkoutSheetsFilterResult {
  const pageSize = normalizePageSize(customPageSize);

  const [sheets, setSheets] = useState<WorkoutSheet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryIdState] = useState<
    number | null
  >(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(
    INITIAL_REFRESH_TRIGGER
  );
  const [currentPage, setCurrentPageState] = useState<number>(FIRST_PAGE);
  const [totalCount, setTotalCount] = useState<number>(0);

  /**
   * Fetches categories from API on mount.
   * Categories are loaded once and cached.
   */
  useEffect(
    function fetchCategoriesOnMount(): void {
      async function fetchCategories(): Promise<void> {
        try {
          const response = await fetch("/api/categories");

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data: unknown = await response.json();
          const categoriesArray = extractCategories(data);
          setCategories(categoriesArray);
        } catch (err) {
          const errorMessage = getErrorMessage(err);
          console.error("Error fetching categories:", errorMessage, err);
          setError("Failed to load categories");
        }
      }

      fetchCategories().catch((err) => {
        console.error("Unhandled error in fetchCategories:", err);
      });
    },
    []
  );

  /**
   * Resets to first page when category filter changes.
   * Ensures pagination starts from beginning for new filter.
   */
  useEffect(
    function resetPageOnCategoryChange(): void {
      setCurrentPageState(FIRST_PAGE);
    },
    [selectedCategoryId]
  );

  /**
   * Fetches workout sheets based on current filters and pagination.
   * Refetches when category, page, or refresh trigger changes.
   */
  useEffect(
    function fetchWorkoutSheets(): void {
      async function fetchSheets(): Promise<void> {
        setIsLoading(true);
        setError(null);

        try {
          const url = buildExerciseGroupsUrl(
            currentPage,
            pageSize,
            selectedCategoryId
          );
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data: unknown = await response.json();
          const sheetsArray = extractWorkoutSheets(data);
          const total = extractTotalCount(data);

          setSheets(sheetsArray);
          setTotalCount(total);
        } catch (err) {
          const errorMessage = getErrorMessage(err);
          console.error("Error fetching sheets:", errorMessage, err);
          setError("Failed to load workout sheets");
          setSheets([]);
          setTotalCount(0);
        } finally {
          setIsLoading(false);
        }
      }

      fetchSheets().catch((err) => {
        console.error("Unhandled error in fetchSheets:", err);
        setIsLoading(false);
      });
    },
    [selectedCategoryId, refreshTrigger, currentPage, pageSize]
  );

  /**
   * Sets the selected category filter.
   * Validates category ID before setting state.
   * @param categoryId - Category ID to filter by (null for all)
   */
  const setSelectedCategoryId = useCallback(
    (categoryId: number | null): void => {
      if (!isValidCategoryId(categoryId)) {
        console.error("Invalid category ID:", categoryId);
        return;
      }

      setSelectedCategoryIdState(categoryId);
    },
    []
  );

  /**
   * Sets the current page number.
   * Validates page number before setting state.
   * @param page - Page number to navigate to (1-indexed)
   */
  const setCurrentPage = useCallback((page: number): void => {
    if (!isValidPageNumber(page)) {
      console.error("Invalid page number:", page);
      return;
    }

    setCurrentPageState(page);
  }, []);

  /**
   * Triggers a refresh of workout sheets data.
   * Increments refresh trigger to force re-fetch.
   */
  const refreshSheets = useCallback((): void => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return {
    sheets,
    categories,
    selectedCategoryId,
    isLoading,
    error,
    currentPage,
    totalCount,
    pageSize,
    setSelectedCategoryId,
    setCurrentPage,
    refreshSheets,
  };
}
