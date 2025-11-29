"use strict";

/**
 * File: Navbar.tsx
 * Description: Main navigation bar component for the application header.
 * Displays logo, menu toggle, notifications, user profile menu, and authentication controls.
 * Responsibilities:
 *   - Render fixed navigation bar with scroll-based styling
 *   - Handle mobile drawer toggle for authenticated users
 *   - Display user profile dropdown with name, email, and logout
 *   - Show notifications dropdown (currently empty state)
 *   - Provide login button for unauthenticated users
 *   - Animate header entrance with smooth transitions
 *   - Calculate and display user initials from name or email
 *   - Handle logout flow with redirect to login page
 * Called by:
 *   - Layout.tsx (renders navbar at top of all pages)
 * Notes:
 *   - Fixed position at top with z-index 50
 *   - Scroll threshold is 20px before style change
 *   - Transparent mode available for landing pages
 *   - User initials fallback: name → email → "TT"
 *   - All dropdown menus align to the right edge
 *   - Logo is clickable only when authenticated
 */

import ProfileDialog from "@/components/profile/ProfileDialog";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { Menu, Bell, User, LogOut, CheckCircle2 } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Props for the Navbar component.
 */
interface NavbarProps {
  /** Function to toggle the mobile drawer open/closed */
  toggleDrawer: () => void;
  /** Whether the user is authenticated */
  isAuthenticated?: boolean;
  /** Whether the navbar should be transparent (for landing pages) */
  transparent?: boolean;
}

/** Scroll position threshold (in pixels) to trigger navbar style change */
const SCROLL_THRESHOLD = 20;

/** Default display name when user name is not available */
const DEFAULT_DISPLAY_NAME = "Usuário";

/** Default email when user email is not available */
const DEFAULT_EMAIL = "usuario@exemplo.com";

/** Fallback initials when no user data is available */
const FALLBACK_INITIALS = "TT";

/** Maximum number of name parts to use for initials */
const MAX_INITIAL_PARTS = 2;

/** Spring animation configuration for smooth transitions */
const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

/** Header entrance animation configuration */
const HEADER_ANIMATION = {
  ...SPRING_CONFIG,
  duration: 0.4,
};

/**
 * Validates if a string is non-empty after trimming.
 * @param value - String to validate
 * @returns True if string is valid and non-empty
 */
function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Safely extracts initials from a name string.
 * Takes first letter of first two words.
 * @param name - Full name string
 * @returns Two-letter uppercase initials
 */
function getInitialsFromName(name: string): string {
  if (!isValidString(name)) {
    return FALLBACK_INITIALS;
  }

  const parts = name.trim().split(" ").filter(isValidString);

  if (parts.length === 0) {
    return FALLBACK_INITIALS;
  }

  const initials = parts
    .slice(0, MAX_INITIAL_PARTS)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return initials.length > 0 ? initials : FALLBACK_INITIALS;
}

/**
 * Safely extracts first letter from email address.
 * @param email - Email address string
 * @returns Single uppercase letter
 */
function getInitialFromEmail(email: string): string {
  if (!isValidString(email)) {
    return FALLBACK_INITIALS;
  }

  const firstChar = email.trim().charAt(0).toUpperCase();
  return firstChar.length > 0 ? firstChar : FALLBACK_INITIALS;
}

/**
 * Calculates user initials with fallback logic.
 * Priority: name initials → email initial → "TT"
 * @param userName - User's full name (optional)
 * @param userEmail - User's email address (optional)
 * @returns Two-letter initials or fallback
 */
function calculateUserInitials(
  userName: string | null | undefined,
  userEmail: string | null | undefined
): string {
  if (isValidString(userName)) {
    return getInitialsFromName(userName);
  }

  if (isValidString(userEmail)) {
    return getInitialFromEmail(userEmail);
  }

  return FALLBACK_INITIALS;
}

/**
 * Validates if scroll position exceeds threshold.
 * @param scrollY - Current scroll position
 * @returns True if scrolled beyond threshold
 */
function hasScrolledBeyondThreshold(scrollY: number): boolean {
  return typeof scrollY === "number" && !isNaN(scrollY) && scrollY > SCROLL_THRESHOLD;
}

/**
 * Main navigation bar component.
 * Displays logo, user menu, notifications, and authentication controls.
 */
export function Navbar({
  toggleDrawer,
  isAuthenticated = false,
  transparent = false,
}: NavbarProps): JSX.Element {
  const router = useRouter();
  const [scrolled, setScrolled] = useState<boolean>(false);
  const { data: session } = useSession();
  const user = session?.user;

  // Extract user information with safe fallbacks
  const displayName = isValidString(user?.name) ? user.name : DEFAULT_DISPLAY_NAME;
  const displayEmail = isValidString(user?.email) ? user.email : DEFAULT_EMAIL;
  const initials = calculateUserInitials(user?.name, user?.email);

  /**
   * Sets up scroll event listener to track scroll position.
   * Updates navbar styling when scroll exceeds threshold.
   */
  useEffect(
    function setupScrollListener(): () => void {
      if (typeof window === "undefined") {
        return (): void => {};
      }

      function handleScroll(): void {
        const isScrolled = hasScrolledBeyondThreshold(window.scrollY);
        setScrolled(isScrolled);
      }

      window.addEventListener("scroll", handleScroll, { passive: true });

      return (): void => {
        window.removeEventListener("scroll", handleScroll);
      };
    },
    []
  );

  /**
   * Handles user logout with redirect to login page.
   * Async operation with error safety.
   */
  async function handleLogout(): Promise<void> {
    try {
      await signOut({ redirect: true, callbackUrl: "/login" });
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback: force redirect even if signOut fails
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  /**
   * Handles logo click navigation to home page.
   * Only navigates if user is authenticated.
   */
  function handleLogoClick(): void {
    if (isAuthenticated && router) {
      router.push("/home").catch((error) => {
        console.error("Navigation to home failed:", error);
      });
    }
  }

  return (
    <motion.header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 px-4",
        {
          "bg-transparent": transparent && !scrolled,
          "bg-white/80 backdrop-blur-md shadow-sm": scrolled || !transparent,
        }
      )}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={HEADER_ANIMATION}
    >
      <div className="flex items-center justify-center w-full">
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDrawer}
                className="mr-2"
                aria-label="Toggle navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <motion.div
              className="font-bold text-xl text-primary tracking-tight cursor-pointer"
              onClick={handleLogoClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={SPRING_CONFIG}
              role="button"
              tabIndex={isAuthenticated ? 0 : -1}
              aria-label="Tay Training - Go to home"
            >
              Tay Training
            </motion.div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative"
                      aria-label="Open notifications"
                    >
                      <Bell className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80" align="end">
                    <DropdownMenuLabel className="font-semibold flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Notificações
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <CheckCircle2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Nenhuma notificação
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Você está em dia com tudo!
                      </p>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative"
                      aria-label="Open user menu"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {displayName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {displayEmail}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ProfileDialog />
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" /> Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                className="bg-primary hover:bg-primary/90 transition-all"
                onClick={(): void => {
                  router.push("/login").catch((error) => {
                    console.error("Navigation to login failed:", error);
                  });
                }}
                aria-label="Login to your account"
              >
                Entrar
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}

export default Navbar;
