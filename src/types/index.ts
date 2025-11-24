/**
 * Type definitions for the Tay Training application
 * Based on Prisma schema and API contracts
 */

// ============================================
// Core Entity Types
// ============================================

export interface Category {
  id: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Exercise {
  id: number;
  name: string;
  description: string;
  videoUrl?: string | null;
  hasMethod?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Method {
  id: number;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

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

// ============================================
// UI/Component Types
// ============================================

export interface WorkoutSheetTransformed {
  id: number;
  name: string;
  exercises: number;
  type: string;
  methods: string[];
  lastUpdated: string;
}

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface EditableDialogProps extends DialogProps {
  isEditing: boolean;
  initialData?: unknown;
  onSaved?: (data: unknown) => void;
}

// ============================================
// API Response Types
// ============================================

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

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: string;
}

// ============================================
// Hook Return Types
// ============================================

export interface UsePaginationResult<T> {
  currentPage: number;
  totalPages: number;
  currentPageItems: T[];
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  setCurrentPage: (page: number) => void;
}

export interface UseWorkoutSheetsFilterResult {
  sheets: ExerciseGroup[];
  categories: Category[];
  selectedCategoryId: number | null;
  isLoading: boolean;
  error: string | null;
  setSelectedCategoryId: (categoryId: number | null) => void;
  refreshSheets: () => void;
}
