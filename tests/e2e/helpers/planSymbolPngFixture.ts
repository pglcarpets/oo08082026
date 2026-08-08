/**
 * Contract-sized PNG plan-symbol fixtures for Product Studio e2e.
 *
 * The publish quality gate checks the PNG signature and the decoded pixel box
 * against `planSymbolRasterBox(widthMm, depthMm)` (±1 px), so e2e uploads have
 * to be generated at the locked 2 px/mm scale + 40 mm pad — not hand-picked art.
 */

import { mkdtempSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";

import sharp from "sharp";

import { planSymbolRasterBox } from "@/lib/catalog/planSymbolPngContract";

export type PlanSymbolPngFixture = {
  readonly filePath: string;
  readonly bytes: Buffer;
  readonly widthPx: number;
  readonly heightPx: number;
};

/**
 * Render a transparent-padded plan symbol PNG for `widthMm × depthMm`.
 *
 * The core footprint is drawn as an opaque rounded rectangle so a painted
 * symbol is visually distinguishable from the Block2D fallback on the canvas.
 */
export async function createPlanSymbolPngFixture(
  slug: string,
  widthMm: number,
  depthMm: number,
): Promise<PlanSymbolPngFixture> {
  const box = planSymbolRasterBox(widthMm, depthMm);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${box.rasterWidthPx}" height="${box.rasterHeightPx}">`,
    `<rect x="${box.padPx}" y="${box.padPx}" width="${box.coreWidthPx}" height="${box.coreHeightPx}" rx="24" fill="#8a8680" stroke="#2c2a28" stroke-width="12"/>`,
    `</svg>`,
  ].join("");

  const bytes = await sharp(Buffer.from(svg))
    .resize(box.rasterWidthPx, box.rasterHeightPx, {
      fit: "fill",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const dir = mkdtempSync(path.join(os.tmpdir(), "plan-symbol-png-"));
  const filePath = path.join(dir, `${slug}.png`);
  writeFileSync(filePath, bytes);

  return {
    filePath,
    bytes,
    widthPx: box.rasterWidthPx,
    heightPx: box.rasterHeightPx,
  };
}
