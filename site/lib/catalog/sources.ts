import "server-only";

import { resolveCatalogFallbackProducts } from "./catalogFallbackResolver";
import { normalizeProducts } from "./adapters";
import type { Product } from "./types";
import {
  canQueryCatalogDatabase,
  fetchCatalogCategoryIdsLive,
  fetchCatalogProductBySlugLive,
  fetchCatalogProductsByCategoryLive,
  fetchCatalogProductsLive,
} from "./catalogDrizzle";

async function catalogFallbackProducts(): Promise<Product[]> {
  const products = await resolveCatalogFallbackProducts();
  return products.length > 0 ? products : [];
}

export async function fetchAllProductsLive(): Promise<Product[]> {
  if (!canQueryCatalogDatabase()) {
    return catalogFallbackProducts();
  }

  try {
    const rows = await fetchCatalogProductsLive();
    if (rows) {return normalizeProducts(rows);}
    return catalogFallbackProducts();
  } catch (error) {
    console.error("[getProducts] Catalog DB unavailable:", error);
    return catalogFallbackProducts();
  }
}

export async function fetchProductsByCategoryLive(categoryId: string): Promise<Product[]> {
  if (!canQueryCatalogDatabase()) {
    return (await catalogFallbackProducts()).filter((product) => product.category_id === categoryId);
  }

  try {
    const rows = await fetchCatalogProductsByCategoryLive(categoryId);
    if (rows) {return normalizeProducts(rows);}
    return (await catalogFallbackProducts()).filter((product) => product.category_id === categoryId);
  } catch (error) {
    console.error("[getProductsByCategory] Catalog DB unavailable:", error);
    return (await catalogFallbackProducts()).filter((product) => product.category_id === categoryId);
  }
}

export async function fetchProductByUrlKeyLive(productUrlKey: string): Promise<Product | null> {
  if (!canQueryCatalogDatabase()) {
    return (await catalogFallbackProducts()).find((product) => product.slug === productUrlKey) ?? null;
  }

  try {
    const row = await fetchCatalogProductBySlugLive(productUrlKey);
    if (row) {return normalizeProducts([row])[0] ?? null;}
    return (await catalogFallbackProducts()).find((product) => product.slug === productUrlKey) ?? null;
  } catch (error) {
    console.error("[getProductByUrlKey] Catalog DB unavailable:", error);
    return (await catalogFallbackProducts()).find((product) => product.slug === productUrlKey) ?? null;
  }
}

export async function fetchCategoryIdsLive(): Promise<string[]> {
  if (!canQueryCatalogDatabase()) {
    return [...new Set((await catalogFallbackProducts()).map((product) => product.category_id).filter(Boolean))];
  }

  try {
    const ids = await fetchCatalogCategoryIdsLive();
    if (ids) {return ids;}
    return [...new Set((await catalogFallbackProducts()).map((product) => product.category_id).filter(Boolean))];
  } catch (error) {
    console.error("[getCategoryIds] Catalog DB unavailable:", error);
    return [...new Set((await catalogFallbackProducts()).map((product) => product.category_id).filter(Boolean))];
  }
}
