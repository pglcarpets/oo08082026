import "server-only";

import { unstable_cache } from "next/cache";
import { buildLocalCatalogFallbackProducts } from "@/lib/catalog/fallback";
import {
  fetchCatalogProductBySlugLive,
  fetchCatalogSlugAliasLive,
} from "@/lib/catalog/catalogDrizzle";
import { CATALOG_REVALIDATE_SECONDS } from "@/features/site/data/fallbacks";

export type ProductSlugResolution<T> = {
  row: T | null;
  requestedSlug: string;
  canonicalSlug: string;
  resolvedViaAlias: boolean;
  aliasSlug: string | null;
};

function normalizeProductUrlKey(value: string): string {
  return String(value || "").trim().toLowerCase();
}

async function fetchProductBySlug<T>(slug: string): Promise<T | null> {
  const product = await fetchCatalogProductBySlugLive(slug);
  return (product as T) ?? null;
}

function fetchFallbackProductBySlug<T>(slug: string): T | null {
  const fallbackProduct = buildLocalCatalogFallbackProducts().find(
    (product) => product.slug === slug,
  );
  return (fallbackProduct as T) ?? null;
}

async function resolveProductByUrlKeyLive<T>(
  requestedUrlKey: string,
): Promise<ProductSlugResolution<T>> {
  const requestedSlug = normalizeProductUrlKey(requestedUrlKey);
  if (!requestedSlug) {
    return {
      row: null,
      requestedSlug: "",
      canonicalSlug: "",
      resolvedViaAlias: false,
      aliasSlug: null,
    };
  }

  const aliasRow = await fetchCatalogSlugAliasLive(requestedSlug);
  const aliasCanonical = String(aliasRow?.canonical_slug || "").trim().toLowerCase();
  if (aliasCanonical && aliasCanonical !== requestedSlug) {
    const aliasedProduct = await fetchProductBySlug<T>(aliasCanonical);
    if (aliasedProduct) {
      return {
        row: aliasedProduct,
        requestedSlug,
        canonicalSlug: aliasCanonical,
        resolvedViaAlias: true,
        aliasSlug: requestedSlug,
      };
    }
  }

  const directProduct = await fetchProductBySlug<T>(requestedSlug);
  if (directProduct) {
    return {
      row: directProduct,
      requestedSlug,
      canonicalSlug: requestedSlug,
      resolvedViaAlias: false,
      aliasSlug: null,
    };
  }

  const fallbackProduct = fetchFallbackProductBySlug<T>(requestedSlug);
  if (!fallbackProduct) {
    return {
      row: null,
      requestedSlug,
      canonicalSlug: requestedSlug,
      resolvedViaAlias: false,
      aliasSlug: null,
    };
  }

  return {
    row: fallbackProduct,
    requestedSlug,
    canonicalSlug: requestedSlug,
    resolvedViaAlias: false,
    aliasSlug: null,
  };
}

const getCachedProductResolution = unstable_cache(
  async <T>(requestedUrlKey: string) => resolveProductByUrlKeyLive<T>(requestedUrlKey),
  ["catalog-product-resolution-v3"],
  {
    revalidate: CATALOG_REVALIDATE_SECONDS,
    tags: ["catalog", "catalog-products", "catalog-slugs"],
  },
);

export async function resolveProductByUrlKey<T>(
  requestedUrlKey: string,
  _selectClause = "*",
): Promise<ProductSlugResolution<T>> {
  return getCachedProductResolution<T>(requestedUrlKey);
}
