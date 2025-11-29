"use strict";

/**
 * File: ExerciseAutocomplete.tsx
 * Description: Searchable autocomplete dropdown component for selecting exercises with debounced search and keyboard navigation.
 * Responsibilities:
 *   - Render exercise selection dropdown with search functionality
 *   - Load and display all available exercises
 *   - Filter exercises based on search query (debounced)
 *   - Support keyboard navigation (Arrow keys, Enter, Escape)
 *   - Display loading states during search
 *   - Handle exercise selection and clearing
 *   - Show empty states and error messages
 *   - Animate dropdown appearance and list items
 * Called by:
 *   - src/components/dialogs/WorkoutSheetDialog.tsx (for exercise selection in workout sheets)
 *   - Other dialog components that need exercise selection
 * Notes:
 *   - Uses "use client" directive for Next.js client-side rendering
 *   - Debounce delay from ANIMATION.DEBOUNCE_DELAY constant
 *   - Supports both controlled exercises prop or API fetch
 *   - All text content is in Portuguese to match application language
 *   - Keyboard navigation: Arrow Up/Down, Enter to select, Escape to close
 *   - Search is case-insensitive and matches name or description
 *   - Automatically loads all exercises when dropdown opens
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ChangeEvent, KeyboardEvent, MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckIcon, ChevronDown, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { ANIMATION } from "@/config/constants";
import type { Exercise } from "@/types";

/**
 * Props for ExerciseAutocomplete component.
 */
interface ExerciseAutocompleteProps {
  /** Currently selected exercise or null */
  value: Exercise | null;
  /** Callback when exercise selection changes */
  onChange: (exercise: Exercise | null) => void;
  /** Placeholder text for the trigger button */
  placeholder?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Optional pre-loaded exercises array (avoids API fetch if provided) */
  exercises?: Exercise[];
}

/**
 * Validates that an exercise object has required properties.
 *
 * @param exercise - Exercise object to validate
 * @returns true if valid, false otherwise
 */
function isValidExercise(exercise: unknown): exercise is Exercise {
  if (!exercise || typeof exercise !== "object") {
    return false;
  }

  const ex = exercise as Record<string, unknown>;

  return (
    typeof ex.id === "number" &&
    typeof ex.name === "string" &&
    ex.name.trim().length > 0
  );
}

/**
 * Extracts exercises array from API response.
 * Handles multiple possible response structures.
 *
 * @param data - API response data
 * @returns Array of exercises
 */
function extractExercisesFromResponse(data: unknown): Exercise[] {
  // Direct array response
  if (Array.isArray(data)) {
    return data.filter(isValidExercise);
  }

  // Response with data property
  if (data && typeof data === "object") {
    const response = data as Record<string, unknown>;

    if (Array.isArray(response.data)) {
      return response.data.filter(isValidExercise);
    }

    if (Array.isArray(response.exercises)) {
      return response.exercises.filter(isValidExercise);
    }
  }

  return [];
}

/**
 * Filters exercises based on search query.
 *
 * @param exercises - Array of exercises to filter
 * @param query - Search query string
 * @returns Filtered array of exercises
 */
function filterExercises(exercises: Exercise[], query: string): Exercise[] {
  if (!query || query.trim().length === 0) {
    return exercises;
  }

  const queryLower = query.toLowerCase().trim();

  return exercises.filter((exercise) => {
    const nameMatch = exercise.name.toLowerCase().includes(queryLower);
    const descMatch = exercise.description?.toLowerCase().includes(queryLower);

    return nameMatch || descMatch;
  });
}

/**
 * Exercise autocomplete component.
 * Provides searchable dropdown for exercise selection.
 *
 * @param props - Component props
 * @returns JSX element containing the exercise autocomplete
 */
export function ExerciseAutocomplete({
  value,
  onChange,
  placeholder = "Selecionar exercício...",
  disabled = false,
  exercises = [],
}: ExerciseAutocompleteProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  /**
   * Loads all available exercises.
   * Uses provided exercises prop or fetches from API.
   */
  const loadAllExercises = useCallback(async (): Promise<void> => {
    setIsSearching(true);

    try {
      if (exercises.length > 0) {
        // Use provided exercises
        const validExercises = exercises.filter(isValidExercise);
        setResults(validExercises);
        setHasSearched(true);
        setHighlightedIndex(-1);
      } else {
        // Fetch from API
        const response = await fetch("/api/db/exercises");

        if (!response.ok) {
          throw new Error(`Failed to fetch exercises: ${response.status}`);
        }

        const data = await response.json();
        const fetchedExercises = extractExercisesFromResponse(data);

        setResults(fetchedExercises);
        setHasSearched(true);
        setHighlightedIndex(-1);
      }
    } catch (error) {
      console.error("Error loading exercises:", error);

      toast({
        title: "Erro",
        description: "Falha ao carregar exercícios",
        variant: "destructive",
      });

      setResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, [exercises, toast]);

  /**
   * Performs exercise search based on query.
   * Filters from provided exercises or fetches from API.
   *
   * @param query - Search query string
   */
  const performSearch = useCallback(
    async (query: string): Promise<void> => {
      const trimmedQuery = query.trim();

      if (trimmedQuery.length === 0) {
        setResults([]);
        setHasSearched(false);
        setHighlightedIndex(-1);
        return;
      }

      setIsSearching(true);

      try {
        let searchResults: Exercise[] = [];

        if (exercises.length > 0) {
          // Filter from provided exercises
          const validExercises = exercises.filter(isValidExercise);
          searchResults = filterExercises(validExercises, trimmedQuery);
        } else {
          // Fetch from API and filter
          const response = await fetch("/api/db/exercises");

          if (!response.ok) {
            throw new Error(`Failed to fetch exercises: ${response.status}`);
          }

          const data = await response.json();
          const fetchedExercises = extractExercisesFromResponse(data);
          searchResults = filterExercises(fetchedExercises, trimmedQuery);
        }

        setResults(searchResults);
        setHasSearched(true);
        setHighlightedIndex(-1);
      } catch (error) {
        console.error("Search error:", error);

        toast({
          title: "Erro",
          description: "Falha ao buscar exercícios",
          variant: "destructive",
        });

        setResults([]);
        setHasSearched(true);
      } finally {
        setIsSearching(false);
      }
    },
    [exercises, toast]
  );

  /**
   * Handles input change with debounce.
   *
   * @param e - Change event from input element
   */
  function handleInputChange(e: ChangeEvent<HTMLInputElement>): void {
    const newValue = e.target.value;
    setInputValue(newValue);
    setOpen(true);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      performSearch(newValue);
    }, ANIMATION.DEBOUNCE_DELAY);
  }

  /**
   * Handles keyboard navigation and selection.
   *
   * @param e - Keyboard event from input element
   */
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (!open || results.length === 0) {
      if (e.key === "Enter") {
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;

      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleSelectExercise(results[highlightedIndex]);
        }
        break;

      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  }

  /**
   * Handles exercise selection.
   *
   * @param exercise - Selected exercise
   */
  function handleSelectExercise(exercise: Exercise): void {
    onChange(exercise);
    setInputValue("");
    setResults([]);
    setOpen(false);
    setHasSearched(false);
    setHighlightedIndex(-1);
  }

  /**
   * Handles clearing the selected exercise.
   *
   * @param e - Mouse event from clear button
   */
  function handleClear(e: MouseEvent<SVGSVGElement>): void {
    e.stopPropagation();
    onChange(null);
    setInputValue("");
    setResults([]);
    setHasSearched(false);
    setHighlightedIndex(-1);
  }

  /**
   * Handles popover open state change.
   *
   * @param isOpen - Whether popover should be open
   */
  function handleOpenChange(isOpen: boolean): void {
    setOpen(isOpen);

    if (isOpen && inputValue.trim().length === 0) {
      // Load all exercises when opening without search query
      loadAllExercises();
    }
  }

  // Close popover when exercise is selected
  useEffect(() => {
    if (value) {
      setOpen(false);
    }
  }, [value]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Determine empty state message
  const showLoadingMessage = inputValue.trim().length === 0 && !hasSearched;
  const showNoResultsMessage = hasSearched && inputValue.trim().length > 0 && results.length === 0;
  const showNoExercisesMessage = hasSearched && inputValue.trim().length === 0 && results.length === 0;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 px-3"
          disabled={disabled}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {value ? (
              <span className="text-sm truncate">{value.name}</span>
            ) : (
              <span className="text-sm text-muted-foreground">
                {placeholder}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {value && (
              <X
                className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={handleClear}
              />
            )}
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="center" side="bottom">
        <div className="p-3 space-y-2">
          {/* Search Input */}
          <div className="relative">
            <Input
              ref={inputRef}
              placeholder="Digite para buscar..."
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="h-9 pr-8"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Results List */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: ANIMATION.TRANSITION_DURATION }}
                className="h-64 overflow-y-auto"
              >
                {isSearching ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : results.length > 0 ? (
                  <div className="space-y-1">
                    {results.map((exercise, index) => (
                      <motion.div
                        key={exercise.id}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: index * ANIMATION.STAGGER_DELAY,
                        }}
                      >
                        <button
                          onClick={() => handleSelectExercise(exercise)}
                          className={`w-full text-left px-3 py-2 rounded-sm text-sm transition-colors ${
                            highlightedIndex === index
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {exercise.name}
                              </div>
                              {exercise.description && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {exercise.description}
                                </div>
                              )}
                            </div>
                            {value?.id === exercise.id && (
                              <CheckIcon className="h-4 w-4 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : showLoadingMessage ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    Carregando exercícios...
                  </div>
                ) : showNoResultsMessage ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum exercício encontrado
                  </div>
                ) : showNoExercisesMessage ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum exercício disponível
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PopoverContent>
    </Popover>
  );
}
