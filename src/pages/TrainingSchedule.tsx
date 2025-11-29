
"use strict";

/**
 * File: TrainingSchedule.tsx
 * Description: Training schedule management page component that allows users to view,
 *              create, edit, and delete training schedules (training sheets) for clients.
 *              Includes pagination, search filtering, and a wizard-based dialog for
 *              creating/editing schedules.
 * Responsibilities:
 *   - Display paginated list of training schedules from the API
 *   - Provide client-side search filtering by name and public name
 *   - Handle CRUD operations (create, edit, delete, view) for training schedules
 *   - Manage pagination state and navigation
 *   - Display loading states with skeleton components
 *   - Show success/error toasts for user feedback
 *   - Integrate with TrainingScheduleDialogWizard for schedule creation/editing
 *   - Provide external view functionality via slug-based URLs
 * Called by:
 *   - Next.js routing system (pages/training-schedule.tsx route)
 *   - Layout navigation links
 *   - User navigation from home page or direct URL access
 * Notes:
 *   - Requires authentication (enforced by requireAuthGetServerSideProps)
 *   - Uses server-side pagination (page data fetched from API)
 *   - Client-side search filtering only affects current page results
 *   - Training schedules can be viewed externally via /training-schedule/{slug}
 *   - Integrates with Framer Motion for animations
 *   - Uses ShadCN UI components for consistent styling
 */

import { useState, useEffect } from "react";
import type { GetServerSideProps } from "next";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { useLoading } from "@/hooks/use-loading";
import { requireAuthGetServerSideProps } from "@/lib/server-auth";
import { apiDelete, ApiError } from "@/lib/api-client";
import type { TrainingSheet } from "@/types";
import { 
  Plus, 
  Search, 
  Edit,
  Trash,
  Calendar,
  MoreVertical,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationUI } from "@/components/ui/pagination-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import TrainingScheduleDialogWizard from "@/components/dialogs/TrainingScheduleDialog_Wizard";
import { useToast } from "@/hooks/use-toast";
import { fadeUpIn, hoverScale, tapScale } from "@/lib/motion-variants";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Response structure from the training sheets API endpoint
 */
interface TrainingSheetListResponse {
  success: boolean;
  data?: unknown;
  meta?: {
    total?: number;
  };
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const SKELETON_COUNT = 5;
const PAGE_SIZE = 10;
const MIN_SEARCH_LENGTH = 0;

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
 * Type guard to validate if an object is a valid TrainingSheet
 */
function isValidTrainingSheet(obj: unknown): obj is TrainingSheet {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  
  const sheet = obj as Record<string, unknown>;
  
  return (
    typeof sheet.id === "number" &&
    typeof sheet.name === "string" &&
    (sheet.publicName === null || typeof sheet.publicName === "string") &&
    (sheet.slug === null || typeof sheet.slug === "string")
  );
}

/**
 * Filters training schedules based on search term
 * Searches in both name and publicName fields (case-insensitive)
 */
function filterSchedulesBySearch(
  schedules: TrainingSheet[],
  searchTerm: string
): TrainingSheet[] {
  if (!searchTerm || searchTerm.length < MIN_SEARCH_LENGTH) {
    return schedules;
  }
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return schedules.filter((schedule) => {
    const nameMatch = schedule.name.toLowerCase().includes(lowerSearchTerm);
    const publicNameMatch = schedule.publicName
      ? schedule.publicName.toLowerCase().includes(lowerSearchTerm)
      : false;
    
    return nameMatch || publicNameMatch;
  });
}

// ============================================================================
// Main Component
// ============================================================================

const TrainingSchedule = (): JSX.Element => {
  // State management with explicit types
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState<boolean>(false);
  const [editingSchedule, setEditingSchedule] = useState<TrainingSheet | null>(null);
  const [schedules, setSchedules] = useState<TrainingSheet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  const { toast } = useToast();
  const { startLoading, stopLoading } = useLoading();

  /**
   * Loads training schedules from the API for a specific page
   * Validates page number, fetches data, and updates component state
   */
  async function loadSchedules(page: number): Promise<void> {
    if (!isValidPositiveInteger(page)) {
      console.error("Invalid page number:", page);
      return;
    }
    
    setLoading(true);
    startLoading();
    
    try {
      const response = await fetch(
        `/api/training-sheets?page=${page}&pageSize=${PAGE_SIZE}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: TrainingSheetListResponse = await response.json();
      
      if (result.success) {
        const scheduleData = isValidArray(result.data) ? result.data : [];
        const validSchedules = scheduleData.filter(isValidTrainingSheet);
        
        setSchedules(validSchedules);
        setTotalCount(
          result.meta && typeof result.meta.total === "number"
            ? result.meta.total
            : 0
        );
      } else {
        throw new Error(result.error || "Failed to load training sheets");
      }
    } catch (err) {
      console.error("Error loading training schedules:", err);
      
      const message = getErrorMessage(err);
      
      toast({ 
        variant: "destructive",
        title: "Erro ao carregar agendas", 
        description: message || "Não foi possível carregar as agendas de treino."
      });
      
      setSchedules([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      stopLoading();
    }
  }

  // Load schedules when page changes
  useEffect(() => {
    loadSchedules(currentPage);
  }, [currentPage]);
  
  /**
   * Opens the edit dialog for a specific schedule
   */
  function handleOpenEditDialog(schedule: TrainingSheet): void {
    setEditingSchedule(schedule);
    setScheduleDialogOpen(true);
  }

  /**
   * Opens the dialog to create a new schedule
   */
  function handleAddNewSchedule(): void {
    setEditingSchedule(null);
    setScheduleDialogOpen(true);
  }

  /**
   * Deletes a training schedule after user confirmation
   * Reloads the current page after successful deletion
   */
  async function handleDeleteSchedule(id: number): Promise<void> {
    if (!isValidPositiveInteger(id)) {
      console.error("Invalid schedule ID:", id);
      return;
    }
    
    const confirmed = window.confirm(
      "Tem certeza que deseja deletar esta agenda?"
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      await apiDelete(`/api/training-sheets/${id}`);
      
      await loadSchedules(currentPage);
      
      toast({
        title: "Agenda excluída",
        description: "A agenda de treino foi removida com sucesso.",
      });
    } catch (err) {
      console.error("Error deleting training schedule:", err);
      
      const message = getErrorMessage(err);
      
      toast({ 
        variant: "destructive",
        title: "Erro ao deletar", 
        description: message || "Não foi possível deletar a agenda."
      });
    }
  }

  /**
   * Callback after successful schedule creation/edit
   * Reloads the current page and shows success message
   */
  function handleScheduleSuccess(): void {
    loadSchedules(currentPage);
    
    toast({
      title: "Agenda salva",
      description: "A agenda foi salva com sucesso.",
    });
  }

  /**
   * Opens the public view of a training schedule in a new tab
   * Validates that the schedule has a valid slug before opening
   */
  function handleViewSchedule(schedule: TrainingSheet): void {
    if (!schedule || !isValidString(schedule.slug)) {
      toast({
        title: "Erro",
        description: "Esta agenda não possui um identificador válido.",
        variant: "destructive",
      });
      return;
    }
    
    window.open(`/training-schedule/${schedule.slug}`, "_blank");
  }

  /**
   * Navigates to the next page if available
   */
  function goToNextPage(): void {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }

  /**
   * Navigates to the previous page if available
   */
  function goToPreviousPage(): void {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }

  /**
   * Handles page selection from pagination UI
   */
  function handlePageSelect(page: number): void {
    if (isValidPositiveInteger(page)) {
      setCurrentPage(page);
    }
  }

  /**
   * Handles search input changes
   */
  function handleSearchChange(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    setSearchTerm(event.target.value);
  }
  
  // Derived state for rendering
  const filteredSchedules = filterSchedulesBySearch(schedules, searchTerm);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasSchedules = filteredSchedules.length > 0;
  const showEmptyState = !loading && !hasSchedules;
  const showPagination = !loading && hasSchedules;
  
  return (
    <Layout>
      <motion.div 
        className="w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div 
          className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8"
          variants={fadeUpIn}
          initial="hidden"
          animate="visible"
        >
          <div>
            <motion.h1 
              className="text-3xl font-bold tracking-tight"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Agendas de Treinos
            </motion.h1>
            <motion.p 
              className="text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Gerencie as agendas de treinos para seus alunos. ({totalCount} total)
            </motion.p>
          </div>
          
          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={{ hover: hoverScale, tap: tapScale }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button 
              className="gap-2 bg-primary hover:bg-primary/90"
              onClick={handleAddNewSchedule}
            >
              <Plus className="h-4 w-4" />
              Nova Agenda
            </Button>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="flex flex-col md:flex-row gap-4 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por nome..."
              className="pl-9 transition-all duration-200 focus:ring-2"
              value={searchTerm}
              onChange={handleSearchChange}
              aria-label="Filtrar agendas por nome"
            />
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border border-border/40">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <CardTitle className="text-lg font-medium">Agendas de Treinos</CardTitle>
                </motion.div>
                <Badge variant="outline" aria-label={`${filteredSchedules.length} agendas encontradas`}>
                  {filteredSchedules.length} agendas
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                    aria-label="Carregando agendas"
                  >
                    {[...Array(SKELETON_COUNT)].map((_, i) => (
                      <motion.div
                        key={`skeleton-${i}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between py-3 px-4 border rounded"
                      >
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="table"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Nome Público</TableHead>
                            <TableHead className="text-right w-[180px]">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {hasSchedules ? (
                            <AnimatePresence mode="popLayout">
                              {filteredSchedules.map((schedule, idx) => {
                                const scheduleName = schedule.name;
                                const schedulePublicName = schedule.publicName || "-";
                                const scheduleId = schedule.id;
                                
                                return (
                                  <motion.tr
                                    key={`schedule-${scheduleId}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="border-b hover:bg-muted/50 transition-colors"
                                    whileHover={{ scale: 1.01 }}
                                  >
                                    <TableCell className="font-medium">{scheduleId}</TableCell>
                                    <TableCell>{scheduleName}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground line-clamp-1">
                                      {schedulePublicName}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <motion.div
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.95 }}
                                        >
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8"
                                            title="Visualizar agenda"
                                            onClick={() => handleViewSchedule(schedule)}
                                            aria-label={`Visualizar agenda ${scheduleName}`}
                                          >
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                        </motion.div>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <motion.div
                                              whileHover={{ scale: 1.1 }}
                                              whileTap={{ scale: 0.95 }}
                                            >
                                              <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8"
                                                aria-label={`Ações para ${scheduleName}`}
                                              >
                                                <MoreVertical className="h-4 w-4" />
                                              </Button>
                                            </motion.div>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem 
                                              className="gap-2"
                                              onClick={() => {
                                                try {
                                                  handleOpenEditDialog(schedule);
                                                } catch (err) {
                                                  console.error("Error opening edit dialog:", err);
                                                }
                                              }}
                                            >
                                              <Edit className="h-4 w-4" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem 
                                              className="text-destructive gap-2"
                                              onClick={() => {
                                                try {
                                                  handleDeleteSchedule(scheduleId);
                                                } catch (err) {
                                                  console.error("Error deleting schedule:", err);
                                                }
                                              }}
                                            >
                                              <Trash className="h-4 w-4" /> Excluir
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </TableCell>
                                  </motion.tr>
                                );
                              })}
                            </AnimatePresence>
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center">
                                <motion.div 
                                  className="flex flex-col items-center justify-center"
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  role="status"
                                  aria-label="Nenhuma agenda encontrada"
                                >
                                  <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                                  <p className="text-muted-foreground">Nenhuma agenda encontrada</p>
                                </motion.div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {showPagination && (
                <motion.div 
                  className="flex items-center justify-between py-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex-1 text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages} ({totalCount} total)
                  </div>
                  <PaginationUI
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPreviousPage={goToPreviousPage}
                    onNextPage={goToNextPage}
                    onPageSelect={handlePageSelect}
                  />
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <TrainingScheduleDialogWizard
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          editingData={editingSchedule}
          onSaved={handleScheduleSuccess}
        />
      </motion.div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = requireAuthGetServerSideProps;

export default TrainingSchedule;
