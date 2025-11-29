"use strict";

/**
 * File: training-schedule.tsx
 * Description: Next.js page route wrapper that exports the Training Schedule page component and authentication logic.
 * Responsibilities:
 *   - Re-export the main TrainingSchedule component from src/pages/TrainingSchedule.tsx
 *   - Re-export getServerSideProps for server-side authentication and data fetching
 *   - Serve as the public route entry point for /training-schedule URL
 *   - Provide access to weekly training schedule management
 * Called by:
 *   - Next.js framework (automatically loaded when user navigates to /training-schedule)
 *   - Navigation components and sidebar menu
 *   - Dashboard quick actions and workout sheet links
 * Notes:
 *   - This is a Next.js routing convention file (pages/ directory structure)
 *   - The actual implementation lives in src/pages/TrainingSchedule.tsx
 *   - This pattern allows separation of routing from implementation
 *   - Authentication is enforced via getServerSideProps (redirects unauthenticated users to /login)
 *   - Training Schedule page displays weekly workout plans with calendar-based interface
 *   - Users can assign workout sheets to specific days of the week
 *   - Integrates with simple-training-schedule service for schedule logic
 *   - Related to training-schedule/[slug].tsx for viewing individual week/workout details
 */

export { default } from "../src/pages/TrainingSchedule";
export { getServerSideProps } from "../src/pages/TrainingSchedule";

