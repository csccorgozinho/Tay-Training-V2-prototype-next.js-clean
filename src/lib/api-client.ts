"use strict";

/**
 * File: api-client.ts
 * Description: Unified API client utility providing type-safe HTTP request wrappers.
 * Centralized fetch() wrapper with automatic response parsing, error handling, and data extraction.
 * Responsibilities:
 *   - Provide type-safe HTTP methods (GET, POST, PUT, DELETE, PATCH)
 *   - Normalize API endpoint URLs (handle absolute, relative, with/without /api/ prefix)
 *   - Automatically parse JSON responses
 *   - Extract data from ApiResponse wrapper format
 *   - Convert HTTP errors to structured ApiError instances
 *   - Generate user-friendly error messages
 *   - Support request cancellation via AbortSignal
 *   - Support parallel API calls with apiGetMultiple
 *   - Add Content-Type: application/json header automatically
 * Called by:
 *   - use-dialog-handlers.ts (CRUD operations)
 *   - exercises.tsx (exercise CRUD)
 *   - methods.tsx (method CRUD)
 *   - WorkoutSheets.tsx (workout sheet operations)
 *   - All components making API calls
 * Notes:
 *   - All endpoints are prefixed with /api/ if not already present
 *   - Supports both wrapped { success, data } and raw response formats
 *   - ApiError includes statusCode and originalError for debugging
 *   - Body is only sent for POST, PUT, PATCH methods
 *   - Network errors get status code 0
 *   - Uses getApiErrorMessage for user-friendly error messages
 */

import type { ApiResponse } from "@/types";
import { getApiErrorMessage } from "./error-messages";

/**
 * Configuration options for API requests.
 */
export interface RequestConfig {
  /** HTTP method (defaults to GET) */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /** Request body (auto-serialized to JSON) */
  body?: Record<string, unknown>;
  /** Additional HTTP headers */
  headers?: Record<string, string>;
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
}

/**
 * Custom error class for API-related errors.
 * Includes HTTP status code and original error message for debugging.
 */
export class ApiError extends Error {
  /** HTTP status code (0 for network errors) */
  statusCode: number;
  /** Original error message from API or network layer */
  originalError?: string;

  /**
   * Creates a new ApiError instance.
   * @param message - User-friendly error message
   * @param statusCode - HTTP status code (0 for network errors)
   * @param originalError - Original technical error message
   */
  constructor(message: string, statusCode: number, originalError?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.originalError = originalError;

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
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
 * Validates if endpoint is a valid URL string.
 * @param endpoint - Endpoint to validate
 * @returns True if endpoint is valid
 */
function isValidEndpoint(endpoint: unknown): endpoint is string {
  return isValidString(endpoint);
}

/**
 * Validates if HTTP method is one of the allowed methods.
 * @param method - Method to validate
 * @returns True if method is valid
 */
function isValidHttpMethod(
  method: unknown
): method is "GET" | "POST" | "PUT" | "DELETE" | "PATCH" {
  return (
    typeof method === "string" &&
    (method === "GET" ||
      method === "POST" ||
      method === "PUT" ||
      method === "DELETE" ||
      method === "PATCH")
  );
}

/**
 * Checks if HTTP method should include a request body.
 * @param method - HTTP method to check
 * @returns True if method accepts body
 */
function methodAcceptsBody(method: string): boolean {
  return method === "POST" || method === "PUT" || method === "PATCH";
}

/**
 * Normalizes API endpoint to ensure proper /api/ prefix.
 * Handles various input formats (absolute URLs, relative paths, with/without /api/).
 * @param endpoint - Raw endpoint string
 * @returns Normalized endpoint URL
 */
function normalizeEndpoint(endpoint: string): string {
  if (!isValidString(endpoint)) {
    throw new Error("Endpoint must be a non-empty string");
  }

  const trimmed = endpoint.trim();

  // Absolute URLs (http:// or https://) are returned as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Already has /api/ prefix
  if (trimmed.startsWith("/api/")) {
    return trimmed;
  }

  // Starts with / but no /api/
  if (trimmed.startsWith("/")) {
    return `/api${trimmed}`;
  }

  // No leading slash
  return `/api/${trimmed}`;
}

/**
 * Safely parses JSON response body.
 * Returns empty object if parsing fails.
 * @param response - Fetch Response object
 * @returns Parsed JSON data or empty object
 */
async function safeParseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    console.warn("Failed to parse response JSON:", error);
    return {};
  }
}

/**
 * Extracts error information from API error response.
 * @param data - Error response data
 * @returns Error message string
 */
function extractErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "Unknown error";
  }

  const obj = data as Record<string, unknown>;

  if (isValidString(obj.error)) {
    return obj.error;
  }

  if (isValidString(obj.message)) {
    return obj.message;
  }

  return "Unknown error";
}

/**
 * Extracts data from API response wrapper or returns raw data.
 * Handles both { success, data } wrapper format and raw response format.
 * @param response - API response data
 * @returns Extracted data of type T
 */
function extractResponseData<T>(response: unknown): T {
  if (!response || typeof response !== "object") {
    return response as T;
  }

  const obj = response as Record<string, unknown>;

  // Check for wrapped response format: { success, data }
  if ("data" in obj && "success" in obj) {
    return obj.data as T;
  }

  // Return raw response for arrays or objects without 'success' field
  if (Array.isArray(response) || !("success" in obj)) {
    return response as T;
  }

  // Default: return as-is
  return response as T;
}

/**
 * Main API client function with consistent error handling and response extraction.
 * Performs HTTP request with automatic JSON parsing and error handling.
 *
 * @template T - Expected response data type
 * @param endpoint - API endpoint (auto-prefixed with /api/ if needed)
 * @param config - Request configuration options
 * @returns Promise resolving to extracted response data
 * @throws {ApiError} On HTTP errors or network failures
 *
 * @example
 * ```ts
 * const data = await apiCall<Exercise>('/exercises/123', { method: 'GET' });
 * ```
 */
export async function apiCall<T = unknown>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  // Validate and extract config
  if (!isValidEndpoint(endpoint)) {
    throw new Error("Invalid endpoint: must be a non-empty string");
  }

  const method = config.method || "GET";
  const { body, headers = {}, signal } = config;

  if (!isValidHttpMethod(method)) {
    throw new Error(`Invalid HTTP method: ${method}`);
  }

  // Normalize endpoint URL
  const url = normalizeEndpoint(endpoint);

  // Build request configuration
  const requestConfig: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  // Add body for methods that accept it
  if (body && methodAcceptsBody(method)) {
    try {
      requestConfig.body = JSON.stringify(body);
    } catch (error) {
      throw new Error(
        `Failed to serialize request body: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // Add abort signal if provided
  if (signal) {
    requestConfig.signal = signal;
  }

  try {
    // Perform fetch request
    const response = await fetch(url, requestConfig);

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await safeParseJson(response);
      const errorMessage = extractErrorMessage(errorData);
      const friendlyMessage = getApiErrorMessage(errorMessage);

      throw new ApiError(friendlyMessage, response.status, errorMessage);
    }

    // Parse and extract response data
    const data = await response.json();
    return extractResponseData<T>(data);
  } catch (error) {
    // Re-throw ApiError instances as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Convert other errors to ApiError
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error(`Failed to fetch ${url}:`, err);

    throw new ApiError(
      "Erro ao comunicar com o servidor. Verifique sua conexão",
      0,
      err.message
    );
  }
}

/**
 * Performs a GET request to fetch data.
 *
 * @template T - Expected response data type
 * @param endpoint - API endpoint
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Promise resolving to response data
 *
 * @example
 * ```ts
 * const exercises = await apiGet<Exercise[]>('/exercises');
 * ```
 */
export async function apiGet<T = unknown>(
  endpoint: string,
  signal?: AbortSignal
): Promise<T> {
  return apiCall<T>(endpoint, { method: "GET", signal });
}

/**
 * Performs a POST request to create data.
 *
 * @template T - Expected response data type
 * @param endpoint - API endpoint
 * @param body - Request body data
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Promise resolving to response data
 *
 * @example
 * ```ts
 * const newExercise = await apiPost<Exercise>('/exercises', {
 *   name: 'Push-ups',
 *   description: 'Upper body exercise'
 * });
 * ```
 */
export async function apiPost<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<T> {
  return apiCall<T>(endpoint, { method: "POST", body, signal });
}

/**
 * Performs a PUT request to update data.
 *
 * @template T - Expected response data type
 * @param endpoint - API endpoint
 * @param body - Request body data
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Promise resolving to response data
 *
 * @example
 * ```ts
 * const updated = await apiPut<Exercise>('/exercises/123', {
 *   name: 'Modified Push-ups'
 * });
 * ```
 */
export async function apiPut<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<T> {
  return apiCall<T>(endpoint, { method: "PUT", body, signal });
}

/**
 * Performs a DELETE request to remove data.
 *
 * @template T - Expected response data type
 * @param endpoint - API endpoint
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Promise resolving to response data
 *
 * @example
 * ```ts
 * await apiDelete('/exercises/123');
 * ```
 */
export async function apiDelete<T = unknown>(
  endpoint: string,
  signal?: AbortSignal
): Promise<T> {
  return apiCall<T>(endpoint, { method: "DELETE", signal });
}

/**
 * Performs a PATCH request for partial updates.
 *
 * @template T - Expected response data type
 * @param endpoint - API endpoint
 * @param body - Request body data (partial)
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Promise resolving to response data
 *
 * @example
 * ```ts
 * const updated = await apiPatch<Exercise>('/exercises/123', {
 *   description: 'Updated description only'
 * });
 * ```
 */
export async function apiPatch<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<T> {
  return apiCall<T>(endpoint, { method: "PATCH", body, signal });
}

/**
 * Fetches multiple endpoints in parallel.
 * Useful for loading multiple resources simultaneously.
 *
 * @template T - Expected response data type for each endpoint
 * @param endpoints - Array of API endpoints
 * @returns Promise resolving to array of response data
 * @throws {Error} If endpoints array is invalid
 *
 * @example
 * ```ts
 * const [exercises, methods] = await apiGetMultiple<Exercise | Method>([
 *   '/exercises',
 *   '/methods'
 * ]);
 * ```
 */
export async function apiGetMultiple<T = unknown>(
  endpoints: string[]
): Promise<T[]> {
  if (!Array.isArray(endpoints)) {
    throw new Error("endpoints must be an array");
  }

  if (endpoints.length === 0) {
    return [];
  }

  // Validate all endpoints
  const invalidEndpoints = endpoints.filter(
    (endpoint) => !isValidEndpoint(endpoint)
  );

  if (invalidEndpoints.length > 0) {
    throw new Error(
      `Invalid endpoints found: ${invalidEndpoints.join(", ")}`
    );
  }

  return Promise.all(endpoints.map((endpoint) => apiGet<T>(endpoint)));
}

