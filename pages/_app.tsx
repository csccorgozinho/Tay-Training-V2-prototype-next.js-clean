"use strict";

/**
 * File: _app.tsx
 * Description: Next.js custom App component that wraps all pages with global providers and layout elements.
 * Responsibilities:
 *   - Initialize React Query client for server state management
 *   - Provide authentication session context via NextAuth
 *   - Wrap application with UI component providers (Tooltip, Toast, Sonner)
 *   - Render global loading bar for page transitions
 *   - Import global CSS styles
 *   - Serve as the root component for all pages in the application
 * Called by:
 *   - Next.js framework (automatically wraps all page components)
 *   - All pages in the pages/ directory (implicitly through Next.js routing)
 * Notes:
 *   - This is a Next.js special file that must be named _app.tsx
 *   - The QueryClient is created once per application lifecycle
 *   - Session is passed through pageProps from getServerSideProps when available
 *   - Provider order matters: QueryClient → Session → Tooltip → page content
 *   - Global styles are imported once here and apply to all pages
 *
 * Application Flow:
 *   1. Entry Point (Public):
 *      - pages/index.tsx → Landing/login page (redirects to /login or /home)
 *      - pages/login.tsx → User authentication
 *      - pages/forgot-password.tsx → Password recovery
 *
 *   2. Main Application (Protected):
 *      - pages/home.tsx → Dashboard (uses src/pages/Home.tsx component)
 *        └─> Displays user stats, recent activity, quick actions
 *
 *      - pages/exercises.tsx → Exercise management
 *        ├─> API: pages/api/db/exercises/index.ts (list/create)
 *        ├─> API: pages/api/db/exercises/[id].ts (view/update/delete)
 *        └─> Uses: ExerciseDialog, ExerciseGroupDialog components
 *
 *      - pages/methods.tsx → Training method management (uses src/pages/Methods.tsx)
 *        ├─> API: pages/api/db/methods/index.ts (list/create)
 *        ├─> API: pages/api/db/methods/[id].ts (view/update/delete)
 *        └─> Uses: MethodDialog component
 *
 *      - pages/workout-sheets.tsx → Training sheet CRUD (uses src/pages/WorkoutSheets.tsx)
 *        ├─> API: pages/api/training-sheets/index.ts (list/create/update with PDF upload)
 *        ├─> API: pages/api/training-sheets/[id].ts (view/delete)
 *        ├─> API: pages/api/workout-sheets.ts (get sheet IDs by category)
 *        ├─> API: pages/api/categories/index.ts (category filtering)
 *        └─> Uses: TrainingSheetDialog, CategoryFilterDialog
 *
 *      - pages/training-schedule.tsx → Weekly training schedule (uses src/pages/TrainingSchedule.tsx)
 *        ├─> API: pages/api/training-schedule/workouts.ts (available sheets)
 *        ├─> Service: src/lib/simple-training-schedule.ts (schedule logic)
 *        └─> Uses: TrainingScheduleDialog
 *
 *      - pages/training-schedule/[slug].tsx → Individual week/workout viewer
 *        └─> Dynamic route for viewing specific training plans
 *
 *   3. Configuration & Metadata:
 *      - pages/api/exercise-configurations/[id].ts → Exercise config CRUD
 *      - pages/api/exercise-configurations/index.ts → Config list/create
 *      - pages/api/exercise-groups/[id].ts → Exercise group CRUD
 *      - pages/api/exercise-groups/index.ts → Group list/create
 *      - pages/api/user/profile.ts → User profile management
 *
 *   4. Authentication Flow:
 *      - pages/api/auth/[...nextauth].ts → NextAuth handlers
 *        └─> Uses: src/lib/auth-config.ts (auth configuration)
 *        └─> Uses: src/lib/server-auth.ts (server-side auth utilities)
 *
 *   5. Shared Services:
 *      - src/lib/api-client.ts → Centralized API calls (used by all pages)
 *      - src/lib/training-sheet-service.ts → Training sheet business logic
 *      - src/lib/prisma.ts → Database client (used by all API routes)
 *      - src/hooks/* → React hooks (pagination, dialogs, loading, filters)
 */

import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { LoadingBar } from "@/components/layout/LoadingBar";
import "../src/index.css";

/**
 * React Query client instance for managing server state.
 * Created once at module initialization to maintain cache across renders.
 */
const queryClient = new QueryClient();

/**
 * Custom Next.js App component.
 * Wraps all pages with necessary providers and global UI elements.
 *
 * @param props - Next.js AppProps containing Component and pageProps
 * @param props.Component - The active page component being rendered
 * @param props.pageProps - Props passed to the page component (includes session if authenticated)
 * @returns The wrapped application with all providers
 */
export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={pageProps.session}>
        <TooltipProvider>
          <LoadingBar />
          <Toaster />
          <Sonner />
          <Component {...pageProps} />
        </TooltipProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
