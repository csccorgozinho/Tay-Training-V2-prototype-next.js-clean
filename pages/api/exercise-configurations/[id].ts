"use strict";

/**
 * File: exercise-configurations/[id].ts
 * Description: API endpoint for individual exercise configuration resource operations.
 *              Handles CRUD operations (GET, PUT, DELETE) for exercise configurations
 *              within workout groups. Exercise configurations define the series, reps,
 *              and methods for specific exercises in a training sheet.
 * 
 * Responsibilities:
 *   - Authenticate PUT and DELETE requests (GET is public for viewing)
 *   - Parse and validate exercise configuration ID from route parameter
 *   - GET: Retrieve full exercise configuration with relations
 *   - PUT: Update exercise configuration (series, reps, methodId) with Zod validation
 *   - DELETE: Remove exercise configuration from database
 *   - Validate request body using Zod schema
 *   - Return appropriate HTTP status codes (200, 400, 404, 405, 500)
 *   - Handle Zod validation errors with detailed error messages
 * 
 * Called by:
 *   - Training sheet components (src/components/dialogs/TrainingSheetDialog.tsx)
 *   - Workout sheet components for exercise configuration management
 *   - Exercise configuration dialog components
 *   - API client utilities (src/lib/api-client.ts)
 * 
 * Notes:
 *   - GET requests do not require authentication (public viewing)
 *   - PUT and DELETE require authentication
 *   - Configuration ID must be a positive integer
 *   - series and reps are stored as strings
 *   - methodId is optional and must be a positive integer if provided
 *   - PUT returns the full updated configuration with relations
 *   - DELETE returns success message instead of 204 No Content
 *   - Uses training-sheet-service for database operations
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "@/lib/api-middleware";
import {
  getExerciseConfigurationFull,
  updateExerciseConfiguration,
  deleteExerciseConfiguration,
} from "@/lib/training-sheet-service";
import { ZodError, z } from "zod";

/**
 * Zod schema for validating exercise configuration updates
 * All fields are optional as updates can be partial
 */
const UpdateExerciseConfigurationSchema = z.object({
  series: z.string().optional(),
  reps: z.string().optional(),
  methodId: z.number().int().optional(),
});

/**
 * Type representing validated update data
 */
type UpdateExerciseConfigurationData = z.infer<typeof UpdateExerciseConfigurationSchema>;

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
 * Parses and validates exercise configuration ID from route parameter
 * @param id - Configuration ID from query string
 * @returns Validated configuration ID as number, or null if invalid
 */
function parseConfigurationId(id: string | string[] | undefined): number | null {
  if (!id || typeof id !== "string") {
    return null;
  }

  const parsedId = parseInt(id, 10);

  // Validate it's a valid positive integer
  if (isNaN(parsedId) || parsedId <= 0) {
    return null;
  }

  return parsedId;
}

/**
 * Checks if the HTTP method requires authentication
 * @param method - HTTP method from request
 * @returns true if authentication is required, false otherwise
 */
function requiresAuthentication(method: string | undefined): boolean {
  if (!method) {
    return false;
  }

  return method === "PUT" || method === "DELETE";
}

/**
 * Exercise configuration resource API handler
 * Manages CRUD operations for individual exercise configurations
 * 
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns Promise that resolves when response is sent
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
): Promise<void> {
  // Require authentication for PUT and DELETE (GET is public)
  if (requiresAuthentication(req.method)) {
    const session = await requireAuth(req, res);
    if (!session) {
      return;
    }
  }

  try {
    // Parse and validate configuration ID
    const configId = parseConfigurationId(req.query.id);

    if (configId === null) {
      res.status(400).json({
        success: false,
        error: "Invalid or missing exercise configuration ID",
      });
      return;
    }

    // GET - Retrieve exercise configuration with full relations
    if (req.method === "GET") {
      const config = await getExerciseConfigurationFull(configId);

      if (!config) {
        res.status(404).json({
          success: false,
          error: "Exercise configuration not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: config,
      });
      return;
    }

    // PUT - Update exercise configuration
    if (req.method === "PUT") {
      // Validate request body using Zod schema
      const validatedData: UpdateExerciseConfigurationData = 
        UpdateExerciseConfigurationSchema.parse(req.body);

      // Update configuration with validated data
      await updateExerciseConfiguration(configId, validatedData);

      // Fetch and return the full updated configuration
      const updatedConfig = await getExerciseConfigurationFull(configId);

      res.status(200).json({
        success: true,
        data: updatedConfig,
      });
      return;
    }

    // DELETE - Remove exercise configuration
    if (req.method === "DELETE") {
      await deleteExerciseConfiguration(configId);

      res.status(200).json({
        success: true,
        message: "Exercise configuration deleted successfully",
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
