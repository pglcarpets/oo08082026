export type CatalogLifecycleState = "live" | "draft" | "retired";

export type CatalogLifecycleEntry = {
  state: CatalogLifecycleState;
  updatedAt: string;
};

export type CatalogLifecycleManifest = Record<string, CatalogLifecycleEntry>;

export const CATALOG_LIFECYCLE_MANIFEST = "catalog-lifecycle.json";

export function isBuyerVisibleLifecycle(state: CatalogLifecycleState): boolean {
  return state === "live";
}

export function isBuyerVisibleSlug(
  slug: string,
  manifest: CatalogLifecycleManifest,
): boolean {
  const entry = manifest[slug];
  if (!entry) return true; // legacy: missing entry treated as live for buyer visibility
  return isBuyerVisibleLifecycle(entry.state);
}

export function resolveCatalogLifecycle(
  slug: string,
  manifest: CatalogLifecycleManifest,
): CatalogLifecycleState {
  return manifest[slug]?.state ?? "draft";
}
