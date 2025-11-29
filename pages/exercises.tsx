"use strict";

/**
 * File: exercises.tsx
 * Description: Next.js page route wrapper that exports the Exercises page component and authentication logic.
 * Responsibilities:
 *   - Re-export the main Exercises component from src/pages/Exercises.tsx
 *   - Re-export getServerSideProps for server-side authentication and data fetching
 *   - Serve as the public route entry point for /exercises URL
 * Called by:
 *   - Next.js framework (automatically loaded when user navigates to /exercises)
 *   - Navigation components and links throughout the application
 * Notes:
 *   - This is a Next.js routing convention file (pages/ directory structure)
 *   - The actual implementation lives in src/pages/Exercises.tsx
 *   - This pattern allows separation of routing from implementation
 *   - Authentication is enforced via getServerSideProps (redirects unauthenticated users)
 *   - Page displays exercise catalog with CRUD operations, pagination, and search
 */

export { default } from "../src/pages/Exercises";
export { getServerSideProps } from "../src/pages/Exercises";

