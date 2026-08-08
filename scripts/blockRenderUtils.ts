import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { resolveSvgForRaster } from "@/lib/catalog/resolveBlockColors";

const REPO = resolve(__dirname, "../..");

export const RASTER_BG = "var(--color-white-150)";
export const RASTER_DENSITY = 400;
const MAX_INPUT_PIXELS = 240_000_000;
const MAX_RASTER_DIM = 30_000;

const BLOCK_CSS_FILES = [
  "tokens.css",
  "tokens-wood.css",
  "tokens-metal.css",
  "tokens-fabric.css",
  "tokens-lighting.css",
  "tokens-primitives.css",
  "theme.css",
  "theme-premium-light.css",
  "workstations.css",
  "tables.css",
  "chairs.css",
  "storage.css",
  "soft-seating.css",
  "equipment.css",
  "accessories.css",
  "blocks2d.css",
] as const;

function stripImports(css: string): string {
  return css.replace(/^\s*@import\s+[^;]+;\s*/gm, "");
}

export function loadBlockCss(): string {
  const dir = resolve(REPO, "lib/catalog/styles");
  return BLOCK_CSS_FILES.map((f) => stripImports(readFileSync(resolve(dir, f), "utf8"))).join("\n");
}

export function styleTag(css: string): string {
  return `<style><![CDATA[${css}]]></style>`;
}

function parseSvgSize(svg: string): { w: number; h: number } {
  const viewBox = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (viewBox) return { w: Number(viewBox[1]), h: Number(viewBox[2]) };
  const width = svg.match(/\bwidth="([\d.]+)"/)?.[1];
  const height = svg.match(/\bheight="([\d.]+)"/)?.[1];
  return { w: Number(width ?? 1000), h: Number(height ?? 1000) };
}

function densityForSvg(svg: string, preferred = RASTER_DENSITY): number {
  const { w, h } = parseSvgSize(svg);
  let density = preferred;
  while (density > 36) {
    const pxW = Math.ceil((w / 72) * density);
    const pxH = Math.ceil((h / 72) * density);
    if (pxW <= MAX_RASTER_DIM && pxH <= MAX_RASTER_DIM && pxW * pxH <= MAX_INPUT_PIXELS) {
      return density;
    }
    density = Math.floor(density * 0.7);
  }
  return density;
}

export async function rasterizeSvg(
  svg: string,
  pngPath: string,
  width: number,
  css = loadBlockCss(),
  jpgPath?: string,
) {
  const clean = resolveSvgForRaster(svg, css);
  const density = densityForSvg(clean);
  let pipe = sharp(Buffer.from(clean), { density, limitInputPixels: false })
    .flatten({ background: RASTER_BG })
    .resize({ width, kernel: sharp.kernel.lanczos3, withoutEnlargement: false });

  await pipe.clone().png({ compressionLevel: 6, adaptiveFiltering: true }).toFile(pngPath);
  if (jpgPath) {
    await pipe.clone().jpeg({ quality: 94, mozjpeg: true }).toFile(jpgPath);
  }
}
