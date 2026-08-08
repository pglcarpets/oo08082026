/**
 * Service page media — graded install still (poster only; no hero video loop).
 */
export const SERVICE_HERO_IMAGE = {
  src: "/assets/marketing/hero/pages/solutions-oneandonly-bright.webp",
  alt: "Office installation and service by One&Only field team",
} as const;

export const SERVICE_HERO_MEDIA = {
  poster: SERVICE_HERO_IMAGE.src,
} as const;
