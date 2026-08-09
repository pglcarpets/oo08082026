import "server-only";

import { unstable_cache } from "next/cache";
import { CATALOG_REVALIDATE_SECONDS } from "@/features/site/data/fallbacks";
import { buildCatalogLive as buildCatalogTreeLive } from "@/lib/catalog/catalogTree";
import {
  fetchAllProductsLive as fetchAllProductsSource,
  fetchCategoryIdsLive as fetchCategoryIdsSource,
  fetchProductByUrlKeyLive as fetchProductByUrlKeySource,
  fetchProductsByCategoryLive as fetchProductsByCategorySource,
} from "@/lib/catalog/sources";

export type {
  CategoryRow,
  CompatCategory,
  CompatProduct,
  CompatSeries,
  Product,
  ProductDetailedInfo,
  ProductMetadata,
  ProductVariant,
} from "@/lib/catalog/types";

import type {
  CompatCategory,
  Product,
} from "@/lib/catalog/types";

const getCachedProducts = unstable_cache(fetchAllProductsSource, ["catalog-products-v5"], {
  revalidate: CATALOG_REVALIDATE_SECONDS,
  tags: ["catalog", "catalog-products"],
});

export async function getProducts(): Promise<Product[]> {
  return (await getCachedProducts()) as Product[];
}

export async function getProductsFresh(): Promise<Product[]> {
  return (await fetchAllProductsSource()) as Product[];
}

const getCachedProductsByCategory = unstable_cache(
  async (categoryId: string) => fetchProductsByCategorySource(categoryId),
  ["catalog-products-by-category-v5"],
  {
    revalidate: CATALOG_REVALIDATE_SECONDS,
    tags: ["catalog", "catalog-products"],
  },
);

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  return (await getCachedProductsByCategory(categoryId)) as Product[];
}

const getCachedProductByUrlKey = unstable_cache(
  async (productUrlKey: string) => fetchProductByUrlKeySource(productUrlKey),
  ["catalog-product-by-url-key-v3"],
  {
    revalidate: CATALOG_REVALIDATE_SECONDS,
    tags: ["catalog", "catalog-products"],
  },
);

export async function getProductByUrlKey(productUrlKey: string): Promise<Product | null> {
  return (await getCachedProductByUrlKey(productUrlKey)) as Product | null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return getProductByUrlKey(slug);
}

const getCachedCatalog = unstable_cache(buildCatalogTreeLive, ["catalog-tree-v7"], {
  revalidate: CATALOG_REVALIDATE_SECONDS,
  tags: ["catalog", "catalog-tree"],
});

export async function getCatalog(): Promise<CompatCategory[]> {
  return (await getCachedCatalog()) as CompatCategory[];
}

export async function getCategoryIds(): Promise<string[]> {
  return fetchCategoryIdsSource();
}
