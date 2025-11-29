
"use strict";

/**
 * File: WorkoutSheets.tsx
 * Description: Workout sheets (exercise groups) management page that displays reusable
 *              workout templates in a card-based grid layout with filtering, search,
 *              and pagination capabilities. Allows creation, editing, duplication,
 *              and deletion of workout sheet templates.
 * Responsibilities:
 *   - Display paginated grid of workout sheet cards with exercise counts and methods
 *   - Provide search functionality to filter sheets by name, type, or methods
 *   - Support category-based filtering via CategoryFilterDialog
 *   - Handle CRUD operations for workout sheets (exercise groups)
 *   - Support duplication of existing workout sheets with automatic naming
 *   - Transform API data into display-friendly format with exercise counts
 *   - Integrate with WorkoutSheetDialog for creation/editing workflows
 *   - Show loading states with skeleton cards during data fetches
 * Called by:
 *   - Next.js routing system (pages/workout-sheets.tsx route)
 *   - Layout navigation links
 *   - User navigation from home page or direct URL access
 * Notes:
 *   - Requires authentication (enforced by requireAuthGetServerSideProps)
 *   - Uses useWorkoutSheetsFilter hook for data fetching and pagination
 *   - Uses useDialogHandlers hook for dialog state management
 *   - Displays 6 cards per page (3 columns × 2 rows on desktop)
 *   - Color-codes workout types (Hipertrofia, Força, Resistência, Geral)
 *   - Fetches full exercise group data before editing to ensure complete information
 *   - Duplicate feature creates copies with " - Cópia" suffix and handles naming conflicts
 */

import { useState, useEffect } from "react";
import type { GetServerSideProps } from "next";
import { Layout } from "@/components/layout/Layout";
import { useWorkoutSheetsFilter } from "@/hooks/use-workout-sheets-filter";
import { useDialogHandlers } from "@/hooks/use-dialog-handlers";
import { requireAuthGetServerSideProps } from "@/lib/server-auth";
import { apiGet, apiPost, ApiError } from "@/lib/api-client";
import { 
  ChevronDown,
  Plus, 
  Search, 
  Filter, 
  Layers,
  MoreVertical, 
  Edit,
  Trash,
  Copy,
  Dumbbell,
  Calendar,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationUI } from "@/components/ui/pagination-ui";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import WorkoutSheetDialog from "@/components/dialogs/WorkoutSheetDialog";
import { CategoryFilterDialog } from "@/components/dialogs/CategoryFilterDialog";
import { useToast } from "@/hooks/use-toast";
import type { ExerciseGroup, WorkoutSheetTransformed, Category } from "@/types";

// ============================================================================
// Constants
// ============================================================================

const ITEMS_PER_PAGE = 6; // 3 cards per row × 2 rows
const SKELETON_COUNT = 3;
const MIN_SEARCH_LENGTH = 0;

/**
 * Type to color mapping for workout categories
 */
const TYPE_COLOR_MAP: Record<string, string> = {
  "Hipertrofia": "bg-purple-500/10 text-purple-500",
  "Força": "bg-blue-500/10 text-blue-500",
  "Resistência": "bg-orange-500/10 text-orange-500",
  "Geral": "bg-green-500/10 text-green-500",
};

const DEFAULT_TYPE_COLOR = "bg-gray-500/10 text-gray-500";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Type guard to check if a value is a valid string
 */
function isValidString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Type guard to check if a value is a valid array
 */
function isValidArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is a positive integer
 */
function isValidPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && value > 0 && Number.isInteger(value);
}

/**
 * Extracts error message from various error types
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (isValidString(error)) {
    return error;
  }
  return "Ocorreu um erro desconhecido";
}

/**
 * Gets the color class for a workout type
 */
function getTypeColor(type: string): string {
  return TYPE_COLOR_MAP[type] || DEFAULT_TYPE_COLOR;
}

/**
 * Generates a unique name for a duplicated workout sheet
 * Checks existing names and appends " - Cópia" with incremental numbers if needed
 */
function generateDuplicateName(
  originalName: string,
  existingNames: string[]
): string {
  let newName = `${originalName} - Cópia`;
  let copyCount = 1;
  
  while (existingNames.includes(newName)) {
    copyCount += 1;
    newName = `${originalName} - Cópia ${copyCount}`;
  }
  
  return newName;
}

/**
 * Filters workout sheets based on search term
 * Searches in name, type, and method names (case-insensitive)
 */
function filterSheetsBySearch(
  sheets: WorkoutSheetTransformed[],
  searchTerm: string
): WorkoutSheetTransformed[] {
  if (!searchTerm || searchTerm.length < MIN_SEARCH_LENGTH) {
    return sheets;
  }
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return sheets.filter((sheet) => {
    const nameMatch = sheet.name.toLowerCase().includes(lowerSearchTerm);
    const typeMatch = sheet.type.toLowerCase().includes(lowerSearchTerm);
    const methodMatch = sheet.methods && sheet.methods.length > 0
      ? sheet.methods.some((method) => method.toLowerCase().includes(lowerSearchTerm))
      : false;
    
    return nameMatch || typeMatch || methodMatch;
  });
}

/**
 * Transforms raw sheet data from API into display format
 * Calculates exercise counts and extracts method names
 */
function transformSheetData(
  sheet: any,
  categories: Category[]
): WorkoutSheetTransformed {
  let totalExercises = 0;
  const methodNames: string[] = [];
  
  // Count exercises from exerciseMethods
  if (isValidArray(sheet.exerciseMethods)) {
    sheet.exerciseMethods.forEach((method: any) => {
      if (method && isValidArray(method.exerciseConfigurations)) {
        const configCount = method.exerciseConfigurations.length;
        totalExercises += configCount;
        
        if (configCount > 0) {
          method.exerciseConfigurations.forEach((config: any) => {
            if (config?.method?.name && isValidString(config.method.name)) {
              if (!methodNames.includes(config.method.name)) {
                methodNames.push(config.method.name);
              }
            }
          });
        }
      }
    });
  }
  
  // Find the category name from the categories array
  const categoryName = categories.find(
    (cat) => cat.id === sheet.categoryId
  )?.name || "Sem categoria";
  
  return {
    id: sheet.id,
    name: sheet.name || "Sem nome",
    exercises: totalExercises,
    type: categoryName,
    methods: methodNames,
    lastUpdated: new Date(sheet.updatedAt).toLocaleDateString("pt-BR"),
  };
}

// ============================================================================
// Main Component
// ============================================================================

const WorkoutSheets = (): JSX.Element => {
  // State management with explicit types
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterDialogOpen, setFilterDialogOpen] = useState<boolean>(false);
  const [workoutSheets, setWorkoutSheets] = useState<WorkoutSheetTransformed[]>([]);
  
  const { toast } = useToast();
  
  // Use the workout sheets filter hook for data fetching and pagination
  const {
    sheets,
    categories,
    selectedCategoryId,
    isLoading: filterLoading,
    error: filterError,
    currentPage,
    totalCount,
    pageSize,
    setSelectedCategoryId,
    setCurrentPage,
    refreshSheets,
  } = useWorkoutSheetsFilter(ITEMS_PER_PAGE);

  // Dialog handlers for workout sheet CRUD operations
  const {
    isOpen: workoutSheetDialogOpen,
    editingItem: editingWorkoutSheet,
    openEditDialog: openEditDialogFromHook,
    openAddDialog,
    closeDialog,
    handleDelete,
  } = useDialogHandlers<ExerciseGroup>({
    itemName: "grupo de exercícios",
    onLoadItems: async (): Promise<void> => {
      refreshSheets();
    },
  });

  /**
   * Opens the edit dialog for a workout sheet
   * Fetches full exercise group data before opening the dialog
   */
  async function handleOpenEditDialog(sheet: WorkoutSheetTransformed): Promise<void> {
    if (!sheet || !isValidPositiveInteger(sheet.id)) {
      console.error("Invalid workout sheet:", sheet);
      return;
    }
    
    try {
      const fullGroup = await apiGet<ExerciseGroup>(
        `/api/exercise-groups/${sheet.id}`
      );
      
      openEditDialogFromHook(fullGroup);
    } catch (err) {
      console.error("Failed to fetch full sheet data:", err);
      
      const message = getErrorMessage(err);
      
      toast({ 
        variant: "destructive",
        title: "Erro ao carregar grupo", 
        description: message || "Não foi possível carregar os dados do grupo."
      });
    }
  }

  /**
   * Transform sheets from filter hook into display format
   * Runs whenever sheets or categories change
   */
  useEffect(() => {
    if (!isValidArray(sheets) || !isValidArray(categories)) {
      return;
    }
    
    const transformedSheets: WorkoutSheetTransformed[] = sheets.map((sheet) =>
      transformSheetData(sheet, categories)
    );
    
    setWorkoutSheets(transformedSheets);
  }, [sheets, categories]);

  /**
   * Handles successful workout sheet creation/update
   * Refreshes the list and shows success toast
   */
  function handleWorkoutSheetSuccess(data: unknown): void {
    refreshSheets();
    
    toast({
      title: "Sucesso!",
      description: "Grupo de exercícios criado/atualizado com sucesso.",
    });
  }

  /**
   * Duplicates a workout sheet with a new unique name
   * Fetches full data, creates a copy, and refreshes the list
   */
  async function handleDuplicateWorkoutSheet(
    sheet: WorkoutSheetTransformed
  ): Promise<void> {
    if (!sheet || !isValidPositiveInteger(sheet.id)) {
      console.error("Invalid workout sheet for duplication:", sheet);
      return;
    }
    
    try {
      // Fetch full sheet data first
      const fullGroup = await apiGet<ExerciseGroup>(
        `/api/exercise-groups/${sheet.id}`
      );

      // Generate unique name for the duplicate
      const existingNames = workoutSheets.map((s) => s.name);
      const newName = generateDuplicateName(fullGroup.name, existingNames);

      // Create duplicate by copying the group
      await apiPost("/api/exercise-groups", {
        name: newName,
        categoryId: fullGroup.categoryId,
        exerciseMethods: isValidArray(fullGroup.exerciseMethods)
          ? fullGroup.exerciseMethods.map((m) => ({
              rest: m.rest,
              observations: m.observations,
              exerciseConfigurations: isValidArray(m.exerciseConfigurations)
                ? m.exerciseConfigurations.map((c) => ({
                    exerciseId: c.exerciseId,
                    methodId: c.methodId,
                    series: c.series,
                    reps: c.reps,
                  }))
                : [],
            }))
          : [],
      });

      // Refresh the list
      refreshSheets();

      toast({
        title: "Grupo duplicado",
        description: `"${fullGroup.name}" foi duplicado como "${newName}"`,
      });
    } catch (err) {
      console.error("Error duplicating group:", err);
      
      const message = getErrorMessage(err);
      
      toast({
        variant: "destructive",
        title: "Erro ao duplicar",
        description: message || "Não foi possível duplicar o grupo.",
      });
    }
  }

  /**
   * Handles deletion of a workout sheet
   */
  async function handleDeleteSheet(id: number): Promise<void> {
    if (!isValidPositiveInteger(id)) {
      console.error("Invalid sheet ID for deletion:", id);
      return;
    }
    
    await handleDelete(id, `/api/exercise-groups/${id}`);
  }

  /**
   * Handles search input changes
   */
  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>): void {
    setSearchTerm(event.target.value);
  }

  /**
   * Handles filter dialog open state changes
   */
  function handleFilterDialogChange(open: boolean): void {
    setFilterDialogOpen(open);
  }

  /**
   * Handles workout sheet dialog open state changes
   */
  function handleWorkoutSheetDialogChange(open: boolean): void {
    if (!open) {
      closeDialog();
    }
  }

  /**
   * Handles page navigation - previous page
   */
  function goToPreviousPage(): void {
    setCurrentPage(Math.max(currentPage - 1, 1));
  }

  /**
   * Handles page navigation - next page
   */
  function goToNextPage(): void {
    setCurrentPage(Math.min(currentPage + 1, totalPages));
  }

  /**
   * Handles page selection from pagination UI
   */
  function handlePageSelect(page: number): void {
    if (isValidPositiveInteger(page)) {
      setCurrentPage(page);
    }
  }
  
  // Derived state for rendering
  const filteredWorkoutSheets = filterSheetsBySearch(workoutSheets, searchTerm);
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasSheets = filteredWorkoutSheets.length > 0;
  const showEmptyState = !filterLoading && !hasSheets;
  const showPagination = hasSheets;
  
  return (
    <Layout>
      <div className="w-full animate-fade-in">
        <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Fichas de Treino</h1>
              <p className="text-muted-foreground">
                Crie e gerencie fichas de treino reutilizáveis. ({totalCount} total)
              </p>
            </div>
            
            <Button 
              className="gap-2 bg-primary hover:bg-primary/90"
              onClick={openAddDialog}
              aria-label="Criar nova ficha de treino"
            >
              <Plus className="h-4 w-4" />
              Nova Ficha
            </Button>
          </div>
          
          {/* Search and Filter Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar fichas de treino..."
                className="pl-9"
                value={searchTerm}
                onChange={handleSearchChange}
                aria-label="Buscar fichas de treino"
              />
            </div>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => handleFilterDialogChange(true)}
              aria-label="Abrir filtros"
            >
              <Filter className="h-4 w-4" />
              Filtrar
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Loading State */}
          {filterLoading ? (
            <div 
              className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              aria-label="Carregando fichas de treino"
            >
              {[...Array(SKELETON_COUNT)].map((_, i) => (
                <Card key={`skeleton-${i}`} className="border border-border/40">
                  <CardHeader>
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-5 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                    </div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWorkoutSheets.map((sheet) => {
              const sheetTypeColor = getTypeColor(sheet.type);
              const sheetName = sheet.name;
              const sheetId = sheet.id;
              const sheetType = sheet.type;
              const sheetExercises = sheet.exercises;
              const sheetMethods = sheet.methods;
              const sheetLastUpdated = sheet.lastUpdated;
              
              return (
                <Card 
                  key={`sheet-${sheetId}`}
                  className="transition-all duration-300 hover:shadow-md border border-border/40 flex flex-col"
                >
                  <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={sheetTypeColor}>
                          {sheetType}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-medium">{sheetName}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          aria-label={`Ações para ${sheetName}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="gap-2"
                          onClick={() => {
                            try {
                              handleOpenEditDialog(sheet);
                            } catch (err) {
                              console.error("Error opening edit dialog:", err);
                            }
                          }}
                        >
                          <Edit className="h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2"
                          onClick={() => {
                            try {
                              handleDuplicateWorkoutSheet(sheet);
                            } catch (err) {
                              console.error("Error duplicating sheet:", err);
                            }
                          }}
                        >
                          <Copy className="h-4 w-4" /> Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive gap-2"
                          onClick={() => {
                            try {
                              handleDeleteSheet(sheetId);
                            } catch (err) {
                              console.error("Error deleting sheet:", err);
                            }
                          }}
                        >
                          <Trash className="h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-muted p-2 rounded-md text-center flex flex-col items-center justify-center">
                        <Dumbbell className="h-4 w-4 mb-1 text-muted-foreground" />
                        <div className="text-lg font-semibold">{sheetExercises}</div>
                        <div className="text-xs text-muted-foreground">Exercícios</div>
                      </div>
                      <div className="bg-muted p-2 rounded-md text-center flex flex-col items-center justify-center">
                        <Clock className="h-4 w-4 mb-1 text-muted-foreground" />
                        <div className="text-lg font-semibold">{sheetMethods.length}</div>
                        <div className="text-xs text-muted-foreground">Métodos</div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Métodos utilizados:</p>
                      <div className="flex flex-wrap gap-2">
                        {sheetMethods.map((method, index) => (
                          <Badge key={`method-${index}`} variant="outline" className="text-xs">
                            {method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 text-xs text-muted-foreground flex justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Última atualização
                    </div>
                    <div>{sheetLastUpdated}</div>
                  </CardFooter>
                </Card>
              );
            })}
            </div>
          )}
          
          {/* Pagination Section */}
          {showPagination && (
            <PaginationUI
              currentPage={currentPage}
              totalPages={totalPages}
              onPreviousPage={goToPreviousPage}
              onNextPage={goToNextPage}
              onPageSelect={handlePageSelect}
            />
          )}
          
          {/* Empty State */}
          {showEmptyState && (
            <div 
              className="flex flex-col items-center justify-center py-12 text-center"
              role="status"
              aria-label="Nenhuma ficha encontrada"
            >
              <div className="bg-muted rounded-full p-4 mb-4">
                <Layers className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Nenhuma ficha encontrada</h3>
              <p className="text-muted-foreground">
                Tente ajustar seus filtros ou adicione uma nova ficha de treino.
              </p>
            </div>
          )}
        </div>

        {/* Workout Sheet Dialog */}
        <WorkoutSheetDialog 
          open={workoutSheetDialogOpen}
          onOpenChange={handleWorkoutSheetDialogChange}
          isEditing={!!editingWorkoutSheet}
          initialData={editingWorkoutSheet}
          onSuccess={handleWorkoutSheetSuccess}
        />

        {/* Category Filter Dialog */}
        <CategoryFilterDialog
          open={filterDialogOpen}
          onOpenChange={handleFilterDialogChange}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={setSelectedCategoryId}
          isLoading={filterLoading}
          error={filterError}
        />
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = requireAuthGetServerSideProps;

export default WorkoutSheets;
