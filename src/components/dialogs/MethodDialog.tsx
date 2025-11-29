"use strict";

/**
 * File: MethodDialog.tsx
 * Description: Dialog component for creating, editing, viewing, and deleting training methods with form validation and activity tracking.
 * Responsibilities:
 *   - Display create/edit form for training methods with name and description
 *   - Validate required fields (name and description) before submission
 *   - Handle method creation via POST /api/db/methods
 *   - Handle method updates via PUT /api/db/methods/:id
 *   - Handle method deletion via DELETE /api/db/methods/:id with confirmation
 *   - Display view-only mode when method is provided without edit flag
 *   - Track activity using ActivityTracker for audit purposes
 *   - Show loading states and error/success toasts
 *   - Animate dialog transitions and form elements
 * Called by:
 *   - src/pages/Methods.tsx (main methods management page)
 *   - Other components that need training method CRUD operations
 * Notes:
 *   - Three modes: Create (no initialData), Edit (isEditing=true + initialData), View (isEditing=false + initialData)
 *   - Both name and description are required fields
 *   - Delete requires user confirmation via browser confirm dialog
 *   - All form fields reset when dialog opens in create mode
 *   - Uses Framer Motion for smooth animations
 *   - Training methods define how exercises should be performed (e.g., drop sets, supersets)
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
  tapScale,
} from "@/lib/motion-variants";
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
import { Textarea } from "@/components/ui/textarea";

/**
 * Represents training method data structure.
 */
interface MethodData {
  id?: number;
  name: string;
  description: string;
}

/**
 * Props for MethodDialog component.
 */
interface MethodDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Whether in editing mode (vs create or view mode) */
  isEditing?: boolean;
  /** Initial method data for edit/view mode */
  initialData?: MethodData | null;
  /** Callback when method is successfully saved */
  onSaved?: (method: MethodData) => void;
}

/**
 * Validates method name.
 *
 * @param name - Method name to validate
 * @returns true if valid, false otherwise
 */
function isValidName(name: string): boolean {
  return name.trim().length > 0;
}

/**
 * Validates method description.
 *
 * @param description - Method description to validate
 * @returns true if valid, false otherwise
 */
function isValidDescription(description: string): boolean {
  return description.trim().length > 0;
}

/**
 * Method dialog component.
 * Handles create, edit, view, and delete operations for training methods.
 *
 * @param props - Component props
 * @returns JSX element containing the method dialog
 */
function MethodDialog({
  open,
  onOpenChange,
  isEditing = false,
  initialData,
  onSaved,
}: MethodDialogProps) {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
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
    } else {
      setName("");
      setDescription("");
    }
  }, [open, initialData]);

  /**
   * Handles form submission for creating or updating method.
   *
   * @param e - Form submit event
   */
  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    // Validate required fields
    if (!isValidName(name)) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
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

    setSaving(true);
    startLoading();

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
      };

      let savedMethod: MethodData;

      if (isEditing && initialData?.id) {
        // Update existing method
        savedMethod = (await apiPut(
          `/api/db/methods/${initialData.id}`,
          payload
        )) as MethodData;
      } else {
        // Create new method
        savedMethod = (await apiPost("/api/db/methods", payload)) as MethodData;
      }

      // Track activity
      ActivityTracker.addActivity(name.trim() || "Novo Método", "Método");

      // Notify parent and close dialog
      if (onSaved) {
        onSaved(savedMethod);
      }

      onOpenChange(false);

      // Show success toast
      toast({
        title: "Sucesso",
        description: isEditing
          ? "Método atualizado com sucesso"
          : "Método criado com sucesso",
      });
    } catch (error) {
      console.error("Error saving method:", error);

      const errorMessage =
        error instanceof ApiError ? error.message : "Erro ao salvar método";

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
   * Handles method deletion with confirmation.
   */
  async function handleDelete(): Promise<void> {
    if (!initialData?.id) {
      console.error("Cannot delete: No method ID provided");
      return;
    }

    // Confirm deletion
    const confirmed = window.confirm(
      "Tem certeza que deseja deletar este método?"
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    startLoading();

    try {
      await apiDelete(`/api/db/methods/${initialData.id}`);

      toast({
        title: "Método deletado",
        description: "O método foi removido com sucesso",
      });

      // Notify parent with deleted method data
      if (onSaved) {
        onSaved(initialData);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting method:", error);

      const errorMessage =
        error instanceof ApiError ? error.message : "Erro ao deletar método";

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
    ? initialData?.name || "Método"
    : isEditing
    ? "Editar Método"
    : "Novo Método";

  // Compute dialog description based on mode
  const dialogDescription = isViewMode
    ? "Detalhes do método de treino"
    : isEditing
    ? "Atualize os detalhes do método de treino"
    : "Preencha os detalhes para criar um novo método de treino";

  // Compute submit button text
  const submitButtonText = saving
    ? "Salvando..."
    : isEditing
    ? "Salvar alterações"
    : "Criar método";

  // Compute delete button text
  const deleteButtonText = saving ? "Deletando..." : "Deletar";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
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
              <DialogDescription>{dialogDescription}</DialogDescription>
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
                  {/* Description */}
                  <motion.div variants={listItem}>
                    <h3 className="text-sm font-semibold mb-1">Descrição</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {initialData.description}
                    </p>
                  </motion.div>
                </motion.div>
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
                <div className="px-6 py-4">
                  <motion.div
                    className="grid gap-4"
                    variants={listContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    {/* Name Field */}
                    <motion.div className="space-y-2" variants={listItem}>
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome do método"
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
                        placeholder="Descreva o método"
                        className="min-h-[100px] transition-all duration-200 focus:ring-2"
                        required
                      />
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
                    <Button type="submit" disabled={saving} className="gap-2">
                      <Save className="h-4 w-4" />
                      {submitButtonText}
                    </Button>
                  </motion.div>
                </DialogFooter>
              </motion.form>
            )}
          </AnimatePresence>

          {/* View Mode Footer */}
          {isViewMode && (
            <DialogFooter className="px-6 py-4 bg-muted/30 border-t flex justify-between items-center">
              <motion.div
                whileHover="hover"
                whileTap="tap"
                variants={{ hover: { scale: 1.02 }, tap: { scale: 0.98 } }}
              >
                <Button
                  variant="destructive"
                  className="gap-2"
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
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export default MethodDialog;
