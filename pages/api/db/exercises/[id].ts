"use strict";

/**
 * File: db/exercises/[id].ts
 * Description: API endpoint for individual exercise CRUD operations.
 *              Handles retrieval, updating, and deletion of specific exercises by ID.
 *              Exercises represent individual workout movements (e.g., Squat, Bench Press).
 * 
 * Responsibilities:
 *   - Authenticate all requests using session validation
 *   - Validate exercise ID from URL parameter
 *   - GET: Fetch single exercise by ID
 *   - PUT/PATCH: Update exercise properties (name, description, videoUrl, hasMethod)
 *   - DELETE: Remove exercise from database
 *   - Validate required fields (description must exist)
 *   - Handle 404 errors for non-existent exercises
 * 
 * Called by:
 *   - Exercise dialog component (src/components/dialogs/ExerciseDialog.tsx)
 *   - Exercises page (src/pages/Exercises.tsx)
 *   - Exercise autocomplete (src/components/dialogs/ExerciseAutocomplete.tsx)
 *   - API client helpers (src/lib/api-client.ts)
 * 
 * Notes:
 *   - Exercise ID must be a valid positive integer
 *   - Description field is required and cannot be empty
 *   - Name and videoUrl are optional (can be null)
 *   - hasMethod flag indicates if exercise uses specific training methods
 *   - DELETE returns 204 No Content on success
 *   - PUT and PATCH are treated identically (both do partial updates)
 */

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/api-middleware";
import type { Exercise } from "@prisma/client";

/**
 * Validates and parses exercise ID from query parameter
 * @param id - Query parameter value (may be string, array, or undefined)
 * @returns Parsed integer ID or null if invalid
 */
function parseExerciseId(id: string | string[] | undefined): number | null {
  // Ensure id exists and is a string (not array)
  if (!id || typeof id !== "string") {
    return null;
  }

  const parsedId = parseInt(id, 10);

  // Ensure parsed value is a valid positive integer
  if (isNaN(parsedId) || parsedId <= 0) {
    return null;
  }

  return parsedId;
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
 * Safely extracts optional string or null value from request body
 * Handles string, null, and undefined inputs
 * @param value - Value from request body
 * @returns string, null, or undefined for Prisma update
 */
function parseOptionalString(value: unknown): string | null | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (value === null) {
    return null;
  }
  return undefined;
}

/**
 * Exercise CRUD API handler
 * Manages individual exercise operations with ID-based routing
 * 
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns Promise that resolves when response is sent
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Exercise>>
): Promise<void> {
  // Require authentication - requireAuth sends 401 response if not authenticated
  const session = await requireAuth(req, res);
  if (!session) {
    return;
  }

  // Validate and parse exercise ID from URL parameter
  const exerciseId = parseExerciseId(req.query.id);
  if (exerciseId === null) {
    res.status(400).json(apiError("Invalid or missing exercise ID"));
    return;
  }

  try {
    // GET - Fetch single exercise
    if (req.method === "GET") {
      const exercise = await prisma.exercise.findUnique({
        where: { id: exerciseId },
      });

      if (!exercise) {
        res.status(404).json(apiError("Exercise not found"));
        return;
      }

      res.status(200).json(apiSuccess(exercise));
      return;
    }

    // PUT/PATCH - Update exercise properties
    if (req.method === "PUT" || req.method === "PATCH") {
      const { name, description, videoUrl, hasMethod } = req.body ?? {};

      // Validate required description field
      if (!isValidDescription(description)) {
        res.status(400).json(apiError("Description is required and cannot be empty"));
        return;
      }

      // Update exercise with validated data
      const updatedExercise = await prisma.exercise.update({
        where: { id: exerciseId },
        data: {
          name: parseOptionalString(name),
          description: description.trim(),
          videoUrl: parseOptionalString(videoUrl),
          hasMethod: typeof hasMethod === "boolean" ? hasMethod : undefined,
        },
      });

      res.status(200).json(apiSuccess(updatedExercise));
      return;
    }

    // DELETE - Remove exercise
    if (req.method === "DELETE") {
      await prisma.exercise.delete({
        where: { id: exerciseId },
      });

      res.status(204).end();
      return;
    }

    // Method not allowed
    res.setHeader("Allow", ["GET", "PUT", "PATCH", "DELETE"]);
    res.status(405).end(`Method ${req.method ?? "UNKNOWN"} Not Allowed`);
    return;

  } catch (err) {
    // Log error for debugging but don't expose details to client
    console.error(`/api/db/exercises/${exerciseId} error`, err);

    res.status(500).json(apiError("Internal server error"));
    return;
  }
}
