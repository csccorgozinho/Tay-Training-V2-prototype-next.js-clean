"use strict";

/**
 * File: api-middleware.ts
 * Description: Middleware utilities for Next.js API routes providing authentication,
 * rate limiting, method validation, and error handling.
 * Responsibilities:
 *   - Enforce authentication on protected API endpoints
 *   - Apply rate limiting with configurable limits per endpoint
 *   - Validate allowed HTTP methods for API routes
 *   - Set rate limit response headers (X-RateLimit-*)
 *   - Handle authentication failures (401 Unauthorized)
 *   - Handle rate limit violations (429 Too Many Requests)
 *   - Handle method not allowed (405 Method Not Allowed)
 *   - Provide higher-order function wrapper (withAuth) for automatic middleware application
 *   - Centralized error handling and logging
 * Called by:
 *   - pages/api/exercises/*.ts (CRUD operations with auth)
 *   - pages/api/methods/*.ts (CRUD operations with auth)
 *   - pages/api/training-sheets/*.ts (CRUD operations with auth)
 *   - pages/api/exercise-groups/*.ts (CRUD operations with auth)
 *   - pages/api/user/profile.ts (User profile with auth)
 *   - Any API route requiring authentication or rate limiting
 * Notes:
 *   - checkRateLimitMiddleware returns false and sends 429 response if limit exceeded
 *   - requireAuth returns null and sends 401 response if not authenticated
 *   - allowMethods returns false and sends 405 response if method not allowed
 *   - withAuth automatically handles auth, rate limiting, and error catching
 *   - All middleware functions follow early-return pattern for cleaner code flow
 *   - Rate limit headers are always set even when not exceeded
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authConfig } from "./auth-config";
import { apiError, type ApiResponse } from "./api-response";
import {
  checkRateLimit,
  getClientIdentifier,
  RateLimits,
  type RateLimitOptions,
} from "./rate-limiter";

/**
 * HTTP status codes used by middleware functions.
 */
const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  METHOD_NOT_ALLOWED: 405,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Rate limit header names for standard rate limiting response.
 */
const RATE_LIMIT_HEADERS = {
  LIMIT: "X-RateLimit-Limit",
  REMAINING: "X-RateLimit-Remaining",
  RESET: "X-RateLimit-Reset",
} as const;

/**
 * Validates if a value is a valid rate limit configuration.
 * @param config - Configuration to validate
 * @returns True if config has required properties
 */
function isValidRateLimitConfig(
  config: unknown
): config is Pick<RateLimitOptions, "max" | "windowMs"> {
  if (!config || typeof config !== "object") {
    return false;
  }

  const cfg = config as Record<string, unknown>;

  return (
    typeof cfg.max === "number" &&
    cfg.max > 0 &&
    typeof cfg.windowMs === "number" &&
    cfg.windowMs > 0
  );
}

/**
 * Validates if methods array is valid (non-empty array of strings).
 * @param methods - Methods array to validate
 * @returns True if methods is valid
 */
function isValidMethodsArray(methods: unknown): methods is string[] {
  if (!Array.isArray(methods)) {
    return false;
  }

  if (methods.length === 0) {
    return false;
  }

  return methods.every((method) => typeof method === "string" && method.length > 0);
}

/**
 * Safely extracts HTTP method from request.
 * @param req - Next.js API request
 * @returns HTTP method string or empty string if undefined
 */
function getRequestMethod(req: NextApiRequest): string {
  return req.method || "";
}

/**
 * Safely extracts URL from request for logging.
 * @param req - Next.js API request
 * @returns URL string or "unknown" if undefined
 */
function getRequestUrl(req: NextApiRequest): string {
  return req.url || "unknown";
}

/**
 * Checks if session has valid user with email.
 * @param session - NextAuth session object
 * @returns True if session has authenticated user with email
 */
function isValidSession(session: unknown): boolean {
  if (!session || typeof session !== "object") {
    return false;
  }

  const sess = session as Record<string, unknown>;

  if (!sess.user || typeof sess.user !== "object") {
    return false;
  }

  const user = sess.user as Record<string, unknown>;

  return typeof user.email === "string" && user.email.length > 0;
}

/**
 * Formats timestamp as ISO string for rate limit reset header.
 * @param timestamp - Unix timestamp in milliseconds
 * @returns ISO string representation
 */
function formatResetTime(timestamp: number): string {
  try {
    return new Date(timestamp).toISOString();
  } catch (error) {
    console.warn("Failed to format reset time:", error);
    return new Date().toISOString();
  }
}

/**
 * Sets rate limit headers on response.
 * @param res - Next.js API response
 * @param limit - Maximum requests allowed
 * @param remaining - Requests remaining in window
 * @param resetTime - Unix timestamp when limit resets
 */
function setRateLimitHeaders(
  res: NextApiResponse<ApiResponse<unknown>>,
  limit: number,
  remaining: number,
  resetTime: number
): void {
  res.setHeader(RATE_LIMIT_HEADERS.LIMIT, limit.toString());
  res.setHeader(RATE_LIMIT_HEADERS.REMAINING, remaining.toString());
  res.setHeader(RATE_LIMIT_HEADERS.RESET, formatResetTime(resetTime));
}

/**
 * Middleware to check rate limits on API requests.
 * Automatically sets rate limit headers and returns 429 if exceeded.
 *
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @param config - Rate limit configuration (max requests and time window)
 * @returns True if request is allowed, false if rate limit exceeded
 *
 * @example
 * ```ts
 * export default async function handler(req, res) {
 *   if (!checkRateLimitMiddleware(req, res, RateLimits.API)) return;
 *   // ... handle request
 * }
 * ```
 */
export function checkRateLimitMiddleware(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<unknown>>,
  config: Pick<RateLimitOptions, "max" | "windowMs">
): boolean {
  if (!isValidRateLimitConfig(config)) {
    console.error("Invalid rate limit configuration:", config);
    return true; // Allow request if config is invalid (fail open)
  }

  const identifier = getClientIdentifier(req);
  const result = checkRateLimit({
    ...config,
    identifier,
  });

  // Always set rate limit headers
  setRateLimitHeaders(res, config.max, result.remaining, result.resetTime);

  // Check if rate limit exceeded
  if (!result.allowed) {
    res
      .status(HTTP_STATUS.TOO_MANY_REQUESTS)
      .json(apiError("Too many requests. Please try again later."));
    return false;
  }

  return true;
}

/**
 * Middleware to require authentication on API endpoints.
 * Returns session if authenticated, returns null and sends 401 if not.
 *
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @returns Session object if authenticated, null if not (response already sent)
 *
 * @example
 * ```ts
 * export default async function handler(req, res) {
 *   const session = await requireAuth(req, res);
 *   if (!session) return; // 401 response already sent
 *   // ... handle authenticated request
 * }
 * ```
 */
export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<unknown>>
): Promise<unknown | null> {
  let session: unknown;

  try {
    session = await getServerSession(req, res, authConfig as any);
  } catch (error) {
    console.error("Failed to get server session:", error);
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(apiError("Authentication failed. Please try again."));
    return null;
  }

  if (!isValidSession(session)) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(apiError("Unauthorized. Please login first."));
    return null;
  }

  return session;
}

/**
 * Middleware to validate allowed HTTP methods for an API route.
 * Returns 405 Method Not Allowed if request method is not in allowed list.
 *
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @param methods - Array of allowed HTTP methods (e.g., ['GET', 'POST'])
 * @returns True if method is allowed, false if not (response already sent)
 *
 * @example
 * ```ts
 * export default async function handler(req, res) {
 *   if (!allowMethods(req, res, ['GET', 'POST'])) return;
 *   // ... handle GET or POST request
 * }
 * ```
 */
export function allowMethods(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<unknown>>,
  methods: string[]
): boolean {
  if (!isValidMethodsArray(methods)) {
    console.error("Invalid methods array:", methods);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(apiError("Server configuration error"));
    return false;
  }

  const requestMethod = getRequestMethod(req);

  if (!methods.includes(requestMethod)) {
    res.setHeader("Allow", methods.join(", "));
    res
      .status(HTTP_STATUS.METHOD_NOT_ALLOWED)
      .json(apiError(`Method ${requestMethod} Not Allowed`));
    return false;
  }

  return true;
}

/**
 * Options for withAuth wrapper function.
 */
export interface WithAuthOptions {
  /** Rate limit configuration (optional) */
  rateLimit?: Pick<RateLimitOptions, "max" | "windowMs">;
}

/**
 * Handler function type for withAuth wrapper.
 */
export type AuthenticatedHandler = (
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<unknown>>,
  session: unknown
) => Promise<void>;

/**
 * Higher-order function that wraps API handlers with automatic authentication,
 * optional rate limiting, and error handling.
 *
 * @param handler - API handler function that receives authenticated session
 * @param options - Optional configuration (rate limiting)
 * @returns Wrapped handler with middleware applied
 *
 * @example
 * ```ts
 * export default withAuth(async (req, res, session) => {
 *   // session is guaranteed to be authenticated here
 *   res.json({ user: session.user });
 * });
 * ```
 *
 * @example
 * ```ts
 * export default withAuth(
 *   async (req, res, session) => {
 *     // Handle request with rate limiting
 *   },
 *   { rateLimit: RateLimits.API }
 * );
 * ```
 */
export function withAuth(
  handler: AuthenticatedHandler,
  options?: WithAuthOptions
): (req: NextApiRequest, res: NextApiResponse<ApiResponse<unknown>>) => Promise<void> {
  if (typeof handler !== "function") {
    throw new Error("withAuth: handler must be a function");
  }

  return async function wrappedHandler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<unknown>>
  ): Promise<void> {
    try {
      // Apply rate limiting if configured
      if (options?.rateLimit) {
        const rateLimitPassed = checkRateLimitMiddleware(
          req,
          res,
          options.rateLimit
        );
        if (!rateLimitPassed) {
          return; // Rate limit response already sent
        }
      }

      // Require authentication
      const session = await requireAuth(req, res);
      if (!session) {
        return; // Auth failure response already sent
      }

      // Call the actual handler with authenticated session
      await handler(req, res, session);
    } catch (err) {
      // Log error with request context
      const method = getRequestMethod(req);
      const url = getRequestUrl(req);
      console.error(`[API Error] ${method} ${url}:`, err);

      // Send generic error response (avoid leaking internal details)
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json(apiError("Internal server error"));
    }
  };
}
