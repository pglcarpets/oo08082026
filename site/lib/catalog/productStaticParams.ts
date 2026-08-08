import "server-only";

import {
  classifyToRequestedCategory,
  normalizeRequestedCategoryId,
} from "@/lib/catalog/site/categories";
import { fetchCatalogProductsLive } from "./catalogDrizzle";
import { buildLocalCatalogFallbackProducts } from "./fallback";

export type ProductStaticParamRow = {
  id?: string;
  slug?: string | null;
  category_id?: string | null;
  name?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  series_name?: string | null;
  images?: string[] | null;
  flagship_image?: string | null;
};

function getMetadataSourceSlug(row: Pick<ProductStaticParamRow, "metadata">): string {
  const metadataRecord =
    row.metadata && typeof row.metadata === "object"
      ? row.metadata
      : null;
  return metadataRecord && typeof metadataRecord.sourceSlug === "string"
    ? metadataRecord.sourceSlug.trim()
    : "";
}

/** Derive a stable source key from metadata or slug shape (`oando-seating--sway` → `sway`). */
export function deriveSourceSlug(row: Pick<ProductStaticParamRow, "metadata" | "slug">): string {
  const fromMetadata = getMetadataSourceSlug(row);
  if (fromMetadata) {return fromMetadata;}

  const slug = typeof row.slug === "string" ? row.slug.trim() : "";
  if (!slug) {return "";}

  const splitIndex = slug.indexOf("--");
  if (splitIndex !== -1) {
    return slug.slice(splitIndex + 2).trim();
  }

  return slug;
}

function canonicalPriority(row: Pick<ProductStaticParamRow, "slug">): number {
  const slug = typeof row.slug === "string" ? row.slug.trim() : "";
  let score = 0;
  if (slug.startsWith("oando-")) {score += 4;}
  if (slug.includes("--")) {score += 2;}
  return score;
}

function resolveRequestedCategoryId(row: ProductStaticParamRow): string {
  const rawCategoryId = row.category_id || "";
  const normalized = normalizeRequestedCategoryId(rawCategoryId);
  if (normalized) {return normalized;}

  return classifyToRequestedCategory({
    baseCategoryId: rawCategoryId,
    seriesName: row.series_name || "",
    product: {
      id: row.id || row.slug || rawCategoryId,
      slug: row.slug || "",
      name: row.name || "",
      description: row.description || "",
      flagshipImage: row.flagship_image || "",
      sceneImages: [],
      variants: [],
      detailedInfo: {
        overview: "",
        features: [],
        dimensions: "",
        materials: [],
      },
      metadata: row.metadata || {},
      images: Array.isArray(row.images) ? row.images : [],
    },
  });
}

async function loadMergedProductRows(): Promise<ProductStaticParamRow[]> {
  const liveRows = await fetchCatalogProductsLive();
  const merged = new Map<string, ProductStaticParamRow>();

  for (const product of buildLocalCatalogFallbackProducts()) {
    const slug = typeof product.slug === "string" ? product.slug.trim() : "";
    if (!slug) {continue;}
    merged.set(slug, {
      id: product.id,
      slug: product.slug,
      category_id: product.category_id,
      name: product.name,
      description: product.description,
      metadata: (product.metadata ?? null) as Record<string, unknown> | null,
      series_name: product.series_name ?? null,
      images: product.images ?? null,
      flagship_image: product.flagship_image ?? null,
    });
  }

  for (const product of liveRows ?? []) {
    const slug = typeof product.slug === "string" ? product.slug.trim() : "";
    if (!slug) {continue;}
    merged.set(slug, {
      id: product.id,
      slug: product.slug,
      category_id: product.category_id,
      name: product.name,
      description: product.description,
      metadata: (product.metadata ?? null) as Record<string, unknown> | null,
      series_name: product.series_name ?? null,
      images: product.images ?? null,
      flagship_image: product.flagship_image ?? null,
    });
  }

  return [...merged.values()];
}

export async function buildProductStaticParams(): Promise<
  Array<{ category: string; product: string }>
> {
  const data = await loadMergedProductRows();
  const seen = new Set<string>();
  const params: Array<{ category: string; product: string }> = [];
  const preferredSlugBySourceKey = new Map<string, string>();

  for (const row of data) {
    const slug = typeof row.slug === "string" ? row.slug.trim() : "";
    if (!slug) {continue;}

    const category = resolveRequestedCategoryId(row);
    const sourceSlug = deriveSourceSlug(row);
    if (!sourceSlug) {continue;}

    const name = typeof row.name === "string" ? row.name.trim() : "";
    const sourceKey = `${category}::${name}::${sourceSlug}`;
    const currentPreferredSlug = preferredSlugBySourceKey.get(sourceKey);
    if (!currentPreferredSlug) {
      preferredSlugBySourceKey.set(sourceKey, slug);
      continue;
    }

    const existingRow = data.find((item) => item.slug === currentPreferredSlug);
    if (existingRow && canonicalPriority(row) > canonicalPriority(existingRow)) {
      preferredSlugBySourceKey.set(sourceKey, slug);
    }
  }

  for (const row of data) {
    const slug = typeof row.slug === "string" ? row.slug.trim() : "";
    if (!slug) {continue;}

    const category = resolveRequestedCategoryId(row);
    const sourceSlug = deriveSourceSlug(row);
    const name = typeof row.name === "string" ? row.name.trim() : "";

    if (sourceSlug) {
      const sourceKey = `${category}::${name}::${sourceSlug}`;
      const preferredSlug = preferredSlugBySourceKey.get(sourceKey);
      if (preferredSlug && preferredSlug !== slug) {continue;}
    }

    const key = `${category}::${slug}`;
    if (seen.has(key)) {continue;}
    seen.add(key);
    params.push({ category, product: slug });
  }

  return params;
}
