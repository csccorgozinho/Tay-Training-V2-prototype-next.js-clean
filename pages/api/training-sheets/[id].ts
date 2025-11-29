"use strict";

/**
 * File: training-sheets/[id].ts
 * Description: API endpoint for individual training sheet resource operations.
 *              Handles CRUD operations (GET, PUT, DELETE) for training sheets.
 *              Training sheets represent complete workout programs with multiple
 *              training days, each containing exercise groups, methods, and configurations.
 * 
 * Responsibilities:
 *   - Authenticate PUT and DELETE requests (GET is public for viewing)
 *   - Parse and validate training sheet ID from route parameter
 *   - GET: Retrieve full training sheet with all nested relations
 *   - PUT: Update training sheet with complete nested structure replacement
 *   - DELETE: Remove training sheet from database
 *   - Validate request body using Zod schema
 *   - Use database transactions for PUT to ensure data consistency
 *   - Handle cascading deletes and recreates for nested structures
 *   - Return appropriate HTTP status codes (200, 400, 404, 405, 500)
 *   - Handle Zod validation errors with detailed error messages
 * 
 * Called by:
 *   - Training sheets page component (src/pages/WorkoutSheets.tsx)
 *   - Training sheet dialog component (src/components/dialogs/TrainingSheetDialog.tsx)
 *   - Workout sheet management components
 *   - API client utilities (src/lib/api-client.ts)
 * 
 * Notes:
 *   - GET requests do not require authentication (public viewing)
 *   - PUT and DELETE require authentication
 *   - Sheet ID must be a positive integer
 *   - PUT performs a complete replace strategy: deletes all existing days and recreates them
 *   - PUT uses Prisma transaction to ensure atomicity
 *   - Cascade delete handles removal of methods and configurations
 *   - publicName defaults to name if not provided
 *   - categoryId and methodId are nullable fields
 *   - DELETE returns success message with 200 status (not 204)
 *   - Uses training-sheet-service for data operations
 *   - Complex nested structure: Sheet → Days → Groups → Methods → Configurations
 */

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-middleware";
import {
  getTrainingSheetFull,
  deleteTrainingSheet,
} from "@/lib/training-sheet-service";
import { CreateTrainingSheetSchema } from "@/lib/training-sheet-schema";
import { ZodError, z } from "zod";
import type { Prisma } from "@prisma/client";

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
 * Type representing validated training sheet data
 */
type CreateTrainingSheetData = z.infer<typeof CreateTrainingSheetSchema>;

/**
 * Parses and validates training sheet ID from route parameter
 * @param id - Sheet ID from query string
 * @returns Validated sheet ID as number, or null if invalid
 */
function parseSheetId(id: string | string[] | undefined): number | null {
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
 * Creates exercise configurations for a given exercise method
 * @param tx - Prisma transaction client
 * @param methodId - ID of the parent exercise method
 * @param configurations - Array of configuration data
 * @returns Promise that resolves when all configurations are created
 */
async function createExerciseConfigurations(
  tx: Prisma.TransactionClient,
  methodId: number,
  configurations: CreateTrainingSheetData["trainingDays"][number]["exerciseGroup"]["exerciseMethods"][number]["exerciseConfigurations"]
): Promise<void> {
  for (const configPayload of configurations) {
    await tx.exerciseConfiguration.create({
      data: {
        series: configPayload.series,
        reps: configPayload.reps,
        exerciseMethodId: methodId,
        exerciseId: configPayload.exerciseId,
        methodId: configPayload.methodId ?? null,
      },
    });
  }
}

/**
 * Creates exercise methods and their configurations for a given exercise group
 * @param tx - Prisma transaction client
 * @param groupId - ID of the parent exercise group
 * @param methods - Array of method data with configurations
 * @returns Promise that resolves when all methods and configurations are created
 */
async function createExerciseMethodsWithConfigurations(
  tx: Prisma.TransactionClient,
  groupId: number,
  methods: CreateTrainingSheetData["trainingDays"][number]["exerciseGroup"]["exerciseMethods"]
): Promise<void> {
  for (const methodPayload of methods) {
    const method = await tx.exerciseMethod.create({
      data: {
        rest: methodPayload.rest,
        observations: methodPayload.observations,
        order: methodPayload.order,
        exerciseGroupId: groupId,
      },
    });

    await createExerciseConfigurations(tx, method.id, methodPayload.exerciseConfigurations);
  }
}

/**
 * Creates a training day with its complete nested structure
 * @param tx - Prisma transaction client
 * @param sheetId - ID of the parent training sheet
 * @param dayPayload - Training day data with nested group, methods, and configurations
 * @returns Promise that resolves when day and all nested data are created
 */
async function createTrainingDayWithNested(
  tx: Prisma.TransactionClient,
  sheetId: number,
  dayPayload: CreateTrainingSheetData["trainingDays"][number]
): Promise<void> {
  // Create ExerciseGroup
  const group = await tx.exerciseGroup.create({
    data: {
      name: dayPayload.exerciseGroup.name,
      categoryId: dayPayload.exerciseGroup.categoryId ?? null,
    },
  });

  // Create TrainingDay linking to sheet and new group
  await tx.trainingDay.create({
    data: {
      day: dayPayload.day,
      shortName: dayPayload.shortName,
      trainingSheetId: sheetId,
      exerciseGroupId: group.id,
    },
  });

  // Create exercise methods and configurations
  await createExerciseMethodsWithConfigurations(
    tx,
    group.id,
    dayPayload.exerciseGroup.exerciseMethods
  );
}

/**
 * Updates training sheet with complete nested structure replacement
 * Uses transaction to ensure atomicity
 * @param sheetId - ID of training sheet to update
 * @param validatedData - Validated training sheet data
 * @returns Promise that resolves when update is complete
 */
async function updateTrainingSheetWithNested(
  sheetId: number,
  validatedData: CreateTrainingSheetData
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 1. Update the training sheet metadata
    await tx.trainingSheet.update({
      where: { id: sheetId },
      data: {
        name: validatedData.name,
        publicName: validatedData.publicName ?? validatedData.name,
        slug: validatedData.slug,
      },
    });

    // 2. Delete all existing training days (cascade will handle methods and configs)
    await tx.trainingDay.deleteMany({
      where: { trainingSheetId: sheetId },
    });

    // 3. Create new training days with updated data
    for (const dayPayload of validatedData.trainingDays) {
      await createTrainingDayWithNested(tx, sheetId, dayPayload);
    }
  });
}

/**
 * Training sheet resource API handler
 * Manages CRUD operations for individual training sheets
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
    // Parse and validate sheet ID
    const sheetId = parseSheetId(req.query.id);

    if (sheetId === null) {
      res.status(400).json({
        success: false,
        error: "Invalid or missing training sheet ID",
      });
      return;
    }

    // GET - Retrieve training sheet with full relations
    if (req.method === "GET") {
      const sheet = await getTrainingSheetFull(sheetId);

      if (!sheet) {
        res.status(404).json({
          success: false,
          error: "Training sheet not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: sheet,
      });
      return;
    }

    // PUT - Update training sheet with full nested structure
    if (req.method === "PUT") {
      // Validate request body using Zod schema
      const validatedData = CreateTrainingSheetSchema.parse(req.body);

      // Update sheet with complete nested structure replacement
      await updateTrainingSheetWithNested(sheetId, validatedData);

      // Fetch and return the complete updated sheet
      const fullSheet = await getTrainingSheetFull(sheetId);

      res.status(200).json({
        success: true,
        data: fullSheet,
      });
      return;
    }

    // DELETE - Remove training sheet
    if (req.method === "DELETE") {
      await deleteTrainingSheet(sheetId);

      res.status(200).json({
        success: true,
        message: "Training sheet deleted successfully",
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
    console.error("Training sheet API error:", error);

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
