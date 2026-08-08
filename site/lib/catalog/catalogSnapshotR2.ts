import "server-only";

import type { Product } from "./types";
import { CATALOG_SNAPSHOT_R2_KEY } from "./catalogSnapshotConstants";
import { readR2ObjectText } from "@/lib/storage/r2Catalog";

export interface CatalogSnapshot {
  version: number;
  exportedAt: string;
  products: Product[];
  categoryIds: string[];
}

let cachedSnapshot: { fetchedAt: number; snapshot: CatalogSnapshot | null } | null = null;
const CACHE_MS = 5 * 60 * 1000;

function parseCatalogSnapshot(raw: string): CatalogSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as CatalogSnapshot;
    if (!parsed || !Array.isArray(parsed.products)) {return null;}
    return parsed;
  } catch {
    return null;
  }
}

export async function fetchCatalogSnapshotFromR2(): Promise<CatalogSnapshot | null> {
  const now = Date.now();
  if (cachedSnapshot && now - cachedSnapshot.fetchedAt < CACHE_MS) {
    return cachedSnapshot.snapshot;
  }

  const raw = await readR2ObjectText(CATALOG_SNAPSHOT_R2_KEY);
  const snapshot = raw ? parseCatalogSnapshot(raw) : null;
  cachedSnapshot = { fetchedAt: now, snapshot };
  return snapshot;
}

export async function fetchCatalogSnapshotProducts(): Promise<Product[] | null> {
  const snapshot = await fetchCatalogSnapshotFromR2();
  if (!snapshot?.products?.length) {return null;}
  return snapshot.products;
}
