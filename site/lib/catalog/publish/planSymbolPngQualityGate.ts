/**
 * Post-upload quality gate for PNG plan symbols before storage publish.
 *
 * Hard fail: empty bytes, invalid PNG signature, dimension mismatch vs contract.
 * Result dialect — never throws for quality fails.
 */

import sharp, { type Metadata } from "sharp";

import { planSymbolRasterBox } from "@/lib/catalog/planSymbolPngContract";

export type PlanSymbolPngQualityResult =
  | { ok: true }
  | { ok: false; error: string };

export type PlanSymbolPngQualityContext = {
  readonly slug: string;
  readonly widthMm: number;
  readonly depthMm: number;
};

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function hasPngSignature(png: Buffer): boolean {
  if (png.length < PNG_SIGNATURE.length) {
    return false;
  }
  return png.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
}

/**
 * Validate PNG upload bytes against footprint mm raster contract (±1 px).
 */
export async function assertPlanSymbolPngQuality(
  png: Buffer,
  ctx: PlanSymbolPngQualityContext,
): Promise<PlanSymbolPngQualityResult> {
  if (!Buffer.isBuffer(png) || png.length === 0) {
    return { ok: false, error: `empty png for ${ctx.slug}` };
  }

  if (!hasPngSignature(png)) {
    return { ok: false, error: `invalid png signature for ${ctx.slug}` };
  }

  let metadata: Metadata;
  try {
    metadata = await sharp(png).metadata();
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: `png decode failed for ${ctx.slug}: ${details}`,
    };
  }

  const widthPx = metadata.width ?? 0;
  const heightPx = metadata.height ?? 0;
  const expected = planSymbolRasterBox(ctx.widthMm, ctx.depthMm);

  if (
    Math.abs(widthPx - expected.rasterWidthPx) > 1 ||
    Math.abs(heightPx - expected.rasterHeightPx) > 1
  ) {
    return {
      ok: false,
      error:
        `png dimensions mismatch for ${ctx.slug}: got ${widthPx}x${heightPx}, ` +
        `expected ${expected.rasterWidthPx}x${expected.rasterHeightPx} (±1 px)`,
    };
  }

  return { ok: true };
}
