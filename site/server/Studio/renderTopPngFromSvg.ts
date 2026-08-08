/**
 * Server-side Studio catalog top_png raster from top_svg.
 *
 * Source of truth for catalog authority: SVG → sharp → PNG at the locked
 * plan-symbol contract box (2 px/mm + 40 mm pad). Pure of furniture I/O.
 */

import sharp from "sharp";

import { planSymbolRasterBox } from "@/lib/catalog/planSymbolPngContract";

/** Max footprint edge (mm) for guest catalog raster — DoS cap. */
export const STUDIO_TOP_PNG_MAX_FOOTPRINT_MM = 20_000 as const;

/** Max raster edge (px) after plan-symbol pad — hard cap before sharp. */
export const STUDIO_TOP_PNG_MAX_RASTER_EDGE_PX = 8_192 as const;

/** Max SVG markup size (bytes, UTF-8) accepted before sharp. */
export const STUDIO_TOP_PNG_MAX_SVG_BYTES = 2 * 1024 * 1024;

/** Finite sharp input pixel budget (edge²-ish upper bound). */
export const STUDIO_TOP_PNG_LIMIT_INPUT_PIXELS =
  STUDIO_TOP_PNG_MAX_RASTER_EDGE_PX * STUDIO_TOP_PNG_MAX_RASTER_EDGE_PX;

/**
 * Normalize Studio client SVG payloads (raw markup or data: URL) to markup.
 */
export function svgMarkupFromInput(input: string): string {
  const trimmed = (input ?? "").trim();
  if (!trimmed) {
    throw new Error("Expected non-empty SVG markup or data URL");
  }

  if (!trimmed.startsWith("data:")) {
    return trimmed;
  }

  const comma = trimmed.indexOf(",");
  if (comma < 0) {
    throw new Error("Malformed SVG data URL");
  }

  const header = trimmed.slice(0, comma);
  const encoded = trimmed.slice(comma + 1);

  if (!header.includes("image/svg+xml") && !header.includes("svg")) {
    throw new Error("Expected image/svg+xml data URL");
  }

  if (header.includes(";base64")) {
    return Buffer.from(encoded, "base64").toString("utf8");
  }

  return decodeURIComponent(encoded);
}

function assertPositiveFootprint(widthMm: number, depthMm: number): void {
  if (!Number.isFinite(widthMm) || widthMm <= 0) {
    throw new Error(`Invalid footprint width_mm: ${widthMm}`);
  }
  if (!Number.isFinite(depthMm) || depthMm <= 0) {
    throw new Error(`Invalid footprint depth_mm: ${depthMm}`);
  }
}

function assertFootprintWithinCatalogCaps(widthMm: number, depthMm: number): void {
  if (widthMm > STUDIO_TOP_PNG_MAX_FOOTPRINT_MM) {
    throw new Error(
      `footprint width_mm too large: ${widthMm} (max ${STUDIO_TOP_PNG_MAX_FOOTPRINT_MM})`,
    );
  }
  if (depthMm > STUDIO_TOP_PNG_MAX_FOOTPRINT_MM) {
    throw new Error(
      `footprint depth_mm too large: ${depthMm} (max ${STUDIO_TOP_PNG_MAX_FOOTPRINT_MM})`,
    );
  }

  const box = planSymbolRasterBox(widthMm, depthMm);
  if (
    box.rasterWidthPx > STUDIO_TOP_PNG_MAX_RASTER_EDGE_PX ||
    box.rasterHeightPx > STUDIO_TOP_PNG_MAX_RASTER_EDGE_PX
  ) {
    throw new Error(
      `raster edge too large: ${box.rasterWidthPx}x${box.rasterHeightPx}px ` +
        `(max edge ${STUDIO_TOP_PNG_MAX_RASTER_EDGE_PX} px)`,
    );
  }
}

/**
 * Rasterize SVG to a contract-sized PNG buffer for catalog write.
 */
export async function renderTopPngFromSvg(
  svgInput: string,
  widthMm: number,
  depthMm: number,
): Promise<Buffer> {
  assertPositiveFootprint(widthMm, depthMm);
  assertFootprintWithinCatalogCaps(widthMm, depthMm);
  const markup = svgMarkupFromInput(svgInput);

  if (Buffer.byteLength(markup, "utf8") > STUDIO_TOP_PNG_MAX_SVG_BYTES) {
    throw new Error(
      `oversized SVG markup: exceeds ${STUDIO_TOP_PNG_MAX_SVG_BYTES} bytes limit`,
    );
  }

  const box = planSymbolRasterBox(widthMm, depthMm);

  return sharp(Buffer.from(markup, "utf8"), {
    density: 144,
    limitInputPixels: STUDIO_TOP_PNG_LIMIT_INPUT_PIXELS,
  })
    .resize(box.rasterWidthPx, box.rasterHeightPx, {
      fit: "fill",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 8 })
    .toBuffer();
}
