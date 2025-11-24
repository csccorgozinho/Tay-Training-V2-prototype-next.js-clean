import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import {
  createExerciseGroup,
  getExerciseGroupFull,
  updateExerciseGroup,
  deleteExerciseGroup,
  createExerciseMethod,
  createExerciseConfiguration,
} from "@/lib/training-sheet-service";
import { ZodError } from "zod";
import { z } from "zod";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";

const CreateExerciseGroupSchema = z.object({
  name: z.string().min(1),
  categoryId: z.number().int().positive(),
  publicName: z.string().optional(),
  exerciseMethods: z.array(z.object({
    rest: z.string().optional(),
    observations: z.string().optional(),
    exerciseConfigurations: z.array(z.object({
      exerciseId: z.number().int().positive(),
      methodId: z.number().int().positive().optional(),
      series: z.string(),
      reps: z.string(),
    })),
  })).optional(),
});

const UpdateExerciseGroupSchema = z.object({
  name: z.string().min(1).optional(),
  publicName: z.string().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // GET - List exercise groups
      if (req.method === "GET") {
      const { categoryId } = req.query;
      const groups = await prisma.exerciseGroup.findMany({
        where: categoryId && categoryId !== "all" ? { categoryId: parseInt(categoryId as string) } : undefined,
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
      return res.status(200).json(apiSuccess(groups, { count: groups.length }));
    }    // POST - Create a new exercise group
    if (req.method === "POST") {
      const validatedData = CreateExerciseGroupSchema.parse(req.body);

      const group = await createExerciseGroup({
        name: validatedData.name,
        categoryId: validatedData.categoryId,
        publicName: validatedData.publicName,
      });

      // Create exercise methods and configurations if provided
      if (validatedData.exerciseMethods && validatedData.exerciseMethods.length > 0) {
        for (let methodIdx = 0; methodIdx < validatedData.exerciseMethods.length; methodIdx++) {
          const methodData = validatedData.exerciseMethods[methodIdx];
          const method = await createExerciseMethod({
            rest: methodData.rest || "60s",
            observations: methodData.observations || "",
            order: methodIdx + 1,
            exerciseGroupId: group.id,
          });

          // Create configurations for this method
          if (methodData.exerciseConfigurations && methodData.exerciseConfigurations.length > 0) {
            for (const config of methodData.exerciseConfigurations) {
              await createExerciseConfiguration({
                series: config.series,
                reps: config.reps,
                exerciseMethodId: method.id,
                exerciseId: config.exerciseId,
                methodId: config.methodId,
              });
            }
          }
        }
      }

      const full = await getExerciseGroupFull(group.id);

      return res.status(201).json(apiSuccess(full));
    }

    return res.status(405).json(apiError("Method not allowed"));
  } catch (error) {
    console.error("Exercise group API error:", error);

    if (error instanceof ZodError) {
      return res.status(400).json(apiError("Validation error"));
    }

    return res.status(500).json(apiError("Internal server error"));
  }
}
