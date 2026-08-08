/**
 * Downloads / Resource Desk — graded install still only
 * (not shared dmrc stock; not catalog PDP truth). No hero video.
 */
export const DOWNLOADS_HERO_IMAGE = {
  src: "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp",
  alt: "One&Only workspace documentation and specification review in Patna",
} as const;

/** Graded poster — LCP still; motion is GSAP parallax/copy, not a video loop. */
export const DOWNLOADS_HERO_MEDIA = {
  poster: DOWNLOADS_HERO_IMAGE.src,
} as const;

export const DOWNLOADS_CRAFT = {
  quote: "Send the brief. We curate the latest pack — not a stale public PDF shelf.",
  attribution: "Resource Desk · One&Only",
} as const;
