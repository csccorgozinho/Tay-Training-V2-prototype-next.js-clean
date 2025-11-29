"use strict";

/**
 * File: exercise-configurations/index.ts
 * Description: API endpoint for exercise configuration collection operations.
 *              Handles listing all exercise configurations with optional filtering
 *              and creating new configurations. Exercise configurations define the
 *              series, reps, and methods for exercises within workout groups.
 * 
 * Responsibilities:
 *   - Authenticate POST requests (GET is public for viewing)
 *   - POST: Create new exercise configuration with full validation
 *   - GET: List all exercise configurations with optional exerciseMethodId filter
 *   - Validate request body using Zod schema for creation
 *   - Return full configuration with relations after creation
 *   - Support filtering by exerciseMethodId query parameter
 *   - Include related data (exercise, method, exerciseMethod, exerciseGroup)
 * 
 * Called by:
 *   - Training sheet components (src/components/dialogs/TrainingSheetDialog.tsx)
 *   - Workout sheet dialog for managing exercise configurations
 *   - Exercise configuration management components
 *   - API client utilities (src/lib/api-client.ts)
 * 
 * Notes:
 *   - GET requests do not require authentication (public viewing)
 *   - POST requires authentication
 *   - series and reps must be non-empty strings
 *   - All ID fields (exerciseMethodId, exerciseId, methodId) must be positive integers
 *   - POST returns 201 Created with full configuration including relations
 *   - GET returns all configurations or filtered by exerciseMethodId
 *   - Prisma client is dynamically imported in GET handler
 *   - UpdateExerciseConfigurationSchema defined but currently unused
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "@/lib/api-middleware";
import {
  createExerciseConfiguration,
  getExerciseConfigurationFull,
} from "@/lib/training-sheet-service";
import { ZodError, z } from "zod";

/**
 * Zod schema for validating exercise configuration creation
 * All fields are required for new configurations
 */
const CreateExerciseConfigurationSchema = z.object({
  series: z.string().min(1, "Series is required"),
  reps: z.string().min(1, "Reps is required"),
  exerciseMethodId: z.number().int().positive("Exercise method ID must be positive"),
  exerciseId: z.number().int().positive("Exercise ID must be positive"),
  methodId: z.number().int().positive("Method ID must be positive"),
});

/**
 * Type representing validated creation data
 */
type CreateExerciseConfigurationData = z.infer<typeof CreateExerciseConfigurationSchema>;

/**
 * Standard API response structure
 */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

/**
 * Parses exerciseMethodId filter from query parameters
 * @param exerciseMethodId - Filter value from query string
 * @returns Validated exerciseMethodId as number, or null if not provided/invalid
 */
function parseExerciseMethodIdFilter(
  exerciseMethodId: string | string[] | undefined
): number | null {
  if (!exerciseMethodId || typeof exerciseMethodId !== "string") {
    return null;
  }

  const parsedId = parseInt(exerciseMethodId, 10);

  // Return null if invalid, allowing handler to decide behavior
  if (isNaN(parsedId) || parsedId <= 0) {
    return null;
  }

  return parsedId;
}

/**
 * Fetches exercise configurations with full relations
 * @param filterByMethodId - Optional exerciseMethodId to filter by
 * @returns Promise resolving to array of configurations
 */
async function fetchExerciseConfigurations(
  filterByMethodId: number | null
): Promise<unknown[]> {
  const prisma = (await import("@/lib/prisma")).default;

  // Build where clause based on filter
  const whereClause = filterByMethodId
    ? { exerciseMethodId: filterByMethodId }
    : {};

  const configurations = await prisma.exerciseConfiguration.findMany({
    where: whereClause,
    include: {
      exercise: true,
      method: true,
      exerciseMethod: {
        include: {
          exerciseGroup: true,
        },
      },
    },
  });

  return configurations;
}

/**
 * Exercise configuration collection API handler
 * Manages listing and creation of exercise configurations
 * 
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns Promise that resolves when response is sent
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
): Promise<void> {
  // Require authentication for POST (GET is public)
  if (req.method === "POST") {
    const session = await requireAuth(req, res);
    if (!session) {
      return;
    }
  }

  try {
    // POST - Create new exercise configuration
    if (req.method === "POST") {
      // Validate request body using Zod schema
      const validatedData: CreateExerciseConfigurationData =
        CreateExerciseConfigurationSchema.parse(req.body);

      // Create configuration with validated data
      // Type assertion safe because Zod validation ensures all required fields are present
      const createdConfig = await createExerciseConfiguration(
        validatedData as Required<CreateExerciseConfigurationData>
      );

      // Fetch and return the full configuration with relations
      const fullConfig = await getExerciseConfigurationFull(createdConfig.id);

      res.status(201).json({
        success: true,
        data: fullConfig,
      });
      return;
    }

    // GET - List exercise configurations with optional filtering
    if (req.method === "GET") {
      // Parse optional exerciseMethodId filter
      const methodIdFilter = parseExerciseMethodIdFilter(req.query.exerciseMethodId);

      // Fetch configurations (filtered or all)
      const configurations = await fetchExerciseConfigurations(methodIdFilter);

      res.status(200).json({
        success: true,
        data: configurations,
      });
      return;
    }

    // Method not allowed
    res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
    return;

  } catch (error) {
    // Log error for debugging but don't expose details to client
    console.error("Exercise configuration API error:", error);

    // Handle Zod validation errors with detailed feedback
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
      return;
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
    return;
  }
}
