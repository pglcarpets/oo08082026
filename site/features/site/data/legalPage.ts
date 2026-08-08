/**
 * Legal route hero media — graded service install still.
 * Shared across privacy, terms, and refund policy for visual parity.
 * Hero video loops removed — poster-only LCP.
 */
export const LEGAL_HERO_IMAGE = {
  src: "/assets/marketing/hero/pages/solutions-oneandonly-bright.webp",
  alt: "Office installation and workspace planning by One&Only",
} as const;

/** Graded hero still (video loops removed). */
export const LEGAL_HERO_MEDIA = {
  poster: LEGAL_HERO_IMAGE.src,
} as const;
