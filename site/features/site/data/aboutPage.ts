/**
 * About page media — executed install photography.
 * Poster under 120 KB budget (`titan-patna-hero.webp`).
 */
export const ABOUT_HERO_IMAGE = {
  src: "/assets/marketing/hero/slides/Titan-Oneandonly-bright.webp",
  alt: "Titan corporate workspace installed by One&Only in Patna",
} as const;

/** Distinct from hero poster — premium workspace still (not ceiling duct crop). */
export const ABOUT_STORY_IMAGE = {
  src: "/assets/marketing/hero/pages/about-oneandonly-bright.webp",
  alt: "Bright workspace overlooking the city — One&Only delivery context",
} as const;

/** Graded hero still (video loops removed). */
export const ABOUT_HERO_MEDIA = {
  poster: ABOUT_HERO_IMAGE.src,
} as const;
