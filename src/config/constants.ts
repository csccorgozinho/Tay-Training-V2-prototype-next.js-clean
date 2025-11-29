"use strict";

/**
 * File: constants.ts
 * Description: Centralized configuration constants for the entire application.
 * Contains all hardcoded values for pagination, defaults, animations, and UI settings.
 * Responsibilities:
 *   - Define pagination limits for exercises, methods, and workout sheets
 *   - Provide default values for exercise properties (rest time, series, reps)
 *   - Specify animation timing and transition durations
 *   - Configure Framer Motion animation parameters
 *   - Maintain UI-related constants (CSS classes, delays)
 *   - Export type-safe constant objects with readonly properties
 * Called by:
 *   - exercises.tsx (pagination for exercises list)
 *   - methods.tsx (pagination for methods list)
 *   - WorkoutSheets.tsx (pagination for workout sheets list)
 *   - ExerciseDialog.tsx (default values for new exercises)
 *   - WorkoutSheetDialog.tsx (animation and default values)
 *   - Various components using debounced search inputs
 *   - Components with Framer Motion animations
 * Notes:
 *   - All constants are exported as readonly objects with `as const`
 *   - String values (like "60s", "3", "10") match expected format in forms
 *   - Animation timings are coordinated between JS and CSS (TRANSITION_CLASS)
 *   - Debounce delay balances responsiveness vs API request frequency
 *   - ConfigConstants type provides type safety for consumers
 */

/**
 * Pagination Configuration
 * Controls how many items are displayed per page in different views.
 */
export const PAGINATION = {
  /** Number of exercises displayed per page in exercises list view */
  EXERCISES_PER_PAGE: 12,
  /** Number of methods displayed per page in methods list view */
  METHODS_PER_PAGE: 12,
  /** Number of workout sheets displayed per page in sheets list view */
  SHEETS_PER_PAGE: 6,
} as const;

/**
 * Exercise Default Values
 * Default values for exercise properties when creating new exercises.
 * String format matches form input expectations.
 */
export const EXERCISE_DEFAULTS = {
  /** Default rest time between sets (in seconds) - string format for form inputs */
  REST_TIME: "60s",
  /** Default number of series/sets for an exercise - string format for form inputs */
  DEFAULT_SERIES: "3",
  /** Default number of repetitions per set - string format for form inputs */
  DEFAULT_REPS: "10",
} as const;

/**
 * Animation & Transition Configuration
 * Timing values for animations, transitions, and user interactions.
 * All timing values are in appropriate units (milliseconds for debounce, seconds for CSS/Framer Motion).
 */
export const ANIMATION = {
  /** Debounce delay for search inputs (milliseconds) - balances UX and API load */
  DEBOUNCE_DELAY: 300,
  /** Standard transition duration for UI elements (seconds) - matches Tailwind duration-200 */
  TRANSITION_DURATION: 0.2,
  /** Dialog/modal animation duration (seconds) - slightly longer for smoother appearance */
  DIALOG_ANIMATION_DURATION: 0.3,
  /** Framer Motion spring stiffness value - controls animation bounce */
  SPRING_STIFFNESS: 300,
  /** Framer Motion spring damping value - controls animation smoothness */
  SPRING_DAMPING: 30,
  /** Base delay multiplier for staggered animations (seconds) - creates cascade effect */
  STAGGER_DELAY: 0.05,
  /** Additional delay for secondary animations (seconds) - staggers animation sequences */
  SECONDARY_DELAY: 0.2,
} as const;

/**
 * UI Configuration
 * General UI-related constants including CSS classes and style values.
 */
export const UI = {
  /** Tailwind CSS transition duration class (matches ANIMATION.TRANSITION_DURATION of 0.2s) */
  TRANSITION_CLASS: "duration-200",
} as const;

/**
 * Type for accessing nested constants.
 * Provides type safety when accessing configuration values throughout the application.
 * This is an intersection type combining all constant object types.
 */
export type ConfigConstants = typeof PAGINATION &
  typeof EXERCISE_DEFAULTS &
  typeof ANIMATION &
  typeof UI;
