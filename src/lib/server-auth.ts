"use strict";

/**
 * File: server-auth.ts
 * Description: Server-side authentication utilities for Next.js pages using getServerSideProps.
 * Provides helper functions to check authentication status and enforce auth requirements on pages.
 * Responsibilities:
 *   - Check authentication status via NextAuth server session
 *   - Return authentication result with session data
 *   - Require authentication for protected pages (redirect to login if not authenticated)
 *   - Redirect authenticated users away from auth pages (login, forgot-password)
 *   - Clean and serialize session data for client-side props
 *   - Handle authentication errors gracefully
 * Called by:
 *   - pages/home.tsx (requireAuthGetServerSideProps)
 *   - pages/exercises.tsx (requireAuthGetServerSideProps)
 *   - pages/methods.tsx (requireAuthGetServerSideProps)
 *   - pages/training-schedule.tsx (requireAuthGetServerSideProps)
 *   - pages/workout-sheets.tsx (requireAuthGetServerSideProps)
 *   - pages/login.tsx (redirectAuthenticatedGetServerSideProps)
 *   - pages/forgot-password.tsx (redirectAuthenticatedGetServerSideProps)
 *   - Any page requiring server-side authentication checks
 * Notes:
 *   - Uses NextAuth getServerSession for authentication
 *   - Authentication status is determined by presence of session.user.id
 *   - Session is cleaned before passing to client (only includes user data)
 *   - Errors during authentication are logged and treated as unauthenticated
 *   - Redirects are temporary (permanent: false) to allow re-authentication
 *   - Login redirect destination: /login
 *   - Authenticated user redirect destination: /home
 */

import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authConfig } from "./auth-config";

/**
 * User data structure in session.
 */
interface User {
  /** User ID */
  id: string;
  /** User email address */
  email: string;
  /** User display name */
  name: string;
}

/**
 * Application session with typed user data.
 */
interface AppSession extends Session {
  /** User information */
  user: User;
}

/**
 * Result of authentication check.
 */
interface AuthResult {
  /** Whether user is authenticated */
  authenticated: boolean;
  /** Session data if authenticated, null otherwise */
  session: AppSession | null;
}

/**
 * Props returned when authentication is required.
 */
interface AuthRequiredProps {
  /** Cleaned session data for client */
  session: Partial<AppSession> | null;
}

/**
 * Redirect configuration for getServerSideProps.
 */
interface RedirectResult {
  redirect: {
    destination: string;
    permanent: boolean;
  };
}

/**
 * Props for pages without auth requirement.
 */
type EmptyProps = Record<string, unknown>;

/**
 * Constants for authentication redirects.
 */
const AUTH_CONSTANTS = {
  /** Login page path */
  LOGIN_PATH: "/login",
  /** Home page path */
  HOME_PATH: "/home",
  /** Whether redirects are permanent */
  REDIRECT_PERMANENT: false,
} as const;

/**
 * Validates if a session has required user data.
 * @param session - Session to validate
 * @returns True if session has valid user with id
 */
function isValidSession(session: unknown): session is AppSession {
  if (!session || typeof session !== "object") {
    return false;
  }

  const sess = session as Record<string, unknown>;

  if (!sess.user || typeof sess.user !== "object") {
    return false;
  }

  const user = sess.user as Record<string, unknown>;

  return (
    typeof user.id === "string" &&
    user.id.length > 0 &&
    typeof user.email === "string" &&
    user.email.length > 0 &&
    typeof user.name === "string"
  );
}

/**
 * Validates if context is a valid GetServerSidePropsContext.
 * @param context - Context to validate
 * @returns True if context is valid
 */
function isValidContext(
  context: unknown
): context is GetServerSidePropsContext {
  if (!context || typeof context !== "object") {
    return false;
  }

  const ctx = context as Record<string, unknown>;

  return (
    ctx.req !== null &&
    ctx.req !== undefined &&
    ctx.res !== null &&
    ctx.res !== undefined
  );
}

/**
 * Creates a clean session object for client-side props.
 * Only includes user data to avoid serialization issues.
 * @param session - Full session object
 * @returns Cleaned session data
 */
function createCleanSession(
  session: AppSession | null
): Partial<AppSession> | null {
  if (!session || !isValidSession(session)) {
    return null;
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
  };
}

/**
 * Creates a redirect result for getServerSideProps.
 * @param destination - Redirect destination path
 * @param permanent - Whether redirect is permanent
 * @returns Redirect result object
 */
function createRedirect(
  destination: string,
  permanent: boolean
): RedirectResult {
  return {
    redirect: {
      destination,
      permanent,
    },
  };
}

/**
 * Creates an authenticated props result.
 * @param session - Session to include in props
 * @returns Props result with session
 */
function createAuthRequiredPropsResult(
  session: AppSession | null
): GetServerSidePropsResult<AuthRequiredProps> {
  return {
    props: {
      session: createCleanSession(session),
    },
  };
}

/**
 * Creates an empty props result.
 * @returns Props result with empty object
 */
function createEmptyPropsResult(): GetServerSidePropsResult<EmptyProps> {
  return {
    props: {},
  };
}

/**
 * Checks authentication status via server-side session.
 * Returns authentication status and session data.
 *
 * @param context - Next.js getServerSideProps context
 * @returns Authentication result with status and session
 *
 * @example
 * ```ts
 * export async function getServerSideProps(context) {
 *   const { authenticated, session } = await getServerAuth(context);
 *   if (!authenticated) {
 *     // Handle unauthenticated user
 *   }
 *   return { props: { session } };
 * }
 * ```
 */
export async function getServerAuth(
  context: GetServerSidePropsContext
): Promise<AuthResult> {
  // Validate context
  if (!isValidContext(context)) {
    console.error("[Auth Error] Invalid context provided to getServerAuth");
    return {
      authenticated: false,
      session: null,
    };
  }

  try {
    // Get session from NextAuth
    const session = (await getServerSession(
      context.req,
      context.res,
      authConfig
    )) as AppSession | null;

    // Validate session
    const authenticated = isValidSession(session);

    return {
      authenticated,
      session: authenticated ? session : null,
    };
  } catch (error) {
    // Log error and return unauthenticated
    if (error instanceof Error) {
      console.error("[Auth Error]", error.message);
    } else {
      console.error("[Auth Error]", error);
    }

    return {
      authenticated: false,
      session: null,
    };
  }
}

/**
 * Requires authentication for a page.
 * Redirects to login page if user is not authenticated.
 * Returns session props if authenticated.
 *
 * @param context - Next.js getServerSideProps context
 * @returns Redirect to login or props with session
 *
 * @example
 * ```ts
 * export const getServerSideProps = requireAuthGetServerSideProps;
 * ```
 */
export async function requireAuthGetServerSideProps(
  context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<AuthRequiredProps>> {
  const { authenticated, session } = await getServerAuth(context);

  if (!authenticated) {
    return createRedirect(
      AUTH_CONSTANTS.LOGIN_PATH,
      AUTH_CONSTANTS.REDIRECT_PERMANENT
    );
  }

  return createAuthRequiredPropsResult(session);
}

/**
 * Redirects authenticated users away from auth pages.
 * Used on login and forgot-password pages to redirect already authenticated users.
 * Returns empty props if not authenticated (allows page to render).
 *
 * @param context - Next.js getServerSideProps context
 * @returns Redirect to home if authenticated, empty props otherwise
 *
 * @example
 * ```ts
 * // In pages/login.tsx
 * export const getServerSideProps = redirectAuthenticatedGetServerSideProps;
 * ```
 */
export async function redirectAuthenticatedGetServerSideProps(
  context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<EmptyProps>> {
  const { authenticated } = await getServerAuth(context);

  if (authenticated) {
    return createRedirect(
      AUTH_CONSTANTS.HOME_PATH,
      AUTH_CONSTANTS.REDIRECT_PERMANENT
    );
  }

  return createEmptyPropsResult();
}

