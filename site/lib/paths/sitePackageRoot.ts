import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Resolve the `site/` package root whether process.cwd() is the monorepo root
 * or the Next.js package directory (pnpm --filter oando-site).
 */
function looksLikeSiteRoot(dir: string): boolean {
  // Fork uses capital Planner/Studio; accept either marker + focss.
  return (
    existsSync(path.join(dir, "focss")) &&
    (existsSync(path.join(dir, "features", "Planner")) ||
      existsSync(path.join(dir, "features", "planner")) ||
      existsSync(path.join(dir, "features", "Studio")) ||
      existsSync(path.join(dir, "app")))
  );
}

export function resolveSitePackageRoot(): string {
  const cwd = process.cwd();
  if (looksLikeSiteRoot(cwd)) {
    return cwd;
  }
  const nested = path.join(cwd, "site");
  if (looksLikeSiteRoot(nested)) {
    return nested;
  }
  // Prefer nested site/ when cwd is monorepo root without markers.
  return nested;
}

export function resolveBlockDescriptorsDir(): string {
  return path.join(resolveSitePackageRoot(), "inventory", "descriptors");
}

/** @deprecated Use resolveBlockDescriptorsDir — legacy path name for docs and migrations. */
export const BLOCK_DESCRIPTORS_DIR_SEGMENT = "inventory/descriptors" as const;

export function resolvePublicDir(): string {
  return path.join(resolveSitePackageRoot(), "public");
}

/**
 * Non-product static trees under `public/assets/others/` (5th major domain).
 * Product media lives in marketing/catalog/planner/studio.
 */
export function resolveOthersAssetsDir(): string {
  return path.join(resolvePublicDir(), "assets", "others");
}

/** Disk segments under `assets/others/legacy/` (old public root trees). */
export type PublicLegacyCatalogSegment =
  | "svg-catalog"
  | "png-catalog"
  | "catalog-assets"
  | "cdn"
  | "fallback"
  | "images"
  | "media"
  | "products"
  | "Studio"
  | "svgcanvas"
  | "models"
  | "_unused";

export function resolveLegacyPublicDir(segment: PublicLegacyCatalogSegment): string {
  return path.join(resolveOthersAssetsDir(), "legacy", segment);
}

/** Disk: `public/assets/others/legacy/svg-catalog` (public URL still `/svg-catalog` via rewrite). */
export function resolveSvgCatalogDir(): string {
  return resolveLegacyPublicDir("svg-catalog");
}

/** Disk: `public/assets/others/legacy/png-catalog` (public URL still `/png-catalog` via rewrite). */
export function resolvePngCatalogDir(): string {
  return resolveLegacyPublicDir("png-catalog");
}