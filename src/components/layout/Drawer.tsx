"use strict";

/**
 * File: Drawer.tsx
 * Description: Mobile-responsive navigation drawer component for the application.
 * Provides a slide-out menu with animated navigation items and route awareness.
 * Responsibilities:
 *   - Render mobile navigation drawer with menu items
 *   - Handle navigation between pages (Exercises, Methods, Workout Sheets, Training Schedule)
 *   - Display active route highlighting
 *   - Provide smooth animations for drawer open/close and menu items
 *   - Auto-close drawer after navigation
 * Called by:
 *   - Layout components (Header.tsx or main layout wrapper)
 *   - Any component needing mobile navigation menu
 * Notes:
 *   - Uses Sheet component from shadcn/ui for drawer behavior
 *   - Framer Motion for animations (list stagger, chevron rotation)
 *   - Automatically closes after navigation selection
 *   - Active route detection based on router.asPath
 *   - 280px width for optimal mobile experience
 */

import * as React from "react";
import type { MouseEvent } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Dumbbell,
  ClipboardList,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { listContainer, listItem } from "@/lib/motion-variants";

/**
 * Props for Drawer component.
 */
interface DrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback when drawer open state changes */
  onOpenChange: (open: boolean) => void;
}

/**
 * Represents a navigation menu item.
 */
interface MenuItem {
  /** Display name of the menu item */
  name: string;
  /** Route path for navigation */
  path: string;
  /** Icon component for the menu item */
  icon: LucideIcon;
}

/** Navigation menu items for the drawer */
const DRAWER_MENU_ITEMS: readonly MenuItem[] = [
  { name: "Exercícios", path: "/exercises", icon: Dumbbell },
  { name: "Métodos de Treino", path: "/methods", icon: ClipboardList },
  { name: "Fichas de Treino", path: "/workout-sheets", icon: Layers },
  { name: "Agenda de Treino", path: "/training-schedule", icon: Calendar },
] as const;

/** Drawer width in pixels */
const DRAWER_WIDTH = 280;

/** Animation delays in seconds */
const ANIMATION_DELAYS = {
  HEADER: 0.1,
  FOOTER: 0.3,
} as const;

/** Chevron animation configuration */
const CHEVRON_ANIMATION = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
} as const;

/**
 * Validates if a path string is non-empty.
 * @param path - Path string to validate
 * @returns True if path is valid
 */
function isValidPath(path: string): boolean {
  return typeof path === "string" && path.length > 0;
}

/**
 * Mobile navigation drawer component with animated menu items.
 * Provides slide-out navigation with active route highlighting.
 */
export function Drawer({ open, onOpenChange }: DrawerProps): JSX.Element {
  const router = useRouter();

  /**
   * Handles navigation to a specific path and closes the drawer.
   * Validates path before navigation.
   * @param path - Target route path
   */
  function handleNavigation(path: string): void {
    if (!isValidPath(path)) {
      console.warn("Invalid navigation path:", path);
      return;
    }

    router.push(path);
    onOpenChange(false);
  }

  /**
   * Checks if a given path matches the current route.
   * @param path - Path to check
   * @returns True if path is active
   */
  function isActivePath(path: string): boolean {
    return router.asPath === path;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger />
      <SheetContent
        side="left"
        className="p-0 w-[280px] border-r h-full flex flex-col"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <motion.div
            className="border-b py-6 px-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: ANIMATION_DELAYS.HEADER }}
          >
            <h2 className="text-xl font-semibold text-primary">Tay Training</h2>
          </motion.div>

          {/* Navigation Menu */}
          <motion.nav
            className="flex-1 py-4 overflow-y-auto"
            variants={listContainer}
            initial="hidden"
            animate="visible"
          >
            <ul className="space-y-1 px-2">
              {DRAWER_MENU_ITEMS.map((item) => {
                const isActive = isActivePath(item.path);
                const Icon = item.icon;

                return (
                  <motion.li key={item.path} variants={listItem}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-left font-normal px-4 py-6 h-auto",
                        isActive && "bg-primary/10 text-primary font-medium"
                      )}
                      onClick={() => handleNavigation(item.path)}
                      aria-label={`Navegar para ${item.name}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 mr-3",
                          isActive && "text-primary"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                      <motion.div
                        className="ml-auto"
                        animate={{ rotate: isActive ? 90 : 0 }}
                        transition={CHEVRON_ANIMATION}
                      >
                        <ChevronRight
                          className={cn("h-4 w-4", isActive && "text-primary")}
                          aria-hidden="true"
                        />
                      </motion.div>
                    </Button>
                  </motion.li>
                );
              })}
            </ul>
          </motion.nav>

          {/* Footer */}
          <motion.div
            className="border-t p-4 mt-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ANIMATION_DELAYS.FOOTER }}
          >
            <div className="pink-glass rounded-lg p-4 text-center">
              <p className="text-sm text-primary font-semibold">
                Tay Training v2
              </p>
              <p className="text-xs text-muted-foreground">© 2023</p>
            </div>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default Drawer;
