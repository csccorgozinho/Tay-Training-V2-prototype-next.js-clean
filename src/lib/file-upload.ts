"use strict";

/**
 * File: file-upload.ts
 * Description: File upload utility for handling multipart/form-data requests with PDF support.
 * Provides functions to parse form data with file uploads, manage upload directories, and handle file deletion.
 * Responsibilities:
 *   - Parse multipart/form-data requests using formidable
 *   - Configure upload directory in public/uploads/pdfs
 *   - Enforce 10MB file size limit for uploads
 *   - Filter uploads to only allow PDF files (application/pdf MIME type)
 *   - Create upload directory if it doesn't exist
 *   - Convert absolute file paths to public URL paths
 *   - Delete uploaded files from filesystem
 *   - Handle file operations with proper error handling
 * Called by:
 *   - pages/api/training-sheets/*.ts (PDF upload for training sheets)
 *   - Any API routes that handle PDF file uploads
 * Notes:
 *   - Only PDF files are allowed (enforced by MIME type filter)
 *   - Maximum file size is 10MB
 *   - Files are stored in public/uploads/pdfs directory
 *   - Upload directory is created automatically if missing
 *   - File extensions are preserved during upload
 *   - deleteFile silently fails if file doesn't exist (logs error but doesn't throw)
 *   - getPublicFilePath throws error if file is not in public directory
 *   - Uses formidable v2/v3 API
 */

import type { IncomingMessage } from "http";
import formidable from "formidable";
import type { Files, Fields } from "formidable";
import fs from "fs/promises";
import path from "path";

/**
 * Parsed form data structure containing fields and uploaded files.
 */
export interface ParsedFormData {
  /** Form fields (text inputs, etc.) */
  fields: Fields;
  /** Uploaded files */
  files: Files;
}

/**
 * Constants for file upload configuration.
 */
const UPLOAD_CONFIG = {
  /** Upload directory relative to project root */
  UPLOAD_DIR: path.join("public", "uploads", "pdfs"),
  /** Maximum file size in bytes (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  /** Allowed MIME type for uploads */
  ALLOWED_MIME_TYPE: "application/pdf",
  /** Public directory name */
  PUBLIC_DIR: "public",
} as const;

/**
 * Validates if a value is a non-empty string.
 * @param value - Value to validate
 * @returns True if value is a valid non-empty string
 */
function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Validates if request is a valid IncomingMessage.
 * @param req - Request object to validate
 * @returns True if request is valid
 */
function isValidRequest(req: unknown): req is IncomingMessage {
  return (
    req !== null &&
    typeof req === "object" &&
    "headers" in req &&
    "method" in req
  );
}

/**
 * Gets the absolute path to the upload directory.
 * @returns Absolute path to upload directory
 */
function getUploadDirectory(): string {
  return path.join(process.cwd(), UPLOAD_CONFIG.UPLOAD_DIR);
}

/**
 * Creates the upload directory if it doesn't exist.
 * @returns Promise that resolves when directory is ready
 */
async function ensureUploadDirectory(): Promise<void> {
  const uploadDir = getUploadDirectory();

  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error("Failed to create upload directory:", error);
    throw new Error("Failed to create upload directory");
  }
}

/**
 * Determines if a file should be accepted based on MIME type.
 * @param mimetype - MIME type of the uploaded file
 * @returns True if file should be accepted, false otherwise
 */
function shouldAcceptFile(mimetype: string | null | undefined): boolean {
  if (!isValidString(mimetype)) {
    return false;
  }

  return mimetype === UPLOAD_CONFIG.ALLOWED_MIME_TYPE;
}

/**
 * Creates and configures a formidable form parser.
 * @param uploadDir - Directory where files will be uploaded
 * @returns Configured formidable instance
 */
function createFormParser(uploadDir: string): ReturnType<typeof formidable> {
  return formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
    filter: ({ mimetype }) => {
      return shouldAcceptFile(mimetype);
    },
  });
}

/**
 * Parses multipart/form-data request body with file upload support.
 * Automatically creates upload directory if it doesn't exist.
 * Only accepts PDF files up to 10MB.
 *
 * @param req - Incoming HTTP request
 * @returns Promise resolving to parsed fields and files
 * @throws Error if request is invalid or parsing fails
 *
 * @example
 * ```ts
 * const { fields, files } = await parseForm(req);
 * console.log('Uploaded file:', files.pdf);
 * ```
 */
export async function parseForm(
  req: IncomingMessage
): Promise<ParsedFormData> {
  // Validate request
  if (!isValidRequest(req)) {
    throw new Error("Invalid request object");
  }

  // Ensure upload directory exists
  await ensureUploadDirectory();

  const uploadDir = getUploadDirectory();
  const form = createFormParser(uploadDir);

  return new Promise<ParsedFormData>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("Form parsing error:", err);
        reject(new Error(`Failed to parse form: ${err.message}`));
        return;
      }

      // Validate parsed data
      if (!fields || !files) {
        reject(new Error("Invalid form data: missing fields or files"));
        return;
      }

      resolve({ fields, files });
    });
  });
}

/**
 * Extracts the public URL path from an absolute file path.
 * Converts filesystem path to web-accessible URL path.
 *
 * @param filepath - Full file path on disk
 * @returns Public URL path (e.g., /uploads/pdfs/file.pdf)
 * @throws Error if file is not in public directory
 *
 * @example
 * ```ts
 * const publicPath = getPublicFilePath('/path/to/project/public/uploads/pdfs/doc.pdf');
 * // Returns: '/uploads/pdfs/doc.pdf'
 * ```
 */
export function getPublicFilePath(filepath: string): string {
  // Validate input
  if (!isValidString(filepath)) {
    throw new Error("Invalid filepath: must be a non-empty string");
  }

  const normalizedPath = filepath.trim();

  // Find 'public' directory in path
  const publicIndex = normalizedPath.indexOf(UPLOAD_CONFIG.PUBLIC_DIR);

  if (publicIndex === -1) {
    throw new Error("File is not in public directory");
  }

  // Extract path after 'public' directory
  const publicDirLength = UPLOAD_CONFIG.PUBLIC_DIR.length;
  const relativePath = normalizedPath.substring(publicIndex + publicDirLength);

  // Normalize path separators to forward slashes for URLs
  const urlPath = relativePath.replace(/\\/g, "/");

  // Ensure path starts with forward slash
  return urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
}

/**
 * Deletes a file from the filesystem.
 * Silently fails if file doesn't exist (logs error but doesn't throw).
 *
 * @param filepath - File path relative to public directory (e.g., /uploads/pdfs/file.pdf)
 * @returns Promise that resolves when deletion is complete
 *
 * @example
 * ```ts
 * await deleteFile('/uploads/pdfs/old-document.pdf');
 * ```
 */
export async function deleteFile(filepath: string): Promise<void> {
  // Validate input
  if (!isValidString(filepath)) {
    console.warn("Invalid filepath provided to deleteFile:", filepath);
    return;
  }

  try {
    // Build full path from public directory
    const normalizedPath = filepath.trim();
    const fullPath = path.join(
      process.cwd(),
      UPLOAD_CONFIG.PUBLIC_DIR,
      normalizedPath
    );

    // Attempt to delete file
    await fs.unlink(fullPath);
  } catch (error) {
    // Log error but don't throw (file might not exist, which is acceptable)
    if (error instanceof Error) {
      console.error(`Error deleting file ${filepath}:`, error.message);
    } else {
      console.error(`Error deleting file ${filepath}:`, error);
    }
  }
}
