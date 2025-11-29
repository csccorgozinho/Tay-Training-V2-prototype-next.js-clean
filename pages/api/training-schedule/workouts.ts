"use strict";

/**
 * File: training-schedule/workouts.ts
 * Description: API endpoint for fetching available workout sheets for training schedule.
 *              Provides a simple read-only endpoint to retrieve all workout sheets that
 *              can be assigned to training schedule weeks and sessions.
 * 
 * Responsibilities:
 *   - Authenticate all requests using session validation
 *   - GET: Fetch all available workout sheets from database
 *   - Return workout sheets with count metadata
 *   - Handle errors gracefully with appropriate status codes
 *   - Provide detailed error messages for debugging
 * 
 * Called by:
 *   - Training schedule page component (src/pages/TrainingSchedule.tsx)
 *   - Training schedule management components
 *   - Workout sheet selection dialogs
 *   - API client utilities (src/lib/api-client.ts)
 * 
 * Notes:
 *   - GET is the only supported method (returns 405 for others)
 *   - All requests require authentication
 *   - Uses simple-training-schedule service for data fetching
 *   - Returns count metadata for UI display
 *   - Error messages exposed to client for better debugging
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "@/lib/api-middleware";
import { fetchAvailableWorkoutSheets } from "@/lib/simple-training-schedule";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";

/**
 * Extracts error message from unknown error type
 * @param error - Error object of unknown type
 * @returns Human-readable error message
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  return "Failed to fetch workout sheets";
}

/**
 * Workout sheets API handler
 * Fetches available workout sheets for training schedule
 * 
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns Promise that resolves when response is sent
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<unknown>>
): Promise<void> {
  // Require authentication - requireAuth sends 401 response if not authenticated
  const session = await requireAuth(req, res);
  if (!session) {
    return;
  }

  try {
    // GET - Fetch all available workout sheets
    if (req.method === "GET") {
      const workoutSheets = await fetchAvailableWorkoutSheets();

      res.status(200).json(
        apiSuccess(workoutSheets, { count: workoutSheets.length })
      );
      return;
    }

    // Method not allowed
    res.status(405).json(apiError("Method not allowed"));
    return;

  } catch (error) {
    // Log error for debugging
    console.error("API Error:", error);

    // Return error with message for client debugging
    const errorMessage = getErrorMessage(error);
    res.status(500).json(apiError(errorMessage));
    return;
  }
}
