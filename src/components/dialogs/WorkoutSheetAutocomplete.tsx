"use strict";

/**
 * File: WorkoutSheetAutocomplete.tsx
 * Description: Searchable autocomplete component for selecting workout sheets (exercise groups).
 * Provides debounced search, keyboard navigation, and optimistic loading of all available groups.
 * Responsibilities:
 *   - Fetch and display exercise groups from API with debounced search
 *   - Provide keyboard navigation (ArrowUp/ArrowDown/Enter/Escape)
 *   - Handle selection and clearing of workout sheets
 *   - Load all sheets on popover open for quick browsing
 *   - Display loading states and empty states appropriately
 * Called by:
 *   - TrainingScheduleDialog_Wizard.tsx (for workout assignment in 28-day schedule)
 *   - Any component needing exercise group selection
 * Notes:
 *   - Uses 500ms debounce delay from ANIMATION.DEBOUNCE_DELAY
 *   - Handles multiple API response formats (array, data.data, data.groups)
 *   - Client-side filtering after fetching all groups (API doesn't support search param)
 *   - Keyboard navigation with visual highlighting
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ChangeEvent, KeyboardEvent, MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckIcon, ChevronDown, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ANIMATION } from "@/config/constants";

/**
 * Represents a workout sheet (exercise group).
 */
interface WorkoutSheet {
  id: number;
  name: string;
  publicName?: string;
}

/**
 * Props for WorkoutSheetAutocomplete component.
 */
interface WorkoutSheetAutocompleteProps {
  /** Currently selected workout sheet or null */
  value: WorkoutSheet | null;
  /** Callback when selection changes */
  onChange: (sheet: WorkoutSheet | null) => void;
  /** Placeholder text for empty state */
  placeholder?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
}

/** Initial highlighted index value */
const NO_HIGHLIGHT = -1;

/**
 * Validates if a workout sheet has required properties.
 * @param sheet - Object to validate
 * @returns True if object is a valid WorkoutSheet
 */
function isValidWorkoutSheet(sheet: any): sheet is WorkoutSheet {
  return (
    sheet !== null &&
    typeof sheet === "object" &&
    typeof sheet.id === "number" &&
    typeof sheet.name === "string"
  );
}

/**
 * Extracts workout sheets array from various API response formats.
 * @param data - API response data
 * @returns Array of workout sheets
 */
function extractSheetsFromResponse(data: any): WorkoutSheet[] {
  if (Array.isArray(data)) {
    return data.filter(isValidWorkoutSheet);
  }

  if (data?.data && Array.isArray(data.data)) {
    return data.data.filter(isValidWorkoutSheet);
  }

  if (data?.groups && Array.isArray(data.groups)) {
    return data.groups.filter(isValidWorkoutSheet);
  }

  return [];
}

/**
 * Filters workout sheets by search query.
 * @param sheets - Array of workout sheets
 * @param query - Search query string
 * @returns Filtered array of sheets matching query
 */
function filterSheetsByQuery(sheets: WorkoutSheet[], query: string): WorkoutSheet[] {
  if (!query.trim()) {
    return sheets;
  }

  const queryLower = query.toLowerCase();

  return sheets.filter((sheet) => {
    const nameMatch = sheet.name.toLowerCase().includes(queryLower);
    const publicNameMatch = sheet.publicName?.toLowerCase().includes(queryLower) || false;
    return nameMatch || publicNameMatch;
  });
}

/**
 * Searchable autocomplete component for selecting workout sheets/exercise groups.
 * Features debounced search, keyboard navigation, and automatic loading on open.
 */
export function WorkoutSheetAutocomplete({
  value,
  onChange,
  placeholder = "Selecionar grupo de exercício...",
  disabled = false,
}: WorkoutSheetAutocompleteProps): JSX.Element {
  const [open, setOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [results, setResults] = useState<WorkoutSheet[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(NO_HIGHLIGHT);
  const { toast } = useToast();

  /**
   * Loads all workout sheets from API when popover opens.
   * Used for quick browsing without requiring search input.
   */
  const loadAllSheets = useCallback(async (): Promise<void> => {
    setIsSearching(true);
    
    try {
      const response = await fetch("/api/exercise-groups");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exercise groups: ${response.status}`);
      }

      const data = await response.json();
      const sheets = extractSheetsFromResponse(data);

      setResults(sheets);
      setHasSearched(true);
      setHighlightedIndex(NO_HIGHLIGHT);
    } catch (err) {
      console.error("Error loading sheets:", err);
      
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Erro",
        description: "Falha ao carregar grupos de exercício",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  /**
   * Performs search with client-side filtering after fetching all sheets.
   * Resets results if query is empty.
   * @param query - Search query string
   */
  const performSearch = useCallback(async (query: string): Promise<void> => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setResults([]);
      setHasSearched(false);
      setHighlightedIndex(NO_HIGHLIGHT);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch("/api/exercise-groups");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exercise groups: ${response.status}`);
      }

      const data = await response.json();
      const sheets = extractSheetsFromResponse(data);
      const filtered = filterSheetsByQuery(sheets, trimmedQuery);

      setResults(filtered);
      setHasSearched(true);
      setHighlightedIndex(NO_HIGHLIGHT);
    } catch (err) {
      console.error("Search error:", err);
      
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Erro",
        description: "Falha ao buscar grupos de exercício",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  /**
   * Handles input change with debounce to avoid excessive API calls.
   * @param e - Input change event
   */
  function handleInputChange(e: ChangeEvent<HTMLInputElement>): void {
    const newValue = e.target.value;
    setInputValue(newValue);
    setOpen(true);

    // Clear existing debounce timer
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      performSearch(newValue);
    }, ANIMATION.DEBOUNCE_DELAY);
  }

  /**
   * Handles keyboard navigation and selection.
   * @param e - Keyboard event
   */
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    // If popover is closed or no results, only handle Enter to open
    if (!open || results.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
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
          const selectedSheet = results[highlightedIndex];
          if (selectedSheet) {
            handleSelectSheet(selectedSheet);
          }
        }
        break;

      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;

      default:
        // No action for other keys
        break;
    }
  }

  /**
   * Handles selection of a workout sheet.
   * @param sheet - Selected workout sheet
   */
  function handleSelectSheet(sheet: WorkoutSheet): void {
    if (!isValidWorkoutSheet(sheet)) {
      console.warn("Invalid workout sheet selected:", sheet);
      return;
    }

    onChange(sheet);
    setInputValue("");
    setResults([]);
    setOpen(false);
    setHasSearched(false);
    setHighlightedIndex(NO_HIGHLIGHT);
  }

  /**
   * Handles clearing the current selection.
   * @param e - Mouse click event
   */
  function handleClear(e: MouseEvent<SVGSVGElement>): void {
    e.stopPropagation();
    onChange(null);
    setInputValue("");
    setResults([]);
    setHasSearched(false);
    setHighlightedIndex(NO_HIGHLIGHT);
  }

  /**
   * Closes popover when a value is selected.
   */
  useEffect(
    function closeOnSelection(): void {
      if (value !== null) {
        setOpen(false);
      }
    },
    [value]
  );

  /**
   * Cleanup debounce timer on unmount to prevent memory leaks.
   */
  useEffect(
    function cleanupTimer(): () => void {
      return (): void => {
        if (debounceTimerRef.current !== null) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
      };
    },
    []
  );

  /**
   * Handles popover open/close state changes.
   * Loads all sheets when opening without a search query.
   * @param isOpen - New open state
   */
  function handleOpenChange(isOpen: boolean): void {
    setOpen(isOpen);
    
    if (isOpen && !inputValue.trim()) {
      loadAllSheets();
    }
  }

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
              <span className="text-sm text-muted-foreground">{placeholder}</span>
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
                    {results.map((sheet, index) => (
                      <motion.div
                        key={sheet.id}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * ANIMATION.STAGGER_DELAY }}
                      >
                        <button
                          onClick={() => handleSelectSheet(sheet)}
                          className={`w-full text-left px-3 py-2 rounded-sm text-sm transition-colors ${
                            highlightedIndex === index
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {sheet.name}
                              </div>
                              {sheet.publicName && sheet.publicName !== sheet.name && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {sheet.publicName}
                                </div>
                              )}
                            </div>
                            {value?.id === sheet.id && (
                              <CheckIcon className="h-4 w-4 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : hasSearched && inputValue.trim() !== "" ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum grupo encontrado
                  </div>
                ) : !hasSearched && inputValue.trim() === "" ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    Carregando grupos de exercício...
                  </div>
                ) : hasSearched && inputValue.trim() === "" && results.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum grupo de exercício disponível
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
