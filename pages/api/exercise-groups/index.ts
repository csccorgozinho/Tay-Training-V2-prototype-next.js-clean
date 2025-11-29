"use strict";

/**
 * File: exercise-groups/index.ts
 * Description: API endpoint for exercise group collection operations.
 *              Handles listing all exercise groups with pagination and filtering,
 *              and creating new groups with nested exercise methods and configurations.
 *              Exercise groups organize exercises into logical sets within workout sessions.
 * 
 * Responsibilities:
 *   - Authenticate POST requests (GET is public for viewing)
 *   - GET: Fetch paginated list of exercise groups with optional category filter
 *   - POST: Create new exercise group with nested methods and configurations
 *   - Validate pagination parameters (page, pageSize)
 *   - Validate category filter parameter
 *   - Enforce pagination limits (max 100 items per page)
 *   - Return total count for client-side pagination UI
 *   - Support "all" as special categoryId to return all groups
 *   - Include full relations (exerciseMethods, configurations, exercise, method, category)
 *   - Create exercise methods with order based on array index
 *   - Create exercise configurations for each method
 * 
 * Called by:
 *   - Training sheet components (src/components/dialogs/TrainingSheetDialog.tsx)
 *   - Workout sheet dialog for managing exercise groups
 *   - Exercise group list components
 *   - API client utilities (src/lib/api-client.ts)
 * 
 * Notes:
 *   - GET requests do not require authentication (public viewing)
 *   - POST requires authentication
 *   - Default pagination: page=1, pageSize=10
 *   - Maximum pageSize is capped at 100 to prevent performance issues
 *   - Groups ordered by creation date (newest first) within category
 *   - categoryId filter: undefined = all groups, "all" = all groups, number = specific category
 *   - Exercise methods are ordered by array index (order starts at 1)
 *   - Default rest period is "60s" if not provided
 *   - Default observations is empty string if not provided
 *   - Returns 201 Created for successful POST operations
 *   - POST returns full group with all nested relations
 */

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-middleware";
import {
  createExerciseGroup,
  getExerciseGroupFull,
  createExerciseMethod,
  createExerciseConfiguration,
} from "@/lib/training-sheet-service";
import { ZodError, z } from "zod";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";

// Pagination configuration constants
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const MIN_PAGE_SIZE = 1;

// Default values for exercise method creation
const DEFAULT_REST_PERIOD = "60s";
const DEFAULT_OBSERVATIONS = "";

/**
 * Zod schema for validating exercise group creation
 * Supports nested creation of exercise methods and configurations
 */
const CreateExerciseGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.number().int().positive("Category ID must be positive"),
  publicName: z.string().optional(),
  exerciseMethods: z
    .array(
      z.object({
        rest: z.string().optional(),
        observations: z.string().optional(),
        exerciseConfigurations: z.array(
          z.object({
            exerciseId: z.number().int().positive("Exercise ID must be positive"),
            methodId: z.number().int().positive("Method ID must be positive").optional(),
            series: z.string().min(1, "Series is required"),
            reps: z.string().min(1, "Reps is required"),
          })
        ),
      })
    )
    .optional(),
});

/**
 * Type representing validated creation data
 */
type CreateExerciseGroupData = z.infer<typeof CreateExerciseGroupSchema>;

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
 * Parses category ID filter from query parameters
 * @param categoryId - Category ID from query string
 * @returns Validated category ID, null for "all", or error string
 */
function parseCategoryIdFilter(
  categoryId: string | string[] | undefined
): number | null | { error: string } {
  // No filter provided - return all groups
  if (!categoryId) {
    return null;
  }

  // Special "all" value - return all groups
  if (categoryId === "all") {
    return null;
  }

  // Must be a string to parse
  if (typeof categoryId !== "string") {
    return { error: "Invalid category ID format" };
  }

  const parsedCategoryId = parseInt(categoryId, 10);

  // Validate it's a valid positive integer
  if (isNaN(parsedCategoryId) || parsedCategoryId <= 0) {
    return { error: "Invalid category ID" };
  }

  return parsedCategoryId;
}

/**
 * Creates exercise methods and their configurations for a group
 * @param groupId - ID of the parent exercise group
 * @param exerciseMethods - Array of method data with configurations
 * @returns Promise that resolves when all methods and configurations are created
 */
async function createExerciseMethodsWithConfigurations(
  groupId: number,
  exerciseMethods: NonNullable<CreateExerciseGroupData["exerciseMethods"]>
): Promise<void> {
  for (let methodIdx = 0; methodIdx < exerciseMethods.length; methodIdx++) {
    const methodData = exerciseMethods[methodIdx];

    // Create exercise method with order based on array index
    const method = await createExerciseMethod({
      rest: methodData.rest ?? DEFAULT_REST_PERIOD,
      observations: methodData.observations ?? DEFAULT_OBSERVATIONS,
      order: methodIdx + 1,
      exerciseGroupId: groupId,
    });

    // Create all configurations for this method
    const configurations = methodData.exerciseConfigurations;
    for (const config of configurations) {
      await createExerciseConfiguration({
        series: config.series,
        reps: config.reps,
        exerciseMethodId: method.id,
        exerciseId: config.exerciseId,
        methodId: config.methodId,
      });
    }
  }
}

/**
 * Exercise group collection API handler
 * Manages listing and creation of exercise groups
 * 
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns Promise that resolves when response is sent
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<unknown>>
): Promise<void> {
  // Require authentication for POST (GET is public)
  if (req.method === "POST") {
    const session = await requireAuth(req, res);
    if (!session) {
      return;
    }
  }

  try {
    // GET - Fetch paginated list of exercise groups
    if (req.method === "GET") {
      // Parse and validate pagination parameters
      const pagination = parsePaginationParams(req.query.page, req.query.pageSize);

      if (!pagination) {
        res.status(400).json(apiError("Invalid pagination parameters"));
        return;
      }

      // Parse and validate category filter
      const categoryFilter = parseCategoryIdFilter(req.query.categoryId);

      if (categoryFilter && typeof categoryFilter === "object" && "error" in categoryFilter) {
        res.status(400).json(apiError(categoryFilter.error));
        return;
      }

      // At this point, categoryFilter is either number or null (error case already handled)
      const validCategoryFilter = categoryFilter as number | null;

      // Build where clause for filtering
      const whereClause = validCategoryFilter !== null ? { categoryId: validCategoryFilter } : undefined;

      // Get total count for pagination metadata
      const totalCount = await prisma.exerciseGroup.count({ where: whereClause });

      // Fetch paginated groups with full relations
      const groups = await prisma.exerciseGroup.findMany({
        where: whereClause,
        include: {
          exerciseMethods: {
            include: {
              exerciseConfigurations: {
                include: {
                  exercise: true,
                  method: true,
                },
              },
            },
            orderBy: { order: "asc" },
          },
          category: true,
        },
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.pageSize,
      });

      // Return groups with pagination metadata
      res.status(200).json(
        apiSuccess(groups, {
          count: groups.length,
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: totalCount,
        })
      );
      return;
    }

    // POST - Create new exercise group with nested methods and configurations
    if (req.method === "POST") {
      // Validate request body using Zod schema
      const validatedData: CreateExerciseGroupData =
        CreateExerciseGroupSchema.parse(req.body);

      // Create the base exercise group
      const createdGroup = await createExerciseGroup({
        name: validatedData.name,
        categoryId: validatedData.categoryId,
        publicName: validatedData.publicName,
      });

      // Create nested exercise methods and configurations if provided
      if (validatedData.exerciseMethods && validatedData.exerciseMethods.length > 0) {
        await createExerciseMethodsWithConfigurations(
          createdGroup.id,
          validatedData.exerciseMethods
        );
      }

      // Fetch and return the full group with all relations
      const fullGroup = await getExerciseGroupFull(createdGroup.id);

      res.status(201).json(apiSuccess(fullGroup));
      return;
    }

    // Method not allowed
    res.status(405).json(apiError("Method not allowed"));
    return;

  } catch (error) {
    // Log error for debugging but don't expose details to client
    console.error("Exercise group API error:", error);

    // Handle Zod validation errors with detailed feedback
    if (error instanceof ZodError) {
      res.status(400).json(apiError("Validation error"));
      return;
    }

    // Generic error response
    res.status(500).json(apiError("Internal server error"));
    return;
  }
}
