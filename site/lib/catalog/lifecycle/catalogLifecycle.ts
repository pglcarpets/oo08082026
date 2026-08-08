import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  CATALOG_LIFECYCLE_MANIFEST,
  type CatalogLifecycleManifest,
  type CatalogLifecycleState,
  isBuyerVisibleSlug,
} from "./catalogLifecycle.shared";

export {
  CATALOG_LIFECYCLE_MANIFEST,
  isBuyerVisibleLifecycle,
  isBuyerVisibleSlug,
  resolveCatalogLifecycle,
} from "./catalogLifecycle.shared";
export type {
  CatalogLifecycleEntry,
  CatalogLifecycleManifest,
  CatalogLifecycleState,
} from "./catalogLifecycle.shared";

export function lifecycleManifestPath(dir: string): string {
  return path.resolve(dir, CATALOG_LIFECYCLE_MANIFEST);
}

export function readLifecycleManifest(dir: string): CatalogLifecycleManifest {
  const manifestPath = lifecycleManifestPath(dir);
  if (!existsSync(manifestPath)) return {};
  try {
    const parsed = JSON.parse(readFileSync(manifestPath, "utf8")) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: CatalogLifecycleManifest = {};
    for (const [slug, entry] of Object.entries(parsed as Record<string, unknown>)) {
      if (!entry || typeof entry !== "object") continue;
      const row = entry as Record<string, unknown>;
      if (
        (row.state === "live" || row.state === "draft" || row.state === "retired") &&
        typeof row.updatedAt === "string"
      ) {
        out[slug] = { state: row.state, updatedAt: row.updatedAt };
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function setCatalogLifecycle(
  dir: string,
  slug: string,
  state: CatalogLifecycleState,
): CatalogLifecycleManifest {
  const manifest = readLifecycleManifest(dir);
  manifest[slug] = { state, updatedAt: new Date().toISOString() };
  mkdirSync(path.resolve(dir), { recursive: true });
  writeFileSync(lifecycleManifestPath(dir), JSON.stringify(manifest, null, 2), "utf8");
  return manifest;
}

export function isBuyerVisibleSlugInDir(dir: string, slug: string): boolean {
  return isBuyerVisibleSlug(slug, readLifecycleManifest(dir));
}
