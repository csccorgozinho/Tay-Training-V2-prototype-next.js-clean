import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-middleware";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Require authentication
  const session = await requireAuth(req, res as NextApiResponse<ApiResponse<any>>);
  if (!session) return;

  if (req.method !== "GET") {
    return res.status(405).json(apiError("Method not allowed"));
  }

  try {
    const { slug } = req.query;

    if (!slug || typeof slug !== "string") {
      return res.status(400).json(apiError("Slug is required"));
    }

    const sheet = await prisma.trainingSheet.findFirst({
      where: { slug },
      select: {
        id: true,
        name: true,
        publicName: true,
        slug: true,
        pdfPath: true,
      },
    });

    if (!sheet) {
      return res.status(404).json(apiError("Training sheet not found"));
    }

    return res.status(200).json(apiSuccess(sheet));
  } catch (error) {
    console.error("Training sheet by slug API error:", error);
    return res.status(500).json(apiError("Internal server error"));
  }
}
