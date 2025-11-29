"use strict";

/**
 * File: init-db.ts
 * Description: Development-only API endpoint for database initialization.
 *              Creates default exercise group category required for application setup.
 *              Uses upsert to ensure idempotent operation (safe to call multiple times).
 * 
 * Responsibilities:
 *   - Verify environment is not production (security check)
 *   - POST: Create or update default "General" category with ID 1
 *   - Use upsert to prevent duplicate category creation
 *   - Return created/updated category data
 *   - Block all non-POST requests with 405 Method Not Allowed
 * 
 * Called by:
 *   - Development setup scripts
 *   - Manual database initialization during development
 *   - Testing environments for consistent test data setup
 * 
 * Notes:
 *   - SECURITY: Completely disabled in production (returns 403 Forbidden)
 *   - Only accepts POST method
 *   - Creates category with hardcoded ID 1 and name "General"
 *   - Upsert ensures idempotency - safe to call multiple times
 *   - Returns detailed error messages for debugging
 *   - Should be called after database migrations but before app usage
 */

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import type { ExerciseGroupCategory } from "@prisma/client";

/**
 * API response structure
 */
interface ApiResponse {
  success: boolean;
  message?: string;
  category?: ExerciseGroupCategory;
  error?: string;
}

/**
 * Default category configuration
 */
const DEFAULT_CATEGORY = {
  id: 1,
  name: "General",
} as const;

/**
 * Checks if the current environment is production
 * @returns true if production, false otherwise
 */
function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Extracts error message from unknown error type
 * @param error - Error object of unknown type
 * @returns Human-readable error message
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to initialize database";
}

/**
 * Creates or updates the default exercise group category
 * @returns Promise resolving to the upserted category
 */
async function createDefaultCategory(): Promise<ExerciseGroupCategory> {
  const category = await prisma.exerciseGroupCategory.upsert({
    where: { id: DEFAULT_CATEGORY.id },
    update: {},
    create: {
      id: DEFAULT_CATEGORY.id,
      name: DEFAULT_CATEGORY.name,
    },
  });

  return category;
}

/**
 * Database initialization API handler
 * Creates default category for exercise groups (development only)
 * 
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns Promise that resolves when response is sent
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
): Promise<void> {
  // SECURITY: Block access in production environment
  if (isProductionEnvironment()) {
    res.status(403).json({
      success: false,
      error: "This endpoint is disabled in production",
    });
    return;
  }

  try {
    // Only accept POST method
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${req.method ?? "UNKNOWN"} Not Allowed`);
      return;
    }

    // Create or update default category
    const category = await createDefaultCategory();

    res.status(200).json({
      success: true,
      message: "Default category created",
      category,
    });
    return;

  } catch (error) {
    // Log error for debugging
    console.error("/api/init-db error:", error);

    // Return error with message
    const errorMessage = getErrorMessage(error);
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
    return;
  }
}
