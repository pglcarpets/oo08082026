import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { isProductsDatabaseConfigured } from "@/platform/drizzle/databaseUrls";
import { productsDb } from "@/platform/drizzle/productsDb";
import { configuratorProducts } from "@/platform/drizzle/schema/catalog";
import type { ConfiguratorProductRow } from "./configuratorCatalog";

type ConfiguratorCatalogFilters = {
  category?: string;
  active?: boolean;
};

/** Read the Admin configurator inventory from its Products DB authority. */
export async function fetchAdminConfiguratorCatalog(
  filters: ConfiguratorCatalogFilters,
): Promise<ConfiguratorProductRow[] | null> {
  if (!isProductsDatabaseConfigured()) {return null;}

  const rows = await productsDb
    .select({
      id: configuratorProducts.id,
      slug: configuratorProducts.slug,
      name: configuratorProducts.name,
      category: configuratorProducts.category,
      family: configuratorProducts.family,
      brand_name: configuratorProducts.brand_name,
      sizing_type: configuratorProducts.sizing_type,
      workstation: configuratorProducts.workstation,
      size_options: configuratorProducts.size_options,
      default_footprint: configuratorProducts.default_footprint,
      derived_rules: configuratorProducts.derived_rules,
      materials: configuratorProducts.materials,
      thumbnail_url: configuratorProducts.thumbnail_url,
      model_3d_url: configuratorProducts.model_3d_url,
      description: configuratorProducts.description,
      active: configuratorProducts.active,
      created_at: configuratorProducts.created_at,
      updated_at: configuratorProducts.updated_at,
    })
    .from(configuratorProducts)
    .where(
      and(
        filters.category ? eq(configuratorProducts.category, filters.category) : undefined,
        filters.active === undefined
          ? undefined
          : eq(configuratorProducts.active, filters.active),
      ),
    )
    .orderBy(asc(configuratorProducts.category), asc(configuratorProducts.name));

  return rows.map((row) => ({
    ...row,
    workstation: row.workstation as ConfiguratorProductRow["workstation"],
    size_options: row.size_options as ConfiguratorProductRow["size_options"],
    default_footprint: row.default_footprint as ConfiguratorProductRow["default_footprint"],
    derived_rules: row.derived_rules as ConfiguratorProductRow["derived_rules"],
  }));
}
