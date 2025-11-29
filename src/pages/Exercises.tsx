
"use strict";

/**
 * File: Exercises.tsx
 * Description: Exercise management page component with CRUD operations.
 * Displays a paginated, searchable grid of exercises with create, edit, view, and delete functionality.
 * Responsibilities:
 *   - Render exercise management interface with grid layout
 *   - Load exercises from API with server-side pagination
 *   - Implement client-side search filtering across current page
 *   - Handle exercise creation, editing, viewing, and deletion
 *   - Manage dialog states for exercise operations
 *   - Display loading states with skeletons during data fetch
 *   - Show empty states when no exercises match filters
 *   - Manage pagination controls and page navigation
 *   - Display toast notifications for user actions
 * Called by:
 *   - Next.js routing system (accessed via /exercises route)
 *   - Navigation menu items in Layout component
 * Notes:
 *   - Requires authentication (enforced by requireAuthGetServerSideProps)
 *   - Uses server-side pagination (API returns paginated data)
 *   - Search filtering is client-side only (filters current page results)
 *   - Exercise dialog handles both create and edit modes
 *   - Delete operation requires confirmation via dialog handler
 *   - Page reloads current page data after CRUD operations
 *   - Total count from API metadata drives pagination
 *   - Items per page configured via PAGINATION.EXERCISES_PER_PAGE constant
 */

import { useState, useEffect } from "react";
import type { GetServerSideProps } from "next";
import { Layout } from "@/components/layout/Layout";
import { useLoading } from "@/hooks/use-loading";
import { useDialogHandlers } from "@/hooks/use-dialog-handlers";
import { requireAuthGetServerSideProps } from "@/lib/server-auth";
import { ApiError } from "@/lib/api-client";
import type { Exercise } from "@/types";
import { PAGINATION } from "@/config/constants";
import {
  Plus,
  Search,
  Dumbbell,
  MoreVertical,
  Edit,
  Eye,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationUI } from "@/components/ui/pagination-ui";
import ExerciseDialog from "@/components/dialogs/ExerciseDialog";
import { useToast } from "@/hooks/use-toast";

// ============================================
// Type Definitions
// ============================================

/**
 * API response structure for exercise listing.
 */
interface ExerciseListResponse {
  success: boolean;
  data?: Exercise[];
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

// ============================================
// Constants
// ============================================

/**
 * Number of skeleton cards to show during loading.
 */
const SKELETON_COUNT = 12;

/**
 * Minimum search term length for effective filtering.
 */
const MIN_SEARCH_LENGTH = 0;

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a value is a valid non-empty string.
 */
function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Check if a value is a valid array.
 */
function isValidArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Check if a value is a valid positive integer.
 */
function isValidPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/**
 * Safely extract error message from unknown error.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Não foi possível carregar os exercícios.";
}

/**
 * Validate exercise object has required properties.
 */
function isValidExercise(exercise: unknown): exercise is Exercise {
  if (typeof exercise !== "object" || exercise === null) {
    return false;
  }

  const ex = exercise as Record<string, unknown>;

  if (!isValidPositiveInteger(ex.id)) {
    return false;
  }

  if (!isValidString(ex.name)) {
    return false;
  }

  return true;
}

/**
 * Filter exercises by search term.
 */
function filterExercisesBySearch(
  exercises: Exercise[],
  searchTerm: string
): Exercise[] {
  if (!searchTerm || searchTerm.trim().length < MIN_SEARCH_LENGTH) {
    return exercises;
  }

  const normalizedSearch = searchTerm.toLowerCase().trim();

  return exercises.filter((exercise) => {
    const nameMatch =
      exercise.name && exercise.name.toLowerCase().includes(normalizedSearch);
    const descriptionMatch =
      exercise.description &&
      exercise.description.toLowerCase().includes(normalizedSearch);

    return nameMatch || descriptionMatch;
  });
}

// ============================================
// Main Component
// ============================================

/**
 * Exercises page component.
 * Manages exercise CRUD operations with pagination and search.
 */
const Exercises = (): JSX.Element => {
  // State management
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Hooks
  const { startLoading, stopLoading } = useLoading();
  const { toast } = useToast();

  // Configuration
  const itemsPerPage = PAGINATION.EXERCISES_PER_PAGE || 12;

  /**
   * Load exercises from API for the specified page.
   * @param page - The page number to load (1-indexed)
   */
  async function loadExercises(page: number): Promise<void> {
    if (!isValidPositiveInteger(page)) {
      console.error("Invalid page number:", page);
      return;
    }

    setLoading(true);
    startLoading();

    try {
      const response = await fetch(
        `/api/db/exercises?page=${page}&pageSize=${itemsPerPage}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ExerciseListResponse = await response.json();

      if (result.success) {
        const exerciseData = isValidArray(result.data) ? result.data : [];
        const validExercises = exerciseData.filter(isValidExercise);

        setExercises(validExercises);
        setTotalCount(
          result.meta && typeof result.meta.total === "number"
            ? result.meta.total
            : 0
        );
      } else {
        throw new Error(result.error || "Failed to load exercises");
      }
    } catch (err) {
      console.error("Error loading exercises:", err);

      const message = getErrorMessage(err);

      toast({
        variant: "destructive",
        title: "Erro ao carregar exercícios",
        description: message,
      });

      setExercises([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      stopLoading();
    }
  }

  /**
   * Handle successful save operation.
   */
  function handleExerciseSaved(exercise: Exercise | null): void {
    loadExercises(currentPage);

    const exerciseName = exercise && isValidString(exercise.name)
      ? exercise.name
      : "Registro criado.";

    toast({
      title: "Exercício salvo",
      description: exerciseName,
    });

    closeDialog();
  }

  /**
   * Navigate to the next page if available.
   */
  function goToNextPage(): void {
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }

  /**
   * Navigate to the previous page if available.
   */
  function goToPreviousPage(): void {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }

  /**
   * Handle page selection from pagination controls.
   */
  function handlePageSelect(page: number): void {
    if (isValidPositiveInteger(page)) {
      setCurrentPage(page);
    }
  }

  /**
   * Handle search term changes.
   */
  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const value = event.target.value;
    setSearchTerm(typeof value === "string" ? value : "");
  }

  // Dialog handlers
  const {
    isOpen: exerciseDialogOpen,
    editingItem: editingExercise,
    selectedItem: selectedExercise,
    openEditDialog,
    openViewDialog,
    openAddDialog,
    closeDialog,
    handleDelete,
  } = useDialogHandlers<Exercise>({
    itemName: "exercício",
    onLoadItems: () => loadExercises(currentPage),
  });

  // Load exercises when page changes
  useEffect(() => {
    loadExercises(currentPage);
  }, [currentPage]);

  // Calculate derived values
  const filteredExercises = filterExercisesBySearch(exercises, searchTerm);
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const hasExercises = filteredExercises.length > 0;
  const showEmptyState = !loading && !hasExercises;
  const showPagination = !loading && hasExercises;

  return (
    <Layout>
      <div className="w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-8 animate-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exercícios</h1>
            <p className="text-muted-foreground">
              Gerencie seu catálogo de exercícios ({totalCount} total)
            </p>
          </div>

          <Button
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={openAddDialog}
            aria-label="Criar novo exercício"
          >
            <Plus className="h-4 w-4" />
            Novo Exercício
          </Button>
        </div>

        {/* Search Section */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar exercícios por nome ou descrição..."
              className="pl-9"
              value={searchTerm}
              onChange={handleSearchChange}
              aria-label="Buscar exercícios"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-h-[400px]">
            {[...Array(SKELETON_COUNT)].map((_, i) => (
              <Card key={`skeleton-${i}`} className="border border-border/40">
                <CardHeader>
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Exercise Grid */}
        {!loading && hasExercises && (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredExercises.map((exercise) => {
              const exerciseName = exercise.name || "Sem nome";
              const exerciseDescription = exercise.description || "-";

              return (
                <Card
                  key={`exercise-${exercise.id}`}
                  onClick={() => openViewDialog(exercise)}
                  className="transition-all duration-300 hover:shadow-md border border-border/40 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver detalhes do exercício ${exerciseName}`}
                >
                  <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="bg-primary/10 text-primary p-2 rounded-lg mt-1 flex-shrink-0">
                        <Dumbbell className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-medium">
                          {exerciseName}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {exerciseDescription}
                        </CardDescription>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          onClick={(e) => e.stopPropagation()}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Menu de ações"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            openViewDialog(exercise);
                          }}
                        >
                          <Eye className="h-4 w-4" /> Ver
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(exercise);
                          }}
                        >
                          <Edit className="h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(
                              exercise.id,
                              `/api/db/exercises/${exercise.id}`
                            );
                          }}
                        >
                          <Trash className="h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {showEmptyState && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted rounded-full p-4 mb-4">
              <Dumbbell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">
              Nenhum exercício encontrado
            </h3>
            <p className="text-muted-foreground">
              Tente ajustar seus filtros ou adicione um novo exercício.
            </p>
          </div>
        )}

        {/* Pagination */}
        {showPagination && (
          <PaginationUI
            currentPage={currentPage}
            totalPages={totalPages}
            onPreviousPage={goToPreviousPage}
            onNextPage={goToNextPage}
            onPageSelect={handlePageSelect}
          />
        )}

        {/* Exercise Dialog */}
        <ExerciseDialog
          open={exerciseDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeDialog();
            }
          }}
          isEditing={!!editingExercise}
          initialData={editingExercise || selectedExercise}
          onSaved={handleExerciseSaved}
        />
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = requireAuthGetServerSideProps;

export default Exercises;