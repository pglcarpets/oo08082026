/**
 * Career page media — graded install still only (tvs-patna graded poster).
 * Poster under 120 KB budget (`career-poster.webp`). No hero video.
 */
export const CAREER_HERO_IMAGE = {
  src: "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
  alt: "One&Only team at a workspace delivery in Patna",
} as const;

export const CAREER_HERO_MEDIA = {
  poster: CAREER_HERO_IMAGE.src,
} as const;
