import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ============================================
// Types
// ============================================

export interface CreateTrainingSheetInput {
  name: string;
  publicName?: string;
  slug?: string;
}

export interface CreateTrainingDayInput {
  day: number;
  shortName?: string;
  trainingSheetId: number;
  exerciseGroupId: number;
}

export interface CreateExerciseGroupInput {
  name: string;
  categoryId?: number | null;
  publicName?: string;
}

export interface CreateExerciseMethodInput {
  rest: string;
  observations?: string;
  order?: number;
  exerciseGroupId: number;
}

export interface CreateExerciseConfigurationInput {
  series: string;
  reps: string;
  exerciseMethodId: number;
  exerciseId: number;
  methodId?: number;
}

export interface UpdateTrainingSheetInput {
  name?: string;
  publicName?: string;
  slug?: string;
}

export interface UpdateExerciseGroupInput {
  name?: string;
  publicName?: string;
}

export interface UpdateExerciseMethodInput {
  rest?: string;
  observations?: string;
  order?: number;
}

export interface UpdateExerciseConfigurationInput {
  series?: string;
  reps?: string;
  methodId?: number | null;
}

// ============================================
// TrainingSheet Operations
// ============================================

/**
 * Create a new training sheet
 */
export async function createTrainingSheet(input: CreateTrainingSheetInput) {
  return prisma.trainingSheet.create({
    data: {
      name: input.name,
      publicName: input.publicName || input.name,
      slug: input.slug || slugify(input.name),
    },
  });
}

/**
 * Get a training sheet with all its nested relations
 */
export async function getTrainingSheetFull(id: number) {
  return prisma.trainingSheet.findUnique({
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
}

/**
 * Update a training sheet
 */
export async function updateTrainingSheet(
  id: number,
  input: UpdateTrainingSheetInput
) {
  return prisma.trainingSheet.update({
    where: { id },
    data: {
      name: input.name,
      publicName: input.publicName,
      slug: input.slug,
    },
  });
}

/**
 * Delete a training sheet and all its nested data (cascading)
 */
export async function deleteTrainingSheet(id: number) {
  return prisma.trainingSheet.delete({
    where: { id },
  });
}

// ============================================
// TrainingDay Operations
// ============================================

/**
 * Create a training day
 */
export async function createTrainingDay(input: CreateTrainingDayInput) {
  return prisma.trainingDay.create({
    data: {
      day: input.day,
      shortName: input.shortName,
      trainingSheetId: input.trainingSheetId,
      exerciseGroupId: input.exerciseGroupId,
    },
  });
}

/**
 * Get a training day with all its nested relations
 */
export async function getTrainingDayFull(id: number) {
  return prisma.trainingDay.findUnique({
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
}

/**
 * Update a training day
 */
export async function updateTrainingDay(
  id: number,
  input: Partial<CreateTrainingDayInput>
) {
  return prisma.trainingDay.update({
    where: { id },
    data: {
      day: input.day,
      shortName: input.shortName,
    },
  });
}

/**
 * Delete a training day
 */
export async function deleteTrainingDay(id: number) {
  return prisma.trainingDay.delete({
    where: { id },
  });
}

// ============================================
// ExerciseGroup Operations
// ============================================

/**
 * Create an exercise group
 */
export async function createExerciseGroup(input: CreateExerciseGroupInput) {
  return prisma.exerciseGroup.create({
    data: {
      name: input.name,
      categoryId: input.categoryId || null,
      publicName: input.publicName,
    },
  });
}

/**
 * Get exercise group with all methods and configurations
 */
export async function getExerciseGroupFull(id: number) {
  return prisma.exerciseGroup.findUnique({
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
}

/**
 * Update exercise group
 */
export async function updateExerciseGroup(
  id: number,
  input: UpdateExerciseGroupInput
) {
  return prisma.exerciseGroup.update({
    where: { id },
    data: {
      name: input.name,
      publicName: input.publicName,
    },
  });
}

/**
 * Delete exercise group (cascades to methods and configs)
 */
export async function deleteExerciseGroup(id: number) {
  return prisma.exerciseGroup.delete({
    where: { id },
  });
}

// ============================================
// ExerciseMethod Operations
// ============================================

/**
 * Create an exercise method
 */
export async function createExerciseMethod(input: CreateExerciseMethodInput) {
  return prisma.exerciseMethod.create({
    data: {
      rest: input.rest,
      observations: input.observations,
      order: input.order,
      exerciseGroupId: input.exerciseGroupId,
    },
  });
}

/**
 * Get exercise method with configurations
 */
export async function getExerciseMethodFull(id: number) {
  return prisma.exerciseMethod.findUnique({
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
}

/**
 * Update exercise method
 */
export async function updateExerciseMethod(
  id: number,
  input: UpdateExerciseMethodInput
) {
  return prisma.exerciseMethod.update({
    where: { id },
    data: {
      rest: input.rest,
      observations: input.observations,
      order: input.order,
    },
  });
}

/**
 * Delete exercise method (cascades to configurations)
 */
export async function deleteExerciseMethod(id: number) {
  return prisma.exerciseMethod.delete({
    where: { id },
  });
}

// ============================================
// ExerciseConfiguration Operations
// ============================================

/**
 * Create exercise configuration
 */
export async function createExerciseConfiguration(
  input: CreateExerciseConfigurationInput
) {
  return prisma.exerciseConfiguration.create({
    data: {
      series: input.series,
      reps: input.reps,
      exerciseMethodId: input.exerciseMethodId,
      exerciseId: input.exerciseId,
      methodId: input.methodId || null,
    },
  });
}

/**
 * Get exercise configuration with relations
 */
export async function getExerciseConfigurationFull(id: number) {
  return prisma.exerciseConfiguration.findUnique({
    where: { id },
    include: {
      exercise: true,
      method: true,
      exerciseMethod: true,
    },
  });
}

/**
 * Update exercise configuration
 */
export async function updateExerciseConfiguration(
  id: number,
  input: UpdateExerciseConfigurationInput
) {
  return prisma.exerciseConfiguration.update({
    where: { id },
    data: {
      series: input.series,
      reps: input.reps,
      methodId: input.methodId,
    },
  });
}

/**
 * Delete exercise configuration
 */
export async function deleteExerciseConfiguration(id: number) {
  return prisma.exerciseConfiguration.delete({
    where: { id },
  });
}

// ============================================
// Bulk Operations with Transactions
// ============================================

export interface TrainingSheetPayload {
  name: string;
  publicName?: string;
  slug?: string;
  trainingDays: Array<{
    day: number;
    shortName?: string;
    exerciseGroup: {
      name: string;
      categoryId: number;
      publicName?: string;
      exerciseMethods: Array<{
        rest: string;
        observations?: string;
        order?: number;
        exerciseConfigurations: Array<{
          series: string;
          reps: string;
          exerciseId: number;
          methodId?: number;
        }>;
      }>;
    };
  }>;
}

/**
 * Create a complete training sheet with all nested relations in a transaction
 * Returns the full structure for optimistic UI
 */
export async function createCompleteTrainingSheet(
  payload: TrainingSheetPayload
) {
  console.debug(`[createCompleteTrainingSheet] Starting with ${payload.trainingDays.length} training days`);
  
  return prisma.$transaction(async (tx) => {
    // 1. Create TrainingSheet
    const sheet = await tx.trainingSheet.create({
      data: {
        name: payload.name,
        publicName: payload.publicName || payload.name,
        slug: payload.slug || slugify(payload.name),
      },
    });
    
    console.debug(`[createCompleteTrainingSheet] Created TrainingSheet: ${sheet.id}`);

    const days = [];
    const groups = [];
    const methods = [];
    const configurations = [];

    // Map to track created/reused groups by their name + categoryId to avoid duplicates
    // Key format: "groupName|categoryId"
    const groupMap = new Map<string, any>();

    // 2. For each training day
    for (const dayPayload of payload.trainingDays) {
      // Use a unique key for the group (combination of name and categoryId)
      // We check the database for existing groups to reuse them
      const groupDeduplicationKey = `${dayPayload.exerciseGroup.name}|${dayPayload.exerciseGroup.categoryId || 'null'}`;
      
      console.debug(`[createCompleteTrainingSheet] Processing day ${dayPayload.day}: groupKey=${groupDeduplicationKey}`);
      
      let group = groupMap.get(groupDeduplicationKey);
      
      // If not in local map, check if it exists in the database
      if (!group) {
        console.debug(`[createCompleteTrainingSheet] Checking if group "${dayPayload.exerciseGroup.name}" already exists in DB...`);
        
        // Query the database for an existing group with the same name and categoryId
        const existingGroup = await tx.exerciseGroup.findFirst({
          where: {
            name: dayPayload.exerciseGroup.name,
            categoryId: dayPayload.exerciseGroup.categoryId || null,
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
          console.debug(`[createCompleteTrainingSheet] FOUND existing ExerciseGroup in DB: ID=${existingGroup.id}, methods=${existingGroup.exerciseMethods.length}`);
          group = existingGroup;
          groupMap.set(groupDeduplicationKey, group);
        } else {
          console.debug(`[createCompleteTrainingSheet] No existing group found, creating NEW ExerciseGroup: ${groupDeduplicationKey}`);
          group = await tx.exerciseGroup.create({
            data: {
              name: dayPayload.exerciseGroup.name,
              categoryId: dayPayload.exerciseGroup.categoryId || null,
            },
          });
          groupMap.set(groupDeduplicationKey, group);
          groups.push(group);
          console.debug(`[createCompleteTrainingSheet] Created ExerciseGroup ID=${group.id} for key ${groupDeduplicationKey}`);

          // 3. Create exercise methods and configurations only for newly created groups
          for (const methodPayload of dayPayload.exerciseGroup.exerciseMethods) {
            const method = await tx.exerciseMethod.create({
              data: {
                rest: methodPayload.rest,
                observations: methodPayload.observations,
                order: methodPayload.order,
                exerciseGroupId: group.id,
              },
            });
            methods.push(method);

            // 4. For each configuration in the method
            for (const configPayload of methodPayload.exerciseConfigurations) {
              const config = await tx.exerciseConfiguration.create({
                data: {
                  series: configPayload.series,
                  reps: configPayload.reps,
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
        console.debug(`[createCompleteTrainingSheet] REUSING ExerciseGroup ID=${group.id} for key ${groupDeduplicationKey}`);
      }

      // Create TrainingDay linking to sheet and (reused or new) group
      const day = await tx.trainingDay.create({
        data: {
          day: dayPayload.day,
          shortName: dayPayload.shortName,
          trainingSheetId: sheet.id,
          exerciseGroupId: group.id,
        },
      });
      days.push(day);
      console.debug(`[createCompleteTrainingSheet] Created TrainingDay ID=${day.id} (day=${dayPayload.day}, groupId=${group.id})`);
    }

    console.debug(`[createCompleteTrainingSheet] Summary: ${groups.length} groups, ${days.length} days, ${methods.length} methods, ${configurations.length} configs`);
    
    // Verify deduplication worked correctly
    const groupIds = new Set(groups.map(g => g.id));
    const trainingDayGroupIds = new Set(days.map(d => d.exerciseGroupId));
    const uniqueGroupsInDays = trainingDayGroupIds.size;
    console.debug(`[createCompleteTrainingSheet] Created groups: ${Array.from(groupIds).join(', ')}`);
    console.debug(`[createCompleteTrainingSheet] Unique groups referenced by TrainingDays: ${uniqueGroupsInDays}`);
    console.debug(`[createCompleteTrainingSheet] Verification: ${groups.length} groups created ≈ ${uniqueGroupsInDays} unique groups used ${groups.length === uniqueGroupsInDays ? '✓' : '✗ MISMATCH!'}`);

    return {
      sheet,
      days,
      groups,
      methods,
      configurations,
    };
  });
}

// ============================================
// Utility Functions
// ============================================

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export { slugify };
