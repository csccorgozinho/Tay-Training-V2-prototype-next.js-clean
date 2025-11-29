"use strict";

/**
 * File: simple-training-schedule.ts
 * Description: Training schedule service for managing workout sheet assignments and weekly plans.
 * Provides database operations for fetching available workout sheets and saving training schedules.
 * Responsibilities:
 *   - Fetch available training sheets from database for selection
 *   - Define TypeScript interfaces for training schedule data structures
 *   - Save training schedule data (currently returns mock data)
 *   - Handle database errors with proper error logging
 *   - Sort training sheets by creation date (newest first)
 *   - Validate and structure schedule data
 * Called by:
 *   - pages/training-schedule.tsx (fetching workout sheets, saving schedules)
 *   - pages/api/training-schedule/*.ts (API route handlers)
 * Notes:
 *   - saveTrainingSchedule currently returns mock data (not persisting to database)
 *   - Uses Prisma for database queries
 *   - Training sheets are ordered by creation date descending
 *   - Week days are represented by numbers (typically 1-7 for Monday-Sunday)
 *   - publicName field is optional (can be null)
 *   - pdfFile field in TrainingSchedule is optional
 *   - Database errors are caught, logged, and re-thrown with user-friendly messages
 */

import prisma from "@/lib/prisma";

/**
 * Simplified training sheet data for dropdown/selection purposes.
 */
export interface SimpleTrainingSheet {
  /** Training sheet ID */
  id: number;
  /** Internal name of the training sheet */
  name: string;
  /** Public-facing name (optional) */
  publicName: string | null;
}

/**
 * Represents a single day in the weekly schedule.
 */
export interface ScheduleDay {
  /** Day of the week (1-7 for Monday-Sunday) */
  day: number;
  /** ID of assigned training sheet (null if rest day) */
  trainingSheetId: number | null;
  /** Optional custom name for the day */
  customName?: string;
}

/**
 * Complete training schedule with week plan.
 */
export interface TrainingSchedule {
  /** Schedule ID */
  id: number;
  /** Schedule name */
  name: string;
  /** Schedule description */
  description: string;
  /** Optional PDF file attachment */
  pdfFile?: File;
  /** Array of 7 days with assigned training sheets */
  weekDays: ScheduleDay[];
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Input data for saving a training schedule.
 */
interface SaveTrainingScheduleInput {
  /** Schedule name */
  name: string;
  /** Schedule description */
  description: string;
  /** Week days with training sheet assignments */
  weekDays: ScheduleDay[];
}

/**
 * Validates if a value is a non-empty string.
 * @param value - Value to validate
 * @returns True if value is a valid non-empty string
 */
function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates if a value is a valid array.
 * @param value - Value to validate
 * @returns True if value is an array
 */
function isValidArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Validates schedule day structure.
 * @param day - Day object to validate
 * @returns True if day has valid structure
 */
function isValidScheduleDay(day: unknown): day is ScheduleDay {
  if (!day || typeof day !== "object") {
    return false;
  }

  const scheduleDay = day as Record<string, unknown>;

  // Validate required fields
  if (typeof scheduleDay.day !== "number" || scheduleDay.day < 1) {
    return false;
  }

  // trainingSheetId can be number or null
  if (
    scheduleDay.trainingSheetId !== null &&
    typeof scheduleDay.trainingSheetId !== "number"
  ) {
    return false;
  }

  // customName is optional but must be string if present
  if (
    scheduleDay.customName !== undefined &&
    typeof scheduleDay.customName !== "string"
  ) {
    return false;
  }

  return true;
}

/**
 * Validates training schedule input data.
 * @param data - Input data to validate
 * @returns True if data has valid structure
 */
function isValidTrainingScheduleInput(
  data: unknown
): data is SaveTrainingScheduleInput {
  if (!data || typeof data !== "object") {
    return false;
  }

  const input = data as Record<string, unknown>;

  // Validate name and description
  if (!isValidString(input.name) || !isValidString(input.description)) {
    return false;
  }

  // Validate weekDays array
  if (!isValidArray(input.weekDays)) {
    return false;
  }

  // Validate each day in weekDays
  return input.weekDays.every((day) => isValidScheduleDay(day));
}

/**
 * Fetches all available training sheets from the database.
 * Returns sheets ordered by creation date (newest first).
 *
 * @returns Promise resolving to array of training sheets
 * @throws Error if database query fails
 *
 * @example
 * ```ts
 * const sheets = await fetchAvailableWorkoutSheets();
 * console.log(`Found ${sheets.length} training sheets`);
 * ```
 */
export async function fetchAvailableWorkoutSheets(): Promise<
  SimpleTrainingSheet[]
> {
  try {
    const sheets = await prisma.trainingSheet.findMany({
      select: {
        id: true,
        name: true,
        publicName: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Validate results
    if (!isValidArray(sheets)) {
      throw new Error("Invalid response from database");
    }

    return sheets;
  } catch (error) {
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error("Error fetching workout sheets:", error.message);
    } else {
      console.error("Error fetching workout sheets:", error);
    }

    // Throw user-friendly error
    throw new Error("Failed to fetch available workout sheets");
  }
}

/**
 * Saves a training schedule with weekly workout assignments.
 * Note: Currently returns mock data - database persistence not yet implemented.
 *
 * @param data - Training schedule data to save
 * @returns Promise resolving to saved training schedule
 * @throws Error if data is invalid or save operation fails
 *
 * @example
 * ```ts
 * const schedule = await saveTrainingSchedule({
 *   name: 'Full Body Week',
 *   description: 'Weekly full body training plan',
 *   weekDays: [
 *     { day: 1, trainingSheetId: 5, customName: 'Upper Body' },
 *     { day: 2, trainingSheetId: null }, // Rest day
 *     // ... more days
 *   ]
 * });
 * ```
 */
export async function saveTrainingSchedule(
  data: SaveTrainingScheduleInput
): Promise<TrainingSchedule> {
  // Validate input data
  if (!isValidTrainingScheduleInput(data)) {
    throw new Error(
      "Invalid training schedule data: name, description, and weekDays are required"
    );
  }

  try {
    // TODO: Implement actual database persistence
    // Currently returns mock data for testing purposes
    const now = new Date();

    return {
      id: Date.now(),
      name: data.name.trim(),
      description: data.description.trim(),
      weekDays: data.weekDays,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error("Error saving training schedule:", error.message);
    } else {
      console.error("Error saving training schedule:", error);
    }

    // Throw user-friendly error
    throw new Error("Failed to save training schedule");
  }
}

