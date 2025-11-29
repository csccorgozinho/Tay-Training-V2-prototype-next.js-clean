"use strict";

/**
 * File: WorkoutSheetDialog.tsx
 * Description: Dialog component for creating and editing workout sheets (exercise groups).
 * Provides a comprehensive interface for managing exercise methods, configurations, and groupings.
 * Responsibilities:
 *   - Create/edit workout sheets with name, public name, and category
 *   - Manage exercise groups with multiple methods
 *   - Configure exercises with series, reps, methods, and rest times
 *   - Handle form validation and submission
 *   - Load categories, exercises, and methods from API
 *   - Track activity for analytics
 * Called by:
 *   - WorkoutSheets.tsx (main workout sheets page)
 *   - Any component needing workout sheet creation/editing
 * Notes:
 *   - Uses accordion UI for managing multiple exercise groups
 *   - Supports edit mode with initialData prop
 *   - Requires at least one exercise group with one method
 *   - Auto-resizing textarea for observations
 *   - Activity tracking on successful save
 */

import { useState, useEffect, useCallback } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { ActivityTracker } from "@/lib/activity-tracker";
import { apiGetMultiple, apiPost, apiPut } from "@/lib/api-client";
import { EXERCISE_DEFAULTS, ANIMATION } from "@/config/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash,
  Loader2,
  X,
  Dumbbell,
  ClipboardList,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Category, Exercise, Method } from "@/types";
import { motion } from "framer-motion";
import { ExerciseAutocomplete } from "./ExerciseAutocomplete";
import { Textarea } from "@/components/ui/textarea";

/**
 * Props for WorkoutSheetDialog component.
 */
interface WorkoutSheetDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Whether dialog is in edit mode */
  isEditing?: boolean;
  /** Initial data for edit mode */
  initialData?: unknown;
  /** Callback when save is successful */
  onSuccess?: (data: unknown) => void;
}

/**
 * Represents a single exercise configuration.
 */
interface ExerciseItem {
  /** Unique identifier for this exercise item */
  id: string;
  /** Exercise ID from database */
  exerciseId: number;
  /** Exercise name for display */
  exerciseName: string;
  /** Method ID from database */
  methodId: number;
  /** Method name for display */
  methodName: string;
  /** Number of series (sets) */
  series: string;
  /** Number of repetitions */
  reps: string;
}

/**
 * Represents a method with multiple exercise configurations.
 */
interface ExerciseMethod {
  /** Unique identifier for this method */
  id: string;
  /** Rest time between sets */
  rest: string;
  /** Additional observations or notes */
  observations: string;
  /** List of exercises in this method */
  exercises: ExerciseItem[];
}

/**
 * Represents a group containing multiple exercise methods.
 */
interface ExerciseGroup {
  /** Unique identifier for this group */
  id: string;
  /** Group name */
  name: string;
  /** List of methods in this group */
  methods: ExerciseMethod[];
}

/**
 * Props for ExerciseCard component.
 */
interface ExerciseCardProps {
  /** Exercise configuration to display */
  exercise: ExerciseItem;
  /** Exercise index for display */
  exIdx: number;
  /** Available exercises from API */
  exercises: Exercise[];
  /** Available methods from API */
  methods: Method[];
  /** Whether the form is loading */
  loading: boolean;
  /** Whether this exercise can be removed */
  canRemove: boolean;
  /** Callback to remove this exercise */
  onRemove: () => void;
  /** Callback to update exercise field */
  onUpdate: (field: string, value: unknown) => void;
}

/**
 * Renders a single exercise configuration card with exercise selection,
 * method selection, series, and repetitions inputs.
 */
function ExerciseCard({
  exercise,
  exIdx,
  exercises,
  methods: availableMethods,
  loading,
  canRemove,
  onRemove,
  onUpdate,
}: ExerciseCardProps): JSX.Element {
  return (
    <Card className="p-4 space-y-4 bg-gradient-to-r from-blue-50/50 to-slate-50/50 dark:from-blue-950/20 dark:to-slate-900/20 border-blue-200/30 dark:border-blue-900/30">
      <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground">
        Exercício {exIdx + 1}
      </span>
    </div>

    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor={`exercise-${exercise.id}`} className="text-xs font-medium">
          Exercício
        </Label>
        <ExerciseAutocomplete
          value={
            exercise.exerciseId
              ? exercises.find((ex) => ex.id === exercise.exerciseId) || null
              : null
          }
          onChange={(selectedExercise) => {
            if (selectedExercise) {
              onUpdate("exerciseId", selectedExercise.id);
            }
          }}
          placeholder="Buscar..."
          exercises={exercises}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`method-${exercise.id}`} className="text-xs font-medium">
          Método
        </Label>
        <Select
          value={exercise.methodId?.toString() || ""}
          onValueChange={(value) => {
            const methodId = parseInt(value, 10);
            if (!isNaN(methodId)) {
              onUpdate("methodId", methodId);
            }
          }}
        >
          <SelectTrigger
            id={`method-${exercise.id}`}
            className="h-9"
            aria-label="Selecionar método de exercício"
          >
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {availableMethods.map((m) => (
              <SelectItem key={m.id} value={m.id.toString()}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`series-${exercise.id}`} className="text-xs font-medium">
            Séries
          </Label>
          <Input
            id={`series-${exercise.id}`}
            value={exercise.series}
            onChange={(e) => onUpdate("series", e.target.value)}
            className="h-9 text-sm"
            placeholder="3"
            aria-label="Número de séries"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`reps-${exercise.id}`} className="text-xs font-medium">
            Reps
          </Label>
          <div className="flex gap-2">
            <Input
              id={`reps-${exercise.id}`}
              value={exercise.reps}
              onChange={(e) => onUpdate("reps", e.target.value)}
              className="h-9 text-sm flex-1"
              placeholder="10"
              aria-label="Número de repetições"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={onRemove}
              className="h-9 w-9 p-0 flex-shrink-0"
              disabled={loading || !canRemove}
              aria-label={`Remover exercício ${exIdx + 1}`}
            >
              <X className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Card>
  );
}

/**
 * Main dialog component for creating/editing workout sheets.
 */
function WorkoutSheetDialog({
  open,
  onOpenChange,
  isEditing = false,
  initialData,
  onSuccess,
}: WorkoutSheetDialogProps): JSX.Element {
  // Form state
  const [name, setName] = useState("");
  const [publicName, setPublicName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);

  // Group state
  const [groups, setGroups] = useState<ExerciseGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  /**
   * Loads initial data from API (categories, exercises, methods).
   * In edit mode, populates form with existing workout sheet data.
   */
  async function loadInitialData(): Promise<void> {
    try {
      setLoadingData(true);
      const [categoriesData, exercisesData, methodsData] = await apiGetMultiple<unknown>([
        "/api/categories",
        "/api/db/exercises",
        "/api/db/methods",
      ]);

      setCategories(Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.data || []);
      setExercises(Array.isArray(exercisesData) ? exercisesData : (exercisesData as any)?.data || []);
      setMethods(Array.isArray(methodsData) ? methodsData : (methodsData as any)?.data || []);

      if (isEditing && initialData) {
        const data = initialData as Record<string, unknown>;
        setName((data.name as string) || "");
        setCategoryId((data.categoryId as number)?.toString() || "");

        if (data.exerciseMethods && Array.isArray(data.exerciseMethods)) {
          const groupData: ExerciseGroup = {
            id: "group-1",
            name: "Grupo 1",
            methods: (data.exerciseMethods as Array<Record<string, unknown>>).map((method) => ({
              id: `method-${(method.id as number)}`,
              rest: (method.rest as string) || EXERCISE_DEFAULTS.REST_TIME,
              observations: (method.observations as string) || "",
              exercises: Array.isArray(method.exerciseConfigurations)
                ? (method.exerciseConfigurations as Array<Record<string, unknown>>).map((config) => ({
                    id: `exercise-${(config.id as number)}`,
                    exerciseId: (config.exerciseId as number) || 0,
                    exerciseName: ((config.exercise as Record<string, unknown>)?.name as string) || "",
                    methodId: (config.methodId as number) || 0,
                    methodName: ((config.method as Record<string, unknown>)?.name as string) || "",
                    series: (config.series as string) || EXERCISE_DEFAULTS.DEFAULT_SERIES,
                    reps: (config.reps as string) || EXERCISE_DEFAULTS.DEFAULT_REPS,
                  }))
                : [],
            })),
          };
          setGroups([groupData]);
          setActiveGroupId("group-1");
        }
      } else {
        const initialGroup: ExerciseGroup = {
          id: "group-1",
          name: "Grupo 1",
          methods: [
            {
              id: `method-${Date.now()}`,
              rest: EXERCISE_DEFAULTS.REST_TIME,
              observations: "",
              exercises: [
                {
                  id: `exercise-${Date.now()}`,
                  exerciseId: 0,
                  exerciseName: "",
                  methodId: 0,
                  methodName: "",
                  series: EXERCISE_DEFAULTS.DEFAULT_SERIES,
                  reps: EXERCISE_DEFAULTS.DEFAULT_REPS,
                },
              ],
            },
          ],
        };
        setGroups([initialGroup]);
        setActiveGroupId("group-1");
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
      
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Erro",
        description: "Falha ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  }

  /**
   * Removes a group from the workout sheet.
   * Prevents removal if only one group exists.
   * @param groupId - ID of the group to remove
   */
  function removeGroup(groupId: string): void {
    if (groups.length > 1) {
      const filtered = groups.filter((g) => g.id !== groupId);
      setGroups(filtered);
      if (groupId === activeGroupId) {
        setActiveGroupId(filtered[0].id);
      }
    }
  }

  /**
   * Adds a new method (exercise group) to the specified group.
   * @param groupId - ID of the group to add the method to
   */
  function addMethodToGroup(groupId: string): void {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              methods: [
                ...group.methods,
                {
                  id: `method-${Date.now()}`,
                  rest: EXERCISE_DEFAULTS.REST_TIME,
                  observations: "",
                  exercises: [
                    {
                      id: `exercise-${Date.now()}`,
                      exerciseId: 0,
                      exerciseName: "",
                      methodId: 0,
                      methodName: "",
                      series: EXERCISE_DEFAULTS.DEFAULT_SERIES,
                      reps: EXERCISE_DEFAULTS.DEFAULT_REPS,
                    },
                  ],
                },
              ],
            }
          : group
      )
    );
  }

  /**
   * Removes a method from the specified group.
   * @param groupId - ID of the group
   * @param methodId - ID of the method to remove
   */
  function removeMethodFromGroup(groupId: string, methodId: string): void {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              methods: group.methods.filter((m) => m.id !== methodId),
            }
          : group
      )
    );
  }

  /**
   * Updates a field in a method.
   * @param groupId - ID of the group
   * @param methodId - ID of the method
   * @param field - Field name to update
   * @param value - New value for the field
   */
  function updateMethod(
    groupId: string,
    methodId: string,
    field: string,
    value: string
  ): void {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              methods: group.methods.map((m) =>
                m.id === methodId ? { ...m, [field]: value } : m
              ),
            }
          : group
      )
    );
  }

  /**
   * Adds a new exercise to the specified method.
   * @param groupId - ID of the group
   * @param methodId - ID of the method
   */
  function addExerciseToMethod(
    groupId: string,
    methodId: string
  ): void {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              methods: group.methods.map((method) =>
                method.id === methodId
                  ? {
                      ...method,
                      exercises: [
                        ...method.exercises,
                        {
                          id: `exercise-${Date.now()}`,
                          exerciseId: 0,
                          exerciseName: "",
                          methodId: 0,
                          methodName: "",
                          series: EXERCISE_DEFAULTS.DEFAULT_SERIES,
                          reps: EXERCISE_DEFAULTS.DEFAULT_REPS,
                        },
                      ],
                    }
                  : method
              ),
            }
          : group
      )
    );
  }

  /**
   * Removes an exercise from the specified method.
   * @param groupId - ID of the group
   * @param methodId - ID of the method
   * @param exerciseId - ID of the exercise to remove
   */
  function removeExerciseFromMethod(
    groupId: string,
    methodId: string,
    exerciseId: string
  ): void {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              methods: group.methods.map((method) =>
                method.id === methodId
                  ? {
                      ...method,
                      exercises: method.exercises.filter(
                        (e) => e.id !== exerciseId
                      ),
                    }
                  : method
              ),
            }
          : group
      )
    );
  }

  /**
   * Updates a field in an exercise configuration.
   * @param groupId - ID of the group
   * @param methodId - ID of the method
   * @param exerciseId - ID of the exercise
   * @param field - Field name to update
   * @param value - New value for the field
   */
  function updateExercise(
    groupId: string,
    methodId: string,
    exerciseId: string,
    field: string,
    value: unknown
  ): void {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              methods: group.methods.map((method) =>
                method.id === methodId
                  ? {
                      ...method,
                      exercises: method.exercises.map((e) =>
                        e.id === exerciseId ? { ...e, [field]: value } : e
                      ),
                    }
                  : method
              ),
            }
          : group
      )
    );
  }

  /**
   * Validates if a string is non-empty after trimming.
   * @param value - String to validate
   * @returns True if string is non-empty
   */
  function isValidName(value: string): boolean {
    return value.trim().length > 0;
  }

  /**
   * Auto-resizes textarea based on content height.
   * @param textarea - Textarea element to resize
   * @param minHeight - Minimum height in pixels (default 88)
   */
  function autoResizeTextarea(
    textarea: HTMLTextAreaElement,
    minHeight: number = 88
  ): void {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
  }

  /**
   * Validates if category ID is selected.
   * @param id - Category ID to validate
   * @returns True if ID is valid
   */
  function isValidCategoryId(id: string): boolean {
    return id.trim().length > 0;
  }

  /**
   * Handles form submission for creating or updating workout sheet.
   * Validates all required fields and sends data to API.
   */
  async function handleSubmit(): Promise<void> {
    try {
      // Validate name
      if (!isValidName(name)) {
        toast({
          title: "Erro",
          description: "Nome da ficha de treino é obrigatório",
          variant: "destructive",
        });
        return;
      }

      // Validate category
      if (!isValidCategoryId(categoryId)) {
        toast({
          title: "Erro",
          description: "Categoria é obrigatória",
          variant: "destructive",
        });
        return;
      }

      // Validate groups exist
      if (groups.length === 0 || groups.every((g) => g.methods.length === 0)) {
        toast({
          title: "Erro",
          description: "Adicione pelo menos um grupo de exercícios",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

      // Validate active group exists
      if (!activeGroup) {
        toast({
          title: "Erro",
          description: "Nenhum grupo selecionado",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        name,
        publicName: publicName || name,
        categoryId: parseInt(categoryId, 10),
        exerciseMethods: activeGroup.methods.map((method) => ({
          rest: method.rest,
          observations: method.observations,
          exerciseConfigurations: method.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            methodId: ex.methodId,
            series: ex.series,
            reps: ex.reps,
          })),
        })),
      };

      const url = isEditing && initialData
        ? `/api/exercise-groups/${(initialData as Record<string, unknown>).id}`
        : "/api/exercise-groups";

      const result = isEditing && initialData
        ? await apiPut(url, payload)
        : await apiPost(url, payload);

      toast({
        title: "Sucesso",
        description: isEditing
          ? "Ficha de treino atualizada"
          : "Ficha de treino criada",
      });

      // Track activity
      ActivityTracker.addActivity(name || "Nova Ficha", "Ficha de Treino");

      onOpenChange(false);
      onSuccess?.(result);

      // Reset form state
      setName("");
      setPublicName("");
      setCategoryId("");
      setGroups([]);
      setActiveGroupId("");
    } catch (err) {
      console.error("Error submitting workout sheet:", err);
      
      const message = err instanceof Error ? err.message : "Erro desconhecido ao salvar";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle>
            {isEditing ? "Editar Ficha de Treino" : "Nova Ficha de Treino"}
          </DialogTitle>
          <DialogDescription>
            Crie uma ficha de treino com métodos e configurações
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center flex-1 py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Informações da Ficha */}
            <section className="bg-gradient-to-br from-blue-50/50 to-blue-50/30 dark:from-blue-950/20 dark:to-blue-950/10 p-5 rounded-lg border border-blue-200/50 dark:border-blue-800/30 space-y-4">
              <header className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ClipboardList className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide">
                  Informações da Ficha
                </h3>
              </header>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Nome *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  placeholder="Ex: Peito e Tríceps"
                  className="h-9"
                  aria-label="Nome da ficha de treino"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicName" className="text-sm font-medium">Nome Público</Label>
                <Input
                  id="publicName"
                  value={publicName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPublicName(e.target.value)}
                  placeholder="Ex: Treino A"
                  className="h-9"
                  aria-label="Nome público da ficha"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Categoria *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category" className="h-9" aria-label="Selecionar categoria">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            {/* Grupos de Exercício */}
            {activeGroup && (
              <motion.section
                key={activeGroup.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: ANIMATION.TRANSITION_DURATION }}
                className="space-y-4"
              >
                <header className="flex items-center justify-between pb-3 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <Dumbbell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-base font-semibold">Grupos de Exercício</h3>
                  </div>
                </header>

                <Button
                  size="sm"
                  onClick={() => addMethodToGroup(activeGroup.id)}
                  className="gap-2 w-full h-9"
                  disabled={loading}
                  aria-label="Adicionar novo grupo de exercício"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Grupo
                </Button>

                {activeGroup.methods.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Nenhum grupo adicionado. Clique em "Adicionar Grupo" para começar.
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="space-y-2">
                    {activeGroup.methods.map((method, methodIdx) => (
                      <AccordionItem
                        key={method.id}
                        value={method.id}
                        className="border rounded-lg overflow-hidden"
                      >
                        <AccordionTrigger className="hover:no-underline px-4 py-3 bg-muted/30 border-b hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                              {methodIdx + 1}
                            </span>
                            <span className="text-sm font-medium">Grupo {methodIdx + 1}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e: MouseEvent<HTMLButtonElement>) => {
                              e.stopPropagation();
                              removeMethodFromGroup(activeGroup.id, method.id);
                            }}
                            className="ml-auto"
                            disabled={activeGroup.methods.length === 1 || loading}
                            aria-label={`Remover grupo ${methodIdx + 1}`}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </AccordionTrigger>
                        <AccordionContent className="p-0">
                          <div className="p-5 space-y-5 bg-slate-50/50 dark:bg-slate-900/20">
                            {/* Propriedades do Método */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label
                                  htmlFor={`rest-${method.id}`}
                                  className="text-xs font-medium"
                                >
                                  Descanso
                                </Label>
                                <Input
                                  id={`rest-${method.id}`}
                                  value={method.rest}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    updateMethod(
                                      activeGroup.id,
                                      method.id,
                                      "rest",
                                      e.target.value
                                    )
                                  }
                                  placeholder="60s"
                                  className="h-8 text-sm"
                                  aria-label="Tempo de descanso"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor={`obs-${method.id}`}
                                  className="text-xs font-medium"
                                >
                                  Observações
                                </Label>
                                <Textarea
                                  id={`obs-${method.id}`}
                                  value={method.observations}
                                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                                    updateMethod(
                                      activeGroup.id,
                                      method.id,
                                      "observations",
                                      e.target.value
                                    );
                                    autoResizeTextarea(e.currentTarget, 88);
                                  }}
                                  placeholder="Notas adicionais"
                                  className="text-sm resize-none"
                                  style={{ minHeight: "88px" }}
                                  aria-label="Observações do grupo"
                                />
                              </div>
                            </div>

                            {/* Exercícios */}
                            <div className="border-t pt-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                  Exercícios ({method.exercises.length})
                                </h4>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    addExerciseToMethod(activeGroup.id, method.id)
                                  }
                                  disabled={loading}
                                  className="h-8 text-xs gap-1"
                                  aria-label="Adicionar exercício"
                                >
                                  <Plus className="h-3 w-3" />
                                  Exercício
                                </Button>
                              </div>

                              <div className="space-y-3">
                                {method.exercises.map((exercise, exIdx) => (
                                  <ExerciseCard
                                    key={exercise.id}
                                    exercise={exercise}
                                    exIdx={exIdx}
                                    exercises={exercises}
                                    methods={methods}
                                    loading={loading}
                                    canRemove={method.exercises.length > 1}
                                    onRemove={() =>
                                      removeExerciseFromMethod(
                                        activeGroup.id,
                                        method.id,
                                        exercise.id
                                      )
                                    }
                                    onUpdate={(field, value) =>
                                      updateExercise(
                                        activeGroup.id,
                                        method.id,
                                        exercise.id,
                                        field,
                                        value
                                      )
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </motion.section>
            )}
          </div>
        )}

        <DialogFooter className="border-t border-border/50 px-0 py-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-9"
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="h-9 gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"} Ficha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutSheetDialog;
