import { NextApiRequest, NextApiResponse } from "next";
import { fetchAvailableWorkoutSheets } from "@/lib/simple-training-schedule";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      const sheets = await fetchAvailableWorkoutSheets();
      return res.status(200).json(apiSuccess(sheets, { count: sheets.length }));
    }

    return res.status(405).json(apiError("Method not allowed"));
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json(
      apiError(
        error instanceof Error
          ? error.message
          : "Failed to fetch workout sheets"
      )
    );
  }
}
