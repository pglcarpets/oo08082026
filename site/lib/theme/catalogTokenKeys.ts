/**
 * CSS variables owned by lib/catalog/styles + blocks2d.ts.
 * Remote theme presets from /api/theme/active must never inject these.
 */
export const CATALOG_BLOCK_TOKEN_KEYS = new Set([
  "block-surface",
  "block-surface-grad-end",
  "block-surface-stroke",
  "block-seat",
  "block-seat-stroke",
  "block-seat-contour",
  "block-seat-backrest",
  "block-seat-backrest-stroke",
  "block-armrest",
  "block-armrest-soft",
  "block-caster-base",
  "block-caster-spoke",
  "block-caster-wheel",
  "block-sofa",
  "block-sofa-stroke",
  "block-sofa-arm",
  "block-sofa-seam",
  "block-panel",
  "block-panel-grad-start",
  "block-glyph",
  "block-glyph-dark",
  "block-screen-grad-start",
  "block-screen-grad-end",
  "block-shadow-color",
  "block-storage",
  "block-storage-stroke",
  "block-storage-grad-start",
  "block-plant-base",
  "block-plant-dark",
  "block-plant-outline",
  "block-pot-base",
  "block-equip-white",
  "block-equip-gray",
  "block-equip-dark",
]);

/** UI chrome tokens the active-theme API may inject (not catalog block geometry). */
export const UI_THEME_TOKEN_KEYS = [
  "block-surface-alt",
  "block-border",
  "block-text",
  "block-text-muted",
  "block-accent",
  "block-accent-hover",
  "block-radius",
  "block-shadow",
  "block-font-display",
  "block-font-body",
] as const;

export function stripCatalogTokens(
  tokens: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tokens).filter(
      ([key]) => !CATALOG_BLOCK_TOKEN_KEYS.has(key.replace(/^--/, "")),
    ),
  );
}
