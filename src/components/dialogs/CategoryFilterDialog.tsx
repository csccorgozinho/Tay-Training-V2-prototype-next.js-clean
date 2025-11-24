import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { X } from "lucide-react";
import { modalSlideUpIn, listContainer, listItem, hoverScale, tapScale } from "@/lib/motion-variants";

interface Category {
  id: number;
  name: string;
}

interface CategoryFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  selectedCategoryId: number | null;
  onCategorySelect: (categoryId: number | null) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function CategoryFilterDialog({
  open,
  onOpenChange,
  categories,
  selectedCategoryId,
  onCategorySelect,
  isLoading = false,
  error = null,
}: CategoryFilterDialogProps) {
  const handleSelectCategory = (categoryId: number | null) => {
    onCategorySelect(categoryId);
  };

  const handleClearFilters = () => {
    onCategorySelect(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <motion.div
          variants={modalSlideUpIn}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
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
                onClick={() => handleClearFilters()}
                disabled={isLoading}
              >
                <span className="flex-1 text-left">Todas as Categorias</span>
                {selectedCategoryId === null && (
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: ANIMATION.SPRING_STIFFNESS, damping: ANIMATION.SPRING_DAMPING }}
                  >
                    <X className="h-4 w-4 ml-2" />
                  </motion.div>
                )}
              </Button>
            </motion.div>

            {/* Category Buttons */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="skeletons"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * ANIMATION.STAGGER_DELAY }}
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
                  {categories.map((category, index) => (
                    <motion.div
                      key={category.id}
                      variants={listItem}
                      whileHover="hover"
                      whileTap="tap"
                      custom={index}
                    >
                      <Button
                        variant={selectedCategoryId === category.id ? "default" : "outline"}
                        className="w-full justify-start transition-all duration-200"
                        onClick={() => handleSelectCategory(category.id)}
                        disabled={isLoading}
                      >
                        <span className="flex-1 text-left">{category.name}</span>
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

            {categories.length === 0 && !isLoading && !error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-8 text-center text-muted-foreground"
              >
                <p>Nenhuma categoria disponível</p>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 px-4 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <p className="text-sm font-medium text-destructive">Erro ao carregar categorias</p>
                <p className="text-xs text-destructive/80 mt-1">{error}</p>
              </motion.div>
            )}
          </div>

          {/* Dialog Footer Actions */}
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
                onClick={() => onOpenChange(false)}
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
