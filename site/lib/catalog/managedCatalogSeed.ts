/**
 * Seed rows for `planner_managed_products` upserts (ops script).
 */

import { furnitureCatalog } from "@/lib/catalog/catalogData";

export type ManagedCatalogSeedRow = {
  slug: string;
  planner_source_slug: string;
  name: string;
  description: string;
  category: string;
  category_id: string;
  category_name: string;
  series_id: string;
  series_name: string;
  price: number;
  flagship_image: string;
  images: string[];
  specs: Record<string, unknown>;
};

export const MANAGED_CATALOG_SEED: ManagedCatalogSeedRow[] = furnitureCatalog.map((item) => {
  const slug = item.id;
  const category_id = item.category;
  return {
    slug,
    planner_source_slug: slug,
    name: item.name,
    description: `${item.name} (seed)`,
    category: item.category,
    category_id,
    category_name: item.category,
    series_id: item.shape || "general",
    series_name: item.shape || "General",
    price: item.priceInr || 0,
    flagship_image: item.iconPath || "",
    images: item.iconPath ? [item.iconPath] : [],
    specs: {
      widthMm: item.widthMm,
      depthMm: item.depthMm,
      heightMm: item.heightMm,
      meshType: item.shape,
      priceInr: item.priceInr,
    },
  };
});
