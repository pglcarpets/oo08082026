import { normalizeRequestedCategoryId } from '@/lib/catalog/site/categories';
import { isPublishableCatalogProduct } from "@/lib/catalog/site/catalogProductFilters";
import localCatalogIndex from "@/features/site/data/localCatalogIndex.json";
import { catalogProductIdFromSlug } from "@/lib/uuid/normalizeUuid";
import type { Product } from "./types";
import { normalizeProducts } from "./adapters";

let localCatalogFallbackCache: Product[] | null = null;

function toTitleCaseSlug(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function resolveFallbackCategoryId(rawCategoryToken: string): string {
  const raw = String(rawCategoryToken || "").trim();
  const normalized = normalizeRequestedCategoryId(raw);
  if (normalized) {return normalized;}
  const stripped = raw.startsWith("oando-") ? raw.slice("oando-".length) : raw;
  const normalizedStripped = normalizeRequestedCategoryId(stripped);
  if (normalizedStripped) {return normalizedStripped;}
  return stripped || "seating";
}

export function buildLocalCatalogFallbackProducts(): Product[] {
  if (localCatalogFallbackCache) {return localCatalogFallbackCache;}

  const products: Product[] = [];
  const entries = Array.isArray(localCatalogIndex) ? localCatalogIndex : [];

  for (const entry of entries as Array<{
    id?: string;
    slug?: string;
    category_id?: string;
    name?: string;
    images?: string[];
    flagship_image?: string;
  }>) {
    const folderName = String(entry.id || entry.slug || "").trim();
    if (!folderName) {continue;}

    if (
      !isPublishableCatalogProduct({
        slug: entry.slug || folderName,
        name: entry.name,
        category_id: entry.category_id,
        flagshipImage: entry.flagship_image,
        images: entry.images,
      })
    ) {
      continue;
    }

    const splitIndex = folderName.indexOf("--");
    const rawCategoryToken =
      splitIndex === -1 ? String(entry.category_id || "") : folderName.slice(0, splitIndex);
    const productToken = splitIndex === -1 ? String(entry.name || "") : folderName.slice(splitIndex + 2);
    const categoryId = resolveFallbackCategoryId(rawCategoryToken);
    const productName = String(entry.name || "").trim() || toTitleCaseSlug(productToken);
    const images = entry.images || [];

    products.push({
      id: catalogProductIdFromSlug(folderName),
      category_id: categoryId,
      series: categoryId,
      name: productName || folderName,
      slug: folderName,
      description: "",
      images,
      flagship_image: images[0] || "",
      features: [],
      finishes: [],
      specs: {
        dimensions: "",
        materials: [],
        features: [],
      },
      series_id: `${categoryId}-series`,
      series_name: toTitleCaseSlug(categoryId),
      created_at: new Date(0).toISOString(),
      metadata: {
        source: "local-catalog-fallback",
        category: categoryId,
        sourceSlug: productToken || folderName,
      },
    });
  }

  localCatalogFallbackCache = normalizeProducts(products).sort((a, b) => a.name.localeCompare(b.name));
  return localCatalogFallbackCache;
}
