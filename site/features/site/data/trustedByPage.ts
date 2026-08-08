/**
 * Trusted-by page media — graded install still (usha poster; distinct from dmrc routes).
 * Hero video loops removed — poster-only LCP.
 */
export const TRUSTED_BY_HERO_IMAGE = {
  src: "/assets/marketing/hero/pages/Other3-oneandonly-bright.webp",
  alt: "Institutional workspace delivery by One&Only",
} as const;

/** Graded hero still (video loops removed). */
export const TRUSTED_BY_HERO_MEDIA = {
  poster: TRUSTED_BY_HERO_IMAGE.src,
} as const;

export const TRUSTED_BY_PALETTE_SWATCHES = [
  { label: "Ecru paper", token: "--color-ecru-50", hex: "#F7F4EE" },
  { label: "Bronze accent", token: "--color-bronze-400", hex: "#9D876C" },
  { label: "Dark ink", token: "--surface-inverse", hex: "#070D12" },
] as const;
