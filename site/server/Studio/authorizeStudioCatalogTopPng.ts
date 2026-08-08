/**
 * Catalog PNG authority for Studio furniture writes.
 *
 * When top_svg is present, server-render PNG via sharp (SVG is source of truth).
 * Otherwise quality-gate client top_png. Always checksum accepted bytes.
 */

import { assertPlanSymbolPngQuality } from "@/lib/catalog/publish/planSymbolPngQualityGate";
import { checksumPngBuffer } from "@/lib/catalog/publish/pngPublishChecksum";
import { decodeDataUrl } from "@studio/server/studioStore";
import { renderTopPngFromSvg } from "@studio/server/renderTopPngFromSvg";

export type StudioCatalogTopPngAuth =
  | { kind: "none" }
  | {
      kind: "accepted";
      png: Buffer;
      checksum: string;
      topPngDataUrl: string;
    }
  | { kind: "rejected"; error: string };

export type AuthorizeStudioCatalogTopPngInput = {
  readonly itemId: string;
  readonly topSvg?: unknown;
  readonly topPng?: unknown;
  readonly widthMm: number;
  readonly depthMm: number;
};

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t ? t : null;
}

function toPngDataUrl(png: Buffer): string {
  return `data:image/png;base64,${png.toString("base64")}`;
}

async function gateAndChecksum(
  png: Buffer,
  itemId: string,
  widthMm: number,
  depthMm: number,
): Promise<StudioCatalogTopPngAuth> {
  const quality = await assertPlanSymbolPngQuality(png, {
    slug: itemId,
    widthMm,
    depthMm,
  });
  if (!quality.ok) {
    return {
      kind: "rejected",
      error: `Substandard plan-symbol PNG rejected: ${quality.error}`,
    };
  }

  try {
    const { checksum } = checksumPngBuffer(png);
    return {
      kind: "accepted",
      png,
      checksum,
      topPngDataUrl: toPngDataUrl(png),
    };
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return { kind: "rejected", error: details };
  }
}

function assertPositiveFootprintAuth(
  widthMm: number,
  depthMm: number,
): StudioCatalogTopPngAuth | null {
  if (!Number.isFinite(widthMm) || widthMm <= 0) {
    return {
      kind: "rejected",
      error: `Invalid footprint width_mm: ${widthMm} (must be finite and positive)`,
    };
  }
  if (!Number.isFinite(depthMm) || depthMm <= 0) {
    return {
      kind: "rejected",
      error: `Invalid footprint depth_mm: ${depthMm} (must be finite and positive)`,
    };
  }
  return null;
}

/**
 * Authorize catalog top_png bytes for a furniture create/update write.
 *
 * Preference: server-render from top_svg when present; else client top_png.
 */
export async function authorizeStudioCatalogTopPng(
  input: AuthorizeStudioCatalogTopPngInput,
): Promise<StudioCatalogTopPngAuth> {
  const topSvg = asNonEmptyString(input.topSvg);
  const topPng = asNonEmptyString(input.topPng);

  if (!topSvg && !topPng) {
    return { kind: "none" };
  }

  // Fail closed on non-positive / non-finite mm for both SVG and client PNG paths.
  const footprintReject = assertPositiveFootprintAuth(input.widthMm, input.depthMm);
  if (footprintReject) {
    return footprintReject;
  }

  let png: Buffer;

  if (topSvg) {
    try {
      png = await renderTopPngFromSvg(topSvg, input.widthMm, input.depthMm);
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      return {
        kind: "rejected",
        error: `Server PNG render from top_svg failed: ${details}`,
      };
    }
  } else {
    try {
      const decoded = decodeDataUrl(topPng!);
      png = decoded.raw;
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      return {
        kind: "rejected",
        error: `Invalid top_png data URL: ${details}`,
      };
    }
  }

  return gateAndChecksum(png, input.itemId, input.widthMm, input.depthMm);
}
