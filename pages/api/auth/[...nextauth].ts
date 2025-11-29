"use strict";

/**
 * File: [...nextauth].ts
 * Description: NextAuth.js API route handler with rate limiting protection.
 *              This is the core authentication endpoint for the application,
 *              handling all NextAuth.js authentication flows (signin, callback, session).
 * 
 * Responsibilities:
 *   - Configure and initialize NextAuth with credentials provider
 *   - Apply strict rate limiting to authentication attempts (5 attempts per 15 minutes)
 *   - Set rate limit headers for client awareness
 *   - Prevent brute force attacks on login endpoint
 *   - Delegate to NextAuth handler for actual authentication logic
 * 
 * Called by:
 *   - NextAuth client-side hooks (signIn, signOut, useSession)
 *   - Login form component (src/components/auth/LoginForm.tsx)
 *   - All protected pages via getServerSideProps (src/lib/server-auth.ts)
 *   - API middleware for session validation (src/lib/api-middleware.ts)
 * 
 * Notes:
 *   - Rate limiting only applies to credentials signin, not session checks
 *   - Uses in-memory rate limiter (not suitable for multi-instance production)
 *   - Returns 429 status code when rate limit is exceeded
 *   - URL patterns checked: 'callback/credentials' and 'signin/credentials'
 */

import NextAuth from 'next-auth/next';
import type { NextApiRequest, NextApiResponse } from 'next';
import { authConfig } from '@/lib/auth-config';
import { checkRateLimit, getClientIdentifier, RateLimits } from '@/lib/rate-limiter';
import { apiError } from '@/lib/api-response';

// Initialize NextAuth handler with application auth configuration
const nextAuthHandler = NextAuth(authConfig);

/**
 * Determines if the request is a credentials authentication attempt
 * @param url - Request URL string
 * @returns true if this is a credentials signin/callback request
 */
function isCredentialsAuthRequest(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  return url.includes('callback/credentials') || url.includes('signin/credentials');
}

/**
 * Main authentication handler with rate limiting protection
 * Wraps NextAuth handler with additional security layer
 * 
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @returns Promise that resolves when authentication is complete
 */
export default async function authHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  // Apply rate limiting only to credentials authentication attempts
  if (isCredentialsAuthRequest(req.url)) {
    const identifier = getClientIdentifier(req);
    
    const rateLimitResult = checkRateLimit({
      max: RateLimits.AUTH.max,
      windowMs: RateLimits.AUTH.windowMs,
      identifier,
    });

    // Inform client of rate limit status via headers
    res.setHeader('X-RateLimit-Limit', RateLimits.AUTH.max.toString());
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());

    // Block request if rate limit exceeded
    if (!rateLimitResult.allowed) {
      res.status(429).json(apiError('Too many login attempts. Please try again later.'));
      return;
    }
  }

  // Delegate to NextAuth handler for authentication processing
  return nextAuthHandler(req, res);
}
