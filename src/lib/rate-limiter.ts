"use strict";

/**
 * File: rate-limiter.ts
 * Description: In-memory rate limiter for API endpoints to prevent abuse and enforce usage limits.
 * Provides sliding window rate limiting with automatic cleanup of expired entries.
 * Responsibilities:
 *   - Track request counts per client identifier within time windows
 *   - Enforce maximum request limits per time window
 *   - Calculate remaining requests and reset times
 *   - Extract client identifiers from requests (user ID or IP address)
 *   - Automatically cleanup expired rate limit entries
 *   - Provide preset rate limit configurations for different endpoint types
 *   - Return rate limit status (allowed/denied, remaining, reset time)
 * Called by:
 *   - api-middleware.ts (checkRateLimitMiddleware function)
 *   - Any API routes requiring rate limiting protection
 * Notes:
 *   - Uses in-memory Map storage (not suitable for multi-server deployments)
 *   - For production with multiple servers, use Redis or dedicated rate limiting service
 *   - Cleanup runs every 10 minutes to remove expired entries
 *   - Client identifier prioritizes user ID over IP address
 *   - Supports x-forwarded-for header for proxy/load balancer scenarios
 *   - Rate limit window starts on first request
 *   - Uses sliding window algorithm (resets after windowMs expires)
 */

import type { NextApiRequest } from "next";

/**
 * Rate limit entry stored in memory.
 */
interface RateLimitEntry {
  /** Number of requests made in current window */
  count: number;
  /** Unix timestamp when the rate limit window resets */
  resetTime: number;
}

/**
 * Options for rate limit checking.
 */
export interface RateLimitOptions {
  /** Maximum number of requests allowed in the time window */
  max: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Unique identifier for the client (e.g., IP address, user ID) */
  identifier: string;
}

/**
 * Result of rate limit check.
 */
export interface RateLimitResult {
  /** Whether the request is allowed (within limits) */
  allowed: boolean;
  /** Number of requests remaining in current window */
  remaining: number;
  /** Unix timestamp when the rate limit resets */
  resetTime: number;
}

/**
 * In-memory storage for rate limit entries.
 * Key format: "rate_limit:{identifier}"
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Cleanup interval in milliseconds (10 minutes).
 */
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Key prefix for rate limit entries.
 */
const RATE_LIMIT_KEY_PREFIX = "rate_limit:";

/**
 * Validates if a value is a positive number.
 * @param value - Value to validate
 * @returns True if value is a positive number
 */
function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && value > 0 && !isNaN(value);
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
 * Validates rate limit options structure.
 * @param options - Options to validate
 * @returns True if options are valid
 */
function isValidRateLimitOptions(
  options: unknown
): options is RateLimitOptions {
  if (!options || typeof options !== "object") {
    return false;
  }

  const opts = options as Record<string, unknown>;

  return (
    isPositiveNumber(opts.max) &&
    isPositiveNumber(opts.windowMs) &&
    isValidString(opts.identifier)
  );
}

/**
 * Creates a storage key for rate limit tracking.
 * @param identifier - Client identifier
 * @returns Storage key
 */
function createRateLimitKey(identifier: string): string {
  return `${RATE_LIMIT_KEY_PREFIX}${identifier}`;
}

/**
 * Checks if a rate limit entry has expired.
 * @param entry - Rate limit entry
 * @param currentTime - Current timestamp
 * @returns True if entry has expired
 */
function isEntryExpired(entry: RateLimitEntry, currentTime: number): boolean {
  return entry.resetTime < currentTime;
}

/**
 * Creates a new rate limit entry for first request.
 * @param windowMs - Time window in milliseconds
 * @param currentTime - Current timestamp
 * @returns New rate limit entry
 */
function createNewEntry(windowMs: number, currentTime: number): RateLimitEntry {
  return {
    count: 1,
    resetTime: currentTime + windowMs,
  };
}

/**
 * Calculates remaining requests in rate limit window.
 * @param max - Maximum allowed requests
 * @param currentCount - Current request count
 * @returns Remaining requests (minimum 0)
 */
function calculateRemaining(max: number, currentCount: number): number {
  const remaining = max - currentCount;
  return remaining < 0 ? 0 : remaining;
}

/**
 * Creates a rate limit result object.
 * @param allowed - Whether request is allowed
 * @param remaining - Remaining requests
 * @param resetTime - Reset timestamp
 * @returns Rate limit result
 */
function createRateLimitResult(
  allowed: boolean,
  remaining: number,
  resetTime: number
): RateLimitResult {
  return {
    allowed,
    remaining,
    resetTime,
  };
}

/**
 * Checks if a request is allowed based on rate limits.
 * Uses sliding window algorithm with automatic window reset.
 *
 * @param options - Rate limit configuration
 * @returns Rate limit result with allowed status, remaining count, and reset time
 * @throws Error if options are invalid
 *
 * @example
 * ```ts
 * const result = checkRateLimit({
 *   max: 100,
 *   windowMs: 60000,
 *   identifier: 'user:123'
 * });
 * if (!result.allowed) {
 *   console.log('Rate limit exceeded');
 * }
 * ```
 */
export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  // Validate options
  if (!isValidRateLimitOptions(options)) {
    throw new Error(
      "Invalid rate limit options: max, windowMs must be positive numbers, identifier must be non-empty string"
    );
  }

  const { max, windowMs, identifier } = options;
  const now = Date.now();
  const key = createRateLimitKey(identifier);

  let entry = rateLimitStore.get(key);

  // Create new entry if doesn't exist or window expired
  if (!entry || isEntryExpired(entry, now)) {
    entry = createNewEntry(windowMs, now);
    rateLimitStore.set(key, entry);

    return createRateLimitResult(true, max - 1, entry.resetTime);
  }

  // Increment count for existing entry
  entry.count = entry.count + 1;

  // Check if limit exceeded
  if (entry.count > max) {
    return createRateLimitResult(false, 0, entry.resetTime);
  }

  // Request allowed
  return createRateLimitResult(
    true,
    calculateRemaining(max, entry.count),
    entry.resetTime
  );
}

/**
 * Safely extracts user ID from request session.
 * @param req - Next.js API request
 * @returns User ID or undefined
 */
function getUserIdFromSession(req: NextApiRequest): string | undefined {
  const session = (req as any).session;

  if (!session || typeof session !== "object") {
    return undefined;
  }

  const user = session.user;

  if (!user || typeof user !== "object") {
    return undefined;
  }

  const userId = user.id;

  return isValidString(userId) ? userId : undefined;
}

/**
 * Safely extracts IP address from x-forwarded-for header.
 * @param forwardedHeader - x-forwarded-for header value
 * @returns First IP address in chain or undefined
 */
function extractIpFromForwardedHeader(
  forwardedHeader: string | string[] | undefined
): string | undefined {
  if (!forwardedHeader) {
    return undefined;
  }

  // Handle string format
  if (typeof forwardedHeader === "string") {
    const firstIp = forwardedHeader.split(",")[0];
    return isValidString(firstIp) ? firstIp.trim() : undefined;
  }

  // Handle array format
  if (Array.isArray(forwardedHeader) && forwardedHeader.length > 0) {
    const firstIp = forwardedHeader[0];
    return isValidString(firstIp) ? firstIp.trim() : undefined;
  }

  return undefined;
}

/**
 * Safely extracts IP address from request socket.
 * @param req - Next.js API request
 * @returns IP address or undefined
 */
function getSocketIpAddress(req: NextApiRequest): string | undefined {
  const socket = (req as any).socket;

  if (!socket || typeof socket !== "object") {
    return undefined;
  }

  const remoteAddress = socket.remoteAddress;

  return isValidString(remoteAddress) ? remoteAddress : undefined;
}

/**
 * Extracts client identifier from request.
 * Prioritizes user ID from session over IP address.
 * Supports x-forwarded-for header for proxy scenarios.
 *
 * @param req - Next.js API request
 * @returns Client identifier string
 *
 * @example
 * ```ts
 * const identifier = getClientIdentifier(req);
 * // Returns: "user:123" or "ip:192.168.1.1" or "ip:unknown"
 * ```
 */
export function getClientIdentifier(req: NextApiRequest): string {
  // Try to get user ID from session (highest priority)
  const userId = getUserIdFromSession(req);
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from x-forwarded-for header (for proxy/load balancer)
  const forwardedHeader = req.headers["x-forwarded-for"];
  const forwardedIp = extractIpFromForwardedHeader(forwardedHeader);
  if (forwardedIp) {
    return `ip:${forwardedIp}`;
  }

  // Fallback to socket remote address
  const socketIp = getSocketIpAddress(req);
  if (socketIp) {
    return `ip:${socketIp}`;
  }

  // Final fallback
  return "ip:unknown";
}

/**
 * Preset rate limit configurations for different endpoint types.
 */
export const RateLimits = {
  /**
   * Strict limit for authentication endpoints.
   * 5 requests per 15 minutes to prevent brute force attacks.
   */
  AUTH: {
    max: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },

  /**
   * Moderate limit for general API endpoints.
   * 100 requests per minute for normal API usage.
   */
  API: {
    max: 100,
    windowMs: 60 * 1000, // 1 minute
  },

  /**
   * Generous limit for read-only operations.
   * 200 requests per minute for data fetching.
   */
  READ: {
    max: 200,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

/**
 * Cleanup expired rate limit entries from memory.
 * Removes entries whose reset time has passed.
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  // Collect expired keys
  rateLimitStore.forEach((entry, key) => {
    if (isEntryExpired(entry, now)) {
      keysToDelete.push(key);
    }
  });

  // Delete expired entries
  keysToDelete.forEach((key) => {
    rateLimitStore.delete(key);
  });

  // Log cleanup activity if entries were removed
  if (keysToDelete.length > 0) {
    console.log(
      `[Rate Limiter] Cleaned up ${keysToDelete.length} expired entries`
    );
  }
}

/**
 * Start periodic cleanup of expired rate limit entries.
 * Runs every 10 minutes to prevent memory leaks.
 */
const cleanupIntervalId = setInterval(
  cleanupExpiredEntries,
  CLEANUP_INTERVAL_MS
);

// Prevent cleanup interval from keeping the process alive
if (cleanupIntervalId.unref) {
  cleanupIntervalId.unref();
}
