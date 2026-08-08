import { describe, expect, it, beforeAll, afterAll } from "vitest";
import path from "node:path";
import { promises as fs } from "node:fs";
import {
  ensureStorageDirs,
  FURNITURE_DIR,
  listFurnitureFromDisk,
  writeFurniture,
  loadFurniture,
  deleteFurnitureFiles,
  nowIso,
  thumbnailFromPng,
} from "@studio/server/studioStore";
import { ensureFurnitureSeeded } from "@studio/server/studioFurnitureSeed";
import {
  extractJson,
  normalizeCategory,
  normalizeDimensions,
} from "@studio/lib/studioAiLlm";
import { DEFAULT_AI_DIMENSIONS_MM } from "@studio/lib/studioTokens";

describe("studioStore (furniture library)", () => {
  const furnitureId = "f_test_unit_studio";

  beforeAll(async () => {
    process.chdir(path.resolve(__dirname, "../../.."));
    await ensureStorageDirs();
  });

  afterAll(async () => {
    await deleteFurnitureFiles(furnitureId);
  });

  it("seeds default furniture from seed-furniture.json", async () => {
    await ensureFurnitureSeeded();
    const items = await listFurnitureFromDisk();
    expect(items.some((i) => String(i.id).startsWith("seed_"))).toBe(true);
  });

  it("writes and loads furniture", async () => {
    const now = nowIso();
    await writeFurniture({
      id: furnitureId,
      name: "Unit Chair",
      category: "Seating",
      dimensions: { width_mm: 600, depth_mm: 600, height_mm: 900 },
      tags: ["test"],
      is_custom: true,
      created_at: now,
      updated_at: now,
    });
    const loaded = await loadFurniture(furnitureId);
    expect(loaded?.name).toBe("Unit Chair");
    await expect(
      fs.access(path.join(FURNITURE_DIR, `${furnitureId}.json`)),
    ).resolves.toBeUndefined();
  });

  it("sorts stock furniture ahead of custom items", async () => {
    const items = await listFurnitureFromDisk();
    const firstCustom = items.findIndex((i) => i.is_custom === true);
    const lastStock = items.map((i) => i.is_custom === true).lastIndexOf(false);
    if (firstCustom !== -1 && lastStock !== -1) {
      expect(lastStock).toBeLessThan(firstCustom);
    }
  });

  it("thumbnails png with sharp", async () => {
    // 1x1 PNG
    const tiny = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const out = await thumbnailFromPng(tiny, 240);
    expect(out.length).toBeGreaterThan(10);
  });
});

describe("studio aiLlm helpers", () => {
  it("extractJson strips fences", () => {
    const data = extractJson('```json\n{"name":"Chair","category":"Seating"}\n```');
    expect(data.name).toBe("Chair");
  });

  it("normalizeCategory / dimensions", () => {
    expect(normalizeCategory("Desks")).toBe("Desks");
    expect(normalizeCategory("Nope")).toBe("Custom");
    expect(
      normalizeDimensions(
        { width_mm: 1200, depth_mm: 800, height_mm: 750 },
        DEFAULT_AI_DIMENSIONS_MM,
      ),
    ).toEqual({
      width_mm: 1200,
      depth_mm: 800,
      height_mm: 750,
    });
  });
});
