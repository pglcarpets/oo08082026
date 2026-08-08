import {
  getCanonicalSubcategoryId,
  normalizeRequestedCategoryId,
  slugifyCatalogToken,
} from '@/lib/catalog/site/categories';

const LEGACY_CATEGORY_SLUG_SEGMENTS: Record<string, string> = {
  seating: "seating",
  "oando-seating": "seating",
  "oando-chairs": "seating",
  "oando-other-seating": "seating",
  workstations: "workstations",
  "oando-workstations": "workstations",
  tables: "tables",
  "oando-tables": "tables",
  storages: "storage",
  storage: "storage",
  "oando-storage": "storage",
  "soft-seating": "soft-seating",
  collaborative: "collaborative",
  "oando-soft-seating": "soft-seating",
  "oando-collaborative": "collaborative",
  education: "educational",
  educational: "educational",
  "oando-educational": "educational",
};

function normalize(input: unknown): string {
  return String(input || "").trim().toLowerCase();
}

export function slugifyProductName(name: unknown): string {
  return slugifyCatalogToken(name);
}

export function categorySlugSegment(categoryId: unknown): string {
  const normalized = normalize(categoryId);
  return LEGACY_CATEGORY_SLUG_SEGMENTS[normalized] || normalized.replace(/^oando-/, "") || "products";
}

export function canonicalCategorySlugSegment(categoryId: unknown): string {
  const canonical = normalizeRequestedCategoryId(String(categoryId || ""));
  return canonical || slugifyProductName(categoryId) || "products";
}

export function buildCanonicalCatalogProductSlug(input: {
  categoryId?: unknown;
  subcategoryId?: unknown;
  subcategoryLabel?: unknown;
  name?: unknown;
}): string {
  const categorySegment = canonicalCategorySlugSegment(input.categoryId);
  const subcategorySource =
    String(input.subcategoryId || "").trim() ||
    String(input.subcategoryLabel || "").trim();
  const subcategorySegment = subcategorySource
    ? getCanonicalSubcategoryId(categorySegment, subcategorySource)
    : "";
  const productNameSlug = slugifyProductName(input.name);
  if (!productNameSlug) {return "";}
  if (!subcategorySegment) {return `${categorySegment}-${productNameSlug}`;}
  return `${categorySegment}-${subcategorySegment}-${productNameSlug}`;
}

export function buildCanonicalSeriesId(input: {
  categoryId?: unknown;
  subcategoryId?: unknown;
  subcategoryLabel?: unknown;
  seriesName?: unknown;
}): string {
  const categorySegment = canonicalCategorySlugSegment(input.categoryId);
  const subcategorySource =
    String(input.subcategoryId || "").trim() ||
    String(input.subcategoryLabel || "").trim();
  const subcategorySegment = subcategorySource
    ? getCanonicalSubcategoryId(categorySegment, subcategorySource)
    : "general";
  const seriesSegment = slugifyProductName(input.seriesName || "series");
  return `${categorySegment}-${subcategorySegment}-${seriesSegment}`;
}

export function isLegacyCatalogSlug(slug: unknown, categoryId: unknown): boolean {
  const normalizedSlug = normalize(slug);
  if (!normalizedSlug) {return false;}
  return normalizedSlug.startsWith(`oando-${categorySlugSegment(categoryId)}--`);
}

export function isCanonicalCatalogSlug(slug: unknown, categoryId: unknown): boolean {
  const normalizedSlug = normalize(slug);
  if (!normalizedSlug) {return false;}
  return normalizedSlug.startsWith(`${canonicalCategorySlugSegment(categoryId)}-`);
}

export function isSupportedCatalogSlug(slug: unknown, categoryId: unknown): boolean {
  return isLegacyCatalogSlug(slug, categoryId) || isCanonicalCatalogSlug(slug, categoryId);
}

export function buildLegacyProductSlug(categoryId: unknown, name: unknown): string {
  const segment = categorySlugSegment(categoryId);
  const productNameSlug = slugifyProductName(name);
  if (!productNameSlug) {return "";}
  return `oando-${segment}--${productNameSlug}`;
}

export function buildCanonicalProductSlug(categoryId: unknown, name: unknown): string {
  return buildLegacyProductSlug(categoryId, name);
}

export function repairProductSlug(input: {
  slug?: unknown;
  categoryId?: unknown;
  name?: unknown;
}): string {
  const existing = normalize(input.slug);
  if (existing) {return existing;}
  return buildLegacyProductSlug(input.categoryId, input.name);
}
