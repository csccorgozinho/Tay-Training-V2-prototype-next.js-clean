import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // Insert default category
    const category = await prisma.exerciseGroupCategory.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: "General",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Default category created",
      category,
    });
  } catch (err) {
    console.error("/api/init-db error:", err);
    return res.status(500).json({ 
      success: false,
      error: err instanceof Error ? err.message : "Failed to initialize database" 
    });
  }
}
