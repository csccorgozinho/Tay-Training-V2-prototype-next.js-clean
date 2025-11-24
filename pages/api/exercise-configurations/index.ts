import { NextApiRequest, NextApiResponse } from "next";
import {
  createExerciseConfiguration,
  getExerciseConfigurationFull,
} from "@/lib/training-sheet-service";
import { ZodError } from "zod";
import { z } from "zod";

const CreateExerciseConfigurationSchema = z.object({
  series: z.string().min(1),
  reps: z.string().min(1),
  exerciseMethodId: z.number().int(),
  exerciseId: z.number().int(),
  methodId: z.number().int(),
});

const UpdateExerciseConfigurationSchema = z.object({
  series: z.string().optional(),
  reps: z.string().optional(),
  methodId: z.number().int().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // POST - Create a new exercise configuration
    if (req.method === "POST") {
      const validatedData = CreateExerciseConfigurationSchema.parse(req.body);

      const created = await createExerciseConfiguration(
        validatedData as any
      );
      const full = await getExerciseConfigurationFull(created.id);

      return res.status(201).json({
        success: true,
        data: full,
      });
    }

    // GET - List all exercise configurations (with optional filtering)
    else if (req.method === "GET") {
      const { exerciseMethodId } = req.query;

      // If a specific method is requested, filter by it
      if (exerciseMethodId) {
        const prisma = (await import("@/lib/prisma")).default;
        const configurations = await prisma.exerciseConfiguration.findMany({
          where: {
            exerciseMethodId: parseInt(exerciseMethodId as string),
          },
          include: {
            exercise: true,
            method: true,
            exerciseMethod: {
              include: {
                exerciseGroup: true,
              },
            },
          },
        });

        return res.status(200).json({
          success: true,
          data: configurations,
        });
      }

      // Otherwise return all configurations
      const prisma = (await import("@/lib/prisma")).default;
      const configurations = await prisma.exerciseConfiguration.findMany({
        include: {
          exercise: true,
          method: true,
          exerciseMethod: {
            include: {
              exerciseGroup: true,
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        data: configurations,
      });
    }

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("Exercise configuration API error:", error);

    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
