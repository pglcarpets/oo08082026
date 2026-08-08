/**
 * Publish Studio furniture payload into versioned descriptor storage.
 * Uses salvaged PNG quality/checksum when PNG bytes provided.
 */

import path from "node:path";
import { persistBlockDescriptor } from "@/lib/catalog/persistBlockDescriptor";
import { setCatalogLifecycle } from "@/lib/catalog/lifecycle/catalogLifecycle";
import { validateFurnitureMetadata } from "@/lib/Studio/validateFurnitureMetadata";
import { checksumPngBuffer } from "@/lib/catalog/publish/pngPublishChecksum";
import { assertPlanSymbolPngQuality } from "@/lib/catalog/publish/planSymbolPngQualityGate";
import { getFurnitureCatalogMode } from "@/lib/catalog/furnitureCatalogMode";

export type PublishFurnitureInput = {
  name: string;
  category: string;
  slug?: string;
  width_mm: number;
  depth_mm: number;
  height_mm?: number;
  topPng?: Buffer;
  descriptorsDir: string;
  lifecycleDir: string;
  goLive?: boolean;
};

export type PublishFurnitureResult =
  | { ok: true; slug: string; version: number }
  | { ok: false; reason: "validation" | "quality" | "persist"; message: string };

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64) || "item"
  );
}

export async function publishFurnitureToCatalog(
  input: PublishFurnitureInput,
): Promise<PublishFurnitureResult> {
  const issues = validateFurnitureMetadata({
    name: input.name,
    category: input.category,
    width_mm: input.width_mm,
    depth_mm: input.depth_mm,
    height_mm: input.height_mm,
  });
  if (issues.length > 0) {
    return {
      ok: false,
      reason: "validation",
      message: issues.map((i) => i.message).join("; "),
    };
  }

  const slug = (input.slug?.trim() || slugify(input.name)).toLowerCase();

  let checksum: string | undefined;
  if (input.topPng) {
    const quality = await assertPlanSymbolPngQuality(input.topPng, {
      slug,
      widthMm: input.width_mm,
      depthMm: input.depth_mm,
    });
    if (!quality.ok) {
      return {
        ok: false,
        reason: "quality",
        message: quality.error,
      };
    }
    try {
      checksum = checksumPngBuffer(input.topPng).checksum;
    } catch (e) {
      return {
        ok: false,
        reason: "quality",
        message: e instanceof Error ? e.message : "PNG checksum failed",
      };
    }
  }
  const descriptor = {
    schemaVersion: "2026-07-04.v2",
    name: input.name,
    category: input.category,
    footprint: {
      widthMm: input.width_mm,
      depthMm: input.depth_mm,
      heightMm: input.height_mm ?? 750,
    },
    topPngChecksum: checksum ?? null,
  };
  const lifecycle = input.goLive ? "live" : "draft";

  try {
    // Production has a read-only filesystem; the descriptor row carries its own
    // lifecycle there, so no manifest file is involved.
    if (getFurnitureCatalogMode() !== "disk") {
      const { persistBlockDescriptorToSupabase } = await import(
        "@/lib/catalog/blockDescriptorStore.supabase"
      );
      const persisted = await persistBlockDescriptorToSupabase({
        slug,
        descriptor,
        checksum: checksum ?? null,
        lifecycle,
      });
      return { ok: true, slug, version: persisted.version };
    }

    const persisted = await persistBlockDescriptor({
      dir: path.resolve(input.descriptorsDir),
      slug,
      descriptor,
      allowedRoots: [path.resolve(input.descriptorsDir)],
    });
    setCatalogLifecycle(path.resolve(input.lifecycleDir), slug, lifecycle);
    return { ok: true, slug, version: persisted.version };
  } catch (e) {
    return {
      ok: false,
      reason: "persist",
      message: e instanceof Error ? e.message : "Persist failed",
    };
  }
}
