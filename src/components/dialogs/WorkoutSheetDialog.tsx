import { useState, useEffect } from "react";
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
import GroupSelectorBar from "./GroupSelectorBar";
import { motion } from "framer-motion";

interface WorkoutSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing?: boolean;
  initialData?: unknown;
  onSuccess?: (data: unknown) => void;
}

interface ExerciseItem {
  id: string;
  exerciseId: number;
  exerciseName: string;
  methodId: number;
  methodName: string;
  series: string;
  reps: string;
}

interface ExerciseMethod {
  id: string;
  rest: string;
  observations: string;
  exercises: ExerciseItem[];
}

interface ExerciseGroup {
  id: string;
  name: string;
  methods: ExerciseMethod[];
}

const WorkoutSheetDialog = ({
  open,
  onOpenChange,
  isEditing = false,
  initialData,
  onSuccess,
}: WorkoutSheetDialogProps) => {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [groups, setGroups] = useState<ExerciseGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  async function loadInitialData() {
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
        // Initialize with one empty group
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
    } finally {
      setLoadingData(false);
    }
  }

  function removeGroup(groupId: string) {
    if (groups.length > 1) {
      const filtered = groups.filter((g) => g.id !== groupId);
      setGroups(filtered);
      if (groupId === activeGroupId) {
        setActiveGroupId(filtered[0].id);
      }
    }
  }

  function addGroup() {
    const newId = `group-${Date.now()}`;
    const newGroup: ExerciseGroup = {
      id: newId,
      name: `Grupo ${groups.length + 1}`,
      methods: [],
    };
    setGroups([...groups, newGroup]);
    setActiveGroupId(newId);
  }

  function updateGroupName(groupId: string, newName: string) {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name: newName } : g))
    );
  }

  function addMethodToGroup(groupId: string) {
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

  function removeMethodFromGroup(groupId: string, methodId: string) {
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

  function updateMethod(
    groupId: string,
    methodId: string,
    field: string,
    value: string
  ) {
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

  function addExerciseToMethod(
    groupId: string,
    methodId: string
  ) {
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

  function removeExerciseFromMethod(
    groupId: string,
    methodId: string,
    exerciseId: string
  ) {
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

  function updateExercise(
    groupId: string,
    methodId: string,
    exerciseId: string,
    field: string,
    value: unknown
  ) {
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

  async function handleSubmit() {
    try {
      if (!name.trim()) {
        toast({
          title: "Erro",
          description: "Nome do grupo de exercício é obrigatório",
          variant: "destructive",
        });
        return;
      }

      if (!categoryId) {
        toast({
          title: "Erro",
          description: "Categoria é obrigatória",
          variant: "destructive",
        });
        return;
      }

      if (groups.length === 0 || groups.every((g) => g.methods.length === 0)) {
        toast({
          title: "Erro",
          description: "Adicione pelo menos um método de exercício",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      // Use only the first group's methods for now (since we're creating a single ExerciseGroup)
      const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

      const payload = {
        name,
        categoryId: parseInt(categoryId),
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
          ? "Grupo de exercício atualizado"
          : "Grupo de exercício criado",
      });

      // Track activity
      ActivityTracker.addActivity(name || 'Novo Grupo', 'Ficha de Treino');

      onOpenChange(false);
      onSuccess?.(result);

      setName("");
      setCategoryId("");
      setGroups([]);
      setActiveGroupId("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
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
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col gap-0">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle>
            {isEditing ? "Editar Grupo de Exercícios" : "Novo Grupo de Exercícios"}
          </DialogTitle>
          <DialogDescription>
            Crie um grupo de exercícios com métodos e configurações
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex justify-center py-12 flex-1">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Sheet Details Section */}
            <div className="bg-gradient-to-br from-blue-50/50 to-blue-50/30 dark:from-blue-950/20 dark:to-blue-950/10 p-5 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
              <h3 className="text-sm font-semibold mb-5 flex items-center gap-2 text-blue-900 dark:text-blue-100 uppercase tracking-wide">
                <ClipboardList className="h-4 w-4" />
                Informações do Grupo
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nome *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Peito e Tríceps"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">Categoria *</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger id="category" className="h-9">
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
              </div>
            </div>

            {/* Group Selector and Exercise Methods */}
            <div className="space-y-5 mt-2">
              {/* Group Selector Bar */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-50/50 dark:from-slate-900/30 dark:to-slate-900/10 p-4 rounded-lg border border-slate-200/50 dark:border-slate-700/30">
                <GroupSelectorBar
                  groups={groups.map((g) => ({ id: g.id, name: g.name }))}
                  activeGroupId={activeGroupId}
                  onSelectGroup={setActiveGroupId}
                  onAddGroup={addGroup}
                  onRemoveGroup={removeGroup}
                  isLoading={loading}
                />
              </div>

              {/* Active Group Content */}
              {activeGroup && (
                <motion.div
                  key={activeGroup.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: ANIMATION.TRANSITION_DURATION }}
                  className="space-y-5"
                >
                  {/* Exercise Methods Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                          <Dumbbell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h3 className="text-base font-semibold">Métodos de Exercício</h3>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addMethodToGroup(activeGroup.id)}
                      className="gap-2 w-full h-9"
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Método
                    </Button>

                    <Accordion type="single" collapsible className="space-y-2">
                      {activeGroup.methods.map((method, methodIdx) => (
                        <AccordionItem
                          key={method.id}
                          value={method.id}
                          className="border rounded-lg overflow-hidden"
                        >
                          <AccordionTrigger className="hover:no-underline px-4 py-3 bg-muted/30 border-b hover:bg-muted/50">
                            <div className="flex items-center gap-3 w-full">
                              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                {methodIdx + 1}
                              </span>
                              <h4 className="text-sm font-medium">
                                Método {methodIdx + 1}
                              </h4>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeMethodFromGroup(activeGroup.id, method.id);
                              }}
                              className="ml-auto"
                              disabled={activeGroup.methods.length === 1 || loading}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </AccordionTrigger>
                          <AccordionContent className="p-0">
                            <div className="p-5 space-y-5 bg-slate-50/50 dark:bg-slate-900/20">
                              {/* Method properties */}
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
                                    onChange={(e) =>
                                      updateMethod(
                                        activeGroup.id,
                                        method.id,
                                        "rest",
                                        e.target.value
                                      )
                                    }
                                    placeholder="60s"
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label
                                    htmlFor={`obs-${method.id}`}
                                    className="text-xs font-medium"
                                  >
                                    Observações
                                  </Label>
                                  <Input
                                    id={`obs-${method.id}`}
                                    value={method.observations}
                                    onChange={(e) =>
                                      updateMethod(
                                        activeGroup.id,
                                        method.id,
                                        "observations",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Notas adicionais"
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>

                              {/* Exercises in this method */}
                              <div className="border-t pt-4 space-y-3">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Exercícios
                                  </h4>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      addExerciseToMethod(activeGroup.id, method.id)
                                    }
                                    disabled={loading}
                                    className="h-8 text-xs"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Exercício
                                  </Button>
                                </div>

                                {method.exercises.map((exercise, exIdx) => (
                                  <Card
                                    key={exercise.id}
                                    className="p-4 space-y-3 bg-gradient-to-r from-blue-50/50 to-slate-50/50 dark:from-blue-950/20 dark:to-slate-900/20 border-blue-200/30 dark:border-blue-900/30"
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs font-medium text-muted-foreground">
                                        Exercício {exIdx + 1}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <Label
                                          htmlFor={`exercise-${exercise.id}`}
                                          className="text-xs"
                                        >
                                          Exercício
                                        </Label>
                                        <Select
                                          value={
                                            exercise.exerciseId?.toString() || ""
                                          }
                                          onValueChange={(value) =>
                                            updateExercise(
                                              activeGroup.id,
                                              method.id,
                                              exercise.id,
                                              "exerciseId",
                                              parseInt(value)
                                            )
                                          }
                                        >
                                          <SelectTrigger
                                            id={`exercise-${exercise.id}`}
                                            className="h-8"
                                          >
                                            <SelectValue placeholder="Selecione" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {exercises.map((ex) => (
                                              <SelectItem
                                                key={ex.id}
                                                value={ex.id.toString()}
                                              >
                                                {ex.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div>
                                        <Label
                                          htmlFor={`method-${exercise.id}`}
                                          className="text-xs"
                                        >
                                          Método
                                        </Label>
                                        <Select
                                          value={
                                            exercise.methodId?.toString() || ""
                                          }
                                          onValueChange={(value) =>
                                            updateExercise(
                                              activeGroup.id,
                                              method.id,
                                              exercise.id,
                                              "methodId",
                                              parseInt(value)
                                            )
                                          }
                                        >
                                          <SelectTrigger
                                            id={`method-${exercise.id}`}
                                            className="h-8"
                                          >
                                            <SelectValue placeholder="Selecione" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {methods.map((m) => (
                                              <SelectItem
                                                key={m.id}
                                                value={m.id.toString()}
                                              >
                                                {m.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div className="flex gap-1 items-end">
                                        <div className="flex-1">
                                          <Label
                                            htmlFor={`series-${exercise.id}`}
                                            className="text-xs"
                                          >
                                            Séries
                                          </Label>
                                          <Input
                                            id={`series-${exercise.id}`}
                                            value={exercise.series}
                                            onChange={(e) =>
                                              updateExercise(
                                                activeGroup.id,
                                                method.id,
                                                exercise.id,
                                                "series",
                                                e.target.value
                                              )
                                            }
                                            className="h-8"
                                            placeholder="3"
                                          />
                                        </div>
                                        <div className="flex-1">
                                          <Label
                                            htmlFor={`reps-${exercise.id}`}
                                            className="text-xs"
                                          >
                                            Reps
                                          </Label>
                                          <Input
                                            id={`reps-${exercise.id}`}
                                            value={exercise.reps}
                                            onChange={(e) =>
                                              updateExercise(
                                                activeGroup.id,
                                                method.id,
                                                exercise.id,
                                                "reps",
                                                e.target.value
                                              )
                                            }
                                            className="h-8"
                                            placeholder="10"
                                          />
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            removeExerciseFromMethod(
                                              activeGroup.id,
                                              method.id,
                                              exercise.id
                                            )
                                          }
                                          className="h-8 w-8 p-0"
                                          disabled={method.exercises.length === 1 || loading}
                                        >
                                          <X className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </motion.div>
              )}
            </div>
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
            {isEditing ? "Atualizar" : "Criar"} Grupo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutSheetDialog;
