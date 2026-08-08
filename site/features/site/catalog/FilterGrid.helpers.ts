"use client";

import type {
  CompatCategory as Category,
  CompatProduct as Product,
} from "@/lib/catalog/site/getProducts";
import { useEffect, useState } from "react";

import { PRICE_RANGES } from "@/lib/catalog/site/filters";
import { hasVerifiedHeadrest, hasVerifiedHeightAdjustable } from "@/lib/catalog/site/traits";
import {
  sanitizeDisplayText,
  filterMeaningfulDimensionText,
  filterMeaningfulMaterialList,
} from "@/lib/displayText";
import { normalizeAssetPath, isProductImageFallback } from "@/lib/assetPaths";
import {
  filterProductCatalogMedia,
  isPublishableCatalogProduct,
} from "@/lib/catalog/site/catalogProductFilters";
import { dedupeCatalogProductsByName } from "@/lib/catalog/site/catalogProductDedupe";
import { resolveDisplayEcoScore } from "@/lib/catalog/site/ecoScore";
import { isUsableMarketingImage } from "@/lib/catalog/site/marketingImages";

export interface FlatProduct extends Product {
  seriesId: string;
  seriesName: string;
  altText?: string;
}

export interface FilterResponse {
  products: FlatProduct[];
  total: number;
  facets: {
    series: string[];
    subcategory: string[];
    material: string[];
    priceRange: string[];
    ecoMin: { min: number; max: number };
    featureAvailability: {
      hasHeadrest: boolean;
      isHeightAdjustable: boolean;
      bifmaCertified: boolean;
      isStackable: boolean;
    };
  };
  meta: {
    categoryId: string;
    catalogTotal: number;
  };
}

function dedupeFlatProducts(products: FlatProduct[]): FlatProduct[] {
  return dedupeCatalogProductsByName(products);
}

export function buildImageCandidates(
  product: Pick<FlatProduct, "images" | "flagshipImage" | "slug">,
  categoryId?: string,
): string[] {
  const raw = filterProductCatalogMedia([
    normalizeAssetPath(product.flagshipImage),
    ...(Array.isArray(product.images)
      ? product.images.map((image) => normalizeAssetPath(String(image || "").trim()))
      : []),
  ]);

  const unique = Array.from(new Set(raw));
  const catalogPreferred = unique.filter(
    (path) => /\/images\/catalog\/oando-/i.test(path),
  );
  const preferred = unique.filter(isUsableMarketingImage);
  const merged =
    catalogPreferred.length > 0
      ? [...catalogPreferred, ...preferred.filter((p) => !catalogPreferred.includes(p))]
      : preferred.length > 0
        ? preferred
        : unique;

  if (categoryId && merged.length > 1) {
    // Nested layout: /assets/catalog/{family}/oando-{family}--…
    const family = String(categoryId).toLowerCase();
    const nestedPrefix = `/assets/catalog/${family}/`;
    const flatPrefix = `/assets/catalog/oando-${family}`;
    const categoryMatch = merged.filter((path) => {
      const lower = path.toLowerCase();
      return lower.startsWith(nestedPrefix) || lower.startsWith(flatPrefix);
    });
    if (categoryMatch.length > 0) {
      return [...categoryMatch, ...merged.filter((p) => !categoryMatch.includes(p))];
    }
  }

  const slug = String(product.slug || "").trim();
  if (slug && merged.length === 0) {
    const family = String(categoryId || "seating").toLowerCase();
    const slugProbePaths = [
      `/assets/catalog/${family}/oando-${family}--${slug}/image-1.webp`,
      `/assets/catalog/oando-${family}--${slug}/image-1.webp`,
    ];
    if (!slug.includes("--")) {
      slugProbePaths.push(
        `/assets/catalog/seating/oando-seating--${slug}/image-1.webp`,
        `/assets/catalog/tables/oando-tables--${slug}/image-1.webp`,
        `/assets/catalog/storage/oando-storage--${slug}/image-1.webp`,
      );
    }
    for (const probePath of slugProbePaths) {
      const resolved = normalizeAssetPath(probePath);
      if (
        resolved &&
        !isProductImageFallback(resolved) &&
        isUsableMarketingImage(resolved)
      ) {
        return [resolved];
      }
    }
  }

  return merged.length > 0 ? merged : unique;
}

function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) {return [];}
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

export function toInlineSpec(value: string, max = 72): string {
  const normalized = sanitizeDisplayText(value);
  if (!normalized) {return "";}
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

export function getDisplayDimensions(product: FlatProduct): string {
  const specs = product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
    ? (product.specs as Record<string, unknown>)
    : {};
  const specDimensions = typeof specs.dimensions === "string" ? specs.dimensions : "";
  const normalizedSpecDimensions = filterMeaningfulDimensionText(specDimensions);
  if (normalizedSpecDimensions) {return toInlineSpec(normalizedSpecDimensions, 68);}

  const detailed = typeof product.detailedInfo?.dimensions === "string"
    ? product.detailedInfo.dimensions
    : "";
  return toInlineSpec(filterMeaningfulDimensionText(detailed), 68);
}

export function getDisplayMaterials(product: FlatProduct): string {
  const specs = product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
    ? (product.specs as Record<string, unknown>)
    : {};
  const sourceMaterials = filterMeaningfulMaterialList(toTextList(specs.materials));
  if (sourceMaterials.length > 0) {
    return toInlineSpec(sourceMaterials.slice(0, 2).join(", "), 68);
  }

  const detailed = filterMeaningfulMaterialList(toTextList(product.detailedInfo?.materials));
  return toInlineSpec(detailed.slice(0, 2).join(", "), 68);
}

export function fallbackAltText(productName: string, categoryName: string): string {
  return sanitizeDisplayText(
    `Product image of ${productName} in ${categoryName} category`,
  ).slice(0, 140);
}

export function getProductRouteKey(product: Pick<FlatProduct, "slug" | "id">): string {
  const slugValue = typeof product.slug === "string" ? product.slug.trim() : "";
  if (slugValue) {return slugValue;}
  const idValue = typeof product.id === "string" ? product.id.trim() : "";
  return idValue;
}

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function flattenCategoryProducts(category: Category): FlatProduct[] {
  const flattened = category.series.flatMap((series) =>
    series.products
      .filter((product) =>
        isPublishableCatalogProduct({
          slug: product.slug,
          name: product.name,
          baseCategoryId: category.id,
          category_id: product.metadata?.category,
          flagshipImage: product.flagshipImage,
          images: product.images,
        }),
      )
      .map((product) => ({
      ...product,
      seriesId: series.id,
      seriesName: series.name,
      altText:
        (product as unknown as { altText?: string; alt_text?: string }).altText ||
        (product as unknown as { altText?: string; alt_text?: string }).alt_text ||
        (product.metadata as Record<string, unknown> | undefined)?.ai_alt_text?.toString() ||
        (product.metadata as Record<string, unknown> | undefined)?.aiAltText?.toString() ||
        fallbackAltText(product.name, category.name),
    })),
  );
  return dedupeFlatProducts(flattened);
}

export function buildFallbackFacets(
  categoryId: string,
  products: FlatProduct[],
): FilterResponse["facets"] {
  const uniqueSorted = (items: string[]) => Array.from(new Set(items.filter(Boolean))).sort((a, b) => a.localeCompare(b));

  const subcategoryValues = products.map((product) =>
    sanitizeDisplayText(product.metadata?.subcategory || ""),
  );
  const materialValues = products.flatMap((product) => {
    const specs = product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
      ? (product.specs as Record<string, unknown>)
      : {};
    return filterMeaningfulMaterialList(toTextList(specs.materials));
  });
  const ecoScores = products
    .map((product) =>
      resolveDisplayEcoScore({ specs: product.specs, metadata: product.metadata }),
    )
    .filter((score): score is number => typeof score === "number" && Number.isFinite(score));

  // Facets use metadata.priceRange bands only (budget|mid|premium|luxury).
  // Never invent numeric list prices as commercial authority.
  let hasHeadrestCount = 0;
  let heightAdjCount = 0;
  let bifmaCount = 0;
  let stackableCount = 0;

  for (const product of products) {
    if (hasVerifiedHeadrest(product)) {hasHeadrestCount += 1;}
    if (hasVerifiedHeightAdjustable(product)) {heightAdjCount += 1;}
    if (product.metadata?.bifmaCertified) {bifmaCount += 1;}
    if (product.metadata?.isStackable) {stackableCount += 1;}
  }

  return {
    series: categoryId === "seating"
      ? []
      : uniqueSorted(products.map((product) => product.seriesName)),
    subcategory: uniqueSorted(subcategoryValues),
    material: uniqueSorted(materialValues),
    priceRange: PRICE_RANGES.filter((range) =>
      products.some((product) => product.metadata?.priceRange === range),
    ),
    ecoMin: {
      min: ecoScores.length > 0 ? Math.min(...ecoScores) : 0,
      max: ecoScores.length > 0 ? Math.max(...ecoScores) : 10,
    },
    featureAvailability: {
      hasHeadrest: hasHeadrestCount > 0,
      isHeightAdjustable: heightAdjCount > 0,
      bifmaCertified: bifmaCount > 0,
      isStackable: stackableCount > 0,
    },
  };
}
