"use strict";

/**
 * File: exercise-groups/[id].ts
 * Description: API endpoint for individual exercise group resource operations.
 *              Handles CRUD operations (GET, PUT, DELETE) for exercise groups
 *              within training sheets. Exercise groups organize exercises into
 *              logical sets within workout sessions.
 * 
 * Responsibilities:
 *   - Authenticate PUT and DELETE requests (GET is public for viewing)
 *   - Parse and validate exercise group ID from route parameter
 *   - GET: Retrieve full exercise group with relations
 *   - PUT: Update exercise group (name, publicName) with Zod validation
 *   - DELETE: Remove exercise group from database
 *   - Validate request body using Zod schema
 *   - Return appropriate HTTP status codes (200, 400, 404, 405, 500)
 *   - Handle Zod validation errors with detailed error messages
 * 
 * Called by:
 *   - Training sheet components (src/components/dialogs/TrainingSheetDialog.tsx)
 *   - Workout sheet dialog for managing exercise groups
 *   - Exercise group management components
 *   - API client utilities (src/lib/api-client.ts)
 * 
 * Notes:
 *   - GET requests do not require authentication (public viewing)
 *   - PUT and DELETE require authentication
 *   - Group ID must be a positive integer
 *   - name is optional but must be non-empty if provided
 *   - publicName is optional and can be any string
 *   - PUT returns the full updated group with relations
 *   - DELETE returns success message with 200 status (not 204)
 *   - Uses training-sheet-service for database operations
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "@/lib/api-middleware";
import {
  getExerciseGroupFull,
  updateExerciseGroup,
  deleteExerciseGroup,
} from "@/lib/training-sheet-service";
import { ZodError, z } from "zod";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";

/**
 * Zod schema for validating exercise group updates
 * Both fields are optional as updates can be partial
 */
const UpdateExerciseGroupSchema = z.object({
  name: z.string().min(1, "Name must not be empty if provided").optional(),
  publicName: z.string().optional(),
});

/**
 * Type representing validated update data
 */
type UpdateExerciseGroupData = z.infer<typeof UpdateExerciseGroupSchema>;

/**
 * Parses and validates exercise group ID from route parameter
 * @param id - Group ID from query string
 * @returns Validated group ID as number, or null if invalid
 */
function parseGroupId(id: string | string[] | undefined): number | null {
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
 * Exercise group resource API handler
 * Manages CRUD operations for individual exercise groups
 * 
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns Promise that resolves when response is sent
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<unknown>>
): Promise<void> {
  // Require authentication for PUT and DELETE (GET is public)
  if (requiresAuthentication(req.method)) {
    const session = await requireAuth(req, res);
    if (!session) {
      return;
    }
  }

  try {
    // Parse and validate group ID
    const groupId = parseGroupId(req.query.id);

    if (groupId === null) {
      res.status(400).json(apiError("Invalid or missing exercise group ID"));
      return;
    }

    // GET - Retrieve exercise group with full relations
    if (req.method === "GET") {
      const group = await getExerciseGroupFull(groupId);

      if (!group) {
        res.status(404).json(apiError("Exercise group not found"));
        return;
      }

      res.status(200).json(apiSuccess(group));
      return;
    }

    // PUT - Update exercise group
    if (req.method === "PUT") {
      // Validate request body using Zod schema
      const validatedData: UpdateExerciseGroupData =
        UpdateExerciseGroupSchema.parse(req.body);

      // Update group with validated data
      await updateExerciseGroup(groupId, validatedData);

      // Fetch and return the full updated group
      const updatedGroup = await getExerciseGroupFull(groupId);

      res.status(200).json(apiSuccess(updatedGroup));
      return;
    }

    // DELETE - Remove exercise group
    if (req.method === "DELETE") {
      await deleteExerciseGroup(groupId);

      res.status(200).json(
        apiSuccess({ message: "Exercise group deleted successfully" })
      );
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
