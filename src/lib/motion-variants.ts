/**
 * Centralized motion variants library for consistent animations across the application.
 * Uses framer-motion spring physics and easing curves inspired by Linear, Vercel, and Notion.
 * 
 * Modern animation principles:
 * - Spring animations for natural feel (stiffness: 300-500, damping: 25-35)
 * - Cubic bezier easing for smooth curves
 * - Staggered children for list animations
 * - Micro-interactions for buttons, cards, and hover states
 * - Performance optimized with will-change CSS
 * 
 * Naming convention: {type}_{direction}_{target}
 * Example: fade_up_in, scale_down_out, slide_left_in
 */

import { Variants, Transition } from 'framer-motion';

/**
 * TIMING CONSTANTS - Reusable transitions for consistency
 */
const spring = {
  tight: { type: 'spring' as const, stiffness: 500, damping: 30 },
  normal: { type: 'spring' as const, stiffness: 400, damping: 30 },
  smooth: { type: 'spring' as const, stiffness: 300, damping: 25 },
  relaxed: { type: 'spring' as const, stiffness: 250, damping: 20 },
};

const easing = {
  easeOut: [0.16, 1, 0.3, 1],
  easeIn: [0.7, 0, 1, 0.3],
  easeInOut: [0.4, 0, 0.2, 1],
  smooth: [0.34, 1.56, 0.64, 1],
};

/**
 * ENTRANCE ANIMATIONS
 * Used when elements first appear or enter the viewport
 */

export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut' as any,
    },
  },
};

export const fadeUpIn: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ...spring.normal,
    },
  },
};

export const fadeDownIn: Variants = {
  hidden: {
    opacity: 0,
    y: -16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ...spring.normal,
    },
  },
};

export const fadeLeftIn: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ...spring.normal,
    },
  },
};

export const fadeRightIn: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ...spring.normal,
    },
  },
};

export const scaleUpIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ...spring.normal,
    },
  },
};

export const scaleDownIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 1.12,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ...spring.normal,
    },
  },
};

export const popIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.6,
    rotate: -10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.4,
      ...spring.tight,
    },
  },
};

/**
 * SMOOTH VARIANTS - Cubic bezier for silky animations
 */
export const smoothFadeUpIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut' as any,
    },
  },
};

export const smoothScaleUpIn: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut' as any,
    },
  },
};

/**
 * EXIT ANIMATIONS
 * Used when elements are removed or hidden from view
 */

export const fadeOut: Variants = {
  hidden: {
    opacity: 1,
  },
  visible: {
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: 'easeIn' as any,
    },
  },
};

export const fadeUpOut: Variants = {
  hidden: {
    opacity: 1,
    y: 0,
  },
  visible: {
    opacity: 0,
    y: 16,
    transition: {
      duration: 0.3,
      ease: 'easeIn' as any,
    },
  },
};

export const fadeDownOut: Variants = {
  hidden: {
    opacity: 1,
    y: 0,
  },
  visible: {
    opacity: 0,
    y: -16,
    transition: {
      duration: 0.3,
      ease: 'easeIn' as any,
    },
  },
};

export const scaleDownOut: Variants = {
  hidden: {
    opacity: 1,
    scale: 1,
  },
  visible: {
    opacity: 0,
    scale: 0.85,
    transition: {
      duration: 0.3,
      ease: 'easeIn' as any,
    },
  },
};

export const popOut: Variants = {
  hidden: {
    opacity: 1,
    scale: 1,
  },
  visible: {
    opacity: 0,
    scale: 0.6,
    transition: {
      duration: 0.25,
      ease: 'easeIn' as any,
    },
  },
};

/**
 * HOVER & INTERACTION STATES
 * Subtle micro-interactions for modern feel
 */

export const hoverScale = {
  scale: 1.04,
  transition: {
    duration: 0.25,
    ...spring.normal,
  },
};

export const hoverScaleSmall = {
  scale: 1.02,
  transition: {
    duration: 0.25,
    ...spring.normal,
  },
};

export const hoverScaleTiny = {
  scale: 1.01,
  transition: {
    duration: 0.2,
    ...spring.normal,
  },
};

export const hoverLift = {
  y: -4,
  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
  transition: {
    duration: 0.25,
    ...spring.normal,
  },
};

export const hoverLiftSmall = {
  y: -2,
  boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
  transition: {
    duration: 0.25,
    ...spring.normal,
  },
};

export const hoverTilt = {
  y: -3,
  transition: {
    duration: 0.25,
    ...spring.normal,
  },
};

export const hoverGlow = {
  boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
  transition: {
    duration: 0.3,
    ...spring.normal,
  },
};

/**
 * TAP/PRESS ANIMATIONS
 */
export const tapScale = {
  scale: 0.94,
  transition: {
    duration: 0.1,
  },
};

export const tapScaleSmall = {
  scale: 0.97,
  transition: {
    duration: 0.1,
  },
};

export const tapDepress = {
  y: 2,
  transition: {
    duration: 0.1,
  },
};

/**
 * LIST ANIMATIONS
 * Used for animating list items with staggered effect
 */

export const listContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

export const listItem: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ...spring.normal,
    },
  },
  exit: {
    opacity: 0,
    y: -16,
    transition: {
      duration: 0.3,
    },
  },
};

export const listItemFadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
    },
  },
};

/**
 * GRID/CARD ANIMATIONS
 * For card grids with staggered entrance
 */
export const gridContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const gridItem: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ...spring.normal,
    },
  },
};

/**
 * DROPDOWN & MENU ANIMATIONS
 * Enhanced alternatives to default animations
 */

export const dropdownIn: Variants = {
  hidden: {
    opacity: 0,
    y: -12,
    scale: 0.92,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ...spring.tight,
    },
  },
};

export const dropdownOut: Variants = {
  hidden: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  visible: {
    opacity: 0,
    y: -12,
    scale: 0.92,
    transition: {
      duration: 0.15,
      ease: 'easeIn' as any,
    },
  },
};

export const menuSlideIn: Variants = {
  hidden: {
    opacity: 0,
    x: -16,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ...spring.normal,
    },
  },
};

export const menuSlideOut: Variants = {
  hidden: {
    opacity: 1,
    x: 0,
  },
  visible: {
    opacity: 0,
    x: -16,
    transition: {
      duration: 0.2,
      ease: 'easeIn' as any,
    },
  },
};

/**
 * DIALOG/MODAL ANIMATIONS
 * Smooth enter/exit for modals and overlays
 */

export const overlayFadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export const modalSlideUpIn: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.93,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ...spring.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: 40,
    scale: 0.93,
    transition: {
      duration: 0.25,
      ease: 'easeIn' as any,
    },
  },
};

export const modalSlideUpOut: Variants = {
  hidden: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  visible: {
    opacity: 0,
    y: 40,
    scale: 0.93,
    transition: {
      duration: 0.25,
    },
  },
};

export const dialogScaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.35,
      ...spring.smooth,
    },
  },
};

/**
 * LOADING & PROGRESS ANIMATIONS
 */

export const spinnerRotate: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1.2,
      repeat: Infinity,
      repeatType: 'loop' as const,
      ease: 'linear',
    },
  },
};

export const spinnerRotateFast: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 0.8,
      repeat: Infinity,
      repeatType: 'loop' as const,
      ease: 'linear',
    },
  },
};

export const pulse: Variants = {
  animate: {
    opacity: [1, 0.5, 1],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      repeatType: 'loop' as const,
      ease: 'easeInOut',
    },
  },
};

export const pulseFast: Variants = {
  animate: {
    opacity: [1, 0.4, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'loop' as const,
      ease: 'easeInOut',
    },
  },
};

export const shimmer: Variants = {
  animate: {
    backgroundPosition: ['200% 0%', '-200% 0%'],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: 'loop' as const,
    },
  },
};

/**
 * SKELETON & PLACEHOLDER ANIMATIONS
 */

export const skeletonPulse: Variants = {
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 1.8,
      repeat: Infinity,
      repeatType: 'loop' as const,
      ease: 'easeInOut',
    },
  },
};

export const skeletonShimmer: Variants = {
  animate: {
    backgroundPosition: ['1000% 0', '-1000% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: 'loop' as const,
      ease: 'linear',
    },
  },
};

/**
 * CONTAINER ANIMATIONS for AnimatePresence
 */

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

/**
 * BADGE & TAG ANIMATIONS
 */

export const badgeScaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
    rotate: -180,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.35,
      ...spring.tight,
    },
  },
};

export const badgePulseIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ...spring.normal,
    },
  },
};

/**
 * ATTENTION SEEKING ANIMATIONS
 * Subtle animations to draw user attention
 */

export const wiggle: Variants = {
  animate: {
    rotate: [-1, 1.5, -1.5, 1, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 4,
    },
  },
};

export const bounce: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.7,
      repeat: Infinity,
      repeatDelay: 2.5,
      ease: 'easeInOut',
    },
  },
};

export const float: Variants = {
  animate: {
    y: [0, -6, 0],
    transition: {
      duration: 3.5,
      repeat: Infinity,
      repeatType: 'loop' as const,
      ease: 'easeInOut',
    },
  },
};

/**
 * TAB/ACCORDION ANIMATIONS
 */

export const tabSlideIn: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ...spring.normal,
    },
  },
};

export const accordionSlideDown: Variants = {
  hidden: {
    opacity: 0,
    height: 0,
  },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      duration: 0.3,
      ...spring.normal,
    },
  },
};

/**
 * UTILITY FUNCTION: Create staggered animation for lists
 */
export const createStaggerVariants = (
  itemCount: number,
  staggerDelay = 0.06
): { container: Variants; item: Variants } => ({
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.08,
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        ...spring.normal,
      },
    },
  },
});

/**
 * UTILITY FUNCTION: Create delay-based variants for sequential animations
 */
export const createDelayedVariants = (
  delay: number
): Variants => ({
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay,
      ...spring.normal,
    },
  },
});

/**
 * UTILITY FUNCTION: Create grid animation variants
 */
export const createGridVariants = (
  columnCount: number
): { container: Variants; item: Variants } => ({
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.1,
      },
    },
  },
  item: {
    hidden: { opacity: 0, scale: 0.85, y: 24 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ...spring.normal,
      },
    },
  },
});
