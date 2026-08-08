/**
 * Display helpers for the read-only workspace catalog admin page.
 */

import type { WorkspaceCatalogItem } from "@/lib/catalog/workspaceCatalog";

export type EnrichedCatalogItem = WorkspaceCatalogItem & {
  shortName: string;
  seatCount: number | null;
};

export function enrichCatalogItem(item: WorkspaceCatalogItem): EnrichedCatalogItem {
  return {
    ...item,
    shortName: item.shortName ?? item.name,
    seatCount: item.seatCount ?? null,
  };
}

export function formatCatalogDimensionsLabel(item: WorkspaceCatalogItem): string {
  const w = item.widthMm;
  const d = item.depthMm;
  const h = item.heightMm;
  if (w && d && h) return `${w} × ${d} × ${h} mm`;
  if (w && d) return `${w} × ${d} mm`;
  return "—";
}

export function formatCatalogSeatFootprint(item: WorkspaceCatalogItem): string {
  const w = item.widthMm;
  const d = item.depthMm;
  if (w && d) return `${w} × ${d} mm`;
  return "—";
}
