"use strict";

/**
 * File: index.ts
 * Description: Central type definitions file for the Tay Training application.
 *              Defines TypeScript interfaces and types for all core entities,
 *              UI components, API responses, and custom hook return values.
 *              Based on Prisma database schema and API contracts.
 * Responsibilities:
 *   - Define core entity types (Category, Exercise, Method, ExerciseGroup, etc.)
 *   - Define training-related types (TrainingSheet, TrainingDay, ExerciseMethod)
 *   - Define UI/component prop types (DialogProps, WorkoutSheetTransformed)
 *   - Define API response wrapper types (ApiResponse, ApiErrorResponse)
 *   - Define custom hook return types (UsePaginationResult, UseWorkoutSheetsFilterResult)
 *   - Ensure type safety across the entire application
 *   - Provide consistent interface contracts for data structures
 * Called by:
 *   - All React components (pages/, src/components/)
 *   - API route handlers (pages/api/)
 *   - Custom hooks (src/hooks/)
 *   - Library utilities (src/lib/)
 *   - Service layers (src/lib/training-sheet-service.ts, etc.)
 * Notes:
 *   - All date fields use JavaScript Date type (converted from Prisma DateTime)
 *   - Optional fields are explicitly marked with ? for clarity
 *   - Null is explicitly allowed where the database schema permits it
 *   - API response types follow a consistent success/error pattern
 *   - Hook return types should match the actual hook implementations
 *   - ExerciseGroup is used interchangeably with "workout sheet" in the UI
 *   - TrainingSheet represents a complete training schedule with multiple days
 */

// ============================================================================
// Core Entity Types
// ============================================================================

/**
 * Category represents a classification for exercise groups
 * Examples: "Hipertrofia", "Força", "Resistência", "Geral"
 */
export interface Category {
  id: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Exercise represents a single physical exercise
 * Contains name, description, and optional video demonstration
 */
export interface Exercise {
  id: number;
  name: string;
  description: string;
  videoUrl?: string | null;
  hasMethod?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Method represents a training methodology or technique
 * Examples: "Drop Set", "Super Set", "Pirâmide Crescente"
 */
export interface Method {
  id: number;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * ExerciseConfiguration links an exercise with a method and specifies sets/reps
 * Part of the exercise method configuration within an exercise group
 */
export interface ExerciseConfiguration {
  id: number;
  series: string;
  reps: string;
  exerciseMethodId?: number | null;
  exerciseId?: number | null;
  methodId?: number | null;
  exercise?: Exercise;
  method?: Method;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * ExerciseMethod groups multiple exercise configurations with shared rest/observations
 * Represents a set of exercises performed together in a training session
 */
export interface ExerciseMethod {
  id: number;
  rest: string;
  observations?: string | null;
  order?: number | null;
  exerciseGroupId: number;
  exerciseConfigurations: ExerciseConfiguration[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * ExerciseGroup (also called "workout sheet" or "training sheet" in the UI)
 * Represents a reusable template of exercises that can be assigned to training days
 * Contains multiple exercise methods with their configurations
 */
export interface ExerciseGroup {
  id: number;
  name: string;
  categoryId: number;
  publicName?: string | null;
  category?: Category;
  exerciseMethods: ExerciseMethod[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * TrainingDay represents a single day in a training schedule
 * Links a specific exercise group to a day number in the training sheet
 */
export interface TrainingDay {
  id: number;
  day: number;
  trainingSheetId: number;
  exerciseGroupId: number;
  shortName?: string | null;
  exerciseGroup?: ExerciseGroup;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * TrainingSheet represents a complete training schedule/program
 * Contains multiple training days, each assigned an exercise group
 * Can be shared via slug and exported to PDF
 */
export interface TrainingSheet {
  id: number;
  name: string;
  publicName?: string | null;
  slug?: string | null;
  offlinePdf?: string | null;
  newTabPdf?: string | null;
  pdfPath?: string | null;
  trainingDays: TrainingDay[];
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// UI/Component Types
// ============================================================================

/**
 * WorkoutSheetTransformed is the display-friendly format for exercise groups
 * Used in the workout sheets list page to show summary information
 * Derived from ExerciseGroup but with calculated fields for UI display
 */
export interface WorkoutSheetTransformed {
  id: number;
  name: string;
  exercises: number; // Calculated: total number of exercises
  type: string; // Derived from category name
  methods: string[]; // Array of method names used
  lastUpdated: string; // Formatted date string (pt-BR locale)
}

/**
 * Base dialog props for all dialog components
 * Provides standard open/close control interface
 */
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Extended dialog props for dialogs that support create/edit modes
 * Used by dialogs that can create new items or edit existing ones
 */
export interface EditableDialogProps extends DialogProps {
  isEditing: boolean;
  initialData?: unknown;
  onSaved?: (data: unknown) => void;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard success response wrapper for API endpoints
 * Generic type T represents the data payload type
 * Meta object provides pagination information when applicable
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  meta?: {
    count?: number;
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

/**
 * Standard error response for API endpoints
 * Always has success: false and includes error message
 * Data is explicitly null to indicate no data was returned
 */
export interface ApiErrorResponse {
  success: false;
  data: null;
  error: string;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for usePagination hook
 * Provides pagination state and navigation functions
 * Generic type T represents the type of items being paginated
 */
export interface UsePaginationResult<T> {
  currentPage: number;
  totalPages: number;
  currentPageItems: T[];
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  setCurrentPage: (page: number) => void;
}

/**
 * Return type for useWorkoutSheetsFilter hook
 * Provides filtered workout sheets data with category filtering and pagination
 * Manages loading states and error handling for the workout sheets page
 */
export interface UseWorkoutSheetsFilterResult {
  sheets: ExerciseGroup[];
  categories: Category[];
  selectedCategoryId: number | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalCount: number;
  pageSize: number;
  setSelectedCategoryId: (categoryId: number | null) => void;
  setCurrentPage: (page: number) => void;
  refreshSheets: () => void;
}
