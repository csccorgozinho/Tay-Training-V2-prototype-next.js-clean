"use strict";

/**
 * File: workout-sheets.tsx
 * Description: Next.js page route wrapper that exports the Workout Sheets (training sheets) page component and authentication logic.
 * Responsibilities:
 *   - Re-export the main WorkoutSheets component from src/pages/WorkoutSheets.tsx
 *   - Re-export getServerSideProps for server-side authentication and data fetching
 *   - Serve as the public route entry point for /workout-sheets URL
 *   - Provide access to training sheet management functionality
 * Called by:
 *   - Next.js framework (automatically loaded when user navigates to /workout-sheets)
 *   - Navigation components and sidebar menu
 *   - Dashboard quick actions and links
 *   - Training schedule page (when assigning sheets to days)
 * Notes:
 *   - This is a Next.js routing convention file (pages/ directory structure)
 *   - The actual implementation lives in src/pages/WorkoutSheets.tsx
 *   - This pattern allows separation of routing from implementation
 *   - Authentication is enforced via getServerSideProps (redirects unauthenticated users to /login)
 *   - Workout Sheets page displays training sheet catalog with CRUD operations, pagination, search, and category filtering
 *   - Training sheets are comprehensive workout plans containing multiple training days with exercises, methods, and configurations
 *   - Supports PDF upload for reference documents
 *   - Uses training-sheet-service for complex nested data operations
 *   - Related APIs: /api/training-sheets/[id].ts, /api/training-sheets/index.ts, /api/workout-sheets.ts
 */

export { default } from "../src/pages/WorkoutSheets";
export { getServerSideProps } from "../src/pages/WorkoutSheets";

