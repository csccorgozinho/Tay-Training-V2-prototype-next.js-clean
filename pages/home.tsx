"use strict";

/**
 * File: home.tsx
 * Description: Next.js page route wrapper that exports the Home dashboard component and authentication logic.
 * Responsibilities:
 *   - Re-export the main Home component from src/pages/Home.tsx
 *   - Re-export getServerSideProps for server-side authentication and data fetching
 *   - Serve as the public route entry point for /home URL
 *   - Act as the primary landing page for authenticated users
 * Called by:
 *   - Next.js framework (automatically loaded when user navigates to /home)
 *   - Login page (redirects here after successful authentication)
 *   - Index page (redirects authenticated users here)
 *   - Navigation components and sidebar menu
 * Notes:
 *   - This is a Next.js routing convention file (pages/ directory structure)
 *   - The actual implementation lives in src/pages/Home.tsx
 *   - This pattern allows separation of routing from implementation
 *   - Authentication is enforced via getServerSideProps (redirects unauthenticated users to /login)
 *   - Home page serves as the main dashboard displaying user stats, recent activity, and quick actions
 */

export { default } from "../src/pages/Home";
export { getServerSideProps } from "../src/pages/Home";

