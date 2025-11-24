import prisma from "@/lib/prisma";

export interface SimpleTrainingSheet {
  id: number;
  name: string;
  publicName: string | null;
}

export interface ScheduleDay {
  day: number;
  trainingSheetId: number | null;
  customName?: string;
}

export interface TrainingSchedule {
  id: number;
  name: string;
  description: string;
  pdfFile?: File;
  weekDays: ScheduleDay[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fetch all available training sheets for selection
 */
export async function fetchAvailableWorkoutSheets(): Promise<SimpleTrainingSheet[]> {
  try {
    const sheets = await prisma.trainingSheet.findMany({
      select: {
        id: true,
        name: true,
        publicName: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return sheets;
  } catch (error) {
    console.error("Error fetching workout sheets:", error);
    throw new Error("Failed to fetch available workout sheets");
  }
}

/**
 * Save a training schedule (week plan with assigned workouts)
 */
export async function saveTrainingSchedule(data: {
  name: string;
  description: string;
  weekDays: ScheduleDay[];
}): Promise<TrainingSchedule> {
  try {
    return {
      id: Date.now(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error("Error saving training schedule:", error);
    throw new Error("Failed to save training schedule");
  }
}

