// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import path from "node:path";
import { promises as fs } from "node:fs";
import sharp from "sharp";

import { planSymbolRasterBox } from "@/lib/catalog/planSymbolPngContract";
import {
  deleteFurnitureFiles,
  ensureStorageDirs,
  FURNITURE_DIR,
  loadFurniture,
  persistFurnitureFiles,
  writeFurniture,
  nowIso,
} from "@studio/server/studioStore";
import { prepareStudioFurnitureCatalogFiles } from "@studio/server/prepareStudioFurnitureCatalogFiles";

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
  <rect x="2" y="2" width="26" height="26" fill="#445" />
</svg>`;

/**
 * 09a exit evidence: prepared payload → disk PNG path + metadata checksum.
 * Mirrors Studio furniture POST catalog write without HTTP/auth.
 */
describe("studio catalog top_png server authority (persist path)", () => {
  const furnitureId = "f_test_server_png_auth";

  beforeAll(async () => {
    process.chdir(path.resolve(__dirname, "../../.."));
    await ensureStorageDirs();
  });

  afterAll(async () => {
    await deleteFurnitureFiles(furnitureId);
  });

  it("writes server-rendered top_png file and stores top_png_checksum on item JSON", async () => {
    const widthMm = 900;
    const depthMm = 500;
    const prepared = await prepareStudioFurnitureCatalogFiles(
      furnitureId,
      {
        name: "Server PNG Chair",
        top_svg: SAMPLE_SVG,
        top_png: "data:image/png;base64,aaaa", // ignored when SVG present after prepare
      },
      { width_mm: widthMm, depth_mm: depthMm },
    );

    expect(prepared.top_png_checksum).toMatch(/^[a-f0-9]{64}$/);

    const fileUrls = await persistFurnitureFiles(furnitureId, prepared.payload);
    expect(fileUrls.top_png_url).toBe(`/api/files/furniture/${furnitureId}_top.png`);
    expect(fileUrls.top_svg_url).toBe(`/api/files/furniture/${furnitureId}_top.svg`);

    const pngPath = path.join(FURNITURE_DIR, `${furnitureId}_top.png`);
    await expect(fs.access(pngPath)).resolves.toBeUndefined();
    const diskPng = await fs.readFile(pngPath);
    const box = planSymbolRasterBox(widthMm, depthMm);
    const meta = await sharp(diskPng).metadata();
    expect(meta.width).toBe(box.rasterWidthPx);
    expect(meta.height).toBe(box.rasterHeightPx);

    const now = nowIso();
    await writeFurniture({
      id: furnitureId,
      name: "Server PNG Chair",
      category: "Seating",
      dimensions: { width_mm: widthMm, depth_mm: depthMm, height_mm: 900 },
      top_png_url: fileUrls.top_png_url,
      top_svg_url: fileUrls.top_svg_url,
      top_png_checksum: prepared.top_png_checksum,
      is_custom: true,
      created_at: now,
      updated_at: now,
    });

    const loaded = await loadFurniture(furnitureId);
    expect(loaded?.top_png_url).toBe(fileUrls.top_png_url);
    expect(loaded?.top_png_checksum).toBe(prepared.top_png_checksum);
  });
});
