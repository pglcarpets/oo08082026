import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { isProductsDatabaseConfigured } from "@/platform/drizzle/databaseUrls";
import { productsDb } from "@/platform/drizzle/productsDb";
import {
  businessStatsCurrent,
  catalogCategories,
  catalogProductImages,
  catalogProductSlugAliases,
  catalogProductSpecs,
  catalogProducts,
} from "@/platform/drizzle/schema/catalog";
import { normalizeCatalogProductId } from "@/lib/uuid/normalizeUuid";
import type { CategoryRow, Product } from "./types";

function logCatalogDbUnavailable(context: string, error: unknown): void {
  console.error(`[${context}] Catalog DB unavailable:`, error);
}

function isMissingCatalogTableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();
  return (
    normalized.includes("does not exist") ||
    normalized.includes("could not find the table") ||
    (normalized.includes("relation") && normalized.includes("does not exist"))
  );
}

const IS_PRODUCTION_BUILD = process.env.NEXT_PHASE === "phase-production-build";

function rowToProduct(row: typeof catalogProducts.$inferSelect): Product {
  const slug = String(row.slug ?? "").trim();
  return {
    ...(row as unknown as Product),
    id: normalizeCatalogProductId(row.id, slug),
    slug,
    "3d_model": row.model_3d ?? undefined,
  };
}

export function canQueryCatalogDatabase(): boolean {
  return isProductsDatabaseConfigured() && !IS_PRODUCTION_BUILD;
}

export async function fetchCatalogProductsLive(): Promise<Product[] | null> {
  if (!canQueryCatalogDatabase()) {return null;}

  try {
    const rows = await productsDb
      .select()
      .from(catalogProducts)
      .orderBy(asc(catalogProducts.name));
    return rows.map(rowToProduct);
  } catch (error) {
    if (!isMissingCatalogTableError(error)) {
      throw error;
    }
    logCatalogDbUnavailable("fetchCatalogProductsLive", error);
    return null;
  }
}

export async function fetchCatalogProductsByCategoryLive(
  categoryId: string,
): Promise<Product[] | null> {
  if (!canQueryCatalogDatabase()) {return null;}

  try {
    const rows = await productsDb
      .select()
      .from(catalogProducts)
      .where(eq(catalogProducts.category_id, categoryId))
      .orderBy(asc(catalogProducts.name));
    return rows.map(rowToProduct);
  } catch (error) {
    logCatalogDbUnavailable("fetchCatalogProductsByCategoryLive", error);
    return null;
  }
}

export async function fetchCatalogProductBySlugLive(slug: string): Promise<Product | null> {
  if (!canQueryCatalogDatabase()) {return null;}

  try {
    const rows = await productsDb
      .select()
      .from(catalogProducts)
      .where(eq(catalogProducts.slug, slug))
      .limit(1);
    return rows[0] ? rowToProduct(rows[0]) : null;
  } catch (error) {
    logCatalogDbUnavailable("fetchCatalogProductBySlugLive", error);
    return null;
  }
}

export async function fetchCatalogCategoryIdsLive(): Promise<string[] | null> {
  if (!canQueryCatalogDatabase()) {return null;}

  try {
    const rows = await productsDb
      .select({ category_id: catalogProducts.category_id })
      .from(catalogProducts)
      .orderBy(asc(catalogProducts.category_id));
    return [
      ...new Set(
        rows
          .map((row) => row.category_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0),
      ),
    ];
  } catch (error) {
    logCatalogDbUnavailable("fetchCatalogCategoryIdsLive", error);
    return null;
  }
}

export async function fetchCatalogCategoriesLive(): Promise<CategoryRow[] | null> {
  if (!canQueryCatalogDatabase()) {return null;}

  try {
    return await productsDb.select().from(catalogCategories);
  } catch (error) {
    logCatalogDbUnavailable("fetchCatalogCategoriesLive", error);
    return null;
  }
}

export type CatalogSlugAliasRow = {
  alias_slug: string;
  canonical_slug: string;
};

export type BusinessStatsRow = {
  projects_delivered: number;
  client_organisations: number;
  sectors_served: number;
  locations_served: number;
  years_experience: number;
  as_of_date: string;
};

export async function fetchCatalogSlugAliasLive(
  aliasSlug: string,
): Promise<CatalogSlugAliasRow | null> {
  if (!canQueryCatalogDatabase()) {return null;}

  try {
    const rows = await productsDb
      .select({
        alias_slug: catalogProductSlugAliases.alias_slug,
        canonical_slug: catalogProductSlugAliases.canonical_slug,
      })
      .from(catalogProductSlugAliases)
      .where(
        and(
          eq(catalogProductSlugAliases.alias_slug, aliasSlug),
          eq(catalogProductSlugAliases.is_active, true),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  } catch (error) {
    logCatalogDbUnavailable("fetchCatalogSlugAliasLive", error);
    return null;
  }
}

export async function fetchCatalogProductsSlugFieldsByCategoryLive(
  categoryId: string,
): Promise<Array<Pick<Product, "slug" | "name" | "category_id" | "metadata">> | null> {
  if (!canQueryCatalogDatabase()) {return null;}

  try {
    const rows = await productsDb
      .select({
        slug: catalogProducts.slug,
        name: catalogProducts.name,
        category_id: catalogProducts.category_id,
        metadata: catalogProducts.metadata,
      })
      .from(catalogProducts)
      .where(eq(catalogProducts.category_id, categoryId));
    return rows.map((row) => ({
      slug: row.slug ?? "",
      name: row.name ?? "",
      category_id: row.category_id ?? "",
      metadata: (row.metadata ?? null) as Product["metadata"],
    }));
  } catch (error) {
    logCatalogDbUnavailable("fetchCatalogProductsSlugFieldsByCategoryLive", error);
    return null;
  }
}

export async function fetchBusinessStatsActiveLive(): Promise<BusinessStatsRow | null> {
  if (!canQueryCatalogDatabase()) {return null;}

  try {
    const rows = await productsDb
      .select({
        projects_delivered: businessStatsCurrent.projects_delivered,
        client_organisations: businessStatsCurrent.client_organisations,
        sectors_served: businessStatsCurrent.sectors_served,
        locations_served: businessStatsCurrent.locations_served,
        years_experience: businessStatsCurrent.years_experience,
        as_of_date: businessStatsCurrent.as_of_date,
      })
      .from(businessStatsCurrent)
      .where(eq(businessStatsCurrent.is_active, true))
      .limit(1);
    const row = rows[0];
    if (!row) {return null;}
    return {
      projects_delivered: row.projects_delivered ?? 0,
      client_organisations: row.client_organisations ?? 0,
      sectors_served: row.sectors_served ?? 0,
      locations_served: row.locations_served ?? 0,
      years_experience: row.years_experience ?? 0,
      as_of_date: String(row.as_of_date ?? ""),
    };
  } catch (error) {
    logCatalogDbUnavailable("fetchBusinessStatsActiveLive", error);
    return null;
  }
}

export async function fetchCatalogProductSpecsRowsLive(
  productIds: string[],
): Promise<Array<{ product_id: string; specs: Record<string, unknown> | null }> | null> {
  if (!canQueryCatalogDatabase() || productIds.length === 0) {return null;}

  try {
    const rows = await productsDb
      .select({
        product_id: catalogProductSpecs.product_id,
        specs: catalogProductSpecs.specs,
      })
      .from(catalogProductSpecs)
      .where(inArray(catalogProductSpecs.product_id, productIds));
    return rows.map((row) => ({
      product_id: row.product_id,
      specs: (row.specs ?? null) as Record<string, unknown> | null,
    }));
  } catch (error) {
    logCatalogDbUnavailable("fetchCatalogProductSpecsRowsLive", error);
    return null;
  }
}

export async function fetchCatalogProductImageRowsLive(
  productIds: string[],
): Promise<
  Array<{
    product_id: string;
    image_url: string | null;
    image_kind: string | null;
    sort_order: number | null;
  }> | null
> {
  if (!canQueryCatalogDatabase() || productIds.length === 0) {return null;}

  try {
    return await productsDb
      .select({
        product_id: catalogProductImages.product_id,
        image_url: catalogProductImages.image_url,
        image_kind: catalogProductImages.image_kind,
        sort_order: catalogProductImages.sort_order,
      })
      .from(catalogProductImages)
      .where(inArray(catalogProductImages.product_id, productIds))
      .orderBy(asc(catalogProductImages.sort_order));
  } catch (error) {
    logCatalogDbUnavailable("fetchCatalogProductImageRowsLive", error);
    return null;
  }
}
