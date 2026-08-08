/**
 * Marketing surfaces (cards, PDP gallery, category tiles) prefer photography.
 * Plan-symbol SVGs belong in planner/admin — not as hero substitutes.
 */

import { isProductCatalogMediaPath } from "@/lib/catalog/site/catalogProductFilters";

const MARKETING_IMAGE_SKIP_PATTERNS = [
  /assets_placeholder/i,
  /\/assets\/marketing\/fallback\//i,
  /\.svg$/i,
] as const;

/** True when path is suitable for marketing photography (not line SVG / placeholders). */
export function isUsableMarketingImage(path: string): boolean {
  const value = path.trim();
  if (!value) {return false;}
  if (!isProductCatalogMediaPath(value)) {return false;}
  return !MARKETING_IMAGE_SKIP_PATTERNS.some((pattern) => pattern.test(value));
}

/** Deduped list preferring photos over line SVG and placeholder assets. */
export function preferMarketingImages(paths: readonly string[]): string[] {
  const unique = Array.from(
    new Set(paths.map((p) => p.trim()).filter(Boolean)),
  );
  const preferred = unique.filter(isUsableMarketingImage);
  return preferred.length > 0 ? preferred : unique;
}

/** First usable marketing image from candidates, or first raw fallback. */
export function pickMarketingImage(
  ...candidates: readonly (string | null | undefined)[]
): string {
  const ordered = candidates
    .map((c) => (typeof c === "string" ? c.trim() : ""))
    .filter(Boolean);
  const preferred = ordered.filter(isUsableMarketingImage);
  return preferred[0] ?? ordered[0] ?? "";
}

const CATALOG_TILE_PATTERN = /\/images\/catalog\/oando-/i;

/**
 * Category hub tiles prefer `/assets/catalog/oando-*` photography over loose
 * `/assets/catalog/products/*` paths (often stale CMS exports or missing on CDN).
 */
export function pickCategoryTileImage(
  candidates: readonly string[],
  catalogFallback?: string,
): string {
  const normalized = preferMarketingImages(candidates);
  const catalogPreferred = normalized.filter((path) => CATALOG_TILE_PATTERN.test(path));
  if (catalogPreferred.length > 0) {return catalogPreferred[0];}
  const fallback = catalogFallback?.trim();
  if (fallback) {return fallback;}
  return normalized[0] ?? "";
}
