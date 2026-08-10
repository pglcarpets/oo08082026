import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let pluginsRegistered = false;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Register GSAP plugins once (client-safe). */
export function registerGsapPlugins(): void {
  if (pluginsRegistered || typeof window === "undefined") {
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  pluginsRegistered = true;
}

/** Honor `prefers-reduced-motion: reduce` (parallax/scrub only). */
export function gsapReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** `useSyncExternalStore` subscription for reduced-motion preference. */
export function subscribeGsapReducedMotion(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

/** SSR snapshot: assume motion allowed so first paint is not frozen off. */
export function gsapReducedMotionServerSnapshot(): boolean {
  return false;
}

export const GSAP_EASE_OUT = "power3.out";
export const GSAP_EASE_IN_OUT = "power2.inOut";

export const GSAP_REVEAL = {
  y: 28,
  opacity: 0,
  duration: 0.85,
  stagger: 0.11,
} as const;

export const GSAP_SCROLL_REVEAL = {
  y: 32,
  opacity: 0,
  duration: 0.75,
  stagger: 0.09,
} as const;
