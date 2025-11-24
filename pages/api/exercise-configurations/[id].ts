import { NextApiRequest, NextApiResponse } from "next";
import {
  getExerciseConfigurationFull,
  updateExerciseConfiguration,
  deleteExerciseConfiguration,
} from "@/lib/training-sheet-service";
import { ZodError } from "zod";
import { z } from "zod";

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
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        error: "Exercise configuration ID is required",
      });
    }

    const configId = parseInt(id);

    // GET - Retrieve a specific exercise configuration
    if (req.method === "GET") {
      const config = await getExerciseConfigurationFull(configId);

      if (!config) {
        return res.status(404).json({
          success: false,
          error: "Exercise configuration not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: config,
      });
    }

    // PUT - Update a specific exercise configuration
    else if (req.method === "PUT") {
      const validatedData = UpdateExerciseConfigurationSchema.parse(req.body);

      await updateExerciseConfiguration(configId, validatedData as any);
      const full = await getExerciseConfigurationFull(configId);

      return res.status(200).json({
        success: true,
        data: full,
      });
    }

    // DELETE - Delete a specific exercise configuration
    else if (req.method === "DELETE") {
      await deleteExerciseConfiguration(configId);

      return res.status(200).json({
        success: true,
        message: "Exercise configuration deleted successfully",
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
