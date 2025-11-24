import { z } from "zod";

// ============================================
// Zod Schemas for Validation
// ============================================

// ExerciseConfiguration schema
export const ExerciseConfigurationSchema = z.object({
  series: z.string().min(1, "Series must not be empty"),
  reps: z.string().min(1, "Reps must not be empty"),
  exerciseId: z.number().int().positive("Exercise ID must be positive"),
  methodId: z.number().int().positive().optional(),
});

// ExerciseMethod schema
export const ExerciseMethodSchema = z.object({
  rest: z.string().min(1, "Rest time must not be empty"),
  observations: z.string().optional(),
  order: z.number().int().optional(),
  exerciseConfigurations: z
    .array(ExerciseConfigurationSchema)
    .min(1, "At least one exercise configuration is required"),
});

// ExerciseGroup schema
export const ExerciseGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  categoryId: z.number().int().positive("Category ID must be positive").optional().nullable(),
  publicName: z.string().optional(),
  exerciseMethods: z
    .array(ExerciseMethodSchema)
    .min(1, "At least one exercise method is required"),
});

// TrainingDay schema
export const TrainingDaySchema = z.object({
  day: z.number().int().positive("Day must be a positive number"),
  shortName: z.string().optional(),
  exerciseGroup: ExerciseGroupSchema,
});

// TrainingSheet creation schema
export const CreateTrainingSheetSchema = z.object({
  name: z.string().min(1, "Training sheet name is required"),
  publicName: z.string().optional(),
  slug: z.string().optional(),
  trainingDays: z
    .array(TrainingDaySchema)
    .min(1, "At least one training day is required"),
});

// TrainingSheet update schema
export const UpdateTrainingSheetSchema = z.object({
  name: z.string().min(1).optional(),
  publicName: z.string().optional(),
  slug: z.string().optional(),
});

// Individual update schemas
export const UpdateExerciseMethodSchema = z.object({
  rest: z.string().min(1).optional(),
  observations: z.string().optional(),
  order: z.number().int().optional(),
});

export const UpdateExerciseConfigurationSchema = z.object({
  series: z.string().min(1).optional(),
  reps: z.string().min(1).optional(),
  methodId: z.number().int().positive().optional().nullable(),
});

// Type exports for TypeScript
export type ExerciseConfiguration = z.infer<typeof ExerciseConfigurationSchema>;
export type ExerciseMethod = z.infer<typeof ExerciseMethodSchema>;
export type ExerciseGroup = z.infer<typeof ExerciseGroupSchema>;
export type TrainingDay = z.infer<typeof TrainingDaySchema>;
export type CreateTrainingSheetInput = z.infer<
  typeof CreateTrainingSheetSchema
>;
export type UpdateTrainingSheetInput = z.infer<
  typeof UpdateTrainingSheetSchema
>;
export type UpdateExerciseMethod = z.infer<typeof UpdateExerciseMethodSchema>;
export type UpdateExerciseConfiguration = z.infer<
  typeof UpdateExerciseConfigurationSchema
>;
