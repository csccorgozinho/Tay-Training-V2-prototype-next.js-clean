"use strict";

/**
 * File: db/methods/index.ts
 * Description: API endpoint for method collection operations.
 *              Handles listing all methods with pagination and creating new training methods.
 *              Methods represent exercise techniques or training methodologies used in workouts.
 * 
 * Responsibilities:
 *   - Authenticate all requests using session validation
 *   - GET: Fetch paginated list of methods with metadata
 *   - POST: Create new method with validation
 *   - Validate pagination parameters (page, pageSize)
 *   - Enforce pagination limits (max 100 items per page)
 *   - Return total count for client-side pagination UI
 *   - Validate required fields on creation (name, description)
 * 
 * Called by:
 *   - Methods page component (src/pages/Methods.tsx)
 *   - Method dialog component (src/components/dialogs/MethodDialog.tsx)
 *   - Workout configuration components
 *   - API client utilities (src/lib/api-client.ts)
 * 
 * Notes:
 *   - Default pagination: page=1, pageSize=10
 *   - Maximum pageSize is capped at 100 to prevent performance issues
 *   - Methods ordered by creation date (newest first)
 *   - Both name and description are required and trimmed
 *   - Returns 201 Created for successful POST operations
 */

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/api-middleware";
import type { Method } from "@prisma/client";

// Pagination configuration constants
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const MIN_PAGE_SIZE = 1;

/**
 * Parses and validates pagination parameters from query string
 * @param page - Page number from query string
 * @param pageSize - Page size from query string
 * @returns Validated pagination parameters or null if invalid
 */
function parsePaginationParams(
  page: string | string[] | undefined,
  pageSize: string | string[] | undefined
): { page: number; pageSize: number; skip: number } | null {
  // Parse page number with fallback to default
  const pageStr = typeof page === "string" ? page : undefined;
  const parsedPage = pageStr ? parseInt(pageStr, 10) : DEFAULT_PAGE;

  // Parse page size with fallback to default
  const pageSizeStr = typeof pageSize === "string" ? pageSize : undefined;
  const parsedPageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : DEFAULT_PAGE_SIZE;

  // Validate that both values are valid numbers
  if (isNaN(parsedPage) || isNaN(parsedPageSize)) {
    return null;
  }

  // Ensure page is at least 1
  const validPage = Math.max(DEFAULT_PAGE, parsedPage);

  // Clamp pageSize between min and max allowed values
  const validPageSize = Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, parsedPageSize));

  // Calculate skip for database query
  const skip = (validPage - 1) * validPageSize;

  return {
    page: validPage,
    pageSize: validPageSize,
    skip,
  };
}

/**
 * Validates that a field is a non-empty string
 * @param value - Value to validate
 * @returns true if valid non-empty string, false otherwise
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates create request body contains required fields
 * @param body - Request body object
 * @returns Validation result with success flag and optional error message
 */
function validateCreateFields(body: unknown): {
  isValid: boolean;
  error?: string;
  name?: string;
  description?: string;
} {
  if (!body || typeof body !== "object") {
    return { isValid: false, error: "Request body is required" };
  }

  const { name, description } = body as Record<string, unknown>;

  if (!isNonEmptyString(name)) {
    return { isValid: false, error: "Name is required and cannot be empty" };
  }

  if (!isNonEmptyString(description)) {
    return { isValid: false, error: "Description is required and cannot be empty" };
  }

  return {
    isValid: true,
    name: name.trim(),
    description: description.trim(),
  };
}

/**
 * Method collection API handler
 * Manages listing and creation of training methods
 * 
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns Promise that resolves when response is sent
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Method | Method[]>>
): Promise<void> {
  // Require authentication - requireAuth sends 401 response if not authenticated
  const session = await requireAuth(req, res);
  if (!session) {
    return;
  }

  try {
    // GET - Fetch paginated list of methods
    if (req.method === "GET") {
      // Parse and validate pagination parameters
      const pagination = parsePaginationParams(req.query.page, req.query.pageSize);

      if (!pagination) {
        res.status(400).json(apiError("Invalid pagination parameters"));
        return;
      }

      // Get total count for pagination metadata
      const totalCount = await prisma.method.count();

      // Fetch paginated methods, ordered by newest first
      const methods = await prisma.method.findMany({
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.pageSize,
      });

      // Return methods with pagination metadata
      res.status(200).json(
        apiSuccess(methods, {
          count: methods.length,
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: totalCount,
        })
      );
      return;
    }

    // POST - Create new method
    if (req.method === "POST") {
      // Validate request body
      const validation = validateCreateFields(req.body);

      if (!validation.isValid) {
        res.status(400).json(apiError(validation.error ?? "Invalid request"));
        return;
      }

      // Create method with validated data
      const createdMethod = await prisma.method.create({
        data: {
          name: validation.name!,
          description: validation.description!,
        },
      });

      res.status(201).json(apiSuccess(createdMethod));
      return;
    }

    // Method not allowed
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method ?? "UNKNOWN"} Not Allowed`);
    return;

  } catch (err) {
    // Log error for debugging but don't expose details to client
    console.error("/api/db/methods error", err);

    res.status(500).json(apiError("Internal server error"));
    return;
  }
}
