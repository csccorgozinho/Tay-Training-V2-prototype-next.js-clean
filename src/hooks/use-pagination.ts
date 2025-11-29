"use strict";

/**
 * File: use-pagination.ts
 * Description: Reusable React hook for client-side pagination of array data.
 * Provides pagination state management and navigation functions for lists of items.
 * Responsibilities:
 *   - Manage current page number state
 *   - Calculate total number of pages based on items and items per page
 *   - Slice items array to return only items for current page
 *   - Provide navigation functions (next, previous, go to specific page)
 *   - Reset to page 1 when search/filter dependency changes
 *   - Prevent navigation beyond valid page boundaries
 * Called by:
 *   - exercises.tsx (paginate exercises list)
 *   - methods.tsx (paginate methods list)
 *   - WorkoutSheets.tsx (paginate workout sheets list)
 *   - Any component needing client-side pagination
 * Notes:
 *   - Generic type T allows pagination of any array type
 *   - Page numbers are 1-indexed (first page is 1, not 0)
 *   - Automatically resets to page 1 when searchDependency changes
 *   - Empty items array results in 0 total pages
 *   - itemsPerPage must be positive, defaults to 1 if invalid
 *   - Safe guards prevent navigation to invalid pages
 */

import { useCallback, useEffect, useState } from "react";

/**
 * Props for the usePagination hook.
 */
interface UsePaginationProps<T> {
  /** Array of items to paginate */
  items: T[];
  /** Number of items to display per page (must be positive) */
  itemsPerPage: number;
  /** Optional dependency that triggers page reset when changed (e.g., search query) */
  searchDependency?: unknown;
}

/**
 * Return type for the usePagination hook.
 */
interface UsePaginationResult<T> {
  /** Current active page number (1-indexed) */
  currentPage: number;
  /** Total number of pages based on items and itemsPerPage */
  totalPages: number;
  /** Items for the current page only */
  currentPageItems: T[];
  /** Navigate to next page (no-op if on last page) */
  goToNextPage: () => void;
  /** Navigate to previous page (no-op if on first page) */
  goToPreviousPage: () => void;
  /** Set specific page number (validates bounds) */
  setCurrentPage: (page: number) => void;
}

/** First page number (1-indexed) */
const FIRST_PAGE = 1;

/** Minimum valid items per page */
const MIN_ITEMS_PER_PAGE = 1;

/**
 * Validates if items array is valid.
 * @param items - Array to validate
 * @returns True if items is a valid array
 */
function isValidItemsArray<T>(items: unknown): items is T[] {
  return Array.isArray(items);
}

/**
 * Validates and normalizes items per page value.
 * @param itemsPerPage - Items per page to validate
 * @returns Valid positive number (minimum 1)
 */
function normalizeItemsPerPage(itemsPerPage: number): number {
  if (
    typeof itemsPerPage !== "number" ||
    isNaN(itemsPerPage) ||
    !Number.isFinite(itemsPerPage) ||
    itemsPerPage < MIN_ITEMS_PER_PAGE
  ) {
    console.warn(
      "Invalid itemsPerPage value:",
      itemsPerPage,
      "- using default:",
      MIN_ITEMS_PER_PAGE
    );
    return MIN_ITEMS_PER_PAGE;
  }

  return Math.floor(itemsPerPage);
}

/**
 * Calculates total number of pages.
 * @param totalItems - Total number of items
 * @param itemsPerPage - Items per page (must be positive)
 * @returns Total pages (minimum 0)
 */
function calculateTotalPages(totalItems: number, itemsPerPage: number): number {
  if (totalItems <= 0 || itemsPerPage <= 0) {
    return 0;
  }

  return Math.ceil(totalItems / itemsPerPage);
}

/**
 * Validates if a page number is within valid bounds.
 * @param page - Page number to validate
 * @param totalPages - Total number of pages
 * @returns True if page is valid
 */
function isValidPageNumber(page: number, totalPages: number): boolean {
  return (
    typeof page === "number" &&
    !isNaN(page) &&
    Number.isFinite(page) &&
    Number.isInteger(page) &&
    page >= FIRST_PAGE &&
    page <= totalPages
  );
}

/**
 * Clamps a page number to valid bounds.
 * @param page - Page number to clamp
 * @param totalPages - Total number of pages
 * @returns Page number within valid range
 */
function clampPageNumber(page: number, totalPages: number): number {
  if (totalPages <= 0) {
    return FIRST_PAGE;
  }

  if (!isValidPageNumber(page, totalPages)) {
    return FIRST_PAGE;
  }

  return Math.max(FIRST_PAGE, Math.min(page, totalPages));
}

/**
 * Calculates start index for current page slice.
 * @param page - Current page number (1-indexed)
 * @param itemsPerPage - Items per page
 * @returns Zero-based start index for array slicing
 */
function calculateStartIndex(page: number, itemsPerPage: number): number {
  return (page - 1) * itemsPerPage;
}

/**
 * Custom React hook for client-side pagination.
 * Manages pagination state and provides navigation functions.
 *
 * @template T - Type of items being paginated
 * @param props - Configuration object with items, itemsPerPage, and optional searchDependency
 * @returns Pagination state and navigation functions
 *
 * @example
 * ```tsx
 * const {
 *   currentPage,
 *   totalPages,
 *   currentPageItems,
 *   goToNextPage,
 *   goToPreviousPage
 * } = usePagination({
 *   items: exercises,
 *   itemsPerPage: 12,
 *   searchDependency: searchQuery
 * });
 * ```
 */
export function usePagination<T>({
  items,
  itemsPerPage,
  searchDependency,
}: UsePaginationProps<T>): UsePaginationResult<T> {
  // Validate and normalize inputs
  const safeItems = isValidItemsArray<T>(items) ? items : [];
  const safeItemsPerPage = normalizeItemsPerPage(itemsPerPage);

  const [currentPage, setCurrentPageState] = useState<number>(FIRST_PAGE);

  /**
   * Resets pagination to first page when search dependency changes.
   * Typically triggered when user searches or filters items.
   */
  useEffect(
    function resetPageOnSearchChange(): void {
      setCurrentPageState(FIRST_PAGE);
    },
    [searchDependency]
  );

  // Calculate pagination values
  const totalPages = calculateTotalPages(safeItems.length, safeItemsPerPage);
  const startIndex = calculateStartIndex(currentPage, safeItemsPerPage);
  const endIndex = startIndex + safeItemsPerPage;
  const currentPageItems = safeItems.slice(startIndex, endIndex);

  /**
   * Navigates to the next page.
   * Does nothing if already on the last page.
   */
  const goToNextPage = useCallback((): void => {
    setCurrentPageState((prevPage) => {
      const nextPage = prevPage + 1;
      return clampPageNumber(nextPage, totalPages);
    });
  }, [totalPages]);

  /**
   * Navigates to the previous page.
   * Does nothing if already on the first page.
   */
  const goToPreviousPage = useCallback((): void => {
    setCurrentPageState((prevPage) => {
      const previousPage = prevPage - 1;
      return clampPageNumber(previousPage, totalPages);
    });
  }, [totalPages]);

  /**
   * Sets a specific page number.
   * Clamps to valid range if page number is out of bounds.
   *
   * @param page - Target page number (1-indexed)
   */
  const setCurrentPage = useCallback(
    (page: number): void => {
      if (typeof page !== "number" || isNaN(page)) {
        console.error("Invalid page number provided:", page);
        return;
      }

      const clampedPage = clampPageNumber(page, totalPages);
      setCurrentPageState(clampedPage);
    },
    [totalPages]
  );

  return {
    currentPage,
    totalPages,
    currentPageItems,
    goToNextPage,
    goToPreviousPage,
    setCurrentPage,
  };
}
