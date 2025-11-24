import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import {
  createCompleteTrainingSheet,
  getTrainingSheetFull,
  updateTrainingSheet,
  deleteTrainingSheet,
  UpdateTrainingSheetInput,
} from "@/lib/training-sheet-service";
import {
  CreateTrainingSheetSchema,
  UpdateTrainingSheetSchema,
} from "@/lib/training-sheet-schema";
import { ZodError } from "zod";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // POST - Create a new training sheet with all nested relations
    if (req.method === "POST") {
      const validatedData = CreateTrainingSheetSchema.parse(req.body);

      const result = await createCompleteTrainingSheet(validatedData as any);

      return res.status(201).json(apiSuccess(result));
    }

    // PUT - Update training sheet
    else if (req.method === "PUT") {
      const { id } = req.query;

      if (!id || typeof id !== "string") {
        return res.status(400).json(apiError("Training sheet ID is required"));
      }

      const validatedData = UpdateTrainingSheetSchema.parse(req.body);

      const updated = await updateTrainingSheet(
        parseInt(id),
        validatedData as UpdateTrainingSheetInput
      );

      const full = await getTrainingSheetFull(updated.id);

      return res.status(200).json(apiSuccess(full));
    }

    // GET - Retrieve training sheets
    else if (req.method === "GET") {
      const { id } = req.query;

      // If ID is provided, get a specific sheet
      if (id) {
        if (typeof id !== "string") {
          return res.status(400).json(apiError("Training sheet ID is required"));
        }

        const sheet = await getTrainingSheetFull(parseInt(id));

        if (!sheet) {
          return res.status(404).json(apiError("Training sheet not found"));
        }

        return res.status(200).json(apiSuccess(sheet));
      }

      // Otherwise, get all training sheets
      const sheets = await prisma.trainingSheet.findMany({
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
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json(apiSuccess(sheets, { count: sheets.length }));
    }

    // DELETE - Delete a training sheet
    else if (req.method === "DELETE") {
      const { id } = req.query;

      if (!id || typeof id !== "string") {
        return res.status(400).json(apiError("Training sheet ID is required"));
      }

      await deleteTrainingSheet(parseInt(id));

      return res.status(200).json(apiSuccess({ message: "Training sheet deleted successfully" }));
    }

    return res.status(405).json(apiError("Method not allowed"));
  } catch (error) {
    console.error("Training sheet API error:", error);

    if (error instanceof ZodError) {
      return res.status(400).json(apiError("Validation error"));
    }

    return res.status(500).json(apiError("Internal server error"));
  }
}
