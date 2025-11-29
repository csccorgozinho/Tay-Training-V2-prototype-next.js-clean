"use strict";

/**
 * File: training-sheet-schema.ts
 * Description: Zod validation schemas for training sheet data structures.
 * Defines comprehensive validation rules for creating and updating training sheets,
 * exercise groups, methods, and configurations.
 * Responsibilities:
 *   - Define Zod schemas for ExerciseConfiguration validation
 *   - Define Zod schemas for ExerciseMethod validation
 *   - Define Zod schemas for ExerciseGroup validation
 *   - Define Zod schemas for TrainingDay validation
 *   - Define Zod schemas for TrainingSheet creation and updates
 *   - Export TypeScript types inferred from Zod schemas
 *   - Enforce validation rules (required fields, min lengths, positive numbers)
 *   - Provide separate schemas for creation vs update operations
 * Called by:
 *   - pages/api/training-sheets/*.ts (API route validation)
 *   - pages/api/exercise-groups/*.ts (API route validation)
 *   - training-sheet-service.ts (data validation before database operations)
 *   - Components that handle training sheet forms
 * Notes:
 *   - All schemas use Zod for runtime validation
 *   - String fields require minimum length of 1 (non-empty)
 *   - IDs must be positive integers
 *   - Update schemas have optional fields (partial updates supported)
 *   - Creation schemas require all mandatory fields
 *   - categoryId can be null or positive integer
 *   - methodId can be null or positive integer
 *   - Arrays must have at least one element where required
 *   - TypeScript types are auto-generated from schemas using z.infer
 */

import { z } from "zod";

/**
 * Minimum length for required string fields.
 */
const MIN_STRING_LENGTH = 1;

/**
 * Minimum array length for required arrays.
 */
const MIN_ARRAY_LENGTH = 1;

/**
 * Error messages for validation failures.
 */
const ERROR_MESSAGES = {
  SERIES_REQUIRED: "Series must not be empty",
  REPS_REQUIRED: "Reps must not be empty",
  EXERCISE_ID_POSITIVE: "Exercise ID must be positive",
  METHOD_ID_POSITIVE: "Method ID must be positive",
  REST_REQUIRED: "Rest time must not be empty",
  GROUP_NAME_REQUIRED: "Group name is required",
  CATEGORY_ID_POSITIVE: "Category ID must be positive",
  EXERCISE_METHOD_REQUIRED: "At least one exercise method is required",
  EXERCISE_CONFIG_REQUIRED: "At least one exercise configuration is required",
  DAY_POSITIVE: "Day must be a positive number",
  EXERCISE_GROUP_REQUIRED: "Exercise group is required",
  TRAINING_SHEET_NAME_REQUIRED: "Training sheet name is required",
  TRAINING_DAY_REQUIRED: "At least one training day is required",
} as const;

// ============================================
// Creation Schemas (Full Validation)
// ============================================

/**
 * Schema for validating exercise configuration data.
 * Represents a single exercise with series and reps.
 */
export const ExerciseConfigurationSchema = z.object({
  /** Number of series/sets (e.g., "3", "4x10") */
  series: z.string().min(MIN_STRING_LENGTH, ERROR_MESSAGES.SERIES_REQUIRED),
  /** Number of repetitions (e.g., "10", "8-12") */
  reps: z.string().min(MIN_STRING_LENGTH, ERROR_MESSAGES.REPS_REQUIRED),
  /** ID of the exercise being performed */
  exerciseId: z.number().int().positive(ERROR_MESSAGES.EXERCISE_ID_POSITIVE),
  /** Optional ID of the training method applied */
  methodId: z.number().int().positive(ERROR_MESSAGES.METHOD_ID_POSITIVE).optional(),
});

/**
 * Schema for validating exercise method data.
 * Represents a training method with rest time and multiple exercises.
 */
export const ExerciseMethodSchema = z.object({
  /** Rest time between sets (e.g., "60s", "1-2min") */
  rest: z.string().min(MIN_STRING_LENGTH, ERROR_MESSAGES.REST_REQUIRED),
  /** Additional observations or notes */
  observations: z.string().optional(),
  /** Display order in the list */
  order: z.number().int().optional(),
  /** Array of exercise configurations in this method */
  exerciseConfigurations: z
    .array(ExerciseConfigurationSchema)
    .min(MIN_ARRAY_LENGTH, ERROR_MESSAGES.EXERCISE_CONFIG_REQUIRED),
});

/**
 * Schema for validating exercise group data.
 * Represents a group of exercises with multiple methods.
 */
export const ExerciseGroupSchema = z.object({
  /** Internal name of the exercise group */
  name: z.string().min(MIN_STRING_LENGTH, ERROR_MESSAGES.GROUP_NAME_REQUIRED),
  /** Optional category ID (can be null for uncategorized) */
  categoryId: z
    .number()
    .int()
    .positive(ERROR_MESSAGES.CATEGORY_ID_POSITIVE)
    .optional()
    .nullable(),
  /** Public-facing name for display */
  publicName: z.string().optional(),
  /** Array of exercise methods in this group */
  exerciseMethods: z
    .array(ExerciseMethodSchema)
    .min(MIN_ARRAY_LENGTH, ERROR_MESSAGES.EXERCISE_METHOD_REQUIRED),
});

/**
 * Schema for validating training day data.
 * Represents a single day in the training schedule.
 */
export const TrainingDaySchema = z.object({
  /** Day number (1-7 for Monday-Sunday or similar) */
  day: z.number().int().positive(ERROR_MESSAGES.DAY_POSITIVE),
  /** Optional short name for the day (e.g., "Upper Body") */
  shortName: z.string().optional(),
  /** Exercise group assigned to this day */
  exerciseGroup: ExerciseGroupSchema,
});

/**
 * Schema for validating training sheet creation data.
 * Requires all mandatory fields for creating a new training sheet.
 */
export const CreateTrainingSheetSchema = z.object({
  /** Name of the training sheet */
  name: z
    .string()
    .min(MIN_STRING_LENGTH, ERROR_MESSAGES.TRAINING_SHEET_NAME_REQUIRED),
  /** Public-facing name for display */
  publicName: z.string().optional(),
  /** URL-friendly slug */
  slug: z.string().optional(),
  /** Path to offline PDF version */
  offlinePdf: z.string().optional(),
  /** Path to PDF for opening in new tab */
  newTabPdf: z.string().optional(),
  /** General PDF path */
  pdfPath: z.string().optional(),
  /** Array of training days in this sheet */
  trainingDays: z
    .array(TrainingDaySchema)
    .min(MIN_ARRAY_LENGTH, ERROR_MESSAGES.TRAINING_DAY_REQUIRED),
});

// ============================================
// Update Schemas (Partial Validation)
// ============================================

/**
 * Schema for validating training sheet update data.
 * All fields are optional to support partial updates.
 */
export const UpdateTrainingSheetSchema = z.object({
  /** Optional name update */
  name: z.string().min(MIN_STRING_LENGTH).optional(),
  /** Optional public name update */
  publicName: z.string().optional(),
  /** Optional slug update */
  slug: z.string().optional(),
  /** Optional offline PDF path update */
  offlinePdf: z.string().optional(),
  /** Optional new tab PDF path update */
  newTabPdf: z.string().optional(),
  /** Optional PDF path update */
  pdfPath: z.string().optional(),
});

/**
 * Schema for validating exercise method update data.
 * All fields are optional to support partial updates.
 */
export const UpdateExerciseMethodSchema = z.object({
  /** Optional rest time update */
  rest: z.string().min(MIN_STRING_LENGTH).optional(),
  /** Optional observations update */
  observations: z.string().optional(),
  /** Optional order update */
  order: z.number().int().optional(),
});

/**
 * Schema for validating exercise configuration update data.
 * All fields are optional to support partial updates.
 */
export const UpdateExerciseConfigurationSchema = z.object({
  /** Optional series update */
  series: z.string().min(MIN_STRING_LENGTH).optional(),
  /** Optional reps update */
  reps: z.string().min(MIN_STRING_LENGTH).optional(),
  /** Optional method ID update (can be set to null to remove) */
  methodId: z.number().int().positive().optional().nullable(),
});

// ============================================
// TypeScript Type Exports
// ============================================

/**
 * TypeScript type for ExerciseConfiguration.
 * Inferred from ExerciseConfigurationSchema.
 */
export type ExerciseConfiguration = z.infer<typeof ExerciseConfigurationSchema>;

/**
 * TypeScript type for ExerciseMethod.
 * Inferred from ExerciseMethodSchema.
 */
export type ExerciseMethod = z.infer<typeof ExerciseMethodSchema>;

/**
 * TypeScript type for ExerciseGroup.
 * Inferred from ExerciseGroupSchema.
 */
export type ExerciseGroup = z.infer<typeof ExerciseGroupSchema>;

/**
 * TypeScript type for TrainingDay.
 * Inferred from TrainingDaySchema.
 */
export type TrainingDay = z.infer<typeof TrainingDaySchema>;

/**
 * TypeScript type for creating a training sheet.
 * Inferred from CreateTrainingSheetSchema.
 */
export type CreateTrainingSheetInput = z.infer<typeof CreateTrainingSheetSchema>;

/**
 * TypeScript type for updating a training sheet.
 * Inferred from UpdateTrainingSheetSchema.
 */
export type UpdateTrainingSheetInput = z.infer<typeof UpdateTrainingSheetSchema>;

/**
 * TypeScript type for updating an exercise method.
 * Inferred from UpdateExerciseMethodSchema.
 */
export type UpdateExerciseMethod = z.infer<typeof UpdateExerciseMethodSchema>;

/**
 * TypeScript type for updating an exercise configuration.
 * Inferred from UpdateExerciseConfigurationSchema.
 */
export type UpdateExerciseConfiguration = z.infer<
  typeof UpdateExerciseConfigurationSchema
>;
