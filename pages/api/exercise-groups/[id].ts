import { NextApiRequest, NextApiResponse } from "next";
import {
  getExerciseGroupFull,
  updateExerciseGroup,
  deleteExerciseGroup,
} from "@/lib/training-sheet-service";
import { ZodError } from "zod";
import { z } from "zod";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";

const UpdateExerciseGroupSchema = z.object({
  name: z.string().min(1).optional(),
  publicName: z.string().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json(apiError("Exercise group ID is required"));
    }

    const groupId = parseInt(id);

    // GET - Retrieve a specific exercise group
    if (req.method === "GET") {
      const group = await getExerciseGroupFull(groupId);

      if (!group) {
        return res.status(404).json(apiError("Exercise group not found"));
      }

      return res.status(200).json(apiSuccess(group));
    }

    // PUT - Update a specific exercise group
    else if (req.method === "PUT") {
      const validatedData = UpdateExerciseGroupSchema.parse(req.body);

      await updateExerciseGroup(groupId, validatedData);
      const full = await getExerciseGroupFull(groupId);

      return res.status(200).json(apiSuccess(full));
    }

    // DELETE - Delete a specific exercise group
    else if (req.method === "DELETE") {
      await deleteExerciseGroup(groupId);

      return res.status(200).json(apiSuccess({ message: "Exercise group deleted successfully" }));
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
