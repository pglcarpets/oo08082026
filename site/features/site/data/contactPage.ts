/**
 * Contact page hero — graded install still only (no video loop).
 * Poster recompressed to ≤120 KB (2026-07-23).
 */
export const CONTACT_HERO_IMAGE = {
  src: "/assets/marketing/hero/pages/contact-oneandonly-bright.webp",
  alt: "Corporate workspace installed by One&Only in Patna",
} as const;

export const CONTACT_HERO_MEDIA = {
  poster: CONTACT_HERO_IMAGE.src,
} as const;
