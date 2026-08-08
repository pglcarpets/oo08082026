/**
 * PNG plan-symbol contract (Product Studio Phase 1).
 *
 * Single owner of scale, raster box math, public URL / storage key shapes,
 * and descriptor field names so publish (Phase 3) and consumers (Phase 2)
 * cannot drift. Pure module — no server-only imports.
 *
 * Locked: L12 (2 px/mm), L15 (field names), 00-start URL/storage shapes.
 * Padding: PLAN_SYMBOL_PAD_MM = 40 matches CatalogBlockPreview PREVIEW_PADDING
 * (not blocks2d blockToSvg PAD which includes chair clearance).
 */

import { z } from "zod";

/** Live plan-symbol raster scale (px per millimetre). */
export const PLAN_SYMBOL_PX_PER_MM = 2 as const;

/**
 * Transparent pad each side of the physical footprint (mm).
 * Raster box = core + 2 * pad * PLAN_SYMBOL_PX_PER_MM on each axis.
 */
export const PLAN_SYMBOL_PAD_MM = 40 as const;

/** Only mime allowed for live plan symbols. */
export const PLAN_SYMBOL_MIME = "image/png" as const;

/** Dev-disk / same-origin public catalog prefix. */
export const PNG_CATALOG_PUBLIC_PATH = "/png-catalog" as const;

/** Supabase `catalog-assets` key prefix (matches catalogAssetStorage). */
export const PLANNER_SYMBOLS_STORAGE_PREFIX = "planner-symbols" as const;

/** Descriptor field names (L15) — one public shape. */
export const PLAN_SYMBOL_PNG_FIELD = {
  url: "planSymbolPngUrl",
  checksum: "planSymbolPngChecksum",
  mime: "planSymbolMime",
} as const;

export type PlanSymbolPngMime = typeof PLAN_SYMBOL_MIME;

export type PlanSymbolRasterBox = {
  readonly widthMm: number;
  readonly depthMm: number;
  /** Core footprint in px (no pad). */
  readonly coreWidthPx: number;
  readonly coreHeightPx: number;
  /** Full raster including pad on all sides. */
  readonly rasterWidthPx: number;
  readonly rasterHeightPx: number;
  readonly padMm: number;
  readonly padPx: number;
  readonly pxPerMm: number;
};

/** Round footprint mm → core pixel box at locked scale. */
export function planSymbolCorePx(
  widthMm: number,
  depthMm: number,
): { readonly widthPx: number; readonly heightPx: number } {
  return {
    widthPx: Math.round(widthMm * PLAN_SYMBOL_PX_PER_MM),
    heightPx: Math.round(depthMm * PLAN_SYMBOL_PX_PER_MM),
  };
}

/** Pad in px at locked scale. */
export function planSymbolPadPx(padMm: number = PLAN_SYMBOL_PAD_MM): number {
  return Math.round(padMm * PLAN_SYMBOL_PX_PER_MM);
}

/**
 * Full raster dimensions: core + pad on each side.
 * Example: 1000×600 mm → core 2000×1200; with 40 mm pad → 2160×1360.
 */
export function planSymbolRasterBox(
  widthMm: number,
  depthMm: number,
  padMm: number = PLAN_SYMBOL_PAD_MM,
): PlanSymbolRasterBox {
  const core = planSymbolCorePx(widthMm, depthMm);
  const padPx = planSymbolPadPx(padMm);
  return {
    widthMm,
    depthMm,
    coreWidthPx: core.widthPx,
    coreHeightPx: core.heightPx,
    rasterWidthPx: core.widthPx + padPx * 2,
    rasterHeightPx: core.heightPx + padPx * 2,
    padMm,
    padPx,
    pxPerMm: PLAN_SYMBOL_PX_PER_MM,
  };
}

/** Dev mirror / same-origin public URL: `/png-catalog/{slug}.png`. */
export function buildPlanSymbolPngPublicUrl(slug: string): string {
  const safe = slug.trim();
  return `${PNG_CATALOG_PUBLIC_PATH}/${safe}.png`;
}

/**
 * Supabase object key: `planner-symbols/{slug}/symbol.png`.
 * Kept pure here so clients can recognize keys without importing server-only storage.
 */
export function plannerSymbolPngStorageKey(slug: string): string {
  return `${PLANNER_SYMBOLS_STORAGE_PREFIX}/${slug.trim()}/symbol.png`;
}

/** Optional additive PNG pointer fields on catalog descriptors (backward-compatible). */
export const PlanSymbolPngPointerFieldsSchema = z
  .object({
    planSymbolPngUrl: z.string().trim().min(1).optional(),
    planSymbolPngChecksum: z
      .string()
      .regex(/^[a-f0-9]{64}$/, "planSymbolPngChecksum must be sha256 hex")
      .optional(),
    planSymbolMime: z.literal(PLAN_SYMBOL_MIME).optional(),
  })
  .strict();

export type PlanSymbolPngPointerFields = z.infer<
  typeof PlanSymbolPngPointerFieldsSchema
>;
