"use strict";

/**
 * File: use-mobile.tsx
 * Description: React hook for detecting mobile viewport sizes using matchMedia API.
 * Provides a boolean flag indicating whether the current viewport is mobile-sized.
 * Responsibilities:
 *   - Detect if viewport width is below mobile breakpoint (768px)
 *   - Listen for viewport size changes using matchMedia
 *   - Return boolean flag for mobile state
 *   - Clean up event listeners on unmount
 *   - Handle server-side rendering (returns false initially)
 * Called by:
 *   - Drawer.tsx (conditionally render mobile navigation)
 *   - Layout components that need responsive behavior
 *   - Any component requiring mobile/desktop detection
 * Notes:
 *   - Breakpoint is 768px (matches Tailwind's 'md' breakpoint)
 *   - Returns false during SSR (before hydration)
 *   - Uses matchMedia for better performance than resize events
 *   - Checks window.innerWidth as fallback for initial state
 *   - Updates automatically when viewport size changes
 */

import { useEffect, useState } from "react";

/**
 * Mobile breakpoint threshold in pixels.
 * Viewport widths below this value are considered mobile.
 * Matches Tailwind CSS 'md' breakpoint (768px).
 */
const MOBILE_BREAKPOINT = 768;

/**
 * Validates if a number is a valid viewport width.
 * @param width - Width value to validate
 * @returns True if width is a valid positive number
 */
function isValidWidth(width: unknown): width is number {
  return (
    typeof width === "number" &&
    !isNaN(width) &&
    Number.isFinite(width) &&
    width >= 0
  );
}

/**
 * Safely checks if current viewport width is below mobile breakpoint.
 * @returns True if viewport is mobile-sized, false otherwise or if window unavailable
 */
function checkIsMobileViewport(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const width = window.innerWidth;

  if (!isValidWidth(width)) {
    console.warn("Invalid window.innerWidth detected:", width);
    return false;
  }

  return width < MOBILE_BREAKPOINT;
}

/**
 * Creates media query string for mobile detection.
 * @returns Media query string for max-width check
 */
function createMobileMediaQuery(): string {
  const maxWidth = MOBILE_BREAKPOINT - 1;
  return `(max-width: ${maxWidth}px)`;
}

/**
 * React hook that detects if the viewport is mobile-sized.
 * Returns a boolean indicating whether the current viewport width is below the mobile breakpoint.
 *
 * @returns True if viewport is mobile-sized (< 768px), false otherwise
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *   return <div>{isMobile ? 'Mobile View' : 'Desktop View'}</div>;
 * }
 * ```
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  /**
   * Sets up matchMedia listener for viewport changes.
   * Initializes mobile state and listens for media query changes.
   */
  useEffect(
    function setupMobileDetection(): () => void {
      // SSR safety check
      if (typeof window === "undefined") {
        return (): void => {};
      }

      const mediaQuery = createMobileMediaQuery();
      const mediaQueryList = window.matchMedia(mediaQuery);

      /**
       * Handler for media query changes.
       * Updates mobile state when viewport crosses breakpoint.
       */
      function handleMediaChange(): void {
        const isCurrentlyMobile = checkIsMobileViewport();
        setIsMobile(isCurrentlyMobile);
      }

      // Set initial state
      const initialIsMobile = checkIsMobileViewport();
      setIsMobile(initialIsMobile);

      // Listen for changes
      mediaQueryList.addEventListener("change", handleMediaChange);

      // Cleanup listener on unmount
      return (): void => {
        mediaQueryList.removeEventListener("change", handleMediaChange);
      };
    },
    []
  );

  return isMobile;
}
