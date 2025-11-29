"use strict";

/**
 * File: api-response.ts
 * Description: Standardized API response utility providing consistent response formatting
 * across all API endpoints. Enforces uniform response structure with success/error states.
 * Responsibilities:
 *   - Define ApiResponse interface with success/error states and optional metadata
 *   - Provide apiSuccess() factory function for successful responses
 *   - Provide apiError() factory function for error responses
 *   - Support pagination metadata (count, page, pageSize, total)
 *   - Ensure type-safe response creation with generic type parameter
 *   - Validate input parameters before creating responses
 * Called by:
 *   - api-middleware.ts (error responses for auth, rate limit, method validation)
 *   - api-client.ts (response parsing and extraction)
 *   - pages/api/exercises/*.ts (all CRUD operations)
 *   - pages/api/methods/*.ts (all CRUD operations)
 *   - pages/api/training-sheets/*.ts (all CRUD operations)
 *   - pages/api/exercise-groups/*.ts (all CRUD operations)
 *   - pages/api/categories/*.ts (all CRUD operations)
 *   - pages/api/user/profile.ts (user profile operations)
 *   - All API route handlers in the application
 * Notes:
 *   - All API responses should use this format for consistency
 *   - Success responses always have success=true and data field
 *   - Error responses always have success=false, data=null, and error message
 *   - Meta field is optional and typically used for paginated responses
 *   - The data field can be any type (specified via generic parameter)
 *   - Error messages should be user-friendly (not technical stack traces)
 */

/**
 * Metadata for paginated API responses.
 * All fields are optional to support partial metadata.
 */
export interface ApiResponseMeta {
  /** Total number of items in current response */
  count?: number;
  /** Current page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Total number of items across all pages */
  total?: number;
}

/**
 * Standardized API response structure.
 * All API endpoints should return this format.
 *
 * @template T - Type of the data payload
 */
export interface ApiResponse<T> {
  /** Indicates if the request was successful */
  success: boolean;
  /** Response payload (null for error responses) */
  data: T;
  /** Error message (only present when success=false) */
  error?: string;
  /** Optional metadata (pagination, counts, etc.) */
  meta?: ApiResponseMeta;
}

/**
 * Validates if a value is a non-empty string.
 * @param value - Value to validate
 * @returns True if value is a valid non-empty string
 */
function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates if metadata object has valid structure.
 * Ensures all numeric fields are positive numbers.
 * @param meta - Metadata to validate
 * @returns True if metadata is valid
 */
function isValidMeta(meta: unknown): meta is ApiResponseMeta {
  if (!meta || typeof meta !== "object") {
    return false;
  }

  const obj = meta as Record<string, unknown>;

  // Check count field if present
  if (
    "count" in obj &&
    obj.count !== undefined &&
    (typeof obj.count !== "number" || obj.count < 0)
  ) {
    return false;
  }

  // Check page field if present
  if (
    "page" in obj &&
    obj.page !== undefined &&
    (typeof obj.page !== "number" || obj.page < 1)
  ) {
    return false;
  }

  // Check pageSize field if present
  if (
    "pageSize" in obj &&
    obj.pageSize !== undefined &&
    (typeof obj.pageSize !== "number" || obj.pageSize < 1)
  ) {
    return false;
  }

  // Check total field if present
  if (
    "total" in obj &&
    obj.total !== undefined &&
    (typeof obj.total !== "number" || obj.total < 0)
  ) {
    return false;
  }

  return true;
}

/**
 * Sanitizes metadata by removing invalid fields.
 * Returns undefined if meta is completely invalid.
 * @param meta - Metadata to sanitize
 * @returns Sanitized metadata or undefined
 */
function sanitizeMeta(meta: unknown): ApiResponseMeta | undefined {
  if (!meta || typeof meta !== "object") {
    return undefined;
  }

  if (!isValidMeta(meta)) {
    console.warn("Invalid metadata detected, filtering invalid fields:", meta);
    const obj = meta as Record<string, unknown>;
    const sanitized: ApiResponseMeta = {};

    // Only include valid numeric fields
    if (typeof obj.count === "number" && obj.count >= 0) {
      sanitized.count = obj.count;
    }
    if (typeof obj.page === "number" && obj.page >= 1) {
      sanitized.page = obj.page;
    }
    if (typeof obj.pageSize === "number" && obj.pageSize >= 1) {
      sanitized.pageSize = obj.pageSize;
    }
    if (typeof obj.total === "number" && obj.total >= 0) {
      sanitized.total = obj.total;
    }

    // Return undefined if no valid fields found
    if (Object.keys(sanitized).length === 0) {
      return undefined;
    }

    return sanitized;
  }

  return meta as ApiResponseMeta;
}

/**
 * Creates a successful API response with optional metadata.
 *
 * @template T - Type of the response data
 * @param data - The response payload
 * @param meta - Optional metadata (pagination, counts, etc.)
 * @returns Standardized success response
 *
 * @example
 * ```ts
 * // Simple success response
 * return res.json(apiSuccess({ id: 1, name: 'Exercise' }));
 * ```
 *
 * @example
 * ```ts
 * // Success response with pagination metadata
 * return res.json(apiSuccess(
 *   exercises,
 *   { count: 10, page: 1, pageSize: 10, total: 100 }
 * ));
 * ```
 */
export function apiSuccess<T>(
  data: T,
  meta?: ApiResponseMeta
): ApiResponse<T> {
  // Note: data can be any type including null/undefined, so we don't validate it
  // The caller is responsible for providing appropriate data

  // Sanitize metadata if provided
  const sanitizedMeta = meta ? sanitizeMeta(meta) : undefined;

  // Build response object
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  // Add meta only if it exists and is valid
  if (sanitizedMeta) {
    response.meta = sanitizedMeta;
  }

  return response;
}

/**
 * Creates an error API response with error message.
 * Always returns data=null for error responses.
 *
 * @param error - User-friendly error message
 * @returns Standardized error response
 *
 * @example
 * ```ts
 * // Authentication error
 * return res.status(401).json(apiError('Unauthorized. Please login first.'));
 * ```
 *
 * @example
 * ```ts
 * // Validation error
 * return res.status(400).json(apiError('Invalid input: name is required'));
 * ```
 */
export function apiError(error: string): ApiResponse<null> {
  // Validate error message
  if (!isValidString(error)) {
    console.warn("Invalid error message provided:", error);
    // Provide default error message for invalid input
    return {
      success: false,
      data: null,
      error: "An error occurred",
    };
  }

  return {
    success: false,
    data: null,
    error: error.trim(),
  };
}
