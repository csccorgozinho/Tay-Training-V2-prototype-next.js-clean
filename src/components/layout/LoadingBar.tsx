"use strict";

/**
 * File: LoadingBar.tsx
 * Description: Animated loading progress bar component for page transitions and async operations.
 * Displays a smooth gradient progress bar at the top of the viewport during loading states.
 * Responsibilities:
 *   - Monitor global loading state via use-loading hook
 *   - Animate progress from 10% to 90% with randomized increments
 *   - Complete to 100% when loading finishes
 *   - Auto-hide after completion with smooth fade-out
 *   - Provide visual feedback with gradient and shadow effects
 * Called by:
 *   - Layout.tsx (renders at top of all pages)
 *   - Any component wrapped in the main layout
 * Notes:
 *   - Fixed position at top of viewport with z-index 9999
 *   - Progress increments randomly between 0-30% every 200ms
 *   - Max progress is 90% while loading (never reaches 100% until complete)
 *   - 500ms delay before hiding after completion
 *   - Uses primary color gradient for visual consistency
 */

import { useEffect, useState } from "react";
import { useLoading } from "@/hooks/use-loading";

/** Initial progress percentage when loading starts */
const INITIAL_PROGRESS = 10;

/** Maximum progress percentage while loading (never reaches 100% until done) */
const MAX_LOADING_PROGRESS = 90;

/** Completed progress percentage */
const COMPLETE_PROGRESS = 100;

/** Reset progress value */
const RESET_PROGRESS = 0;

/** Interval delay for progress updates in milliseconds */
const PROGRESS_UPDATE_INTERVAL = 200;

/** Maximum random increment per update */
const MAX_RANDOM_INCREMENT = 30;

/** Delay before hiding bar after completion in milliseconds */
const HIDE_DELAY = 500;

/**
 * Generates a random progress increment.
 * @returns Random number between 0 and MAX_RANDOM_INCREMENT
 */
function getRandomIncrement(): number {
  return Math.random() * MAX_RANDOM_INCREMENT;
}

/**
 * Calculates next progress value, ensuring it doesn't exceed maximum.
 * @param currentProgress - Current progress percentage
 * @param maxProgress - Maximum allowed progress
 * @returns New progress value
 */
function calculateNextProgress(
  currentProgress: number,
  maxProgress: number
): number {
  if (currentProgress >= maxProgress) {
    return currentProgress;
  }

  const nextProgress = currentProgress + getRandomIncrement();
  return Math.min(nextProgress, maxProgress);
}

/**
 * Validates if progress value is within valid range.
 * @param progress - Progress value to validate
 * @returns True if progress is valid (0-100)
 */
function isValidProgress(progress: number): boolean {
  return (
    typeof progress === "number" &&
    !isNaN(progress) &&
    progress >= 0 &&
    progress <= 100
  );
}

/**
 * Animated loading progress bar component.
 * Displays a gradient progress bar at the top of the viewport during loading states.
 */
export function LoadingBar(): JSX.Element | null {
  const { isLoading } = useLoading();
  const [progress, setProgress] = useState<number>(RESET_PROGRESS);
  const [showBar, setShowBar] = useState<boolean>(false);

  /**
   * Manages loading bar visibility and progress animation.
   * Starts progress when loading begins, completes when loading ends.
   */
  useEffect(
    function manageLoadingProgress(): () => void {
      if (isLoading) {
        // Start loading
        setShowBar(true);
        setProgress(INITIAL_PROGRESS);

        // Animate progress with random increments
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (!isValidProgress(prev)) {
              console.warn("Invalid progress value detected:", prev);
              return INITIAL_PROGRESS;
            }

            return calculateNextProgress(prev, MAX_LOADING_PROGRESS);
          });
        }, PROGRESS_UPDATE_INTERVAL);

        // Cleanup interval on unmount or when loading changes
        return (): void => {
          clearInterval(interval);
        };
      }

      // Complete loading
      setProgress(COMPLETE_PROGRESS);

      // Hide bar after delay
      const timer = setTimeout(() => {
        setShowBar(false);
        setProgress(RESET_PROGRESS);
      }, HIDE_DELAY);

      // Cleanup timer on unmount or when loading changes
      return (): void => {
        clearTimeout(timer);
      };
    },
    [isLoading]
  );

  // Don't render if bar should be hidden
  if (!showBar) {
    return null;
  }

  // Ensure progress is valid before rendering
  const safeProgress = isValidProgress(progress) ? progress : RESET_PROGRESS;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[9999] bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all duration-300 ease-out shadow-lg"
        style={{
          width: `${safeProgress}%`,
          boxShadow:
            safeProgress > 0
              ? "0 0 10px rgba(var(--primary), 0.5)"
              : "none",
        }}
        role="progressbar"
        aria-valuenow={Math.round(safeProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Loading progress"
      />
    </div>
  );
}

export default LoadingBar;
