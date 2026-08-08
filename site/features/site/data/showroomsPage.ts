/**
 * Showrooms page media — graded install still (video loops removed).
 * Poster under 120 KB (`showrooms-poster.webp`); distinct crop from contact.
 */
export const SHOWROOMS_HERO_IMAGE = {
  src: "/assets/marketing/hero/pages/Other3-oneandonly-bright.webp",
  alt: "One&Only Patna showroom and workspace installation",
} as const;

export const SHOWROOMS_HERO_MEDIA = {
  poster: SHOWROOMS_HERO_IMAGE.src,
} as const;
