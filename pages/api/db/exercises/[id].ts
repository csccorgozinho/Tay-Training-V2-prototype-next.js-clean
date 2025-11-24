import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json(apiError("Missing exercise id"));
  }

  const exerciseId = parseInt(id, 10);
  if (isNaN(exerciseId)) {
    return res.status(400).json(apiError("Invalid exercise id"));
  }

  try {
    if (req.method === "GET") {
      const exercise = await prisma.exercise.findUnique({
        where: { id: exerciseId },
      });
      if (!exercise) return res.status(404).json(apiError("Not found"));
      return res.status(200).json(apiSuccess(exercise));
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      const { name, description, videoUrl, hasMethod } = req.body ?? {};

      if (!description || typeof description !== "string" || !description.trim()) {
        return res.status(400).json(apiError("Description is required."));
      }

      const updated = await prisma.exercise.update({
        where: { id: exerciseId },
        data: {
          name:
            typeof name === "string"
              ? name
              : name === null
                ? null
                : undefined,
          description: description.trim(),
          videoUrl:
            typeof videoUrl === "string"
              ? videoUrl
              : videoUrl === null
                ? null
                : undefined,
          hasMethod: typeof hasMethod === "boolean" ? hasMethod : undefined,
        },
      });

      return res.status(200).json(apiSuccess(updated));
    }

    if (req.method === "DELETE") {
      await prisma.exercise.delete({ where: { id: exerciseId } });
      return res.status(204).end();
    }

    res.setHeader("Allow", ["GET", "PUT", "PATCH", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error(`/api/db/exercises/${id} error`, err);
    return res.status(500).json(apiError("Internal server error"));
  }
}
