"use strict";

/**
 * File: training-sheet-service.ts
 * Description: Comprehensive database service for managing training sheets and related entities.
 * Provides CRUD operations and complex transactional operations for training sheet management.
 * Responsibilities:
 *   - Create, read, update, delete training sheets with all nested relations
 *   - Manage training days linked to training sheets
 *   - Manage exercise groups with categories
 *   - Manage exercise methods with configurations
 *   - Manage exercise configurations with exercises and methods
 *   - Handle bulk operations with database transactions
 *   - Deduplicate exercise groups to prevent redundant data
 *   - Generate URL-friendly slugs for training sheets
 * Called by:
 *   - pages/api/training-sheets/[id].ts (API routes for CRUD operations)
 *   - pages/api/training-sheets/index.ts (API routes for creation and listing)
 *   - pages/api/exercise-groups/[id].ts (API routes for exercise group operations)
 *   - pages/api/exercise-groups/index.ts (API routes for exercise group creation)
 *   - pages/api/exercise-configurations/[id].ts (API routes for configuration operations)
 *   - pages/api/exercise-configurations/index.ts (API routes for configuration creation)
 *   - Components that manage training sheet data
 * Notes:
 *   - All database operations use Prisma ORM
 *   - Delete operations cascade to related entities (defined in Prisma schema)
 *   - createCompleteTrainingSheet uses transactions for atomicity
 *   - Exercise groups are deduplicated by name + categoryId to prevent duplicates
 *   - Slug generation uses slugify utility (lowercase, hyphens, no special chars)
 *   - All IDs are positive integers managed by the database
 *   - Optional fields default to null in the database
 *   - Transactions ensure all-or-nothing creation of complex structures
 *   - Debug logging enabled for transaction operations
 */

import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ============================================
// Input Type Definitions
// ============================================

/**
 * Input type for creating a new training sheet.
 */
export interface CreateTrainingSheetInput {
  /** Name of the training sheet */
  name: string;
  /** Public-facing display name */
  publicName?: string;
  /** URL-friendly slug */
  slug?: string;
  /** Path to offline PDF version */
  offlinePdf?: string;
  /** Path to PDF for new tab */
  newTabPdf?: string;
  /** General PDF path */
  pdfPath?: string;
}

/**
 * Input type for creating a training day.
 */
export interface CreateTrainingDayInput {
  /** Day number (e.g., 1-7 for Monday-Sunday) */
  day: number;
  /** Short name for the day */
  shortName?: string;
  /** ID of the parent training sheet */
  trainingSheetId: number;
  /** ID of the exercise group for this day */
  exerciseGroupId: number;
}

/**
 * Input type for creating an exercise group.
 */
export interface CreateExerciseGroupInput {
  /** Name of the exercise group */
  name: string;
  /** Optional category ID (can be null) */
  categoryId?: number | null;
  /** Public-facing display name */
  publicName?: string;
}

/**
 * Input type for creating an exercise method.
 */
export interface CreateExerciseMethodInput {
  /** Rest time between sets (e.g., "60s", "1-2min") */
  rest: string;
  /** Additional observations or notes */
  observations?: string;
  /** Display order */
  order?: number;
  /** ID of the parent exercise group */
  exerciseGroupId: number;
}

/**
 * Input type for creating an exercise configuration.
 */
export interface CreateExerciseConfigurationInput {
  /** Number of series/sets */
  series: string;
  /** Number of repetitions */
  reps: string;
  /** ID of the parent exercise method */
  exerciseMethodId: number;
  /** ID of the exercise */
  exerciseId: number;
  /** Optional method ID */
  methodId?: number;
}

/**
 * Input type for updating a training sheet (partial).
 */
export interface UpdateTrainingSheetInput {
  /** Updated name */
  name?: string;
  /** Updated public name */
  publicName?: string;
  /** Updated slug */
  slug?: string;
  /** Updated offline PDF path */
  offlinePdf?: string;
  /** Updated new tab PDF path */
  newTabPdf?: string;
  /** Updated PDF path */
  pdfPath?: string;
}

/**
 * Input type for updating an exercise group (partial).
 */
export interface UpdateExerciseGroupInput {
  /** Updated name */
  name?: string;
  /** Updated public name */
  publicName?: string;
}

/**
 * Input type for updating an exercise method (partial).
 */
export interface UpdateExerciseMethodInput {
  /** Updated rest time */
  rest?: string;
  /** Updated observations */
  observations?: string;
  /** Updated order */
  order?: number;
}

/**
 * Input type for updating an exercise configuration (partial).
 */
export interface UpdateExerciseConfigurationInput {
  /** Updated series */
  series?: string;
  /** Updated reps */
  reps?: string;
  /** Updated method ID (can be set to null) */
  methodId?: number | null;
}

/**
 * Complex payload for creating a complete training sheet with nested relations.
 */
export interface TrainingSheetPayload {
  /** Name of the training sheet */
  name: string;
  /** Public-facing display name */
  publicName?: string;
  /** URL-friendly slug */
  slug?: string;
  /** Path to offline PDF version */
  offlinePdf?: string;
  /** Path to PDF for new tab */
  newTabPdf?: string;
  /** General PDF path */
  pdfPath?: string;
  /** Array of training days with nested exercise groups */
  trainingDays: Array<{
    /** Day number */
    day: number;
    /** Short name for the day */
    shortName?: string;
    /** Exercise group with methods and configurations */
    exerciseGroup: {
      /** Name of the exercise group */
      name: string;
      /** Category ID */
      categoryId: number;
      /** Public-facing display name */
      publicName?: string;
      /** Array of exercise methods */
      exerciseMethods: Array<{
        /** Rest time between sets */
        rest: string;
        /** Additional observations */
        observations?: string;
        /** Display order */
        order?: number;
        /** Array of exercise configurations */
        exerciseConfigurations: Array<{
          /** Number of series/sets */
          series: string;
          /** Number of repetitions */
          reps: string;
          /** ID of the exercise */
          exerciseId: number;
          /** Optional method ID */
          methodId?: number;
        }>;
      }>;
    };
  }>;
}

// ============================================
// Validation Helper Functions
// ============================================

/**
 * Check if a value is a valid non-empty string.
 */
function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Check if a value is a valid positive integer.
 */
function isValidPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/**
 * Check if a value is an array.
 */
function isValidArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Validate CreateTrainingSheetInput.
 */
function validateCreateTrainingSheetInput(
  input: unknown
): input is CreateTrainingSheetInput {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const data = input as Record<string, unknown>;

  if (!isValidString(data.name)) {
    return false;
  }

  return true;
}

/**
 * Validate CreateTrainingDayInput.
 */
function validateCreateTrainingDayInput(
  input: unknown
): input is CreateTrainingDayInput {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const data = input as Record<string, unknown>;

  if (!isValidPositiveInteger(data.day)) {
    return false;
  }

  if (!isValidPositiveInteger(data.trainingSheetId)) {
    return false;
  }

  if (!isValidPositiveInteger(data.exerciseGroupId)) {
    return false;
  }

  return true;
}

/**
 * Validate CreateExerciseGroupInput.
 */
function validateCreateExerciseGroupInput(
  input: unknown
): input is CreateExerciseGroupInput {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const data = input as Record<string, unknown>;

  if (!isValidString(data.name)) {
    return false;
  }

  return true;
}

/**
 * Validate CreateExerciseMethodInput.
 */
function validateCreateExerciseMethodInput(
  input: unknown
): input is CreateExerciseMethodInput {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const data = input as Record<string, unknown>;

  if (!isValidString(data.rest)) {
    return false;
  }

  if (!isValidPositiveInteger(data.exerciseGroupId)) {
    return false;
  }

  return true;
}

/**
 * Validate CreateExerciseConfigurationInput.
 */
function validateCreateExerciseConfigurationInput(
  input: unknown
): input is CreateExerciseConfigurationInput {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const data = input as Record<string, unknown>;

  if (!isValidString(data.series)) {
    return false;
  }

  if (!isValidString(data.reps)) {
    return false;
  }

  if (!isValidPositiveInteger(data.exerciseMethodId)) {
    return false;
  }

  if (!isValidPositiveInteger(data.exerciseId)) {
    return false;
  }

  return true;
}

/**
 * Validate TrainingSheetPayload.
 */
function validateTrainingSheetPayload(
  payload: unknown
): payload is TrainingSheetPayload {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const data = payload as Record<string, unknown>;

  if (!isValidString(data.name)) {
    return false;
  }

  if (!isValidArray(data.trainingDays) || data.trainingDays.length === 0) {
    return false;
  }

  return true;
}


// ============================================
// TrainingSheet Operations
// ============================================

/**
 * Create a new training sheet.
 * @param input - Training sheet creation data
 * @returns The created training sheet
 * @throws Error if input is invalid or database operation fails
 */
export async function createTrainingSheet(
  input: CreateTrainingSheetInput
): Promise<Prisma.TrainingSheetGetPayload<object>> {
  if (!validateCreateTrainingSheetInput(input)) {
    throw new Error("Invalid input: name is required and must be a non-empty string");
  }

  const trimmedName = input.name.trim();
  const publicName = input.publicName?.trim() || trimmedName;
  const slug = input.slug?.trim() || slugify(trimmedName);

  try {
    const result = await prisma.trainingSheet.create({
      data: {
        name: trimmedName,
        publicName: publicName,
        slug: slug,
        offlinePdf: input.offlinePdf?.trim() || undefined,
        newTabPdf: input.newTabPdf?.trim() || undefined,
        pdfPath: input.pdfPath?.trim() || undefined,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating training sheet:", error.message);
    } else {
      console.error("Error creating training sheet:", error);
    }
    throw new Error("Failed to create training sheet");
  }
}

/**
 * Get a training sheet with all its nested relations.
 * @param id - Training sheet ID
 * @returns The training sheet with all nested data, or null if not found
 * @throws Error if ID is invalid or database operation fails
 */
export async function getTrainingSheetFull(
  id: number
): Promise<Prisma.TrainingSheetGetPayload<{
  include: {
    trainingDays: {
      include: {
        exerciseGroup: {
          include: {
            exerciseMethods: {
              include: {
                exerciseConfigurations: {
                  include: {
                    exercise: true;
                    method: true;
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}> | null> {
  if (!isValidPositiveInteger(id)) {
    throw new Error("Invalid ID: must be a positive integer");
  }

  try {
    const result = await prisma.trainingSheet.findUnique({
      where: { id },
      include: {
        trainingDays: {
          include: {
            exerciseGroup: {
              include: {
                exerciseMethods: {
                  include: {
                    exerciseConfigurations: {
                      include: {
                        exercise: true,
                        method: true,
                      },
                    },
                  },
                  orderBy: { order: "asc" },
                },
              },
            },
          },
          orderBy: { day: "asc" },
        },
      },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching training sheet:", error.message);
    } else {
      console.error("Error fetching training sheet:", error);
    }
    throw new Error("Failed to fetch training sheet");
  }
}

/**
 * Update a training sheet.
 * @param id - Training sheet ID
 * @param input - Fields to update
 * @returns The updated training sheet
 * @throws Error if ID is invalid or database operation fails
 */
export async function updateTrainingSheet(
  id: number,
  input: UpdateTrainingSheetInput
): Promise<Prisma.TrainingSheetGetPayload<object>> {
  if (!isValidPositiveInteger(id)) {
    throw new Error("Invalid ID: must be a positive integer");
  }

  if (typeof input !== "object" || input === null) {
    throw new Error("Invalid input: must be an object");
  }

  try {
    const updateData: Prisma.TrainingSheetUpdateInput = {};

    if (input.name !== undefined) {
      updateData.name = input.name.trim();
    }
    if (input.publicName !== undefined) {
      updateData.publicName = input.publicName.trim();
    }
    if (input.slug !== undefined) {
      updateData.slug = input.slug.trim();
    }
    if (input.offlinePdf !== undefined) {
      updateData.offlinePdf = input.offlinePdf.trim();
    }
    if (input.newTabPdf !== undefined) {
      updateData.newTabPdf = input.newTabPdf.trim();
    }
    if (input.pdfPath !== undefined) {
      updateData.pdfPath = input.pdfPath.trim();
    }

    const result = await prisma.trainingSheet.update({
      where: { id },
      data: updateData,
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error updating training sheet:", error.message);
    } else {
      console.error("Error updating training sheet:", error);
    }
    throw new Error("Failed to update training sheet");
  }
}

/**
 * Delete a training sheet and all its nested data (cascading).
 * @param id - Training sheet ID
 * @returns The deleted training sheet
 * @throws Error if ID is invalid or database operation fails
 */
export async function deleteTrainingSheet(
  id: number
): Promise<Prisma.TrainingSheetGetPayload<object>> {
  if (!isValidPositiveInteger(id)) {
    throw new Error("Invalid ID: must be a positive integer");
  }

  try {
    const result = await prisma.trainingSheet.delete({
      where: { id },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting training sheet:", error.message);
    } else {
      console.error("Error deleting training sheet:", error);
    }
    throw new Error("Failed to delete training sheet");
  }
}

// ============================================
// TrainingDay Operations
// ============================================

/**
 * Create a training day.
 * @param input - Training day creation data
 * @returns The created training day
 * @throws Error if input is invalid or database operation fails
 */
export async function createTrainingDay(
  input: CreateTrainingDayInput
): Promise<Prisma.TrainingDayGetPayload<object>> {
  if (!validateCreateTrainingDayInput(input)) {
    throw new Error(
      "Invalid input: day, trainingSheetId, and exerciseGroupId must be positive integers"
    );
  }

  try {
    const result = await prisma.trainingDay.create({
      data: {
        day: input.day,
        shortName: input.shortName?.trim() || undefined,
        trainingSheetId: input.trainingSheetId,
        exerciseGroupId: input.exerciseGroupId,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating training day:", error.message);
    } else {
      console.error("Error creating training day:", error);
    }
    throw new Error("Failed to create training day");
  }
}

/**
 * Get a training day with all its nested relations.
 * @param id - Training day ID
 * @returns The training day with all nested data, or null if not found
 * @throws Error if ID is invalid or database operation fails
 */
export async function getTrainingDayFull(
  id: number
): Promise<Prisma.TrainingDayGetPayload<{
  include: {
    exerciseGroup: {
      include: {
        exerciseMethods: {
          include: {
            exerciseConfigurations: {
              include: {
                exercise: true;
                method: true;
              };
            };
          };
        };
      };
    };
    trainingSheet: true;
  };
}> | null> {
  if (!isValidPositiveInteger(id)) {
    throw new Error("Invalid ID: must be a positive integer");
  }

  try {
    const result = await prisma.trainingDay.findUnique({
      where: { id },
      include: {
        exerciseGroup: {
          include: {
            exerciseMethods: {
              include: {
                exerciseConfigurations: {
                  include: {
                    exercise: true,
                    method: true,
                  },
                },
              },
              orderBy: { order: "asc" },
            },
          },
        },
        trainingSheet: true,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching training day:", error.message);
    } else {
      console.error("Error fetching training day:", error);
    }
    throw new Error("Failed to fetch training day");
  }
}

/**
 * Update a training day.
 * @param id - Training day ID
 * @param input - Fields to update (partial)
 * @returns The updated training day
 * @throws Error if ID is invalid or database operation fails
 */
export async function updateTrainingDay(
  id: number,
  input: Partial<CreateTrainingDayInput>
): Promise<Prisma.TrainingDayGetPayload<object>> {
  if (!isValidPositiveInteger(id)) {
    throw new Error("Invalid ID: must be a positive integer");
  }

  if (typeof input !== "object" || input === null) {
    throw new Error("Invalid input: must be an object");
  }

  try {
    const updateData: Prisma.TrainingDayUpdateInput = {};

    if (input.day !== undefined) {
      updateData.day = input.day;
    }
    if (input.shortName !== undefined) {
      updateData.shortName = input.shortName.trim();
    }

    const result = await prisma.trainingDay.update({
      where: { id },
      data: updateData,
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error updating training day:", error.message);
    } else {
      console.error("Error updating training day:", error);
    }
    throw new Error("Failed to update training day");
  }
}

/**
 * Delete a training day.
 * @param id - Training day ID
 * @returns The deleted training day
 * @throws Error if ID is invalid or database operation fails
 */
export async function deleteTrainingDay(
  id: number
): Promise<Prisma.TrainingDayGetPayload<object>> {
  if (!isValidPositiveInteger(id)) {
    throw new Error("Invalid ID: must be a positive integer");
  }

  try {
    const result = await prisma.trainingDay.delete({
      where: { id },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting training day:", error.message);
    } else {
      console.error("Error deleting training day:", error);
    }
    throw new Error("Failed to delete training day");
  }
}

// ============================================
// ExerciseGroup Operations
// ============================================

/**
 * Create an exercise group.
 * @param input - Exercise group creation data
 * @returns The created exercise group
 * @throws Error if input is invalid or database operation fails
 */
export async function createExerciseGroup(
  input: CreateExerciseGroupInput
): Promise<Prisma.ExerciseGroupGetPayload<object>> {
  if (!validateCreateExerciseGroupInput(input)) {
    throw new Error("Invalid input: name is required and must be a non-empty string");
  }

  try {
    const result = await prisma.exerciseGroup.create({
      data: {
        name: input.name.trim(),
        categoryId: input.categoryId || null,
        publicName: input.publicName?.trim() || undefined,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating exercise group:", error.message);
    } else {
      console.error("Error creating exercise group:", error);
    }
    throw new Error("Failed to create exercise group");
  }
}

/**
 * Get exercise group with all methods and configurations.
 * @param id - Exercise group ID
 * @returns The exercise group with all nested data, or null if not found
 * @throws Error if ID is invalid or database operation fails
 */
export async function getExerciseGroupFull(
  id: number
): Promise<Prisma.ExerciseGroupGetPayload<{
  include: {
    exerciseMethods: {
      include: {
        exerciseConfigurations: {
          include: {
            exercise: true;
            method: true;
          };
        };
      };
    };
    category: true;
  };
}> | null> {
  if (!isValidPositiveInteger(id)) {
    throw new Error("Invalid ID: must be a positive integer");
  }

  try {
    const result = await prisma.exerciseGroup.findUnique({
      where: { id },
      include: {
        exerciseMethods: {
          include: {
            exerciseConfigurations: {
              include: {
                exercise: true,
                method: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
        category: true,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching exercise group:", error.message);
    } else {
      console.error("Error fetching exercise group:", error);
    }
    throw new Error("Failed to fetch exercise group");
  }
}

/**
 * Update exercise group.
 * @param id - Exercise group ID
 * @param input - Fields to update
 * @returns The updated exercise group
 * @throws Error if ID is invalid or database operation fails
 */
export async function updateExerciseGroup(
  id: number,
  input: UpdateExerciseGroupInput
): Promise<Prisma.ExerciseGroupGetPayload<object>> {
  if (!isValidPositiveInteger(id)) {
    throw new Error("Invalid ID: must be a positive integer");
  }

  if (typeof input !== "object" || input === null) {
    throw new Error("Invalid input: must be an object");
  }

  try {
    const updateData: Prisma.ExerciseGroupUpdateInput = {};

    if (input.name !== undefined) {
      updateData.name = input.name.trim();
    }
    if (input.publicName !== undefined) {
      updateData.publicName = input.publicName.trim();
    }

    const result = await prisma.exerciseGroup.update({
      where: { id },
      data: updateData,
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error updating exercise group:", error.message);
    } else {
      console.error("Error updating exercise group:", error);
    }
    throw new Error("Failed to update exercise group");
  }
}

/**
 * Delete exercise group (cascades to methods and configs).
 * @param id - Exercise group ID
 * @returns The deleted exercise group
 * @throws Error if ID is invalid or database operation fails
 */
export async function deleteExerciseGroup(
  id: number
): Promise<Prisma.ExerciseGroupGetPayload<object>> {
  if (!isValidPositiveInteger(id)) {
    throw new Error("Invalid ID: must be a positive integer");
  }

  try {
    const result = await prisma.exerciseGroup.delete({
      where: { id },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting exercise group:", error.message);
    } else {
      console.error("Error deleting exercise group:", error);
    }
    throw new Error("Failed to delete exercise group");
  }
}

// ============================================
// ExerciseMethod Operations
// ============================================

/**
 * Create an exercise method.
 * @param input - Exercise method creation data
 * @returns The created exercise method
 * @throws Error if input is invalid or database operation fails
 */
export async function createExerciseMethod(
  input: CreateExerciseMethodInput
): Promise<Prisma.ExerciseMethodGetPayload<object>> {
  if (!validateCreateExerciseMethodInput(input)) {
    throw new Error(
      "Invalid input: rest and exerciseGroupId are required, exerciseGroupId must be a positive integer"
    );
  }

  try {
    const result = await prisma.exerciseMethod.create({
      data: {
        rest: input.rest.trim(),
        observations: input.observations?.trim() || undefined,
        order: input.order,
        exerciseGroupId: input.exerciseGroupId,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating exercise method:", error.message);
    } else {
      console.error("Error creating exercise method:", error);
    }
    throw new Error("Failed to create exercise method");
  }
}

/**
 * Get exercise method with configurations.
 * @param id - Exercise method ID
 * @returns The exercise method with all nested data, or null if not found
 * @throws Error if ID is invalid or database operation fails
 */
export async function getExerciseMethodFull(
  id: number
): Promise<Prisma.ExerciseMethodGetPayload<{
  include: {
    exerciseConfigurations: {
      include: {
        exercise: true;
        method: true;
      };
    };
    exerciseGroup: true;
  };
}> | null> {
  if (!isValidPositiveInteger(id)) {
    throw new Error("Invalid ID: must be a positive integer");
  }

  try {
    const result = await prisma.exerciseMethod.findUnique({
      where: { id },
      include: {
        exerciseConfigurations: {
          include: {
            exercise: true,
            method: true,
          },
        },
        exerciseGroup: true,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching exercise method:", error.message);
    } else {
      console.error("Error fetching exercise method:", error);
    }
    throw new Error("Failed to fetch exercise method");
  }
}

/**
 * Update exercise method.
 * @param id - Exercise method ID
 * @param input - Fields to update
 * @returns The updated exercise method
 * @throws Error if ID is invalid or database operation fails
 */
export async function updateExerciseMethod(
  id: number,
  input: UpdateExerciseMethodInput
): Promise<Prisma.ExerciseMethodGetPayload<object>> {
  if (!isValidPositiveInteger(id)) {
    throw new Error("Invalid ID: must be a positive integer");
  }

  if (typeof input !== "object" || input === null) {
    throw new Error("Invalid input: must be an object");
  }

  try {
    const updateData: Prisma.ExerciseMethodUpdateInput = {};

    if (input.rest !== undefined) {
      updateData.rest = input.rest.trim();
    }
    if (input.observations !== undefined) {
      updateData.observations = input.observations.trim();
    }
    if (input.order !== undefined) {
      updateData.order = input.order;
    }

    const result = await prisma.exerciseMethod.update({
      where: { id },
      data: updateData,
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error updating exercise method:", error.message);
    } else {
      console.error("Error updating exercise method:", error);
    }
    throw new Error("Failed to update exercise method");
  }
}

/**
 * Delete exercise method (cascades to configurations).
 * @param id - Exercise method ID
 * @returns The deleted exercise method
 * @throws Error if ID is invalid or database operation fails
 */
export async function deleteExerciseMethod(
  id: number
): Promise<Prisma.ExerciseMethodGetPayload<object>> {
  if (!isValidPositiveInteger(id)) {
    throw new Error("Invalid ID: must be a positive integer");
  }

  try {
    const result = await prisma.exerciseMethod.delete({
      where: { id },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting exercise method:", error.message);
    } else {
      console.error("Error deleting exercise method:", error);
    }
    throw new Error("Failed to delete exercise method");
  }
}

// ============================================
// ExerciseConfiguration Operations
// ============================================

/**
 * Create exercise configuration.
 * @param input - Exercise configuration creation data
 * @returns The created exercise configuration
 * @throws Error if input is invalid or database operation fails
 */
export async function createExerciseConfiguration(
  input: CreateExerciseConfigurationInput
): Promise<Prisma.ExerciseConfigurationGetPayload<object>> {
  if (!validateCreateExerciseConfigurationInput(input)) {
    throw new Error(
      "Invalid input: series, reps, exerciseMethodId, and exerciseId are required; IDs must be positive integers"
    );
  }

  try {
    const result = await prisma.exerciseConfiguration.create({
      data: {
        series: input.series.trim(),
        reps: input.reps.trim(),
        exerciseMethodId: input.exerciseMethodId,
        exerciseId: input.exerciseId,
        methodId: input.methodId || null,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating exercise configuration:", error.message);
    } else {
      console.error("Error creating exercise configuration:", error);
    }
    throw new Error("Failed to create exercise configuration");
  }
}

/**
 * Get exercise configuration with relations.
 * @param id - Exercise configuration ID
 * @returns The exercise configuration with all nested data, or null if not found
 * @throws Error if ID is invalid or database operation fails
 */
export async function getExerciseConfigurationFull(
  id: number
): Promise<Prisma.ExerciseConfigurationGetPayload<{
  include: {
    exercise: true;
    method: true;
    exerciseMethod: true;
  };
}> | null> {
  if (!isValidPositiveInteger(id)) {
    throw new Error("Invalid ID: must be a positive integer");
  }

  try {
    const result = await prisma.exerciseConfiguration.findUnique({
      where: { id },
      include: {
        exercise: true,
        method: true,
        exerciseMethod: true,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching exercise configuration:", error.message);
    } else {
      console.error("Error fetching exercise configuration:", error);
    }
    throw new Error("Failed to fetch exercise configuration");
  }
}

/**
 * Update exercise configuration.
 * @param id - Exercise configuration ID
 * @param input - Fields to update
 * @returns The updated exercise configuration
 * @throws Error if ID is invalid or database operation fails
 */
export async function updateExerciseConfiguration(
  id: number,
  input: UpdateExerciseConfigurationInput
): Promise<Prisma.ExerciseConfigurationGetPayload<object>> {
  if (!isValidPositiveInteger(id)) {
    throw new Error("Invalid ID: must be a positive integer");
  }

  if (typeof input !== "object" || input === null) {
    throw new Error("Invalid input: must be an object");
  }

  try {
    const updateData: Prisma.ExerciseConfigurationUpdateInput = {};

    if (input.series !== undefined) {
      updateData.series = input.series.trim();
    }
    if (input.reps !== undefined) {
      updateData.reps = input.reps.trim();
    }
    if (input.methodId !== undefined) {
      if (input.methodId === null) {
        updateData.method = { disconnect: true };
      } else {
        updateData.method = { connect: { id: input.methodId } };
      }
    }

    const result = await prisma.exerciseConfiguration.update({
      where: { id },
      data: updateData,
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error updating exercise configuration:", error.message);
    } else {
      console.error("Error updating exercise configuration:", error);
    }
    throw new Error("Failed to update exercise configuration");
  }
}

/**
 * Delete exercise configuration.
 * @param id - Exercise configuration ID
 * @returns The deleted exercise configuration
 * @throws Error if ID is invalid or database operation fails
 */
export async function deleteExerciseConfiguration(
  id: number
): Promise<Prisma.ExerciseConfigurationGetPayload<object>> {
  if (!isValidPositiveInteger(id)) {
    throw new Error("Invalid ID: must be a positive integer");
  }

  try {
    const result = await prisma.exerciseConfiguration.delete({
      where: { id },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting exercise configuration:", error.message);
    } else {
      console.error("Error deleting exercise configuration:", error);
    }
    throw new Error("Failed to delete exercise configuration");
  }
}


// ============================================
// Bulk Operations with Transactions
// ============================================

/**
 * Create a complete training sheet with all nested relations in a transaction.
 * Returns the full structure for optimistic UI updates.
 * Deduplicates exercise groups by name + categoryId to prevent redundant data.
 * @param payload - Complete training sheet data with nested relations
 * @returns Object containing created sheet, days, groups, methods, and configurations
 * @throws Error if payload is invalid or transaction fails
 */
export async function createCompleteTrainingSheet(
  payload: TrainingSheetPayload
): Promise<{
  sheet: Prisma.TrainingSheetGetPayload<object>;
  days: Prisma.TrainingDayGetPayload<object>[];
  groups: Prisma.ExerciseGroupGetPayload<object>[];
  methods: Prisma.ExerciseMethodGetPayload<object>[];
  configurations: Prisma.ExerciseConfigurationGetPayload<object>[];
}> {
  if (!validateTrainingSheetPayload(payload)) {
    throw new Error(
      "Invalid payload: name and trainingDays array (with at least one element) are required"
    );
  }

  console.debug(
    `[createCompleteTrainingSheet] Starting with ${payload.trainingDays.length} training days`
  );

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Create TrainingSheet
      const trimmedName = payload.name.trim();
      const publicName = payload.publicName?.trim() || trimmedName;
      const slug = payload.slug?.trim() || slugify(trimmedName);

      const sheet = await tx.trainingSheet.create({
        data: {
          name: trimmedName,
          publicName: publicName,
          slug: slug,
          offlinePdf: payload.offlinePdf?.trim() || undefined,
          newTabPdf: payload.newTabPdf?.trim() || undefined,
          pdfPath: payload.pdfPath?.trim() || undefined,
        },
      });

      console.debug(
        `[createCompleteTrainingSheet] Created TrainingSheet: ${sheet.id}`
      );

      const days: Prisma.TrainingDayGetPayload<object>[] = [];
      const groups: Prisma.ExerciseGroupGetPayload<object>[] = [];
      const methods: Prisma.ExerciseMethodGetPayload<object>[] = [];
      const configurations: Prisma.ExerciseConfigurationGetPayload<object>[] = [];

      // Map to track created/reused groups by their name + categoryId to avoid duplicates
      // Key format: "groupName|categoryId"
      const groupMap = new Map<
        string,
        Prisma.ExerciseGroupGetPayload<{
          include: {
            exerciseMethods: {
              include: {
                exerciseConfigurations: true;
              };
            };
          };
        }>
      >();

      // 2. For each training day
      for (const dayPayload of payload.trainingDays) {
        // Use a unique key for the group (combination of name and categoryId)
        // We check the database for existing groups to reuse them
        const groupName = dayPayload.exerciseGroup.name.trim();
        const groupCategoryId = dayPayload.exerciseGroup.categoryId || null;
        const groupDeduplicationKey = `${groupName}|${groupCategoryId !== null ? groupCategoryId : "null"}`;

        console.debug(
          `[createCompleteTrainingSheet] Processing day ${dayPayload.day}: groupKey=${groupDeduplicationKey}`
        );

        let group = groupMap.get(groupDeduplicationKey);

        // If not in local map, check if it exists in the database
        if (!group) {
          console.debug(
            `[createCompleteTrainingSheet] Checking if group "${groupName}" already exists in DB...`
          );

          // Query the database for an existing group with the same name and categoryId
          const existingGroup = await tx.exerciseGroup.findFirst({
            where: {
              name: groupName,
              categoryId: groupCategoryId,
            },
            include: {
              exerciseMethods: {
                include: {
                  exerciseConfigurations: true,
                },
              },
            },
          });

          if (existingGroup) {
            console.debug(
              `[createCompleteTrainingSheet] FOUND existing ExerciseGroup in DB: ID=${existingGroup.id}, methods=${existingGroup.exerciseMethods.length}`
            );
            group = existingGroup;
            groupMap.set(groupDeduplicationKey, group);
          } else {
            console.debug(
              `[createCompleteTrainingSheet] No existing group found, creating NEW ExerciseGroup: ${groupDeduplicationKey}`
            );
            const newGroup = await tx.exerciseGroup.create({
              data: {
                name: groupName,
                categoryId: groupCategoryId,
              },
            });
            group = {
              ...newGroup,
              exerciseMethods: [],
            };
            groupMap.set(groupDeduplicationKey, group);
            groups.push(newGroup);
            console.debug(
              `[createCompleteTrainingSheet] Created ExerciseGroup ID=${newGroup.id} for key ${groupDeduplicationKey}`
            );

            // 3. Create exercise methods and configurations only for newly created groups
            for (const methodPayload of dayPayload.exerciseGroup
              .exerciseMethods) {
              const method = await tx.exerciseMethod.create({
                data: {
                  rest: methodPayload.rest.trim(),
                  observations: methodPayload.observations?.trim() || undefined,
                  order: methodPayload.order,
                  exerciseGroupId: newGroup.id,
                },
              });
              methods.push(method);

              // 4. For each configuration in the method
              for (const configPayload of methodPayload.exerciseConfigurations) {
                const config = await tx.exerciseConfiguration.create({
                  data: {
                    series: configPayload.series.trim(),
                    reps: configPayload.reps.trim(),
                    exerciseMethodId: method.id,
                    exerciseId: configPayload.exerciseId,
                    methodId: configPayload.methodId || null,
                  },
                });
                configurations.push(config);
              }
            }
          }
        } else {
          console.debug(
            `[createCompleteTrainingSheet] REUSING ExerciseGroup ID=${group.id} for key ${groupDeduplicationKey}`
          );
        }

        // Create TrainingDay linking to sheet and (reused or new) group
        const day = await tx.trainingDay.create({
          data: {
            day: dayPayload.day,
            shortName: dayPayload.shortName?.trim() || undefined,
            trainingSheetId: sheet.id,
            exerciseGroupId: group.id,
          },
        });
        days.push(day);
        console.debug(
          `[createCompleteTrainingSheet] Created TrainingDay ID=${day.id} (day=${dayPayload.day}, groupId=${group.id})`
        );
      }

      console.debug(
        `[createCompleteTrainingSheet] Summary: ${groups.length} groups, ${days.length} days, ${methods.length} methods, ${configurations.length} configs`
      );

      // Verify deduplication worked correctly
      const groupIds = new Set(groups.map((g) => g.id));
      const trainingDayGroupIds = new Set(days.map((d) => d.exerciseGroupId));
      const uniqueGroupsInDays = trainingDayGroupIds.size;
      console.debug(
        `[createCompleteTrainingSheet] Created groups: ${Array.from(groupIds).join(", ")}`
      );
      console.debug(
        `[createCompleteTrainingSheet] Unique groups referenced by TrainingDays: ${uniqueGroupsInDays}`
      );
      console.debug(
        `[createCompleteTrainingSheet] Verification: ${groups.length} groups created ≈ ${uniqueGroupsInDays} unique groups used ${groups.length === uniqueGroupsInDays ? "✓" : "✗ MISMATCH!"}`
      );

      return {
        sheet,
        days,
        groups,
        methods,
        configurations,
      };
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating complete training sheet:", error.message);
    } else {
      console.error("Error creating complete training sheet:", error);
    }
    throw new Error("Failed to create complete training sheet");
  }
}


// ============================================
// Utility Functions
// ============================================

/**
 * Convert a string to a URL-friendly slug.
 * @param str - The string to slugify
 * @returns A lowercase, hyphenated slug with no special characters
 * @example
 * slugify("My Training Sheet") // "my-training-sheet"
 * slugify("Upper Body (2024)") // "upper-body-2024"
 */
function slugify(str: string): string {
  if (!isValidString(str)) {
    return "";
  }

  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export { slugify };
