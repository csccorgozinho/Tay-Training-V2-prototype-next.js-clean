"use strict";

/**
 * File: db/exercises/index.ts
 * Description: API endpoint for exercise collection operations.
 *              Handles listing all exercises with pagination and creating new exercises.
 *              Exercises represent individual workout movements used in training programs.
 * 
 * Responsibilities:
 *   - Authenticate all requests using session validation
 *   - GET: Fetch paginated list of exercises with metadata
 *   - POST: Create new exercise with validation
 *   - Validate pagination parameters (page, pageSize)
 *   - Enforce pagination limits (max 100 items per page)
 *   - Return total count for client-side pagination UI
 *   - Validate required fields on creation (description)
 * 
 * Called by:
 *   - Exercises page component (src/pages/Exercises.tsx)
 *   - Exercise autocomplete component (src/components/dialogs/ExerciseAutocomplete.tsx)
 *   - Exercise dialog component (src/components/dialogs/ExerciseDialog.tsx)
 *   - Workout sheet dialog (src/components/dialogs/WorkoutSheetDialog.tsx)
 *   - Home page for exercise count (src/pages/Home.tsx)
 * 
 * Notes:
 *   - Default pagination: page=1, pageSize=10
 *   - Maximum pageSize is capped at 100 to prevent performance issues
 *   - Exercises ordered by creation date (newest first)
 *   - Description is required, name and videoUrl are optional
 *   - hasMethod defaults to true if not specified
 *   - Returns 201 Created for successful POST operations
 */

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/api-middleware";
import type { Exercise } from "@prisma/client";

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
 * Validates that description field is present and non-empty
 * @param description - Description value from request body
 * @returns true if valid, false otherwise
 */
function isValidDescription(description: unknown): description is string {
  return typeof description === "string" && description.trim().length > 0;
}

/**
 * Safely extracts optional string value from request body
 * @param value - Value from request body
 * @returns string or null
 */
function parseOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Parses hasMethod flag with default value
 * @param value - Value from request body
 * @returns boolean value (defaults to true)
 */
function parseHasMethodFlag(value: unknown): boolean {
  return typeof value === "boolean" ? value : true;
}

/**
 * Exercise collection API handler
 * Manages listing and creation of exercises
 * 
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns Promise that resolves when response is sent
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Exercise | Exercise[]>>
): Promise<void> {
  // Require authentication - requireAuth sends 401 response if not authenticated
  const session = await requireAuth(req, res);
  if (!session) {
    return;
  }

  try {
    // GET - Fetch paginated list of exercises
    if (req.method === "GET") {
      // Parse and validate pagination parameters
      const pagination = parsePaginationParams(req.query.page, req.query.pageSize);

      if (!pagination) {
        res.status(400).json(apiError("Invalid pagination parameters"));
        return;
      }

      // Get total count for pagination metadata
      const totalCount = await prisma.exercise.count();

      // Fetch paginated exercises, ordered by newest first
      const exercises = await prisma.exercise.findMany({
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.pageSize,
      });

      // Return exercises with pagination metadata
      res.status(200).json(
        apiSuccess(exercises, {
          count: exercises.length,
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: totalCount,
        })
      );
      return;
    }

    // POST - Create new exercise
    if (req.method === "POST") {
      const { name, description, videoUrl, hasMethod } = req.body ?? {};

      // Validate required description field
      if (!isValidDescription(description)) {
        res.status(400).json(apiError("Description is required and cannot be empty"));
        return;
      }

      // Create exercise with validated data
      const createdExercise = await prisma.exercise.create({
        data: {
          name: parseOptionalString(name),
          description: description.trim(),
          videoUrl: parseOptionalString(videoUrl),
          hasMethod: parseHasMethodFlag(hasMethod),
        },
      });

      res.status(201).json(apiSuccess(createdExercise));
      return;
    }

    // Method not allowed
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method ?? "UNKNOWN"} Not Allowed`);
    return;

  } catch (err) {
    // Log error for debugging but don't expose details to client
    console.error("/api/db/exercises error", err);

    res.status(500).json(apiError("Internal server error"));
    return;
  }
}