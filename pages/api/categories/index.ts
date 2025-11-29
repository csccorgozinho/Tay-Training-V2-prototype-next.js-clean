"use strict";

/**
 * File: categories/index.ts
 * Description: API endpoint for retrieving exercise group categories.
 *              Provides a read-only list of all available workout categories
 *              used for organizing exercise groups (e.g., Upper Body, Lower Body, etc.).
 * 
 * Responsibilities:
 *   - Authenticate requests using session validation
 *   - Fetch all exercise group categories from database
 *   - Return categories sorted alphabetically by name
 *   - Provide category count in response metadata
 *   - Handle errors with standardized API response format
 * 
 * Called by:
 *   - Workout sheet dialog (src/components/dialogs/WorkoutSheetDialog.tsx)
 *   - Category filter dialog (src/components/dialogs/CategoryFilterDialog.tsx)
 *   - Workout sheets filter hook (src/hooks/use-workout-sheets-filter.ts)
 *   - Any component that needs to display category dropdown/selection
 * 
 * Notes:
 *   - This endpoint is read-only (GET only, no POST/PUT/DELETE)
 *   - Categories are system-managed and cannot be created via this API
 *   - All requests must be authenticated
 *   - Returns empty array if no categories exist (not an error)
 */

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/api-middleware";
import type { ExerciseGroupCategory } from "@prisma/client";

/**
 * Validates that the request method is GET
 * @param method - HTTP method from request
 * @returns true if method is GET
 */
function isGetRequest(method: string | undefined): boolean {
  return method === "GET";
}

/**
 * Categories API handler
 * Fetches all exercise group categories with authentication required
 * 
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns Promise that resolves when response is sent
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ExerciseGroupCategory[]>>
): Promise<void> {
  // Require authentication - requireAuth sends 401 response if not authenticated
  const session = await requireAuth(req, res);
  if (!session) {
    return;
  }

  try {
    // Only GET method is supported
    if (!isGetRequest(req.method)) {
      res.status(405).json(apiError("Method not allowed"));
      return;
    }

    // Fetch all categories, sorted alphabetically for consistent ordering
    const categories = await prisma.exerciseGroupCategory.findMany({
      orderBy: {
        name: "asc",
      },
    });

    // Return successful response with category data and count metadata
    res.status(200).json(
      apiSuccess(categories, {
        count: categories.length,
        total: categories.length,
      })
    );
    return;

  } catch (error) {
    // Log error for debugging but don't expose details to client
    console.error("Categories API error:", error);
    
    res.status(500).json(apiError("Internal server error"));
    return;
  }
}
