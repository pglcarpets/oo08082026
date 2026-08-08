/**
 * Prepare Studio furniture payload for disk catalog write:
 * server-render top_png from top_svg when present, quality-gate, checksum.
 */

import { authorizeStudioCatalogTopPng } from "@studio/server/authorizeStudioCatalogTopPng";
import { BadRequestError } from "@studio/server/studioStore";

export type FurnitureFootprintMm = {
  readonly width_mm: number;
  readonly depth_mm: number;
};

export type PreparedStudioFurnitureCatalogFiles = {
  readonly payload: Record<string, unknown>;
  readonly top_png_checksum: string | null;
};

/** Ensure top_svg is a data URL so {@link persistFurnitureFiles} can decode it. */
function normalizeTopSvgForPersist(topSvg: unknown): unknown {
  if (typeof topSvg !== "string" || !topSvg.trim()) return topSvg;
  if (topSvg.startsWith("data:")) return topSvg;
  // Raw markup from unit fixtures / non-browser callers — wrap for disk decode.
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(topSvg)}`;
}

/**
 * Mutates a shallow copy of `payload` so catalog `top_png` is server-authoritative
 * when SVG is present. Throws {@link BadRequestError} on quality/render failure.
 */
export async function prepareStudioFurnitureCatalogFiles(
  itemId: string,
  payload: Record<string, unknown>,
  footprint: FurnitureFootprintMm,
): Promise<PreparedStudioFurnitureCatalogFiles> {
  const auth = await authorizeStudioCatalogTopPng({
    itemId,
    topSvg: payload.top_svg,
    topPng: payload.top_png,
    widthMm: footprint.width_mm,
    depthMm: footprint.depth_mm,
  });

  if (auth.kind === "rejected") {
    throw new BadRequestError(auth.error);
  }

  if (auth.kind === "none") {
    return { payload, top_png_checksum: null };
  }

  const nextPayload: Record<string, unknown> = {
    ...payload,
    top_png: auth.topPngDataUrl,
  };
  if (typeof payload.top_svg === "string") {
    nextPayload.top_svg = normalizeTopSvgForPersist(payload.top_svg);
  }

  return {
    payload: nextPayload,
    top_png_checksum: auth.checksum,
  };
}

/** Read footprint mm from dimensions object or top-level width_mm/depth_mm. */
export function resolveFurnitureFootprintMm(
  payload: Record<string, unknown>,
): FurnitureFootprintMm {
  const dims =
    payload.dimensions &&
    typeof payload.dimensions === "object" &&
    !Array.isArray(payload.dimensions)
      ? (payload.dimensions as Record<string, unknown>)
      : null;

  const widthRaw = dims?.width_mm ?? payload.width_mm;
  const depthRaw = dims?.depth_mm ?? payload.depth_mm;

  return {
    width_mm: Number(widthRaw) || 0,
    depth_mm: Number(depthRaw) || 0,
  };
}
