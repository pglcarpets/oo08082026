/**
 * @vitest-environment node
 *
 * Live round-trip for the furniture library in supabase mode — the path
 * production runs, where the filesystem is read-only.
 *
 * The Studio writes this library and the Planner rail reads it. On disk that
 * coupling was two independent declarations of the same directory constant; in
 * supabase mode it is one table, so this test stands in for the whole
 * Studio → Planner handoff: write as the Studio does, read as the rail does.
 *
 * Skips when admin service env is missing.
 */
import { describe, it, expect, afterAll } from "vitest";
import {
  deleteFurnitureFromSupabase,
  listFurnitureFromSupabase,
  loadFurnitureFromSupabase,
  persistFurnitureAssetsToSupabase,
  writeFurnitureToSupabase,
} from "@/lib/catalog/furnitureCatalogStore.supabase";

const hasAdmin =
  Boolean(process.env.NEXT_ADMIN_SUPABASE_URL?.trim()) &&
  Boolean(process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim());

/** 1×1 transparent PNG. */
const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

describe.runIf(hasAdmin)("furniture_catalog (live)", () => {
  const itemId = `f_vitest_${Date.now().toString(36)}`;

  afterAll(async () => {
    await deleteFurnitureFromSupabase(itemId).catch(() => undefined);
  });

  it("round-trips an item the Studio writes and the Planner rail reads", async () => {
    await writeFurnitureToSupabase({
      id: itemId,
      name: "Vitest Desk",
      category: "desks",
      tags: ["vitest", "smoke"],
      dimensions: { width_mm: 1400, depth_mm: 700, height_mm: 750 },
      is_custom: true,
    });

    const loaded = await loadFurnitureFromSupabase(itemId);
    expect(loaded).not.toBeNull();
    expect(loaded?.name).toBe("Vitest Desk");
    expect(loaded?.tags).toEqual(["vitest", "smoke"]);
    expect(loaded?.dimensions).toEqual({
      width_mm: 1400,
      depth_mm: 700,
      height_mm: 750,
    });

    // The rail lists seeded items before custom ones, then by name.
    const listed = await listFurnitureFromSupabase();
    expect(listed.some((i) => i.id === itemId)).toBe(true);
    const firstCustom = listed.findIndex((i) => i.is_custom === true);
    const lastSeeded = listed.map((i) => i.is_custom === false).lastIndexOf(true);
    if (firstCustom !== -1 && lastSeeded !== -1) {
      expect(lastSeeded).toBeLessThan(firstCustom);
    }

    expect(await deleteFurnitureFromSupabase(itemId)).toBe(true);
    expect(await loadFurnitureFromSupabase(itemId)).toBeNull();
  }, 60_000);

  it("uploads asset bytes to the bucket and returns public URLs", async () => {
    const assetItemId = `${itemId}_assets`;
    try {
      const urls = await persistFurnitureAssetsToSupabase(assetItemId, {
        top_png: PNG_1PX,
      });

      expect(urls.top_png_url).toMatch(
        /\/storage\/v1\/object\/public\/catalog-assets\/furniture-library\//,
      );
      expect(urls.thumbnail_url).toBeTruthy();

      // Public read must actually work — the rail loads these straight from the
      // bucket, with no signed URL and no server hop.
      const res = await fetch(urls.top_png_url);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("image/png");
    } finally {
      await deleteFurnitureFromSupabase(assetItemId).catch(() => undefined);
    }
  }, 60_000);
});
