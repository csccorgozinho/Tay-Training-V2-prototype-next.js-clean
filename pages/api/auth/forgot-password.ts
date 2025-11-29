"use strict";

/**
 * File: forgot-password.ts
 * Description: API endpoint for handling password reset requests.
 * Responsibilities:
 *   - Validate email address format
 *   - Check if user exists in database
 *   - Generate password reset token (placeholder for now)
 *   - Send password reset email (placeholder for now)
 *   - Return success/error response
 * Called by:
 *   - src/components/auth/ForgotPassword.tsx (password recovery form)
 * Notes:
 *   - This endpoint does NOT require authentication (public endpoint)
 *   - Email sending is currently a placeholder - requires email service integration
 *   - Token generation is simplified - should use crypto.randomBytes in production
 *   - Token should be stored in database with expiration (not implemented yet)
 *   - In production, integrate with services like SendGrid, AWS SES, or Resend
 *   - Always returns success to prevent email enumeration attacks
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import type { ApiResponse } from "@/lib/api-response";

/**
 * Request body schema for password reset.
 */
const ForgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>;

interface ForgotPasswordResponse {
  message: string;
}

/**
 * Validates the request body against the schema.
 *
 * @param body - Request body to validate
 * @returns Validated email or null if invalid
 */
function validateRequestBody(body: unknown): string | null {
  try {
    const validated = ForgotPasswordSchema.parse(body);
    return validated.email.trim().toLowerCase();
  } catch (error) {
    return null;
  }
}

/**
 * Checks if a user exists with the given email.
 *
 * @param email - Email address to check
 * @returns true if user exists, false otherwise
 */
async function userExists(email: string): Promise<boolean> {
  try {
    const user = await prisma.user.findFirst({
      where: { email },
      select: { id: true },
    });
    return user !== null;
  } catch (error) {
    console.error("Error checking user existence:", error);
    return false;
  }
}

/**
 * Generates a password reset token.
 * PLACEHOLDER: In production, use crypto.randomBytes() and store in database.
 *
 * @param email - User's email address
 * @returns Reset token string
 */
function generateResetToken(email: string): string {
  // PLACEHOLDER: In production, use:
  // const token = crypto.randomBytes(32).toString('hex');
  // Store token in database with expiration timestamp
  const timestamp = Date.now();
  return `reset_${email}_${timestamp}`;
}

/**
 * Sends password reset email.
 * PLACEHOLDER: In production, integrate with email service.
 *
 * @param email - Recipient email address
 * @param token - Password reset token
 * @returns Promise that resolves when email is sent
 */
async function sendResetEmail(email: string, token: string): Promise<void> {
  // PLACEHOLDER: In production, integrate with email service:
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: email,
  //   from: 'noreply@taytraining.com',
  //   subject: 'Redefinir sua senha - Tay Training',
  //   html: `<p>Clique no link para redefinir sua senha: <a href="${process.env.NEXTAUTH_URL}/reset-password?token=${token}">Redefinir senha</a></p>`
  // });

  console.log(`[PLACEHOLDER] Password reset email sent to: ${email}`);
  console.log(`[PLACEHOLDER] Reset token: ${token}`);
  console.log(
    `[PLACEHOLDER] Reset link: ${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
  );

  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Extracts error message from unknown error type.
 *
 * @param error - Error object
 * @returns Error message string
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error occurred";
}

/**
 * Main API handler for password reset requests.
 * Processes POST requests to initiate password reset flow.
 *
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ForgotPasswordResponse>>
): Promise<void> {
  // Only allow POST method
  if (req.method !== "POST") {
    res.status(405).json(apiError("Método não permitido"));
    return;
  }

  try {
    // Validate request body
    const email = validateRequestBody(req.body);

    if (!email) {
      res.status(400).json(apiError("E-mail inválido"));
      return;
    }

    // Check if user exists
    const exists = await userExists(email);

    if (exists) {
      // Generate reset token
      const token = generateResetToken(email);

      // Send reset email
      await sendResetEmail(email, token);

      console.log(`Password reset initiated for: ${email}`);
    } else {
      // User doesn't exist, but don't reveal this for security
      console.log(`Password reset attempted for non-existent user: ${email}`);
    }

    // Always return success to prevent email enumeration
    res.status(200).json(
      apiSuccess({
        message:
          "Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.",
      })
    );
    return;
  } catch (error) {
    console.error("Password reset error:", error);

    res.status(500).json(apiError("Erro ao processar solicitação"));
    return;
  }
}
