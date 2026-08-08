import { sanitizeDisplayText } from "@/lib/displayText";

export type CatalogDedupeProduct = {
  slug?: string | null;
  name?: string | null;
  flagshipImage?: string | null;
  images?: readonly (string | null | undefined)[] | null;
  metadata?: { source?: string; subcategory?: string } | null;
};

function normalizeDedupeName(value?: string | null): string {
  const base = sanitizeDisplayText(String(value || ""));
  const withoutParen = base.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  return withoutParen.toLowerCase();
}

function getPrimaryImage(
  product: Pick<CatalogDedupeProduct, "images" | "flagshipImage">,
): string {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return String(product.images[0] || "").trim();
  }
  return String(product.flagshipImage || "").trim();
}

/** Prefer canonical oando catalog slugs and photography over legacy scrape duplicates. */
export function catalogProductDedupePriority(product: CatalogDedupeProduct): number {
  const slug = String(product.slug || "").trim().toLowerCase();
  let score = 0;
  if (/^oando-[a-z0-9-]+--/.test(slug)) {score += 8;}
  if (slug.includes("--")) {score += 4;}
  if (slug.startsWith("oando-")) {score += 2;}
  if (/-(?:chair|table|desk|stool)$/i.test(slug)) {score -= 6;}
  const image = getPrimaryImage(product);
  if (/\/images\/catalog\/oando-/i.test(image)) {score += 4;}
  if (/\/images\/products\//i.test(image)) {score -= 4;}
  if (product.metadata?.source === "oando.co.in") {score += 1;}
  return score;
}

/** Collapse legacy scrape duplicates (e.g. arvo + arvo-chair) to one card per product name. */
export function dedupeCatalogProductsByName<T extends CatalogDedupeProduct>(products: T[]): T[] {
  const bestByKey = new Map<string, T>();

  for (const product of products) {
    const key = normalizeDedupeName(product.name);
    if (!key) {continue;}
    const existing = bestByKey.get(key);
    if (
      !existing ||
      catalogProductDedupePriority(product) > catalogProductDedupePriority(existing)
    ) {
      bestByKey.set(key, product);
    }
  }

  return Array.from(bestByKey.values());
}
