"use strict";

/**
 * File: methods.tsx
 * Description: Next.js page route wrapper that exports the Methods (training methods) page component and authentication logic.
 * Responsibilities:
 *   - Re-export the main Methods component from src/pages/Methods.tsx
 *   - Re-export getServerSideProps for server-side authentication and data fetching
 *   - Serve as the public route entry point for /methods URL
 *   - Provide access to training method management functionality
 * Called by:
 *   - Next.js framework (automatically loaded when user navigates to /methods)
 *   - Navigation components and sidebar menu
 *   - Dashboard quick actions and links
 * Notes:
 *   - This is a Next.js routing convention file (pages/ directory structure)
 *   - The actual implementation lives in src/pages/Methods.tsx
 *   - This pattern allows separation of routing from implementation
 *   - Authentication is enforced via getServerSideProps (redirects unauthenticated users to /login)
 *   - Methods page displays training methods catalog with CRUD operations, pagination, and search
 *   - Training methods define how exercises are performed (e.g., sets, reps, tempo, rest periods)
 */

export { default } from "../src/pages/Methods";
export { getServerSideProps } from "../src/pages/Methods";

