import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import {
  getTrainingSheetFull,
  deleteTrainingSheet,
  createCompleteTrainingSheet,
} from "@/lib/training-sheet-service";
import { CreateTrainingSheetSchema } from "@/lib/training-sheet-schema";
import { ZodError } from "zod";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        error: "Training sheet ID is required",
      });
    }

    const sheetId = parseInt(id);

    // GET - Retrieve a specific training sheet
    if (req.method === "GET") {
      const sheet = await getTrainingSheetFull(sheetId);

      if (!sheet) {
        return res.status(404).json({
          success: false,
          error: "Training sheet not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: sheet,
      });
    }

    // PUT - Update a specific training sheet with full nested structure
    else if (req.method === "PUT") {
      const validatedData = CreateTrainingSheetSchema.parse(req.body);

      // Use transaction to safely update the sheet and all its relations
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update the training sheet metadata
        const updatedSheet = await tx.trainingSheet.update({
          where: { id: sheetId },
          data: {
            name: validatedData.name,
            publicName: validatedData.publicName || validatedData.name,
            slug: validatedData.slug,
          },
        });

        // 2. Delete all existing training days (cascade will handle methods and configs)
        await tx.trainingDay.deleteMany({
          where: { trainingSheetId: sheetId },
        });

        // 3. Create new training days with updated data
        for (const dayPayload of validatedData.trainingDays) {
          // Create ExerciseGroup
          const group = await tx.exerciseGroup.create({
            data: {
              name: dayPayload.exerciseGroup.name,
              categoryId: dayPayload.exerciseGroup.categoryId || null,
            },
          });

          // Create TrainingDay linking to existing sheet and new group
          await tx.trainingDay.create({
            data: {
              day: dayPayload.day,
              shortName: dayPayload.shortName,
              trainingSheetId: sheetId,
              exerciseGroupId: group.id,
            },
          });

          // Create exercise methods and configurations
          for (const methodPayload of dayPayload.exerciseGroup.exerciseMethods) {
            const method = await tx.exerciseMethod.create({
              data: {
                rest: methodPayload.rest,
                observations: methodPayload.observations,
                order: methodPayload.order,
                exerciseGroupId: group.id,
              },
            });

            for (const configPayload of methodPayload.exerciseConfigurations) {
              await tx.exerciseConfiguration.create({
                data: {
                  series: configPayload.series,
                  reps: configPayload.reps,
                  exerciseMethodId: method.id,
                  exerciseId: configPayload.exerciseId,
                  methodId: configPayload.methodId || null,
                },
              });
            }
          }
        }

        return updatedSheet;
      });

      // Fetch and return the complete updated sheet
      const fullSheet = await getTrainingSheetFull(sheetId);

      return res.status(200).json({
        success: true,
        data: fullSheet,
      });
    }

    // DELETE - Delete a specific training sheet
    else if (req.method === "DELETE") {
      await deleteTrainingSheet(sheetId);

      return res.status(200).json({
        success: true,
        message: "Training sheet deleted successfully",
      });
    }

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("Training sheet API error:", error);

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
