/**
 * Planning page media — graded install still only (no hero video).
 * Poster-first LCP; reduced-motion stays on the still.
 */
export const PLANNING_HERO_IMAGE = {
  src: "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
  alt: "Workspace planning session with floor layout and furniture specification",
} as const;

export const PLANNING_HERO_MEDIA = {
  poster: PLANNING_HERO_IMAGE.src,
} as const;
