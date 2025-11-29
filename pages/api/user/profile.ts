"use strict";

/**
 * File: user/profile.ts
 * Description: API endpoint for user profile management.
 *              Handles retrieving and updating authenticated user profile information.
 *              Provides read and write access to user name and email data.
 * 
 * Responsibilities:
 *   - Authenticate all requests using NextAuth session validation
 *   - GET: Retrieve authenticated user's profile information
 *   - PUT: Update authenticated user's profile (name field)
 *   - Validate user session and extract user identification
 *   - Return only public user fields (id, email, name)
 *   - Handle user not found scenarios
 *   - Return appropriate HTTP status codes (200, 401, 404, 405, 500)
 * 
 * Called by:
 *   - Profile page component (src/pages/profile/ProfilePage.tsx)
 *   - User profile management components
 *   - Account settings components
 *   - API client utilities (src/lib/api-client.ts)
 * 
 * Notes:
 *   - All requests require authentication via NextAuth session
 *   - Uses relative imports for lib files (../../../src/lib/*)
 *   - Error messages are in Portuguese ("Não autenticado", "Usuário não encontrado")
 *   - Only name field is updateable via PUT
 *   - Empty string for name is converted to null
 *   - User ID is retrieved from session for updates
 *   - Returns 401 if session is missing or invalid
 *   - Returns 404 if user not found in database
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth-config";
import prisma from "@/lib/prisma";

/**
 * User profile data structure with public fields only
 */
interface UserProfile {
  id: number;
  email: string;
  name: string | null;
}

/**
 * Request body structure for profile updates
 */
interface ProfileUpdateRequest {
  name?: string;
}

/**
 * API response types for profile endpoint
 */
type ProfileResponse =
  | { user: UserProfile }
  | { message: string }
  | { error: string };

/**
 * Session structure from NextAuth
 */
interface AuthSession {
  user?: {
    id?: string;
    email?: string;
    name?: string | null;
  };
}

/**
 * Fields to select when querying user data
 * Only includes public, non-sensitive information
 */
const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
  name: true,
} as const;

/**
 * Validates and extracts user email from session
 * @param session - NextAuth session object
 * @returns User email or null if invalid
 */
function extractUserEmail(session: unknown): string | null {
  const authSession = session as AuthSession | null;

  if (!authSession?.user?.email) {
    return null;
  }

  return authSession.user.email;
}

/**
 * Validates and extracts user ID from session
 * @param session - NextAuth session object
 * @returns User ID as number or null if invalid
 */
function extractUserId(session: unknown): number | null {
  const authSession = session as AuthSession | null;

  if (!authSession?.user?.id) {
    return null;
  }

  const userId = parseInt(authSession.user.id, 10);

  if (isNaN(userId) || userId <= 0) {
    return null;
  }

  return userId;
}

/**
 * Builds update data object from request body
 * @param body - Request body with profile fields
 * @returns Update data object with validated fields
 */
function buildUpdateData(body: ProfileUpdateRequest): Partial<UserProfile> {
  const updateData: Partial<UserProfile> = {};

  // Only update name if provided as string
  if (typeof body.name === "string") {
    // Empty string becomes null
    updateData.name = body.name.length > 0 ? body.name : null;
  }

  return updateData;
}

/**
 * Handles GET request to retrieve user profile
 * @param res - Next.js API response object
 * @param userEmail - Authenticated user's email
 * @returns Promise that resolves when response is sent
 */
async function handleGetProfile(
  res: NextApiResponse<ProfileResponse>,
  userEmail: string
): Promise<void> {
  try {
    const user = await prisma.user.findFirst({
      where: { email: userEmail },
      select: PUBLIC_USER_FIELDS,
    });

    if (!user) {
      res.status(404).json({ message: "Usuário não encontrado" });
      return;
    }

    res.status(200).json({ user });
    return;
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Erro ao carregar perfil" });
    return;
  }
}

/**
 * Handles PUT request to update user profile
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @param userId - Authenticated user's ID
 * @returns Promise that resolves when response is sent
 */
async function handleUpdateProfile(
  req: NextApiRequest,
  res: NextApiResponse<ProfileResponse>,
  userId: number
): Promise<void> {
  const requestBody: ProfileUpdateRequest = req.body ?? {};

  // Build update data from request body
  const updateData = buildUpdateData(requestBody);

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: PUBLIC_USER_FIELDS,
    });

    res.status(200).json({ user: updatedUser });
    return;
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Erro ao atualizar perfil" });
    return;
  }
}

/**
 * User profile API handler
 * Manages retrieving and updating user profile information
 * 
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns Promise that resolves when response is sent
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProfileResponse>
): Promise<void> {
  // Get authenticated session
  const session = await getServerSession(req, res, authConfig);

  // Extract and validate user email from session
  const userEmail = extractUserEmail(session);

  if (!userEmail) {
    res.status(401).json({ message: "Não autenticado" });
    return;
  }

  // GET - Retrieve user profile
  if (req.method === "GET") {
    await handleGetProfile(res, userEmail);
    return;
  }

  // PUT - Update user profile
  if (req.method === "PUT") {
    // Extract and validate user ID from session
    const userId = extractUserId(session);

    if (userId === null) {
      res.status(401).json({ message: "Não autenticado" });
      return;
    }

    await handleUpdateProfile(req, res, userId);
    return;
  }

  // Method not allowed
  res.setHeader("Allow", ["GET", "PUT"]);
  res.status(405).json({ message: `Method ${req.method ?? "UNKNOWN"} Not Allowed` });
  return;
}
