import {
  canQueryCatalogDatabase,
  fetchCatalogCategoriesLive,
  fetchCatalogProductsLive,
} from "./catalogDrizzle";
import { resolveCatalogFallbackProducts } from "./catalogFallbackResolver";
import { normalizeProducts, toCompatProduct } from "./adapters";
import type { CategoryRow, CompatCategory, CompatSeries, Product } from "./types";

const CATALOG_FETCH_RETRIES =
  process.env.NEXT_PHASE === "phase-production-build" || process.env.CI === "true" ? 1 : 3;
const CATALOG_RETRY_DELAY_MS = 500;
const CATALOG_FAILURE_COOLDOWN_MS = 60_000;

let lastCatalogFailureAt = 0;
const loggedCatalogErrors = new Set<string>();

function summarizeCatalogError(message?: string): string {
  if (!message) {return "Unknown catalog DB error";}
  const singleLine = message.replace(/\s+/g, " ").trim();
  return singleLine.length > 260 ? `${singleLine.slice(0, 260)}...` : singleLine;
}

function isTransientCatalogError(message?: string): boolean {
  if (!message) {return false;}
  const normalized = message.toLowerCase();
  return (
    normalized.includes("ssl handshake failed") ||
    normalized.includes("error code 525") ||
    normalized.includes("fetch failed") ||
    normalized.includes("network") ||
    normalized.includes("timeout") ||
    normalized.includes("<!doctype html") ||
    normalized.includes("<html") ||
    normalized.includes("cloudflare") ||
    normalized.includes("origin is unreachable") ||
    normalized.includes("temporarily unavailable")
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function buildCatalogLive(): Promise<CompatCategory[]> {
  let categories: CategoryRow[] = [];
  let products: Product[] = [];
  let lastError = "";

  const now = Date.now();
  const hasRecentFailure =
    lastCatalogFailureAt > 0 && now - lastCatalogFailureAt < CATALOG_FAILURE_COOLDOWN_MS;
  if (hasRecentFailure) {
    return [];
  }

  if (!canQueryCatalogDatabase()) {
    return [];
  }

  for (let attempt = 1; attempt <= CATALOG_FETCH_RETRIES; attempt += 1) {
    try {
      const categoryRows = await fetchCatalogCategoriesLive();
      const productRows = await fetchCatalogProductsLive();

      if (categoryRows && productRows) {
        categories = categoryRows as CategoryRow[];
        products = normalizeProducts(productRows);
        lastCatalogFailureAt = 0;
        break;
      }

      lastError = "Missing catalog_categories or catalog_products";
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error(
        `[getCatalog] Catalog DB error (attempt ${attempt}/${CATALOG_FETCH_RETRIES}):`,
        summarizeCatalogError(lastError),
      );
    }

    if (attempt < CATALOG_FETCH_RETRIES && isTransientCatalogError(lastError)) {
      await wait(CATALOG_RETRY_DELAY_MS * attempt);
      continue;
    }

    const summarized = summarizeCatalogError(lastError);
    lastCatalogFailureAt = Date.now();
    if (lastError && !loggedCatalogErrors.has(summarized)) {
      loggedCatalogErrors.add(summarized);
      console.error(`[getCatalog] failed: ${summarized}`);
    }
    break;
  }

  if (categories.length === 0 && products.length === 0 && lastError) {
    const localFallbackProducts = await resolveCatalogFallbackProducts();
    if (localFallbackProducts.length > 0) {
      products = localFallbackProducts;
      const categoryIds = [
        ...new Set(localFallbackProducts.map((product) => product.category_id).filter(Boolean)),
      ];
      categories = categoryIds.map((id) => ({ id, name: id }));
      lastCatalogFailureAt = 0;
    } else {
      const summarized = summarizeCatalogError(lastError);
      lastCatalogFailureAt = Date.now();
      if (!loggedCatalogErrors.has(summarized)) {
        loggedCatalogErrors.add(summarized);
        console.error(`[getCatalog] failed: ${summarized}`);
      }
      return [];
    }
  }

  const categoryMap = new Map<string, { info: CategoryRow; products: Product[] }>();

  for (const category of categories) {
    categoryMap.set(category.id, { info: category, products: [] });
  }

  for (const product of products) {
    const categoryId = product.category_id;
    let categoryEntry = categoryMap.get(categoryId);
    if (!categoryEntry) {
      const fallbackName = categoryId.replace("oando-", "");
      categoryEntry = {
        info: { id: categoryId, name: fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1) },
        products: []
      };
      categoryMap.set(categoryId, categoryEntry);
    }
    categoryEntry.products.push(product);
  }

  const result: CompatCategory[] = [];

  for (const [categoryId, categoryData] of categoryMap) {
    if (categoryData.products.length === 0) {continue;}

    const seriesMap = new Map<string, Product[]>();
    for (const product of categoryData.products) {
      const seriesId = product.series_id || `${categoryId}-series`;
      const existing = seriesMap.get(seriesId);
      if (existing) {
        existing.push(product);
      } else {
        seriesMap.set(seriesId, [product]);
      }
    }

    const series: CompatSeries[] = [];
    for (const [seriesId, seriesProducts] of seriesMap) {
      series.push({
        id: seriesId,
        name: seriesProducts[0]?.series_name || "Series",
        description: `Premium ${categoryData.info.name.toLowerCase()} solutions`,
        products: seriesProducts.map(toCompatProduct),
      });
    }

    result.push({
      id: categoryId,
      name: categoryData.info.name,
      description: `Professional furniture systems for ${categoryData.info.name.toLowerCase()}`,
      series,
    });
  }

  if (result.length === 0) {
    const message = "Catalog DB returned no usable categories";
    if (!loggedCatalogErrors.has(message)) {
      loggedCatalogErrors.add(message);
      console.error(`[getCatalog] ${message}`);
    }
    return [];
  }

  return result;
}
