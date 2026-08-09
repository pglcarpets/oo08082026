/**
 * Keep install photography and project case studies out of product grids / PDP galleries.
 */

export type CatalogPublishabilityInput = {
  slug?: string | null;
  name?: string | null;
  baseCategoryId?: string | null;
  categoryId?: string | null;
  category_id?: string | null;
  flagshipImage?: string | null;
  images?: readonly (string | null | undefined)[] | null;
};

const PROJECT_CASE_STUDY_NAME_PATTERN =
  /\b(abdul hai|dmrc office|tcs workspace|honda office)\b/i;

/** Scraped SKUs with no publishable CDN asset set — hide from public grids. */
const UNPUBLISHED_CATALOG_SLUGS = new Set([
  "crox",
  "oando-seating--crox",
]);

export function isProjectOrInstallCatalogEntry(input: CatalogPublishabilityInput): boolean {
  const slug = String(input.slug || "").trim().toLowerCase();
  const name = String(input.name || "").trim();
  const category = String(
    input.baseCategoryId || input.categoryId || input.category_id || "",
  )
    .trim()
    .toLowerCase();

  if (category === "projects") {return true;}
  if (slug.startsWith("project-")) {return true;}
  if (slug.includes("abdul-hai") || slug.includes("dmrc-office")) {return true;}
  if (name && PROJECT_CASE_STUDY_NAME_PATTERN.test(name)) {return true;}
  return false;
}

function hasPublishableCatalogMedia(input: CatalogPublishabilityInput): boolean {
  const candidates = [input.flagshipImage, ...(input.images ?? [])].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  if (candidates.length === 0) {return true;}
  return filterProductCatalogMedia(candidates).length > 0;
}

export function isPublishableCatalogProduct(input: CatalogPublishabilityInput): boolean {
  const slug = String(input.slug || "").trim().toLowerCase();
  if (UNPUBLISHED_CATALOG_SLUGS.has(slug)) {return false;}
  if (isProjectOrInstallCatalogEntry(input)) {return false;}
  return hasPublishableCatalogMedia(input);
}

/** Product still paths — not `/assets/marketing/projects/*` or scraped install folders. */
export function isProductCatalogMediaPath(path: string | null | undefined): boolean {
  const value = String(path || "").trim();
  if (!value) {return false;}

  const lower = value.toLowerCase();
  if (lower.startsWith("/assets/marketing/projects/")) {return false;}
  if (lower.startsWith("/assets/catalog/products/")) {return false;}
  if (/\/assets\/catalog\/project-/i.test(lower)) {return false;}
  if (/\/assets\/catalog\/honda-office\//i.test(lower)) {return false;}
  if (/\/assets\/catalog\/tcs-workspace\//i.test(lower)) {return false;}
  if (/\/assets\/catalog\/686d3b55385e7b905b01d3a5_/i.test(lower)) {return false;}
  if (lower.includes("/project-gallery-")) {return false;}
  return true;
}

export function filterProductCatalogMedia(
  paths: readonly (string | null | undefined)[] | null | undefined,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of paths ?? []) {
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value || !isProductCatalogMediaPath(value) || seen.has(value)) {continue;}
    seen.add(value);
    out.push(value);
  }
  return out;
}
