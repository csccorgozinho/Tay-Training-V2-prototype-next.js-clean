import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  try {
    if (req.method === "GET") {
      const methods = await prisma.method.findMany({
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json(apiSuccess(methods, { count: methods.length }));
    }

    if (req.method === "POST") {
      const { name, description } = req.body ?? {};

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json(apiError("Name is required."));
      }

      if (!description || typeof description !== "string" || !description.trim()) {
        return res.status(400).json(apiError("Description is required."));
      }

      const created = await prisma.method.create({
        data: {
          name: name.trim(),
          description: description.trim(),
        },
      });

      return res.status(201).json(apiSuccess(created));
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error("/api/db/methods error", err);
    return res.status(500).json(apiError("Internal server error"));
  }
}
