import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json(apiError("Missing method id"));
  }

  const methodId = parseInt(id, 10);
  if (isNaN(methodId)) {
    return res.status(400).json(apiError("Invalid method id"));
  }

  try {
    if (req.method === "GET") {
      const method = await prisma.method.findUnique({ where: { id: methodId } });
      if (!method) return res.status(404).json(apiError("Not found"));
      return res.status(200).json(apiSuccess(method));
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      const { name, description } = req.body ?? {};

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json(apiError("Name is required."));
      }

      if (!description || typeof description !== "string" || !description.trim()) {
        return res.status(400).json(apiError("Description is required."));
      }

      const updated = await prisma.method.update({
        where: { id: methodId },
        data: {
          name: name.trim(),
          description: description.trim(),
        },
      });

      return res.status(200).json(apiSuccess(updated));
    }

    if (req.method === "DELETE") {
      await prisma.method.delete({ where: { id: methodId } });
      return res.status(204).end();
    }

    res.setHeader("Allow", ["GET", "PUT", "PATCH", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error(`/api/db/methods/${id} error`, err);
    return res.status(500).json(apiError("Internal server error"));
  }
}
