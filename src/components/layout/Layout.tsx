"use strict";

/**
 * File: Layout.tsx
 * Description: Main layout wrapper component for the application.
 * Provides consistent page structure with navbar, drawer navigation, and loading bar.
 * Responsibilities:
 *   - Wrap all pages with consistent layout structure
 *   - Manage drawer open/close state
 *   - Conditionally render navbar based on hideNavbar prop
 *   - Detect authenticated routes and show/hide navigation accordingly
 *   - Provide responsive container with max-width constraint
 *   - Display loading bar for route transitions
 * Called by:
 *   - _app.tsx (wraps all pages in the application)
 *   - Individual pages that need custom layout configuration
 * Notes:
 *   - Authenticated routes: /home, /exercises, /methods, /workout-sheets, /training-schedule
 *   - Drawer navigation only shown on authenticated routes
 *   - Navbar can be hidden via hideNavbar prop (e.g., login page)
 *   - Transparent prop allows navbar transparency customization
 *   - Applies pt-16 padding when navbar is visible to prevent content overlap
 */

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/router";
import Navbar from "./Navbar";
import Drawer from "./Drawer";
import LoadingBar from "./LoadingBar";

/**
 * Props for Layout component.
 */
interface LayoutProps {
  /** Child elements to render within the layout */
  children: ReactNode;
  /** Whether to hide the navbar (e.g., for login pages) */
  hideNavbar?: boolean;
  /** Whether the navbar should be transparent */
  transparent?: boolean;
}

/**
 * Routes that require authentication and show navigation.
 * Used to determine if drawer should be displayed.
 */
const AUTHENTICATED_ROUTES: readonly string[] = [
  "/home",
  "/exercises",
  "/methods",
  "/workout-sheets",
  "/training-schedule",
] as const;

/**
 * Checks if the current route is authenticated.
 * @param currentPath - Current router path
 * @returns True if route is authenticated
 */
function isAuthenticatedRoute(currentPath: string): boolean {
  if (typeof currentPath !== "string" || currentPath.length === 0) {
    return false;
  }

  return AUTHENTICATED_ROUTES.some((route) => currentPath.startsWith(route));
}

/**
 * Main layout wrapper component for the application.
 * Provides consistent structure with navbar, drawer, and content area.
 */
export function Layout({
  children,
  hideNavbar = false,
  transparent = false,
}: LayoutProps): JSX.Element {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const router = useRouter();
  
  const isAuthenticated = isAuthenticatedRoute(router.asPath);

  /**
   * Toggles the drawer open/close state.
   */
  function toggleDrawer(): void {
    setIsDrawerOpen((prev) => !prev);
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-accent/30 overflow-x-hidden">
      <LoadingBar />
      
      {!hideNavbar && (
        <Navbar
          toggleDrawer={toggleDrawer}
          isAuthenticated={isAuthenticated}
          transparent={transparent}
        />
      )}

      {isAuthenticated && (
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
      )}

      <main
        className={`flex-1 w-full flex flex-col items-center ${
          !hideNavbar ? "pt-16" : ""
        }`}
      >
        <div className="w-full max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

export default Layout;
