/**
 * Standardized API Response Utility
 * 
 * Provides consistent response formatting across all API endpoints.
 * All endpoints should use this utility for consistency, maintainability, and type safety.
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  meta?: {
    count?: number;
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

/**
 * Creates a successful API response
 * @param data - The response data
 * @param meta - Optional metadata (count, pagination, etc.)
 */
export function apiSuccess<T>(
  data: T,
  meta?: ApiResponse<T>['meta']
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

/**
 * Creates an error API response
 * @param error - Error message
 */
export function apiError(error: string): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error,
  };
}
