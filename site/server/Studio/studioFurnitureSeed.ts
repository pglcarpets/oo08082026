import path from "node:path";
import { promises as fs } from "node:fs";
import {
  FURNITURE_DIR,
  ensureStorageDirs,
  nowIso,
  writeBytes,
  writeFurniture,
} from "@studio/server/studioStore";
import { getFurnitureCatalogMode } from "@/lib/catalog/furnitureCatalogMode";

/**
 * Materialise the default furniture library from the Studio's seed spec.
 * The Studio owns catalog writes and seeding, so both the spec and this loader
 * live on the Studio side; the Planner reads the resulting files through its own
 * read-only catalog handler.
 */

type SeedSpec = {
  id: string;
  name: string;
  category: string;
  subcategory?: string | null;
  tags?: string[];
  dimensions: { width_mm: number; depth_mm: number; height_mm: number };
  notes?: string | null;
  svg: string;
};

let seeded = false;

/**
 * Materialise the disk seed library.
 *
 * Disk mode only. In supabase mode the library lives in
 * `public.furniture_catalog`, seeded once at deploy time by
 * `pnpm run seed:furniture` — a GET handler must not write, and on a read-only
 * production filesystem these writes cannot succeed anyway.
 */
export async function ensureFurnitureSeeded(): Promise<void> {
  if (seeded) return;
  if (getFurnitureCatalogMode() !== "disk") {
    seeded = true;
    return;
  }
  await ensureStorageDirs();
  const seedPath = path.join(
    process.cwd(),
    "site",
    "platform",
    "Studio",
    "data",
    "seed-furniture.json",
  );
  let specs: SeedSpec[] = [];
  try {
    const raw = await fs.readFile(seedPath, "utf8");
    specs = JSON.parse(raw) as SeedSpec[];
  } catch {
    seeded = true;
    return;
  }
  for (const spec of specs) {
    const metaPath = path.join(FURNITURE_DIR, `${spec.id}.json`);
    try {
      await fs.access(metaPath);
      continue;
    } catch {
      /* create */
    }
    const now = nowIso();
    const svgPath = path.join(FURNITURE_DIR, `${spec.id}_top.svg`);
    await writeBytes(svgPath, Buffer.from(spec.svg, "utf8"));
    const item = {
      id: spec.id,
      name: spec.name,
      category: spec.category,
      subcategory: spec.subcategory ?? null,
      tags: spec.tags ?? [],
      dimensions: spec.dimensions,
      notes: spec.notes ?? null,
      is_custom: false,
      thumbnail_url: `/api/files/furniture/${spec.id}_top.svg`,
      top_png_url: null,
      top_svg_url: `/api/files/furniture/${spec.id}_top.svg`,
      front_png_url: null,
      side_png_url: null,
      top_fabric_json: null,
      front_fabric_json: null,
      side_fabric_json: null,
      created_at: now,
      updated_at: now,
    };
    await writeFurniture(item);
  }
  seeded = true;
}
