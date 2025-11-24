"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckIcon, ChevronDown, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ANIMATION } from "@/config/constants";

interface WorkoutSheet {
  id: number;
  name: string;
  publicName?: string;
}

interface WorkoutSheetAutocompleteProps {
  value: WorkoutSheet | null;
  onChange: (sheet: WorkoutSheet | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function WorkoutSheetAutocomplete({
  value,
  onChange,
  placeholder = "Selecionar grupo de exercício...",
  disabled = false,
}: WorkoutSheetAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<WorkoutSheet[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const { toast } = useToast();

  // Load all results when popover opens
  const loadAllSheets = useCallback(async () => {
    setIsSearching(true);
    try {
      const response = await fetch("/api/exercise-groups");
      if (!response.ok) {
        throw new Error("Failed to fetch exercise groups");
      }

      const data = await response.json();
      let groups = [];
      if (Array.isArray(data)) {
        groups = data;
      } else if (data?.data && Array.isArray(data.data)) {
        groups = data.data;
      } else if (data?.groups && Array.isArray(data.groups)) {
        groups = data.groups;
      }

      setResults(groups);
      setHasSearched(true);
      setHighlightedIndex(-1);
    } catch (err) {
      console.error("Error loading sheets:", err);
      toast({
        title: "Erro",
        description: "Falha ao carregar grupos de exercício",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setHighlightedIndex(-1);
      return;
    }

    setIsSearching(true);
    try {
      // Use the exercise-groups endpoint which already handles search/filtering
      const response = await fetch("/api/exercise-groups");
      if (!response.ok) {
        throw new Error("Failed to fetch exercise groups");
      }

      const data = await response.json();
      let groups = [];
      if (Array.isArray(data)) {
        groups = data;
      } else if (data?.data && Array.isArray(data.data)) {
        groups = data.data;
      } else if (data?.groups && Array.isArray(data.groups)) {
        groups = data.groups;
      }

      // Filter by the search query (case-insensitive)
      const queryLower = query.toLowerCase();
      const filtered = groups.filter(
        (group: WorkoutSheet) =>
          group.name.toLowerCase().includes(queryLower) ||
          group.publicName?.toLowerCase().includes(queryLower)
      );

      setResults(filtered);
      setHasSearched(true);
      setHighlightedIndex(-1);
    } catch (err) {
      console.error("Search error:", err);
      toast({
        title: "Erro",
        description: "Falha ao buscar grupos de exercício",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setOpen(true);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      performSearch(newValue);
    }, ANIMATION.DEBOUNCE_DELAY);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
          handleSelectSheet(results[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  // Handle sheet selection
  const handleSelectSheet = (sheet: WorkoutSheet) => {
    onChange(sheet);
    setInputValue("");
    setResults([]);
    setOpen(false);
    setHasSearched(false);
    setHighlightedIndex(-1);
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    onChange(null);
    setInputValue("");
    setResults([]);
    setHasSearched(false);
    setHighlightedIndex(-1);
  };

  // Close popover when value changes
  useEffect(() => {
    if (value) {
      setOpen(false);
    }
  }, [value]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen && !inputValue.trim()) {
        // Load all sheets when opening without search query
        loadAllSheets();
      }
    }}>
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
                ) : hasSearched && inputValue.trim() ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum grupo encontrado
                  </div>
                ) : inputValue.trim() === "" && !hasSearched ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    Carregando grupos de exercício...
                  </div>
                ) : inputValue.trim() === "" && hasSearched && results.length === 0 ? (
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
