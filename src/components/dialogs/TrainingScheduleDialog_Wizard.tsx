"use strict";

/**
 * File: TrainingScheduleDialog_Wizard.tsx
 * Description: Multi-step wizard dialog for creating and editing 4-week training schedules with workout assignments, PDF uploads, and custom naming.
 * Responsibilities:
 *   - Display 4-step wizard for training schedule creation/editing
 *   - Step 1: Collect schedule name, public name, and PDF file upload
 *   - Step 2: Configure weekly workouts (4 weeks × 7 days = 28 days)
 *   - Step 3: Customize short names for workouts used in schedule
 *   - Step 4: Review and submit (handled by final next button)
 *   - Load exercise groups from API for workout selection
 *   - Convert week/day selection to absolute day numbers (1-28)
 *   - Build training days payload with full exercise group data
 *   - Handle PDF file uploads via FormData
 *   - Track schedule creation/update activity
 *   - Prevent double submission with guard flag
 *   - Support edit mode with pre-populated data from existing schedules
 * Called by:
 *   - src/pages/TrainingSchedule.tsx (main training schedule management page)
 *   - Other components that need training schedule CRUD operations
 * Notes:
 *   - "use client" directive required for Next.js client-side rendering
 *   - 4-week schedule with 7 days per week = 28 total days
 *   - Day calculation: absoluteDay = (week - 1) × 7 + dayOfWeek
 *   - Reverse calculation: week = floor((day - 1) / 7) + 1, dayOfWeek = day - (week - 1) × 7
 *   - Each workout can have custom short name for display
 *   - Fetches full exercise group data including methods and configurations
 *   - Uses FormData for multipart/form-data file uploads
 *   - Activity tracking uses schedule name or "Novo Treino" fallback
 *   - Double submission prevented with isSubmitting and hasSubmitted flags
 *   - Edit mode loads existing PDF filename and allows viewing/replacing
 */

"use client";

import React, { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  FileUp,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Calendar,
  Pencil,
  ClipboardCheck,
  Loader2,
  Dumbbell,
} from "lucide-react";
import { ActivityTracker } from "@/lib/activity-tracker";
import { useToast } from "@/hooks/use-toast";
import { WorkoutSheetAutocomplete } from "./WorkoutSheetAutocomplete";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Represents a workout sheet/exercise group.
 */
interface WorkoutSheet {
  id: number;
  name: string;
  publicName?: string;
}

/**
 * Props for TrainingScheduleDialog component.
 */
interface TrainingScheduleDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when schedule is successfully saved */
  onSaved?: () => void;
  /** Existing schedule data for edit mode */
  editingData?: any;
}

/**
 * Represents an exercise group with methods and configurations.
 */
interface ExerciseGroup {
  id: number;
  name: string;
  publicName?: string;
  categoryId?: number;
  exerciseMethods?: Record<string, unknown>[];
}

/**
 * Represents a single day's workout assignment.
 */
interface DayPlan {
  [day: string]: {
    groupId: number | null;
  };
}

/**
 * Represents all 4 weeks of workout assignments.
 */
interface WeekPlans {
  [week: string]: DayPlan;
}

/** Days of the week in Portuguese */
const DAYS_OF_WEEK = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

/** Total number of wizard steps (excluding final submission step) */
const TOTAL_WIZARD_STEPS = 4;

/** Number of weeks in schedule */
const WEEKS_COUNT = 4;

/** Number of days per week */
const DAYS_PER_WEEK = 7;

/** Total days in schedule */
const TOTAL_DAYS = WEEKS_COUNT * DAYS_PER_WEEK; // 28 days

/**
 * Creates default empty week plans for 4 weeks.
 *
 * @returns Empty week plans object
 */
function createDefaultWeekPlans(): WeekPlans {
  const plans: WeekPlans = {};

  for (let week = 1; week <= WEEKS_COUNT; week++) {
    plans[week.toString()] = {};

    for (let day = 1; day <= DAYS_PER_WEEK; day++) {
      plans[week.toString()][day.toString()] = { groupId: null };
    }
  }

  return plans;
}

/**
 * Calculates absolute day number (1-28) from week and day of week.
 *
 * @param week - Week number (1-4)
 * @param dayOfWeek - Day of week (1-7)
 * @returns Absolute day number (1-28)
 */
function calculateAbsoluteDay(week: number, dayOfWeek: number): number {
  return (week - 1) * DAYS_PER_WEEK + dayOfWeek;
}

/**
 * Calculates week and day of week from absolute day number.
 *
 * @param absoluteDay - Absolute day number (1-28)
 * @returns Object with week (1-4) and dayOfWeek (1-7)
 */
function calculateWeekAndDay(absoluteDay: number): {
  week: number;
  dayOfWeek: number;
} {
  const week = Math.floor((absoluteDay - 1) / DAYS_PER_WEEK) + 1;
  const dayOfWeek = absoluteDay - (week - 1) * DAYS_PER_WEEK;
  return { week, dayOfWeek };
}

/**
 * Validates if a day number is within valid range (1-28).
 *
 * @param day - Day number to validate
 * @returns True if day is valid, false otherwise
 */
function isValidDay(day: number): boolean {
  return day >= 1 && day <= TOTAL_DAYS;
}

/**
 * Extracts exercise groups array from various API response formats.
 *
 * @param data - API response data
 * @returns Array of exercise groups
 */
function extractGroupsFromResponse(data: any): ExerciseGroup[] {
  if (Array.isArray(data)) {
    return data;
  }
  
  if (data?.data && Array.isArray(data.data)) {
    return data.data;
  }
  
  if (data?.groups && Array.isArray(data.groups)) {
    return data.groups;
  }
  
  return [];
}

/**
 * Validates if schedule name is not empty.
 *
 * @param name - Schedule name to validate
 * @returns True if name is valid (not empty), false otherwise
 */
function isValidScheduleName(name: string): boolean {
  return name.trim().length > 0;
}

function TrainingScheduleDialogWizard({
  open,
  onOpenChange,
  onSaved,
  editingData,
}: TrainingScheduleDialogProps): JSX.Element {
  const { toast } = useToast();

  // Wizard step state
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form data
  const [name, setName] = useState<string>("");
  const [publicName, setPublicName] = useState<string>("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>("");

  // Week configuration
  const [selectedWeek, setSelectedWeek] = useState<string>("1");

  // Exercise groups from API
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState<boolean>(false);

  // Workout configurations
  const [workoutShortNames, setWorkoutShortNames] = useState<Map<number, string>>(
    new Map()
  );
  const [isEditingShortName, setIsEditingShortName] = useState<number | null>(
    null
  );
  const [shortNameInput, setShortNameInput] = useState<string>("");

  // Week plans
  const [weekPlans, setWeekPlans] = useState<WeekPlans>(
    createDefaultWeekPlans()
  );

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingSheetId, setEditingSheetId] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  /**
   * Load exercise groups from API when dialog opens.
   * Uses extractGroupsFromResponse helper for parsing.
   */
  useEffect(
    function loadExerciseGroups(): void {
      if (!open) return;

      const loadGroups = async (): Promise<void> => {
        try {
          setIsLoadingGroups(true);
          const response = await fetch("/api/exercise-groups");
          
          if (!response.ok) {
            throw new Error("Failed to load groups");
          }

          const data = await response.json();
          const groups = extractGroupsFromResponse(data);
          setExerciseGroups(groups);
        } catch (err) {
          console.error("Error loading groups:", err);
          toast({
            title: "Erro",
            description: "Falha ao carregar grupos de exercício",
            variant: "destructive",
          });
        } finally {
          setIsLoadingGroups(false);
        }
      };

      loadGroups();
    },
    [open, toast]
  );

  /**
   * Reset state when dialog opens/closes.
   * Loads editing data if present, otherwise resets to defaults.
   */
  useEffect(
    function resetDialogState(): void {
    if (open) {
      setHasSubmitted(false);
      if (editingData?.id) {
        setEditingSheetId(editingData.id);
        setName(editingData.name || "");
        setPublicName(editingData.publicName || "");
        setCurrentStep(1);

        // Load existing PDF info
        const existingPdfPath = (editingData as any)?.pdfPath;
        if (existingPdfPath) {
          const fileName = existingPdfPath.split('/').pop() || 'Arquivo existente';
          setPdfFileName(fileName);
        } else {
          setPdfFileName("");
        }

        const newWeekPlans = createDefaultWeekPlans();
        const savedShortNamesMap = new Map<number, string>();
        
        if (editingData.trainingDays && Array.isArray(editingData.trainingDays)) {
          (editingData?.trainingDays as any[] || []).forEach((trainingDay: Record<string, unknown>) => {
            const day = typeof trainingDay.day === 'number' ? trainingDay.day : 0;
            
            // Validate day is in range 1-28
            if (day < 1 || day > 28) {
              console.warn(`Invalid training day: ${day}, skipping`);
              return;
            }
            
            // Correct reverse calculation: day (1-28) → week (1-4) and dayOfWeek (1-7)
            const weekNumber = Math.floor((day - 1) / 7) + 1;
            const dayOfWeek = day - (weekNumber - 1) * 7;

            const groupId = (typeof trainingDay.exerciseGroupId === 'number' ? trainingDay.exerciseGroupId : null) || null;
            
            newWeekPlans[weekNumber.toString()][dayOfWeek.toString()] = {
              groupId: groupId,
            };
            
            // Save the shortName from backend (like Angular v1 savedShortNames)
            if (groupId && trainingDay.shortName && typeof trainingDay.shortName === 'string') {
              savedShortNamesMap.set(groupId, trainingDay.shortName);
            }
          });
        }
        
        setWeekPlans(newWeekPlans);
        setWorkoutShortNames(savedShortNamesMap);
      } else {
        setEditingSheetId(null);
        setCurrentStep(1);
        setName("");
        setPublicName("");
        setPdfFile(null);
        setPdfFileName("");
        setSelectedWeek("1");
        setWeekPlans(createDefaultWeekPlans());
        setWorkoutShortNames(new Map());
        setIsEditingShortName(null);
        setShortNameInput("");
      }
    }
  },
    [open, editingData]
  );

  /**
   * Auto-generate short names for newly added workout groups.
   * Maintains short names for groups already configured.
   */
  useEffect(
    function syncWorkoutShortNames(): void {
    const usedGroupIds = new Set<number>();
    Object.values(weekPlans).forEach((week) => {
      Object.values(week).forEach((day) => {
        if (day.groupId) usedGroupIds.add(day.groupId);
      });
    });

    // Only update if there are changes (avoid infinite loop)
    const currentGroupIds = new Set(workoutShortNames.keys());
    const hasChanges = 
      usedGroupIds.size !== currentGroupIds.size ||
      Array.from(usedGroupIds).some(id => !currentGroupIds.has(id)) ||
      Array.from(currentGroupIds).some(id => !usedGroupIds.has(id));
    
    if (!hasChanges) return;

    const newShortNames = new Map(workoutShortNames);
    
    // Convert to array to maintain order (like Angular v1 logic)
    const sortedGroupIds = Array.from(usedGroupIds).sort((a, b) => a - b);
    
    sortedGroupIds.forEach((groupId, index) => {
      if (!newShortNames.has(groupId)) {
        // Use same logic as Angular v1: check saved names first, then fallback to "Treino N"
        // This is needed because backend won't be updated
        newShortNames.set(groupId, `Treino ${index + 1}`);
      }
    });

    // Remove groups that are no longer used
    newShortNames.forEach((_, groupId) => {
      if (!usedGroupIds.has(groupId)) {
        newShortNames.delete(groupId);
      }
    });

    setWorkoutShortNames(newShortNames);
  },
    [weekPlans, workoutShortNames]
  );

  /**
   * Handles workout selection for a specific day in a week.
   * @param weekId - Week identifier ("1" to "4")
   * @param dayId - Day identifier ("1" to "7")
   * @param sheet - Selected workout sheet or null for no workout
   */
  function handleWorkoutChange(
    weekId: string,
    dayId: string,
    sheet: WorkoutSheet | null
  ): void {
    const groupId = sheet?.id || null;
    setWeekPlans((prev) => ({
      ...prev,
      [weekId]: {
        ...prev[weekId],
        [dayId]: {
          groupId: groupId as number | null,
        },
      },
    }));
  }

  /**
   * Handles PDF file selection.
   * @param e - File input change event
   */
  function handleFileChange(e: ChangeEvent<HTMLInputElement>): void {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
      setPdfFileName(e.target.files[0].name);
    }
  }

  /**
   * Initiates editing mode for a workout's short name.
   * @param groupId - Exercise group ID to edit
   */
  function handleEditShortName(groupId: number): void {
    const currentName = workoutShortNames.get(groupId) || "";
    setShortNameInput(currentName);
    setIsEditingShortName(groupId);
  }

  /**
   * Saves the edited short name for the current workout.
   */
  function handleSaveShortName(): void {
    if (isEditingShortName === null) return;

    const newShortNames = new Map(workoutShortNames);
    newShortNames.set(isEditingShortName, shortNameInput);
    setWorkoutShortNames(newShortNames);
    setIsEditingShortName(null);
  }

  /**
   * Cancels short name editing without saving.
   */
  function handleCancelShortName(): void {
    setIsEditingShortName(null);
  }

  /**
   * Gets the display name for an exercise group.
   * @param groupId - Exercise group ID or null
   * @returns Group name or fallback message
   */
  function getGroupName(groupId: number | null): string {
    if (!groupId) return "Nenhum treino";
    const group = exerciseGroups.find((g) => g.id === groupId);
    return group ? group.name : "Treino não encontrado";
  }

  /**
   * Gets the short name for a workout, falling back to full group name.
   * @param groupId - Exercise group ID
   * @returns Custom short name or full group name
   */
  function getShortName(groupId: number): string {
    return workoutShortNames.get(groupId) || getGroupName(groupId);
  }

  /**
   * Gets unique exercise group IDs used across all weeks.
   * @returns Array of unique group IDs
   */
  function getUniqueGroupsUsed(): number[] {
    const groupIds = new Set<number>();

    Object.values(weekPlans).forEach((week) => {
      Object.values(week).forEach((day) => {
        if (day.groupId) {
          groupIds.add(day.groupId);
        }
      });
    });

    return Array.from(groupIds);
  }

  /**
   * Handles form submission for creating or updating training schedule.
   * Validates inputs, fetches group data, builds training days payload,
   * and submits with PDF file if present.
   * @param e - Form submit event
   */
  async function handleSubmit(e: FormEvent): Promise<void> {
    if (e) {
      e.preventDefault();
    }

    // Prevent double submission
    if (isSubmitting || hasSubmitted) {
      return;
    }

    // Validate schedule name
    if (!isValidScheduleName(name)) {
      toast({
        title: "Erro",
        description: "Nome da agenda é obrigatório",
        variant: "destructive",
      });
      return;
    }

    // Validate at least one workout is assigned
    if (getUniqueGroupsUsed().length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um grupo de exercício",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Fetch all group data we need
      const groupDataMap = new Map();
      for (const groupId of getUniqueGroupsUsed()) {
        const groupRes = await fetch(`/api/exercise-groups/${groupId}`);
        if (!groupRes.ok) throw new Error(`Failed to fetch group ${groupId}`);

        const groupData = await groupRes.json();
        groupDataMap.set(groupId, groupData.data || groupData);
      }

      // Build training days from week plans
      const trainingDaysData = [];
      let dayCounter = 1;
      for (let week = 1; week <= 4; week++) {
        for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
          const groupId = weekPlans[week.toString()][dayOfWeek.toString()]?.groupId;

          if (groupId) {
            const fullGroup = groupDataMap.get(groupId);
            if (!fullGroup) {
              console.warn(`[Dialog] Group ${groupId} not found in groupDataMap, skipping day ${dayCounter}`);
              dayCounter++;
              continue;
            }

            // Validate day calculation
            const absoluteDay = (week - 1) * 7 + dayOfWeek;
            if (absoluteDay < 1 || absoluteDay > 28) {
              console.error(`[Dialog] Invalid day calculation: week=${week}, dayOfWeek=${dayOfWeek}, absoluteDay=${absoluteDay}`);
              dayCounter++;
              continue;
            }

            const methods = Array.isArray(fullGroup.exerciseMethods) ? fullGroup.exerciseMethods : [];

            if (methods.length === 0) {
              throw new Error(`Group "${fullGroup.name}" has no methods`);
            }

            const customTitle = getShortName(groupId);
            
            console.debug(`[Dialog] Day ${dayCounter}: Adding ${fullGroup.name} (groupId=${groupId}, customTitle=${customTitle}, methodCount=${methods.length})`);

            trainingDaysData.push({
              day: dayCounter,
              shortName: customTitle,
              exerciseGroup: {
                name: fullGroup.name,
                categoryId: fullGroup.categoryId || 1,
                exerciseMethods: methods.map((method: Record<string, unknown>) => {
                  const configs = Array.isArray(method.exerciseConfigurations) ? method.exerciseConfigurations : [];

                  const exerciseConfigs =
                    configs.length > 0
                      ? configs.map((config: Record<string, unknown>) => ({
                          series: config.series || "3",
                          reps: config.reps || "10",
                          exerciseId: config.exerciseId || 1,
                          methodId: config.methodId || undefined,
                        }))
                      : [
                          {
                            series: "3",
                            reps: "10",
                            exerciseId: 1,
                            methodId: undefined,
                          },
                        ];

                  return {
                    rest: method.rest || "60s",
                    observations: method.observations || "",
                    order: method.order || 0,
                    exerciseConfigurations: exerciseConfigs,
                  };
                }),
              },
            });

            dayCounter++;
          } else {
            dayCounter++;
          }
        }
      }

      const payload = {
        name,
        publicName: publicName || name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        trainingDays: trainingDaysData,
      };
      
      const method = editingSheetId ? "PUT" : "POST";
      const url = editingSheetId ? `/api/training-sheets/${editingSheetId}` : "/api/training-sheets";

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("name", name);
      formData.append("publicName", publicName || name);
      formData.append("slug", name.toLowerCase().replace(/\s+/g, "-"));
      formData.append("trainingDays", JSON.stringify(trainingDaysData));

      // Append PDF file if selected
      if (pdfFile) {
        formData.append("file", pdfFile);
      }

      const response = await fetch(url, {
        method,
        body: formData, // Send FormData instead of JSON
        // Note: Don't set Content-Type header, browser will set it automatically with boundary
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }

      setHasSubmitted(true);
      toast({
        title: "Sucesso",
        description: editingSheetId ? "Agenda atualizada" : "Agenda criada",
      });

      // Track activity
      ActivityTracker.addActivity(name || 'Novo Treino', 'Treino');

      onOpenChange(false);
      // Delay onSaved callback to ensure state updates propagate
      setTimeout(() => {
        onSaved?.();
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error saving schedule";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Advances to the next wizard step or submits on final step.
   */
  function goToNextStep(): void {
    if (currentStep < TOTAL_WIZARD_STEPS) {
      if (currentStep === TOTAL_WIZARD_STEPS - 1) {
        handleSubmit(new Event("submit") as unknown as FormEvent);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  }

  /**
   * Goes back to the previous wizard step.
   */
  function goToPreviousStep(): void {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  /**
   * Renders the step indicator/progress bar for the wizard.
   * @returns JSX element showing step progress
   */
  function renderStepIndicator(): JSX.Element {
    return (
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1">
          {Array.from({ length: TOTAL_WIZARD_STEPS - 1 }).map((_, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
              <React.Fragment key={stepNumber}>
                <Button
                  variant="outline"
                  className="relative z-10 text-xs w-7 h-7 rounded-full p-0 font-semibold"
                  data-active={isActive}
                  data-completed={isCompleted}
                  onClick={() => setCurrentStep(stepNumber)}
                  type="button"
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : stepNumber}
                </Button>

                {stepNumber < TOTAL_WIZARD_STEPS - 1 && (
                  <div className={`h-0.5 w-12 ${stepNumber < currentStep ? "bg-primary" : "bg-muted"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  /**
   * Gets the title for the current wizard step.
   * @returns Step title string
   */
  function getStepTitle(): string {
    switch (currentStep) {
      case 1:
        return "Informações da Agenda";
      case 2:
        return "Configuração da Agenda";
      case 3:
        return "Treinos Utilizados";
      case 4:
        return "Revisão";
      default:
        return "";
    }
  }

  /**
   * Renders the content for the current wizard step.
   * @returns JSX element with step-specific form content
   */
  function renderStepContent(): JSX.Element {
    const weeks = [
      { value: "1", label: "Semana 1" },
      { value: "2", label: "Semana 2" },
      { value: "3", label: "Semana 3" },
      { value: "4", label: "Semana 4" },
    ];

    const weekDays = DAYS_OF_WEEK.map((label, index) => ({
      value: (index + 1).toString(),
      label,
    }));

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nome da Agenda *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Mês 01 - 1° ano - 5x"
                required
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publicName" className="text-sm font-medium">Nome Público (Exibido aos alunos)</Label>
              <Input
                id="publicName"
                value={publicName}
                onChange={(e) => setPublicName(e.target.value)}
                placeholder="Ex: Mês 01 - Treino A"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdfFile" className="text-sm font-medium">Treino Offline (PDF)</Label>
              <div className="flex items-center gap-2">
                <Input id="pdfFile" type="file" accept=".pdf" onChange={handleFileChange} className="flex-1 h-9" />
                <Button type="button" variant="outline" size="icon" className="h-9 w-9">
                  <FileUp className="h-4 w-4" />
                </Button>
              </div>
              {pdfFileName && (
                <div className="text-xs text-muted-foreground mt-1">
                  <p>Arquivo: {pdfFileName}</p>
                  {editingSheetId && (editingData as any)?.pdfPath && !pdfFile && (
                    <a 
                      href={(editingData as any).pdfPath} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Visualizar PDF atual
                    </a>
                  )}
                  {pdfFile && <p className="text-green-600">Novo arquivo selecionado (substituirá o existente)</p>}
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-border/50">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-base font-semibold">Configuração da Agenda</h3>
            </div>

            {isLoadingGroups ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Defina os treinos para cada dia da semana.</p>

                <Tabs value={selectedWeek} onValueChange={setSelectedWeek} className="flex flex-col">
                  <TabsList className="grid grid-cols-4 w-full">
                    {weeks.map((week) => (
                      <TabsTrigger key={week.value} value={week.value} className="text-xs">
                        {week.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <div className="mt-4 border border-border/50 rounded-lg p-5 bg-gradient-to-br from-slate-50/30 to-slate-50/10 dark:from-slate-900/10 dark:to-slate-900/5">
                    {weeks.map((week) => (
                      <TabsContent key={week.value} value={week.value} className="m-0 p-0 space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                          {weekDays.map((day) => {
                            const currentGroupId = weekPlans[week.value][day.value]?.groupId;
                            const currentSheet = currentGroupId 
                              ? exerciseGroups.find(g => g.id === currentGroupId)
                              : null;
                            
                            return (
                              <div key={day.value} className="border border-border/50 p-3 rounded-lg bg-background hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                <Label className="mb-2.5 block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{day.label}</Label>
                                <WorkoutSheetAutocomplete
                                  value={currentSheet || null}
                                  onChange={(sheet) => handleWorkoutChange(week.value, day.value, sheet)}
                                  placeholder="Selecionar treino"
                                  disabled={isLoadingGroups}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>
                    ))}
                  </div>
                </Tabs>
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-border/50">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Dumbbell className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-base font-semibold">Treinos Utilizados</h3>
            </div>

            <p className="text-sm text-muted-foreground">Personalize os nomes dos treinos para exibição aos alunos.</p>

            <div className="border border-border/50 rounded-lg bg-gradient-to-br from-slate-50/30 to-slate-50/10 dark:from-slate-900/10 dark:to-slate-900/5 overflow-hidden">
              <div className="max-h-[350px] overflow-y-auto">
                <div className="p-4 space-y-3">
                  {getUniqueGroupsUsed().length > 0 ? (
                    getUniqueGroupsUsed().map((groupId, idx) => (
                      <div key={groupId} className="flex items-center gap-3 border border-border/50 p-4 rounded-lg bg-background hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{getGroupName(groupId)}</p>
                          {isEditingShortName === groupId ? (
                            <div className="flex gap-2 items-center mt-2.5">
                              <Input
                                value={shortNameInput}
                                onChange={(e) => setShortNameInput(e.target.value)}
                                placeholder="Nome personalizado"
                                className="h-8 text-xs flex-1"
                                autoFocus
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={handleSaveShortName}
                                className="h-8 w-8 flex-shrink-0"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={handleCancelShortName}
                                className="h-8 w-8 flex-shrink-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between mt-1.5">
                              <div className="text-xs text-muted-foreground truncate mr-2">
                                <span className="font-medium">Exibir como:</span> {getShortName(groupId)}
                              </div>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditShortName(groupId)}
                                className="h-7 w-7 flex-shrink-0"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Nenhum treino adicionado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render buttons
  const renderStepButtons = () => {
    return (
      <div className="flex justify-between w-full gap-3">
        {currentStep > 1 ? (
          <Button type="button" variant="outline" onClick={goToPreviousStep} className="gap-2 h-9">
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9">
            Cancelar
          </Button>
        )}

        {currentStep < TOTAL_WIZARD_STEPS - 1 ? (
          <Button type="button" onClick={goToNextStep} className="gap-2 h-9">
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={goToNextStep} disabled={isSubmitting} className="gap-2 h-9">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
            {editingSheetId ? "Salvar alterações" : "Criar agenda"}
          </Button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[95vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b border-border/50">
          <DialogTitle>{editingSheetId ? "Editar Agenda de Treino" : "Nova Agenda de Treino"}</DialogTitle>
          <DialogDescription>
            {editingSheetId ? "Atualize os detalhes da agenda de treino" : "Crie uma nova agenda de treino com exercícios personalizados"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Step Indicator - with better spacing */}
          <div className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-slate-50/50 to-slate-50/30 dark:from-slate-900/20 dark:to-slate-900/10">
            {renderStepIndicator()}
          </div>

          {/* Step Title */}
          <div className="px-6 py-3 border-b border-border/50 bg-background">
            <h2 className="text-base font-semibold">{getStepTitle()}</h2>
          </div>

          {/* Step Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-5">{renderStepContent()}</div>

          {/* Footer - Fixed */}
          <div className="border-t border-border/50 bg-gradient-to-r from-slate-50/50 to-slate-50/30 dark:from-slate-900/20 dark:to-slate-900/10 px-6 py-3 flex items-center justify-between">
            {renderStepButtons()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrainingScheduleDialogWizard;
