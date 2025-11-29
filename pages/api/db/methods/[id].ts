"use strict";

/**
 * File: db/methods/[id].ts
 * Description: API endpoint for individual method resource operations.
 *              Handles CRUD operations (GET, PUT, PATCH, DELETE) for training methods.
 *              Methods represent exercise techniques or training methodologies used in workouts.
 * 
 * Responsibilities:
 *   - Authenticate all requests using session validation
 *   - Parse and validate method ID from route parameter
 *   - GET: Retrieve single method by ID
 *   - PUT/PATCH: Update method name and description with validation
 *   - DELETE: Remove method from database
 *   - Validate required fields (name, description) on updates
 *   - Return appropriate HTTP status codes (200, 204, 400, 404, 500)
 * 
 * Called by:
 *   - Methods page component (src/pages/Methods.tsx)
 *   - Method dialog component (src/components/dialogs/MethodDialog.tsx)
 *   - API client utilities (src/lib/api-client.ts)
 *   - Workout configuration components
 * 
 * Notes:
 *   - Both PUT and PATCH methods perform full updates (name + description required)
 *   - DELETE returns 204 No Content with no response body
 *   - Method ID must be a positive integer
 *   - Name and description are trimmed of whitespace before storage
 *   - 404 error returned if method not found for GET/PUT/PATCH/DELETE operations
 */

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError, type ApiResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/api-middleware";
import type { Method } from "@prisma/client";

/**
 * Parses and validates method ID from route parameter
 * @param id - Method ID from query string
 * @returns Validated method ID as number, or null if invalid
 */
function parseMethodId(id: string | string[] | undefined): number | null {
  if (!id || typeof id !== "string") {
    return null;
  }

  const parsedId = parseInt(id, 10);

  // Validate it's a valid positive integer
  if (isNaN(parsedId) || parsedId <= 0) {
    return null;
  }

  return parsedId;
}

/**
 * Validates that a field is a non-empty string
 * @param value - Value to validate
 * @returns true if valid non-empty string, false otherwise
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates update request body contains required fields
 * @param body - Request body object
 * @returns Validation result with success flag and optional error message
 */
function validateUpdateFields(body: unknown): {
  isValid: boolean;
  error?: string;
  name?: string;
  description?: string;
} {
  if (!body || typeof body !== "object") {
    return { isValid: false, error: "Request body is required" };
  }

  const { name, description } = body as Record<string, unknown>;

  if (!isNonEmptyString(name)) {
    return { isValid: false, error: "Name is required and cannot be empty" };
  }

  if (!isNonEmptyString(description)) {
    return { isValid: false, error: "Description is required and cannot be empty" };
  }

  return {
    isValid: true,
    name: name.trim(),
    description: description.trim(),
  };
}

/**
 * Method resource API handler
 * Manages CRUD operations for individual training methods
 * 
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns Promise that resolves when response is sent
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Method>>
): Promise<void> {
  // Require authentication - requireAuth sends 401 response if not authenticated
  const session = await requireAuth(req, res);
  if (!session) {
    return;
  }

  // Parse and validate method ID
  const methodId = parseMethodId(req.query.id);
  if (methodId === null) {
    res.status(400).json(apiError("Invalid or missing method ID"));
    return;
  }

  try {
    // GET - Retrieve method by ID
    if (req.method === "GET") {
      const method = await prisma.method.findUnique({
        where: { id: methodId },
      });

      if (!method) {
        res.status(404).json(apiError("Method not found"));
        return;
      }

      res.status(200).json(apiSuccess(method));
      return;
    }

    // PUT/PATCH - Update method
    if (req.method === "PUT" || req.method === "PATCH") {
      // Validate request body
      const validation = validateUpdateFields(req.body);

      if (!validation.isValid) {
        res.status(400).json(apiError(validation.error ?? "Invalid request"));
        return;
      }

      // Update method with validated data
      const updatedMethod = await prisma.method.update({
        where: { id: methodId },
        data: {
          name: validation.name!,
          description: validation.description!,
        },
      });

      res.status(200).json(apiSuccess(updatedMethod));
      return;
    }

    // DELETE - Remove method
    if (req.method === "DELETE") {
      await prisma.method.delete({
        where: { id: methodId },
      });

      res.status(204).end();
      return;
    }

    // Method not allowed
    res.setHeader("Allow", ["GET", "PUT", "PATCH", "DELETE"]);
    res.status(405).end(`Method ${req.method ?? "UNKNOWN"} Not Allowed`);
    return;

  } catch (err) {
    // Log error for debugging but don't expose details to client
    console.error(`/api/db/methods/${methodId} error`, err);

    res.status(500).json(apiError("Internal server error"));
    return;
  }
}
