/**
 * Centralized Configuration Constants
 * This file contains all hardcoded configuration values used throughout the application.
 * Extracting these into a single location allows for easy maintenance and updates.
 */

/**
 * Pagination Configuration
 * Controls how many items are displayed per page in different views
 */
export const PAGINATION = {
  /** Number of exercises displayed per page */
  EXERCISES_PER_PAGE: 12,
  /** Number of methods displayed per page */
  METHODS_PER_PAGE: 12,
  /** Number of workout sheets displayed per page */
  SHEETS_PER_PAGE: 6,
} as const;

/**
 * Exercise Default Values
 * Default values for exercise properties when creating new exercises
 */
export const EXERCISE_DEFAULTS = {
  /** Default rest time between sets (in seconds) */
  REST_TIME: "60s",
  /** Default number of series/sets for an exercise */
  DEFAULT_SERIES: "3",
  /** Default number of repetitions per set */
  DEFAULT_REPS: "10",
} as const;

/**
 * Animation & Transition Configuration
 * Timing values for animations, transitions, and user interactions
 */
export const ANIMATION = {
  /** Debounce delay for search inputs (milliseconds) */
  DEBOUNCE_DELAY: 300,
  /** Standard transition duration for UI elements (seconds) */
  TRANSITION_DURATION: 0.2,
  /** Dialog/modal animation duration (seconds) */
  DIALOG_ANIMATION_DURATION: 0.3,
  /** Framer Motion spring stiffness value */
  SPRING_STIFFNESS: 300,
  /** Framer Motion spring damping value */
  SPRING_DAMPING: 30,
  /** Base delay multiplier for staggered animations (seconds) */
  STAGGER_DELAY: 0.05,
  /** Additional delay for secondary animations (seconds) */
  SECONDARY_DELAY: 0.2,
} as const;

/**
 * UI Configuration
 * General UI-related constants
 */
export const UI = {
  /** Tailwind CSS transition duration class (matches ANIMATION.TRANSITION_DURATION) */
  TRANSITION_CLASS: "duration-200",
} as const;

/**
 * Type for accessing nested constants
 * Provides type safety when accessing configuration values
 */
export type ConfigConstants = typeof PAGINATION &
  typeof EXERCISE_DEFAULTS &
  typeof ANIMATION &
  typeof UI;
