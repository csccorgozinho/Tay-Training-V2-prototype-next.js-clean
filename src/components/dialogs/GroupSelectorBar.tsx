"use strict";

/**
 * File: GroupSelectorBar.tsx
 * Description: Horizontal scrollable tab bar for selecting, adding, and removing exercise groups with auto-scroll and overflow indicators.
 * Responsibilities:
 *   - Render scrollable horizontal list of group tabs
 *   - Highlight active/selected group with visual styling
 *   - Auto-scroll to active group when selection changes
 *   - Show/hide left/right scroll buttons based on overflow state
 *   - Handle group selection via click
 *   - Provide add group button (max 15 groups)
 *   - Provide remove group button (minimum 1 group required)
 *   - Calculate scroll button visibility based on container dimensions
 *   - Animate group tabs with Framer Motion
 *   - Support loading state that disables all interactions
 * Called by:
 *   - src/components/dialogs/WorkoutSheetDialog.tsx (manages exercise groups in workout sheets)
 *   - Other dialog components that need group management
 * Notes:
 *   - Maximum 15 groups allowed (enforced on add button)
 *   - Minimum 1 group required (remove button hidden when only 1 group)
 *   - Auto-scrolls active group into view with smooth animation
 *   - Scroll buttons appear/disappear based on overflow detection
 *   - Uses ref forwarding for active button to enable auto-scroll
 *   - Responsive to window resize events for scroll calculation
 */

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ANIMATION } from "@/config/constants";

/**
 * Represents a group/tab in the selector bar.
 */
export interface Group {
  /** Unique identifier for the group */
  id: string;
  /** Display name for the group */
  name: string;
}

/**
 * Props for GroupSelectorBar component.
 */
interface GroupSelectorBarProps {
  /** Array of groups to display */
  groups: Group[];
  /** ID of the currently active group */
  activeGroupId: string;
  /** Callback when a group is selected */
  onSelectGroup: (groupId: string) => void;
  /** Callback when add group button is clicked */
  onAddGroup: () => void;
  /** Callback when remove group button is clicked */
  onRemoveGroup: (groupId: string) => void;
  /** Optional callback for renaming groups (not currently used) */
  onRenameGroup?: (groupId: string, newName: string) => void;
  /** Whether the component is in loading state */
  isLoading?: boolean;
}

/** Maximum number of groups allowed */
const MAX_GROUPS = 15;

/** Minimum number of groups required */
const MIN_GROUPS = 1;

/** Amount to scroll in pixels when using scroll buttons */
const SCROLL_AMOUNT = 200;

/** Padding around active button when auto-scrolling */
const SCROLL_PADDING = 10;

/** Tolerance for scroll right detection (accounts for rounding) */
const SCROLL_RIGHT_TOLERANCE = 5;

/**
 * Checks if element is scrolled to the left edge.
 *
 * @param element - HTML element to check
 * @returns true if scrolled past left edge
 */
function hasScrollLeft(element: HTMLElement): boolean {
  return element.scrollLeft > 0;
}

/**
 * Checks if element has scrollable content to the right.
 *
 * @param element - HTML element to check
 * @returns true if can scroll right
 */
function hasScrollRight(element: HTMLElement): boolean {
  const maxScrollLeft = element.scrollWidth - element.clientWidth;
  return element.scrollLeft < maxScrollLeft - SCROLL_RIGHT_TOLERANCE;
}

/**
 * Calculates if button is visible within container viewport.
 *
 * @param button - Button element to check
 * @param container - Container element
 * @returns Object with visibility flags for left and right
 */
function isButtonVisible(
  button: HTMLButtonElement,
  container: HTMLDivElement
): { isLeftVisible: boolean; isRightVisible: boolean } {
  const buttonOffsetLeft = button.offsetLeft;
  const buttonWidth = button.offsetWidth;
  const containerWidth = container.clientWidth;
  const scrollLeft = container.scrollLeft;

  const isLeftVisible = buttonOffsetLeft >= scrollLeft;
  const isRightVisible =
    buttonOffsetLeft + buttonWidth <= scrollLeft + containerWidth;

  return { isLeftVisible, isRightVisible };
}

/**
 * Scrolls container to make button visible.
 *
 * @param button - Button element to scroll to
 * @param container - Container element to scroll
 */
function scrollToButton(
  button: HTMLButtonElement,
  container: HTMLDivElement
): void {
  const { isLeftVisible, isRightVisible } = isButtonVisible(button, container);

  if (!isLeftVisible) {
    // Button is to the left, scroll left
    container.scrollTo({
      left: button.offsetLeft - SCROLL_PADDING,
      behavior: "smooth",
    });
  } else if (!isRightVisible) {
    // Button is to the right, scroll right
    const scrollTarget =
      button.offsetLeft + button.offsetWidth - container.clientWidth + SCROLL_PADDING;

    container.scrollTo({
      left: scrollTarget,
      behavior: "smooth",
    });
  }
}

/**
 * Group selector bar component.
 * Displays horizontal scrollable tabs for group selection.
 *
 * @param props - Component props
 * @returns JSX element containing the group selector bar
 */
function GroupSelectorBar({
  groups,
  activeGroupId,
  onSelectGroup,
  onAddGroup,
  onRemoveGroup,
  onRenameGroup,
  isLoading = false,
}: GroupSelectorBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState<boolean>(false);
  const [showRightScroll, setShowRightScroll] = useState<boolean>(false);

  /**
   * Auto-scrolls to active group button when selection changes.
   */
  useEffect(() => {
    if (!activeButtonRef.current || !scrollContainerRef.current) {
      return;
    }

    scrollToButton(activeButtonRef.current, scrollContainerRef.current);
  }, [activeGroupId]);

  /**
   * Updates scroll button visibility based on scroll position.
   */
  function handleScroll(): void {
    if (!scrollContainerRef.current) {
      return;
    }

    const container = scrollContainerRef.current;
    setShowLeftScroll(hasScrollLeft(container));
    setShowRightScroll(hasScrollRight(container));
  }

  /**
   * Sets up scroll detection and resize listener.
   */
  useEffect(() => {
    handleScroll();

    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  /**
   * Scrolls container in specified direction.
   *
   * @param direction - Direction to scroll (left or right)
   */
  function scroll(direction: "left" | "right"): void {
    if (!scrollContainerRef.current) {
      return;
    }

    const scrollDelta = direction === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT;

    scrollContainerRef.current.scrollBy({
      left: scrollDelta,
      behavior: "smooth",
    });
  }

  /**
   * Handles group selection click.
   *
   * @param groupId - ID of group to select
   */
  function handleSelectGroup(groupId: string): void {
    if (isLoading) {
      return;
    }

    onSelectGroup(groupId);
  }

  /**
   * Handles add group button click.
   */
  function handleAddGroup(): void {
    if (isLoading || groups.length >= MAX_GROUPS) {
      return;
    }

    onAddGroup();
  }

  /**
   * Handles remove group button click.
   */
  function handleRemoveGroup(): void {
    if (isLoading || groups.length <= MIN_GROUPS) {
      return;
    }

    onRemoveGroup(activeGroupId);
  }

  // Compute flags
  const canAddGroup = groups.length < MAX_GROUPS;
  const canRemoveGroup = groups.length > MIN_GROUPS;
  const addButtonTitle = canAddGroup
    ? "Add new group"
    : `Maximum ${MAX_GROUPS} groups allowed`;

  return (
    <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-lg border border-border/50">
      {/* Left Scroll Button */}
      <AnimatePresence>
        {showLeftScroll && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: ANIMATION.TRANSITION_DURATION }}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => scroll("left")}
              disabled={isLoading}
              aria-label="Scroll left"
            >
              <span className="text-xs">←</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable Container */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-1 overflow-x-auto scrollbar-hide scroll-smooth"
          role="tablist"
          aria-label="Group selector"
        >
          <AnimatePresence mode="popLayout">
            {groups.map((group) => {
              const isActive = group.id === activeGroupId;

              return (
                <motion.div
                  key={group.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: ANIMATION.TRANSITION_DURATION }}
                  className="flex-shrink-0"
                >
                  <button
                    ref={isActive ? activeButtonRef : null}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleSelectGroup(group.id)}
                    disabled={isLoading}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap",
                      "border-b-2 relative",
                      isActive
                        ? "bg-primary/10 text-primary border-b-primary font-semibold shadow-sm"
                        : "bg-transparent text-muted-foreground border-b-transparent hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {group.name}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Scroll Button */}
      <AnimatePresence>
        {showRightScroll && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: ANIMATION.TRANSITION_DURATION }}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => scroll("right")}
              disabled={isLoading}
              aria-label="Scroll right"
            >
              <span className="text-xs">→</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Group Button */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 flex-shrink-0"
        onClick={handleAddGroup}
        disabled={isLoading || !canAddGroup}
        title={addButtonTitle}
        aria-label={addButtonTitle}
      >
        <Plus className="h-4 w-4" />
      </Button>

      {/* Remove Group Button */}
      {canRemoveGroup && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleRemoveGroup}
          disabled={isLoading}
          title="Remove current group"
          aria-label="Remove current group"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default GroupSelectorBar;
