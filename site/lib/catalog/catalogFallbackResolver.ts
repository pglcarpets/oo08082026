import "server-only";

import type { Product } from "./types";
import { normalizeProducts } from "./adapters";
import { buildLocalCatalogFallbackProducts } from "./fallback";
import { fetchCatalogSnapshotProducts } from "./catalogSnapshotR2";

/** DB unavailable: R2 nightly snapshot first, then bundled local index. */
export async function resolveCatalogFallbackProducts(): Promise<Product[]> {
  const fromR2 = await fetchCatalogSnapshotProducts();
  if (fromR2?.length) {
    return normalizeProducts(fromR2).sort((a, b) => a.name.localeCompare(b.name));
  }
  return buildLocalCatalogFallbackProducts();
}
