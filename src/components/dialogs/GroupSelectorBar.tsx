import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ANIMATION } from "@/config/constants";

export interface Group {
  id: string;
  name: string;
}

interface GroupSelectorBarProps {
  groups: Group[];
  activeGroupId: string;
  onSelectGroup: (groupId: string) => void;
  onAddGroup: () => void;
  onRemoveGroup: (groupId: string) => void;
  onRenameGroup?: (groupId: string, newName: string) => void;
  isLoading?: boolean;
}

const GroupSelectorBar = ({
  groups,
  activeGroupId,
  onSelectGroup,
  onAddGroup,
  onRemoveGroup,
  onRenameGroup,
  isLoading = false,
}: GroupSelectorBarProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Auto-scroll to active group when it changes
  useEffect(() => {
    if (activeButtonRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const button = activeButtonRef.current;

      const buttonOffsetLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;
      const containerWidth = container.clientWidth;
      const scrollLeft = container.scrollLeft;

      // Check if button is out of view
      if (buttonOffsetLeft < scrollLeft) {
        // Button is to the left, scroll left
        container.scrollTo({
          left: buttonOffsetLeft - 10,
          behavior: "smooth",
        });
      } else if (buttonOffsetLeft + buttonWidth > scrollLeft + containerWidth) {
        // Button is to the right, scroll right
        container.scrollTo({
          left: buttonOffsetLeft + buttonWidth - containerWidth + 10,
          behavior: "smooth",
        });
      }
    }
  }, [activeGroupId]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const hasScrollLeft = container.scrollLeft > 0;
    const hasScrollRight =
      container.scrollLeft < container.scrollWidth - container.clientWidth - 5;

    setShowLeftScroll(hasScrollLeft);
    setShowRightScroll(hasScrollRight);
  };

  // Initial scroll check
  useEffect(() => {
    handleScroll();
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 200;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

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
        >
          <AnimatePresence mode="popLayout">
            {groups.map((group, index) => {
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
                    onClick={() => onSelectGroup(group.id)}
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
        onClick={onAddGroup}
        disabled={isLoading || groups.length >= 15}
        title={groups.length >= 15 ? "Maximum 15 groups allowed" : "Add new group"}
      >
        <Plus className="h-4 w-4" />
      </Button>

      {/* Remove Group Button */}
      {groups.length > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onRemoveGroup(activeGroupId)}
          disabled={isLoading}
          title="Remove current group"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default GroupSelectorBar;
