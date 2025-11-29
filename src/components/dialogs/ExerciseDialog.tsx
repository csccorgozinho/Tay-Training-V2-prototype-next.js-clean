"use strict";

/**
 * File: ExerciseDialog.tsx
 * Description: Dialog component for creating, editing, viewing, and deleting exercises with video support and method configuration.
 * Responsibilities:
 *   - Display create/edit form for exercises with name, description, video URL, and method flag
 *   - Validate required fields (name and description) before submission
 *   - Handle exercise creation via POST /api/db/exercises
 *   - Handle exercise updates via PUT /api/db/exercises/:id
 *   - Handle exercise deletion via DELETE /api/db/exercises/:id with confirmation
 *   - Display view-only mode when exercise is provided without edit flag
 *   - Track activity using ActivityTracker for audit purposes
 *   - Show loading states and error/success toasts
 *   - Render video player when video URL is provided
 *   - Animate dialog transitions and form elements
 * Called by:
 *   - src/pages/Exercises.tsx (main exercises management page)
 *   - Other components that need exercise CRUD operations
 * Notes:
 *   - Three modes: Create (no initialData), Edit (isEditing=true + initialData), View (isEditing=false + initialData)
 *   - Video URL accepts YouTube, Vimeo, and other video platforms
 *   - hasMethod flag indicates if exercise uses specific training methods
 *   - Delete requires user confirmation via browser confirm dialog
 *   - All form fields reset when dialog opens in create mode
 *   - Uses Framer Motion for smooth animations
 */

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Trash2 } from "lucide-react";
import { useLoading } from "@/hooks/use-loading";
import { useToast } from "@/hooks/use-toast";
import { ActivityTracker } from "@/lib/activity-tracker";
import { apiPost, apiPut, apiDelete, ApiError } from "@/lib/api-client";
import {
  fadeUpIn,
  modalSlideUpIn,
  listContainer,
  listItem,
  hoverScale,
  hoverLift,
  tapScale,
} from "@/lib/motion-variants";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { VideoPlayer } from "@/components/ui/video-player";

/**
 * Represents exercise data structure.
 */
interface ExerciseData {
  id?: number;
  name: string;
  description: string;
  videoUrl?: string | null;
  hasMethod?: boolean;
}

/**
 * Props for ExerciseDialog component.
 */
interface ExerciseDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Whether in editing mode (vs create or view mode) */
  isEditing?: boolean;
  /** Initial exercise data for edit/view mode */
  initialData?: ExerciseData | null;
  /** Callback when exercise is successfully saved */
  onSaved?: (exercise: ExerciseData) => void;
}

/**
 * Validates exercise name.
 *
 * @param name - Exercise name to validate
 * @returns true if valid, false otherwise
 */
function isValidName(name: string): boolean {
  return name.trim().length > 0;
}

/**
 * Validates exercise description.
 *
 * @param description - Exercise description to validate
 * @returns true if valid, false otherwise
 */
function isValidDescription(description: string): boolean {
  return description.trim().length > 0;
}

/**
 * Validates video URL format (basic check).
 *
 * @param url - Video URL to validate
 * @returns true if valid or empty, false otherwise
 */
function isValidVideoUrl(url: string | null): boolean {
  if (!url || url.trim().length === 0) {
    return true; // Optional field
  }

  try {
    const parsedUrl = new URL(url.trim());
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Exercise dialog component.
 * Handles create, edit, view, and delete operations for exercises.
 *
 * @param props - Component props
 * @returns JSX element containing the exercise dialog
 */
function ExerciseDialog({
  open,
  onOpenChange,
  isEditing = false,
  initialData,
  onSaved,
}: ExerciseDialogProps) {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [hasMethod, setHasMethod] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const { startLoading, stopLoading } = useLoading();
  const { toast } = useToast();

  // Determine if in view-only mode
  const isViewMode = !isEditing && !!initialData?.id;

  /**
   * Initializes form fields when dialog opens.
   * Resets to initialData or empty values.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setVideoUrl(initialData.videoUrl || null);
      setHasMethod(initialData.hasMethod !== false);
    } else {
      setName("");
      setDescription("");
      setVideoUrl(null);
      setHasMethod(true);
    }
  }, [open, initialData]);

  /**
   * Handles form submission for creating or updating exercise.
   *
   * @param e - Form submit event
   */
  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    // Validate required fields
    if (!isValidName(name)) {
      toast({
        title: "Erro",
        description: "Nome do exercício é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!isValidDescription(description)) {
      toast({
        title: "Erro",
        description: "Descrição é obrigatória",
        variant: "destructive",
      });
      return;
    }

    // Validate video URL if provided
    if (videoUrl && !isValidVideoUrl(videoUrl)) {
      toast({
        title: "Erro",
        description: "URL do vídeo inválida",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    startLoading();

    try {
      const payload: Partial<ExerciseData> = {
        name: name.trim(),
        description: description.trim(),
        videoUrl: videoUrl?.trim() || null,
        hasMethod,
      };

      let savedExercise: ExerciseData;

      if (isEditing && initialData?.id) {
        // Update existing exercise
        savedExercise = (await apiPut(
          `/api/db/exercises/${initialData.id}`,
          payload
        )) as ExerciseData;
      } else {
        // Create new exercise
        savedExercise = (await apiPost(
          "/api/db/exercises",
          payload
        )) as ExerciseData;
      }

      // Track activity
      ActivityTracker.addActivity(
        name.trim() || "Novo Exercício",
        "Exercício"
      );

      // Notify parent and close dialog
      if (onSaved) {
        onSaved(savedExercise);
      }

      onOpenChange(false);

      // Show success toast
      toast({
        title: "Sucesso",
        description: isEditing
          ? "Exercício atualizado com sucesso"
          : "Exercício criado com sucesso",
      });
    } catch (error) {
      console.error("Error saving exercise:", error);

      const errorMessage =
        error instanceof ApiError
          ? error.message
          : "Erro ao salvar exercício";

      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: errorMessage,
      });
    } finally {
      setSaving(false);
      stopLoading();
    }
  }

  /**
   * Handles exercise deletion with confirmation.
   */
  async function handleDelete(): Promise<void> {
    if (!initialData?.id) {
      console.error("Cannot delete: No exercise ID provided");
      return;
    }

    // Confirm deletion
    const confirmed = window.confirm(
      "Tem certeza que deseja deletar este exercício?"
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    startLoading();

    try {
      await apiDelete(`/api/db/exercises/${initialData.id}`);

      toast({
        title: "Sucesso",
        description: "Exercício deletado com sucesso",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting exercise:", error);

      const errorMessage =
        error instanceof ApiError
          ? error.message
          : "Erro ao deletar exercício";

      toast({
        variant: "destructive",
        title: "Erro ao deletar",
        description: errorMessage,
      });
    } finally {
      setSaving(false);
      stopLoading();
    }
  }

  /**
   * Handles dialog close.
   */
  function handleClose(): void {
    onOpenChange(false);
  }

  // Compute dialog title based on mode
  const dialogTitle = isViewMode
    ? initialData?.name || "Exercício"
    : isEditing
    ? "Editar Exercício"
    : "Novo Exercício";

  // Compute submit button text
  const submitButtonText = saving
    ? "Salvando..."
    : isEditing
    ? "Salvar alterações"
    : "Criar exercício";

  // Compute delete button text
  const deleteButtonText = saving ? "Deletando..." : "Deletar";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
        <motion.div
          variants={modalSlideUpIn}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Dialog Header */}
          <DialogHeader className="px-6 pt-6 pb-2">
            <motion.div variants={fadeUpIn} initial="hidden" animate="visible">
              <DialogTitle>{dialogTitle}</DialogTitle>
            </motion.div>
          </DialogHeader>

          {/* Dialog Content - View or Edit Mode */}
          <AnimatePresence mode="wait">
            {isViewMode && initialData ? (
              <motion.div
                key="view-mode"
                variants={fadeUpIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="px-6 py-4"
              >
                <motion.div
                  className="grid gap-4"
                  variants={listContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {/* Video Player */}
                  {initialData.videoUrl && (
                    <motion.div variants={listItem}>
                      <VideoPlayer
                        url={initialData.videoUrl}
                        title={initialData.name || "Vídeo do Exercício"}
                      />
                    </motion.div>
                  )}

                  {/* Description */}
                  <motion.div variants={listItem}>
                    <h3 className="text-sm font-semibold">Descrição</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {initialData.description || "-"}
                    </p>
                  </motion.div>

                  {/* Has Method Flag */}
                  {initialData.hasMethod && (
                    <motion.div variants={listItem}>
                      <h3 className="text-sm font-semibold">
                        Utiliza método de treino específico
                      </h3>
                      <p className="text-sm text-muted-foreground">Sim</p>
                    </motion.div>
                  )}
                </motion.div>

                {/* View Mode Footer */}
                <DialogFooter className="pt-4 flex justify-between items-center">
                  <motion.div
                    whileHover="hover"
                    whileTap="tap"
                    initial="initial"
                    variants={{ hover: hoverLift, tap: tapScale }}
                    className="w-full"
                  >
                    <Button
                      variant="destructive"
                      className="gap-2 w-auto"
                      onClick={handleDelete}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleteButtonText}
                    </Button>
                  </motion.div>
                  <Button variant="ghost" onClick={handleClose}>
                    Fechar
                  </Button>
                </DialogFooter>
              </motion.div>
            ) : (
              <motion.form
                key="edit-mode"
                onSubmit={handleSubmit}
                variants={fadeUpIn}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="px-6 py-4 overflow-y-auto max-h-[calc(100vh-200px)]">
                  <motion.div
                    className="grid gap-5"
                    variants={listContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    {/* Exercise Name Field */}
                    <motion.div className="space-y-2" variants={listItem}>
                      <Label htmlFor="name">Nome do Exercício *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome do exercício"
                        required
                        className="transition-all duration-200 focus:ring-2"
                      />
                    </motion.div>

                    {/* Description Field */}
                    <motion.div className="space-y-2" variants={listItem}>
                      <Label htmlFor="description">Descrição *</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva como executar o exercício"
                        className="min-h-[100px] transition-all duration-200 focus:ring-2"
                        required
                      />
                    </motion.div>

                    {/* Video URL Field */}
                    <motion.div className="space-y-2" variants={listItem}>
                      <Label htmlFor="videoUrl">Link do vídeo</Label>
                      <Input
                        id="videoUrl"
                        value={videoUrl || ""}
                        onChange={(e) =>
                          setVideoUrl(e.target.value || null)
                        }
                        placeholder="URL do vídeo demonstrativo (YouTube, Vimeo, etc.)"
                        className="transition-all duration-200 focus:ring-2"
                      />
                    </motion.div>

                    {/* Has Method Checkbox */}
                    <motion.div
                      className="flex items-center space-x-2"
                      variants={listItem}
                    >
                      <Checkbox
                        id="hasMethod"
                        checked={hasMethod}
                        onCheckedChange={(checked) =>
                          setHasMethod(checked as boolean)
                        }
                      />
                      <Label htmlFor="hasMethod" className="cursor-pointer">
                        Este exercício utiliza método de treino específico
                      </Label>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Edit Mode Footer */}
                <DialogFooter className="px-6 py-4 bg-muted/30">
                  <motion.div
                    whileHover="hover"
                    whileTap="tap"
                    variants={{ hover: hoverScale, tap: tapScale }}
                  >
                    <Button
                      type="submit"
                      className="gap-2"
                      disabled={saving}
                    >
                      <Save className="h-4 w-4" />
                      {submitButtonText}
                    </Button>
                  </motion.div>
                </DialogFooter>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export default ExerciseDialog;

