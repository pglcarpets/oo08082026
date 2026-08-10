import type { Transition, Variants } from "framer-motion";
import { useReducedMotion } from "framer-motion";

export const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

/** Durations in seconds — UI ≈150–400ms; one-shot reveal ≤900ms. */
export const MOTION_TOKENS = {
  fast: 0.26,
  base: 0.36,
  medium: 0.48,
  slow: 0.72,
  distanceSm: 10,
  distanceMd: 16,
  distanceLg: 28,
} as const;

export function fadeUp(distance: number = MOTION_TOKENS.distanceMd, delay = 0): {
  initial: { opacity: number; y: number };
  whileInView: { opacity: number; y: number };
  viewport: { once: true; amount: number };
  transition: Transition;
} {
  return {
    initial: { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: MOTION_TOKENS.slow, delay, ease: MOTION_EASE },
  };
}

/** Mount reveal — for footer blocks where whileInView may never fire at page bottom. */
export function fadeUpMount(distance: number = MOTION_TOKENS.distanceMd, delay = 0): {
  initial: { opacity: number; y: number };
  animate: { opacity: number; y: number };
  transition: Transition;
} {
  return {
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: { duration: MOTION_TOKENS.slow, delay, ease: MOTION_EASE },
  };
}

/**
 * Marketing reveals stay on even when OS has prefers-reduced-motion.
 * Large parallax/scrub still gated in GSAP helpers — not here.
 * Returning {} previously left some callers without whileInView targets.
 */
export function useFadeUp(
  distance: number = MOTION_TOKENS.distanceMd,
  delay = 0,
): ReturnType<typeof fadeUp> {
  return fadeUp(distance, delay);
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: MOTION_TOKENS.distanceMd },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_TOKENS.medium,
      ease: MOTION_EASE,
    },
  },
};

/** Stagger reveals for marketing sections — always run (see useFadeUp). */
export function useStaggerMotion(): {
  container: Variants;
  item: Variants;
  initial: "hidden" | false;
  whileInView: "visible" | undefined;
} {
  return {
    container: staggerContainer,
    item: staggerItem,
    initial: "hidden",
    whileInView: "visible",
  };
}

export const panelEnter: Transition = {
  duration: MOTION_TOKENS.medium,
  ease: MOTION_EASE,
};

export const drawerTransition: Transition = {
  duration: MOTION_TOKENS.base,
  ease: MOTION_EASE,
};

export const hoverLift = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -4,
    scale: 1.01,
    transition: {
      duration: MOTION_TOKENS.fast,
      ease: MOTION_EASE,
    },
  },
} as const;

export const filterSwap: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_TOKENS.base,
      ease: MOTION_EASE,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: MOTION_TOKENS.fast,
      ease: MOTION_EASE,
    },
  },
};

export const marqueeKeyframes = {
  left: "marquee-left 90s linear infinite",
  right: "marquee-right 90s linear infinite",
} as const;

/**
 * Returns hover/tap props that are nulled-out when the user has
 * `prefers-reduced-motion: reduce`. Use to wrap framer-motion
 * `whileHover` / `whileTap` props so they degrade gracefully.
 *
 * Example:
 *   const { whileHover, whileTap } = useMotionSafeHover({ y: -3 }, { y: 0 });
 *   <motion.div whileHover={whileHover} whileTap={whileTap} />
 */
export function useMotionSafeHover<H extends object, T extends object>(
  hover: H,
  tap?: T,
): {
  whileHover: H | undefined;
  whileTap: T | undefined;
} {
  const reduce = useReducedMotion();
  return {
    whileHover: reduce ? undefined : hover,
    whileTap: reduce ? undefined : tap,
  };
}
