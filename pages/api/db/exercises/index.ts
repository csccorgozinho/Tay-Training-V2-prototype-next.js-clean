import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  try {
    if (req.method === "GET") {
      const exercises = await prisma.exercise.findMany({
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json(apiSuccess(exercises, { count: exercises.length }));
    }

    if (req.method === "POST") {
      const { name, description, videoUrl, hasMethod } = req.body ?? {};

      if (!description || typeof description !== "string" || !description.trim()) {
        return res
          .status(400)
          .json(apiError("Description is required."));
      }

      const created = await prisma.exercise.create({
        data: {
          name: name && typeof name === "string" ? name : null,
          description: description.trim(),
          videoUrl: videoUrl && typeof videoUrl === "string" ? videoUrl : null,
          hasMethod: typeof hasMethod === "boolean" ? hasMethod : true,
        },
      });

      return res.status(201).json(apiSuccess(created));
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error("/api/db/exercises error", err);
    return res.status(500).json(apiError("Internal server error"));
  }
}