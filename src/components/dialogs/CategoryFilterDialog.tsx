"use strict";

/**
 * File: CategoryFilterDialog.tsx
 * Description: Modal dialog component for filtering workout sheets by category with animations.
 * Responsibilities:
 *   - Display category list in a modal dialog
 *   - Handle category selection and filtering
 *   - Show "All Categories" option to clear filters
 *   - Display loading skeletons during data fetch
 *   - Show error messages if category loading fails
 *   - Provide visual feedback for selected category
 *   - Animate dialog appearance and category list
 *   - Handle dialog open/close state
 * Called by:
 *   - src/pages/WorkoutSheets.tsx (workout sheets page for category filtering)
 * Notes:
 *   - Uses Framer Motion for smooth animations
 *   - All text content is in Portuguese to match application language
 *   - Selected category is indicated with checkmark and default variant
 *   - Supports null categoryId to show all categories
 *   - Loading state shows 4 skeleton placeholders
 *   - Categories list is scrollable with max height of 96 units
 *   - Dialog footer shows "Clear Filter" button only when a category is selected
 */

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ANIMATION } from "@/config/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  modalSlideUpIn,
  listContainer,
  listItem,
  hoverScale,
  tapScale,
} from "@/lib/motion-variants";

/**
 * Category data structure.
 */
interface Category {
  id: number;
  name: string;
}

/**
 * Props for CategoryFilterDialog component.
 */
interface CategoryFilterDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Array of available categories */
  categories: Category[];
  /** Currently selected category ID, null means all categories */
  selectedCategoryId: number | null;
  /** Callback when a category is selected */
  onCategorySelect: (categoryId: number | null) => void;
  /** Whether categories are currently loading */
  isLoading?: boolean;
  /** Error message if category loading failed */
  error?: string | null;
}

/**
 * Number of skeleton loaders to show during loading state.
 */
const SKELETON_COUNT = 4;

/**
 * Validates that a category object has required properties.
 *
 * @param category - Category object to validate
 * @returns true if valid, false otherwise
 */
function isValidCategory(category: unknown): category is Category {
  if (!category || typeof category !== "object") {
    return false;
  }

  const cat = category as Record<string, unknown>;

  return (
    typeof cat.id === "number" &&
    typeof cat.name === "string" &&
    cat.name.trim().length > 0
  );
}

/**
 * Category filter dialog component.
 * Displays a modal for filtering workout sheets by category.
 *
 * @param props - Component props
 * @returns JSX element containing the category filter dialog
 */
export function CategoryFilterDialog({
  open,
  onOpenChange,
  categories,
  selectedCategoryId,
  onCategorySelect,
  isLoading = false,
  error = null,
}: CategoryFilterDialogProps) {
  /**
   * Handles category selection.
   *
   * @param categoryId - Selected category ID or null for all categories
   */
  function handleSelectCategory(categoryId: number | null): void {
    onCategorySelect(categoryId);
  }

  /**
   * Clears all category filters by selecting null.
   */
  function handleClearFilters(): void {
    onCategorySelect(null);
  }

  /**
   * Handles dialog close action.
   */
  function handleClose(): void {
    onOpenChange(false);
  }

  // Filter out invalid categories
  const validCategories = categories.filter(isValidCategory);

  // Determine if there are no categories to display
  const hasNoCategories = validCategories.length === 0 && !isLoading && !error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <motion.div
          variants={modalSlideUpIn}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Dialog Header */}
          <DialogHeader className="px-6 pt-6 pb-2">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: ANIMATION.DIALOG_ANIMATION_DURATION }}
            >
              <DialogTitle>Filtrar por Categoria</DialogTitle>
              <DialogDescription>
                Selecione uma categoria para filtrar as fichas de treino
              </DialogDescription>
            </motion.div>
          </DialogHeader>

          {/* Dialog Body */}
          <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
            {/* All Categories Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              whileHover="hover"
              whileTap="tap"
              variants={{ hover: hoverScale, tap: tapScale }}
            >
              <Button
                variant={selectedCategoryId === null ? "default" : "outline"}
                className="w-full justify-start transition-all duration-200"
                onClick={handleClearFilters}
                disabled={isLoading}
              >
                <span className="flex-1 text-left">Todas as Categorias</span>
                {selectedCategoryId === null && (
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: ANIMATION.SPRING_STIFFNESS,
                      damping: ANIMATION.SPRING_DAMPING,
                    }}
                  >
                    <X className="h-4 w-4 ml-2" />
                  </motion.div>
                )}
              </Button>
            </motion.div>

            {/* Category List or Loading State */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="skeletons"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * ANIMATION.STAGGER_DELAY }}
                    >
                      <Skeleton className="h-10 w-full" />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="categories"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                  variants={listContainer}
                >
                  {validCategories.map((category, index) => (
                    <motion.div
                      key={category.id}
                      variants={listItem}
                      whileHover="hover"
                      whileTap="tap"
                      custom={index}
                    >
                      <Button
                        variant={
                          selectedCategoryId === category.id
                            ? "default"
                            : "outline"
                        }
                        className="w-full justify-start transition-all duration-200"
                        onClick={() => handleSelectCategory(category.id)}
                        disabled={isLoading}
                      >
                        <span className="flex-1 text-left">
                          {category.name}
                        </span>
                        {selectedCategoryId === category.id && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="text-xs font-semibold"
                          >
                            ✓
                          </motion.span>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State */}
            {hasNoCategories && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-8 text-center text-muted-foreground"
              >
                <p>Nenhuma categoria disponível</p>
              </motion.div>
            )}

            {/* Error State */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 px-4 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <p className="text-sm font-medium text-destructive">
                  Erro ao carregar categorias
                </p>
                <p className="text-xs text-destructive/80 mt-1">{error}</p>
              </motion.div>
            )}
          </div>

          {/* Dialog Footer */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ANIMATION.SECONDARY_DELAY }}
            className="flex gap-2 px-6 py-4 border-t bg-muted/30"
          >
            <motion.div
              whileHover="hover"
              whileTap="tap"
              variants={{ hover: hoverScale, tap: tapScale }}
              className="flex-1"
            >
              <Button
                variant="outline"
                className="w-full"
                onClick={handleClose}
              >
                Fechar
              </Button>
            </motion.div>
            {selectedCategoryId !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover="hover"
                whileTap="tap"
                variants={{ hover: hoverScale, tap: tapScale }}
                className="flex-1"
              >
                <Button
                  variant="default"
                  className="w-full"
                  onClick={handleClearFilters}
                >
                  Limpar Filtro
                </Button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
