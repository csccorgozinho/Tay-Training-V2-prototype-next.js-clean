"use client";

import React, { useState, useEffect } from "react";
import { ActivityTracker } from "@/lib/activity-tracker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FileUp, ChevronRight, ChevronLeft, Edit, Check, X, Calendar, Info, Pencil, ClipboardCheck, Loader2, Dumbbell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkoutSheetAutocomplete } from "./WorkoutSheetAutocomplete";

interface WorkoutSheet {
  id: number;
  name: string;
  publicName?: string;
}

interface TrainingScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  editingData?: any;
}

interface ExerciseGroup {
  id: number;
  name: string;
  publicName?: string;
  categoryId?: number;
  exerciseMethods?: Record<string, unknown>[];
}

interface WorkoutAlias {
  groupId: number;
  alias: string;
}

interface DayPlan {
  [day: string]: {
    groupId: number | null;
  };
}

interface WeekPlans {
  [week: string]: DayPlan;
}

const DAYS_OF_WEEK = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const createDefaultWeekPlans = (): WeekPlans => {
  const plans: WeekPlans = {};
  for (let week = 1; week <= 4; week++) {
    plans[week.toString()] = {};
    for (let day = 1; day <= 7; day++) {
      plans[week.toString()][day.toString()] = { groupId: null };
    }
  }
  return plans;
};

const TrainingScheduleDialogWizard = ({ open, onOpenChange, onSaved, editingData }: TrainingScheduleDialogProps) => {
  const { toast } = useToast();

  // Wizard step state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form data
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState("");

  // Week configuration
  const [selectedWeek, setSelectedWeek] = useState("1");

  // Exercise groups from API
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // Workout configurations
  const [workoutAliases, setWorkoutAliases] = useState<WorkoutAlias[]>([]);
  const [isEditingAlias, setIsEditingAlias] = useState<number | null>(null);
  const [aliasInput, setAliasInput] = useState("");

  // Week plans
  const [weekPlans, setWeekPlans] = useState<WeekPlans>(createDefaultWeekPlans());

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSheetId, setEditingSheetId] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false); // Guard against double submission

  // Load exercise groups
  useEffect(() => {
    const loadGroups = async () => {
      try {
        setIsLoadingGroups(true);
        const response = await fetch("/api/exercise-groups");
        if (!response.ok) throw new Error("Failed to load groups");

        const data = await response.json();
        let groups = [];
        if (Array.isArray(data)) {
          groups = data;
        } else if (data?.data && Array.isArray(data.data)) {
          groups = data.data;
        } else if (data?.groups && Array.isArray(data.groups)) {
          groups = data.groups;
        }
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

    if (open) {
      loadGroups();
    }
  }, [open, toast]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setHasSubmitted(false);
      if (editingData?.id) {
        setEditingSheetId(editingData.id);
        setName(editingData.name || "");
        setDescription(editingData.publicName || "");
        setCurrentStep(1);

        const newWeekPlans = createDefaultWeekPlans();
        if (editingData.trainingDays && Array.isArray(editingData.trainingDays)) {
          (editingData?.trainingDays as any[] || []).forEach((trainingDay: Record<string, unknown>) => {
            const day = typeof trainingDay.day === 'number' ? trainingDay.day : 0;
            const dayOfWeek = (day - 1) % 7;
            const weekNumber = Math.floor((day - 1) / 7) + 1;

            newWeekPlans[weekNumber.toString()][dayOfWeek + 1] = {
              groupId: (typeof trainingDay.exerciseGroupId === 'number' ? trainingDay.exerciseGroupId : null) || null,
            };
          });
        }
        setWeekPlans(newWeekPlans);
      } else {
        setEditingSheetId(null);
        setCurrentStep(1);
        setName("");
        setDescription("");
        setPdfFile(null);
        setPdfFileName("");
        setSelectedWeek("1");
        setWeekPlans(createDefaultWeekPlans());
        setWorkoutAliases([]);
        setIsEditingAlias(null);
        setAliasInput("");
      }
    }
  }, [open, editingData]);

  // Update aliases when workouts change
  useEffect(() => {
    const usedGroupIds = new Set<number>();

    Object.values(weekPlans).forEach((week) => {
      Object.values(week).forEach((day) => {
        if (day.groupId) {
          usedGroupIds.add(day.groupId);
        }
      });
    });

    const updatedAliases = workoutAliases.filter((alias) => usedGroupIds.has(alias.groupId));

    usedGroupIds.forEach((groupId) => {
      if (!updatedAliases.some((alias) => alias.groupId === groupId)) {
        const group = exerciseGroups.find((g) => g.id === groupId);
        updatedAliases.push({
          groupId,
          alias: group ? group.name : "",
        });
      }
    });

    setWorkoutAliases(updatedAliases);
  }, [weekPlans, exerciseGroups]);

  // Handle workout change for a day
  const handleWorkoutChange = (weekId: string, dayId: string, sheet: WorkoutSheet | null) => {
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
  };

  // Handle PDF file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
      setPdfFileName(e.target.files[0].name);
    }
  };

  // Alias editing handlers
  const handleEditAlias = (groupId: number) => {
    const currentAlias = workoutAliases.find((a) => a.groupId === groupId);
    if (currentAlias) {
      setAliasInput(currentAlias.alias);
      setIsEditingAlias(groupId);
    }
  };

  const handleSaveAlias = () => {
    if (isEditingAlias === null) return;

    setWorkoutAliases((prev) =>
      prev.map((alias) => (alias.groupId === isEditingAlias ? { ...alias, alias: aliasInput } : alias))
    );

    setIsEditingAlias(null);
  };

  const handleCancelAlias = () => {
    setIsEditingAlias(null);
  };

  // Get group name
  const getGroupName = (groupId: number | null): string => {
    if (!groupId) return "Nenhum treino";
    const group = exerciseGroups.find((g) => g.id === groupId);
    return group ? group.name : "Treino não encontrado";
  };

  // Get alias name
  const getAliasName = (groupId: number): string => {
    const alias = workoutAliases.find((a) => a.groupId === groupId);
    return alias?.alias || getGroupName(groupId);
  };

  // Get unique groups used
  const getUniqueGroupsUsed = (): number[] => {
    const groupIds = new Set<number>();

    Object.values(weekPlans).forEach((week) => {
      Object.values(week).forEach((day) => {
        if (day.groupId) {
          groupIds.add(day.groupId);
        }
      });
    });

    return Array.from(groupIds);
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Prevent double submission
    if (isSubmitting || hasSubmitted) {
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da agenda é obrigatório",
        variant: "destructive",
      });
      return;
    }

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

            const methods = Array.isArray(fullGroup.exerciseMethods) ? fullGroup.exerciseMethods : [];

            if (methods.length === 0) {
              throw new Error(`Group "${fullGroup.name}" has no methods`);
            }

            const customTitle = getAliasName(groupId);
            
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
        publicName: description || name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        trainingDays: trainingDaysData,
      };
      
      const method = editingSheetId ? "PUT" : "POST";
      const url = editingSheetId ? `/api/training-sheets/${editingSheetId}` : "/api/training-sheets";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  // Navigation
  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      if (currentStep === totalSteps - 1) {
        handleSubmit(new Event("submit") as unknown as React.FormEvent);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1">
          {Array.from({ length: totalSteps - 1 }).map((_, index) => {
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

                {stepNumber < totalSteps - 1 && (
                  <div className={`h-0.5 w-12 ${stepNumber < currentStep ? "bg-primary" : "bg-muted"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // Get step title
  const getStepTitle = () => {
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
  };

  // Render step content
  const renderStepContent = () => {
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
              <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da agenda (opcional)"
                className="resize-none h-[90px] text-sm"
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
              {pdfFileName && <p className="text-xs text-muted-foreground mt-1">Arquivo: {pdfFileName}</p>}
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
                          {isEditingAlias === groupId ? (
                            <div className="flex gap-2 items-center mt-2.5">
                              <Input
                                value={aliasInput}
                                onChange={(e) => setAliasInput(e.target.value)}
                                placeholder="Nome personalizado"
                                className="h-8 text-xs flex-1"
                                autoFocus
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={handleSaveAlias}
                                className="h-8 w-8 flex-shrink-0"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={handleCancelAlias}
                                className="h-8 w-8 flex-shrink-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between mt-1.5">
                              <div className="text-xs text-muted-foreground truncate mr-2">
                                <span className="font-medium">Exibir como:</span> {getAliasName(groupId)}
                              </div>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditAlias(groupId)}
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

        {currentStep < totalSteps - 1 ? (
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
