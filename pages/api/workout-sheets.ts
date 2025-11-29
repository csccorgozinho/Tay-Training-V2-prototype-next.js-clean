"use strict";

/**
 * File: workout-sheets.ts
 * Description: API endpoint for fetching workout sheet IDs with optional category filtering.
 *              Returns simple array of training sheet IDs for lightweight listing/filtering.
 *              Supports filtering by exercise group category or returning all sheets.
 * 
 * Responsibilities:
 *   - Authenticate all requests using session validation
 *   - GET: Fetch training sheet IDs with optional category filter
 *   - Support "all" or undefined categoryId to return all sheets
 *   - Support numeric categoryId to filter by exercise group category
 *   - Validate categoryId parameter if provided
 *   - Order results by creation date (newest first)
 *   - Return only ID array (not full sheet objects)
 * 
 * Called by:
 *   - Workout sheets page component (src/pages/WorkoutSheets.tsx)
 *   - Training sheet filter components
 *   - Category filter dropdowns
 *   - API client utilities (src/lib/api-client.ts)
 * 
 * Notes:
 *   - GET is the only supported method (returns 405 for others)
 *   - All requests require authentication
 *   - Returns array of numbers (sheet IDs), not objects
 *   - categoryId filter uses "some" relation to find sheets with at least one day in category
 *   - "all" or missing categoryId returns all sheets
 *   - Sheets ordered by creation date (newest first)
 *   - Lightweight endpoint - only selects IDs, not full sheet data
 */

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-middleware";

/**
 * API response types
 */
type WorkoutSheetsResponse = number[] | { error: string };

/**
 * Parses category ID from query parameter
 * @param categoryId - Category ID from query string
 * @returns Validated category ID as number, null for "all", or error string
 */
function parseCategoryIdFilter(
  categoryId: string | string[] | undefined
): number | null | { error: string } {
  // No filter or "all" - return all sheets
  if (!categoryId || categoryId === "all") {
    return null;
  }

  // Must be a string to parse
  if (typeof categoryId !== "string") {
    return { error: "Invalid categoryId format" };
  }

  const parsedCategoryId = Number(categoryId);

  // Validate it's a valid number
  if (isNaN(parsedCategoryId)) {
    return { error: "Invalid categoryId" };
  }

  return parsedCategoryId;
}

/**
 * Fetches all training sheet IDs without filtering
 * @returns Promise resolving to array of sheet IDs
 */
async function fetchAllSheetIds(): Promise<number[]> {
  const sheets = await prisma.trainingSheet.findMany({
    select: {
      id: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return sheets.map((sheet) => sheet.id);
}

/**
 * Fetches training sheet IDs filtered by category
 * @param categoryId - Category ID to filter by
 * @returns Promise resolving to array of sheet IDs
 */
async function fetchSheetIdsByCategory(categoryId: number): Promise<number[]> {
  const sheets = await prisma.trainingSheet.findMany({
    where: {
      trainingDays: {
        some: {
          exerciseGroup: {
            categoryId: categoryId,
          },
        },
      },
    },
    select: {
      id: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return sheets.map((sheet) => sheet.id);
}

/**
 * Workout sheets API handler
 * Fetches training sheet IDs with optional category filtering
 * 
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns Promise that resolves when response is sent
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WorkoutSheetsResponse>
): Promise<void> {
  // Require authentication - requireAuth sends 401 response if not authenticated
  // Type assertion needed due to response type mismatch
  const session = await requireAuth(req, res as any);
  if (!session) {
    return;
  }

  // Only accept GET method
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Parse and validate category filter
    const categoryFilter = parseCategoryIdFilter(req.query.categoryId);

    // Check for validation error
    if (categoryFilter && typeof categoryFilter === "object" && "error" in categoryFilter) {
      res.status(400).json({ error: categoryFilter.error });
      return;
    }

    // At this point, categoryFilter is either number or null (error case already handled)
    const validCategoryFilter = categoryFilter as number | null;

    // Fetch sheet IDs based on filter
    let sheetIds: number[];

    if (validCategoryFilter === null) {
      // No filter - return all sheets
      sheetIds = await fetchAllSheetIds();
    } else {
      // Filter by category
      sheetIds = await fetchSheetIdsByCategory(validCategoryFilter);
    }

    res.status(200).json(sheetIds);
    return;

  } catch (error) {
    // Log error for debugging
    console.error("Error fetching workout sheets:", error);

    res.status(500).json({ error: "Failed to fetch workout sheets" });
    return;
  }
}
