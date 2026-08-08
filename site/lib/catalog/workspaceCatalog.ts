/**
 * Read-only static workspace element library for admin browse UI.
 * Sourced from the shared furniture seed list (not a live editable catalog).
 */

import { furnitureCatalog } from "@/lib/catalog/catalogData";

export type WorkspaceCatalogItem = {
  id: string;
  name: string;
  category: string;
  sku?: string;
  shortName?: string;
  seatCount?: number | null;
  widthMm?: number;
  depthMm?: number;
  heightMm?: number;
};

export const PLANNER_CATALOG_ITEMS: WorkspaceCatalogItem[] = furnitureCatalog.map(
  (item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    sku: item.id,
    shortName: item.name,
    seatCount: null,
    widthMm: item.widthMm,
    depthMm: item.depthMm,
    heightMm: item.heightMm,
  }),
);
