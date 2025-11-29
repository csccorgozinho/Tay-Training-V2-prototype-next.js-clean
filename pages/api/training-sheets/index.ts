"use strict";

/**
 * File: training-sheets/index.ts
 * Description: API endpoint for training sheet collection operations.
 *              Handles listing, creating, updating, and deleting training sheets.
 *              Supports file uploads for PDF attachments using multipart/form-data.
 *              Training sheets represent complete workout programs with multiple days.
 * 
 * Responsibilities:
 *   - Authenticate all requests (GET, POST, PUT, DELETE require authentication)
 *   - GET: Fetch paginated list of training sheets or single sheet by ID
 *   - POST: Create new training sheet with nested structure and optional PDF upload
 *   - PUT: Update training sheet metadata and optionally replace PDF file
 *   - DELETE: Remove training sheet and associated PDF file
 *   - Parse multipart/form-data for file uploads (POST, PUT)
 *   - Validate pagination parameters (page, pageSize)
 *   - Enforce pagination limits (max 100 items per page)
 *   - Handle PDF file uploads and deletions
 *   - Return total count for client-side pagination UI
 *   - Include full nested relations in responses
 * 
 * Called by:
 *   - Training sheets page component (src/pages/WorkoutSheets.tsx)
 *   - Training sheet dialog component (src/components/dialogs/TrainingSheetDialog.tsx)
 *   - Workout sheet management components
 *   - API client utilities (src/lib/api-client.ts)
 * 
 * Notes:
 *   - All methods require authentication
 *   - Body parser is disabled to support multipart/form-data file uploads
 *   - POST expects trainingDays as JSON string in form data
 *   - PUT with file upload deletes old PDF file before uploading new one
 *   - Default pagination: page=1, pageSize=10
 *   - Maximum pageSize is capped at 100 to prevent performance issues
 *   - Sheets ordered by creation date (newest first)
 *   - GET with id parameter returns single sheet, without id returns paginated list
 *   - Returns 201 Created for successful POST operations
 *   - Complex nested structure: Sheet → Days → Groups → Methods → Configurations
 *   - formidable returns field values as arrays, must extract first element
 */

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-middleware";
import {
  createCompleteTrainingSheet,
  getTrainingSheetFull,
  updateTrainingSheet,
  deleteTrainingSheet,
  type UpdateTrainingSheetInput,
} from "@/lib/training-sheet-service";
import {
  CreateTrainingSheetSchema,
  UpdateTrainingSheetSchema,
} from "@/lib/training-sheet-schema";
import { ZodError, z } from "zod";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";
import { parseForm, getPublicFilePath, deleteFile } from "@/lib/file-upload";

// Disable body parser for file upload
export const config = {
  api: {
    bodyParser: false,
  },
};

// Pagination configuration constants
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const MIN_PAGE_SIZE = 1;

/**
 * Type representing validated training sheet creation data
 */
type CreateTrainingSheetData = z.infer<typeof CreateTrainingSheetSchema>;

/**
 * Type representing validated training sheet update data
 */
type UpdateTrainingSheetData = z.infer<typeof UpdateTrainingSheetSchema>;

/**
 * Extracts first value from formidable field (which can be string or array)
 * @param field - Field value from formidable (string | string[] | undefined)
 * @returns First string value or undefined
 */
function extractFormField(field: string | string[] | undefined): string | undefined {
  if (Array.isArray(field)) {
    return field[0];
  }
  return field;
}

/**
 * Parses and validates pagination parameters from query string
 * @param page - Page number from query string
 * @param pageSize - Page size from query string
 * @returns Validated pagination parameters or null if invalid
 */
function parsePaginationParams(
  page: string | string[] | undefined,
  pageSize: string | string[] | undefined
): { page: number; pageSize: number; skip: number } | null {
  // Parse page number with fallback to default
  const pageStr = typeof page === "string" ? page : undefined;
  const parsedPage = pageStr ? parseInt(pageStr, 10) : DEFAULT_PAGE;

  // Parse page size with fallback to default
  const pageSizeStr = typeof pageSize === "string" ? pageSize : undefined;
  const parsedPageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : DEFAULT_PAGE_SIZE;

  // Validate that both values are valid numbers
  if (isNaN(parsedPage) || isNaN(parsedPageSize)) {
    return null;
  }

  // Ensure page is at least 1
  const validPage = Math.max(DEFAULT_PAGE, parsedPage);

  // Clamp pageSize between min and max allowed values
  const validPageSize = Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, parsedPageSize));

  // Calculate skip for database query
  const skip = (validPage - 1) * validPageSize;

  return {
    page: validPage,
    pageSize: validPageSize,
    skip,
  };
}

/**
 * Parses training sheet ID from query parameter
 * @param id - ID from query string
 * @returns Validated ID as number, or null if invalid
 */
function parseSheetId(id: string | string[] | undefined): number | null {
  if (!id || typeof id !== "string") {
    return null;
  }

  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId) || parsedId <= 0) {
    return null;
  }

  return parsedId;
}

/**
 * Handles POST request to create new training sheet with file upload
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns Promise that resolves when response is sent
 */
async function handleCreateTrainingSheet(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<unknown>>
): Promise<void> {
  // Parse multipart/form-data
  const { fields, files } = await parseForm(req);

  // Extract field values (formidable returns arrays)
  const name = extractFormField(fields.name);
  const publicName = extractFormField(fields.publicName);
  const slug = extractFormField(fields.slug);
  const offlinePdf = extractFormField(fields.offlinePdf);
  const newTabPdf = extractFormField(fields.newTabPdf);
  const trainingDaysRaw = extractFormField(fields.trainingDays);

  // Handle uploaded file
  let pdfPath: string | undefined;
  if (files.file) {
    const fileArray = Array.isArray(files.file) ? files.file : [files.file];
    const uploadedFile = fileArray[0];
    pdfPath = getPublicFilePath(uploadedFile.filepath);
  }

  // Parse trainingDays JSON
  const trainingDays = trainingDaysRaw ? JSON.parse(trainingDaysRaw) : [];

  // Prepare data for validation
  const validationData = {
    name,
    publicName,
    slug,
    offlinePdf,
    newTabPdf,
    pdfPath,
    trainingDays,
  };

  const validatedData: CreateTrainingSheetData = CreateTrainingSheetSchema.parse(validationData);

  // Type assertion is safe because Zod validation ensures all required fields match TrainingSheetPayload
  const createdSheet = await createCompleteTrainingSheet(validatedData as any);

  res.status(201).json(apiSuccess(createdSheet));
}

/**
 * Handles PUT request to update training sheet with optional file upload
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @param sheetId - ID of the training sheet to update
 * @returns Promise that resolves when response is sent
 */
async function handleUpdateTrainingSheet(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<unknown>>,
  sheetId: number
): Promise<void> {
  // Parse multipart/form-data
  const { fields, files } = await parseForm(req);

  // Extract field values
  const name = extractFormField(fields.name);
  const publicName = extractFormField(fields.publicName);
  const slug = extractFormField(fields.slug);
  const offlinePdf = extractFormField(fields.offlinePdf);
  const newTabPdf = extractFormField(fields.newTabPdf);

  // Handle uploaded file
  let pdfPath: string | undefined;
  if (files.file) {
    const fileArray = Array.isArray(files.file) ? files.file : [files.file];
    const uploadedFile = fileArray[0];
    pdfPath = getPublicFilePath(uploadedFile.filepath);

    // Delete old PDF if exists
    const existingSheet = await prisma.trainingSheet.findUnique({
      where: { id: sheetId },
      select: { pdfPath: true },
    });

    if (existingSheet?.pdfPath) {
      await deleteFile(existingSheet.pdfPath);
    }
  }

  // Prepare data for validation
  const validationData = {
    name,
    publicName,
    slug,
    offlinePdf,
    newTabPdf,
    ...(pdfPath && { pdfPath }),
  };

  const validatedData: UpdateTrainingSheetData = UpdateTrainingSheetSchema.parse(validationData);

  const updatedSheet = await updateTrainingSheet(sheetId, validatedData as UpdateTrainingSheetInput);

  // Fetch and return the full updated sheet
  const fullSheet = await getTrainingSheetFull(updatedSheet.id);

  res.status(200).json(apiSuccess(fullSheet));
}

/**
 * Handles GET request to fetch single training sheet by ID
 * @param res - Next.js API response object
 * @param sheetId - ID of the training sheet to fetch
 * @returns Promise that resolves when response is sent
 */
async function handleGetSingleTrainingSheet(
  res: NextApiResponse<ApiResponse<unknown>>,
  sheetId: number
): Promise<void> {
  const sheet = await getTrainingSheetFull(sheetId);

  if (!sheet) {
    res.status(404).json(apiError("Training sheet not found"));
    return;
  }

  res.status(200).json(apiSuccess(sheet));
}

/**
 * Handles GET request to fetch paginated list of training sheets
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns Promise that resolves when response is sent
 */
async function handleGetAllTrainingSheets(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<unknown>>
): Promise<void> {
  // Parse and validate pagination parameters
  const pagination = parsePaginationParams(req.query.page, req.query.pageSize);

  if (!pagination) {
    res.status(400).json(apiError("Invalid pagination parameters"));
    return;
  }

  // Get total count for pagination metadata
  const totalCount = await prisma.trainingSheet.count();

  // Fetch paginated sheets with full relations
  const sheets = await prisma.trainingSheet.findMany({
    include: {
      trainingDays: {
        include: {
          exerciseGroup: {
            include: {
              exerciseMethods: {
                include: {
                  exerciseConfigurations: {
                    include: {
                      exercise: true,
                      method: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: pagination.skip,
    take: pagination.pageSize,
  });

  // Return sheets with pagination metadata
  res.status(200).json(
    apiSuccess(sheets, {
      count: sheets.length,
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: totalCount,
    })
  );
}

/**
 * Training sheet collection API handler
 * Manages listing, creation, updating, and deletion of training sheets
 * 
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns Promise that resolves when response is sent
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<unknown>>
): Promise<void> {
  // Require authentication for all methods
  const session = await requireAuth(req, res);
  if (!session) {
    return;
  }

  try {
    // POST - Create new training sheet with nested structure and file upload
    if (req.method === "POST") {
      await handleCreateTrainingSheet(req, res);
      return;
    }

    // PUT - Update training sheet metadata and optionally replace PDF
    if (req.method === "PUT") {
      const sheetId = parseSheetId(req.query.id);

      if (sheetId === null) {
        res.status(400).json(apiError("Invalid or missing training sheet ID"));
        return;
      }

      await handleUpdateTrainingSheet(req, res, sheetId);
      return;
    }

    // GET - Retrieve training sheet(s)
    if (req.method === "GET") {
      const sheetId = parseSheetId(req.query.id);

      // If ID is provided, get a specific sheet
      if (sheetId !== null) {
        await handleGetSingleTrainingSheet(res, sheetId);
        return;
      }

      // Otherwise, get all training sheets with pagination
      await handleGetAllTrainingSheets(req, res);
      return;
    }

    // DELETE - Remove training sheet
    if (req.method === "DELETE") {
      const sheetId = parseSheetId(req.query.id);

      if (sheetId === null) {
        res.status(400).json(apiError("Invalid or missing training sheet ID"));
        return;
      }

      await deleteTrainingSheet(sheetId);

      res.status(200).json(apiSuccess({ message: "Training sheet deleted successfully" }));
      return;
    }

    // Method not allowed
    res.status(405).json(apiError("Method not allowed"));
    return;

  } catch (error) {
    // Log error for debugging but don't expose details to client
    console.error("Training sheet API error:", error);

    // Handle Zod validation errors with detailed feedback
    if (error instanceof ZodError) {
      res.status(400).json(apiError("Validation error"));
      return;
    }

    // Generic error response
    res.status(500).json(apiError("Internal server error"));
    return;
  }
}
