"use strict";

/**
 * File: auth-config.ts
 * Description: NextAuth.js authentication configuration for credential-based login.
 * Configures JWT strategy, credentials provider, and custom callbacks for user authentication.
 * Responsibilities:
 *   - Configure NextAuth session strategy (JWT-based)
 *   - Define credentials provider for email/password authentication
 *   - Implement authorization logic with database user lookup
 *   - Validate credentials and password using bcrypt
 *   - Handle authentication errors with specific error codes
 *   - Configure JWT callback to store user ID in token
 *   - Configure session callback to attach user ID to session
 *   - Define custom sign-in page route
 *   - Return user object with id, email, and name on successful auth
 * Called by:
 *   - pages/api/auth/[...nextauth].ts (NextAuth API route handler)
 *   - api-middleware.ts (getServerSession for auth checks)
 *   - server-auth.ts (server-side authentication utilities)
 * Notes:
 *   - Uses JWT strategy (no database sessions)
 *   - Password comparison uses bcrypt for security
 *   - User ID is stored as string in JWT token (token.sub)
 *   - Throws specific error codes: MISSING_CREDENTIALS, USER_NOT_FOUND, INVALID_ACCOUNT, INVALID_PASSWORD
 *   - Custom sign-in page is /login
 *   - Requires valid email and password in credentials
 *   - User must have password field in database (non-null)
 */

import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import bcrypt from "bcryptjs";

/**
 * Authentication error codes for specific failure scenarios.
 */
const AUTH_ERRORS = {
  MISSING_CREDENTIALS: "MISSING_CREDENTIALS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INVALID_ACCOUNT: "INVALID_ACCOUNT",
  INVALID_PASSWORD: "INVALID_PASSWORD",
} as const;

/**
 * Credentials structure for login.
 */
interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * User object returned after successful authentication.
 */
interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Validates if credentials object has required email and password fields.
 * @param credentials - Credentials object to validate
 * @returns True if credentials are valid
 */
function isValidCredentials(
  credentials: Record<string, unknown> | undefined
): boolean {
  if (!credentials || typeof credentials !== "object") {
    return false;
  }

  const email = credentials.email;
  const password = credentials.password;

  return (
    typeof email === "string" &&
    email.trim().length > 0 &&
    typeof password === "string" &&
    password.length > 0
  );
}

/**
 * Validates if a value is a non-empty string.
 * @param value - Value to validate
 * @returns True if value is a valid non-empty string
 */
function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Safely converts user ID to string.
 * @param id - User ID (number or string)
 * @returns String representation of ID
 */
function convertIdToString(id: unknown): string {
  if (typeof id === "string") {
    return id;
  }
  if (typeof id === "number") {
    return String(id);
  }
  throw new Error("Invalid user ID type");
}

/**
 * Authorizes user credentials by looking up user in database and validating password.
 * @param credentials - Login credentials (email and password)
 * @returns User object if authentication successful
 * @throws Error with specific code if authentication fails
 */
async function authorizeUser(
  credentials: Record<string, unknown> | undefined
): Promise<AuthUser> {
  // Validate credentials structure
  if (!isValidCredentials(credentials)) {
    throw new Error(AUTH_ERRORS.MISSING_CREDENTIALS);
  }

  // Extract validated email and password
  const email = credentials.email as string;
  const password = credentials.password as string;

  // Look up user in database
  let user;
  try {
    user = await prisma.user.findFirst({
      where: { email: email.trim() },
    });
  } catch (error) {
    console.error("Database error during user lookup:", error);
    throw new Error("Database error");
  }

  // Check if user exists
  if (!user) {
    throw new Error(AUTH_ERRORS.USER_NOT_FOUND);
  }

  // Check if user has a password (not OAuth-only account)
  if (!isValidString(user.password)) {
    throw new Error(AUTH_ERRORS.INVALID_ACCOUNT);
  }

  // Validate password with bcrypt
  let isPasswordValid: boolean;
  try {
    isPasswordValid = await bcrypt.compare(password, user.password as string);
  } catch (error) {
    console.error("Password comparison error:", error);
    throw new Error("Authentication error");
  }

  if (!isPasswordValid) {
    throw new Error(AUTH_ERRORS.INVALID_PASSWORD);
  }

  // Return authenticated user object
  return {
    id: convertIdToString(user.id),
    email: user.email,
    name: user.name,
  };
}

/**
 * NextAuth.js configuration object.
 * Exported as authConfig for use in NextAuth API route and middleware.
 */
export const authConfig = {
  // Use JWT strategy (no database sessions)
  session: {
    strategy: "jwt" as const,
  },

  // Authentication providers
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: authorizeUser,
    }),
  ],

  // Callbacks for JWT and session customization
  callbacks: {
    /**
     * JWT callback - adds user ID to JWT token.
     * @param token - JWT token
     * @param user - User object (only present on initial sign-in)
     * @returns Updated JWT token
     */
    async jwt({ token, user }: any) {
      // Add user ID to token on initial sign-in
      if (user && user.id) {
        token.sub = String(user.id);
      }
      return token;
    },

    /**
     * Session callback - adds user ID from token to session.
     * @param session - Session object
     * @param token - JWT token
     * @returns Updated session object
     */
    async session({ session, token }: any) {
      // Add user ID from token to session
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },

  // Custom pages
  pages: {
    signIn: "/login",
  },
};
