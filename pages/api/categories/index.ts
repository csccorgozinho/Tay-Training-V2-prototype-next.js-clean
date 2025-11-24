import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  try {
    // GET - Fetch all exercise group categories
    if (req.method === "GET") {
      const categories = await prisma.exerciseGroupCategory.findMany({
        orderBy: {
          name: "asc",
        },
      });

      return res.status(200).json(apiSuccess(categories, { count: categories.length }));
    }

    return res.status(405).json(apiError("Method not allowed"));
  } catch (error) {
    console.error("Categories API error:", error);
    return res.status(500).json(apiError("Internal server error"));
  }
}
