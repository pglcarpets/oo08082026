/**
 * Plan-symbol SVG URL helpers for marketing PDP thumbs.
 * Residual after legacy `@/features/planner/catalog/*` SVG modules were removed.
 * PNG remains the planner paint authority; SVG is a labelled read fallback.
 */

export const SVG_CATALOG_PUBLIC_PATH = "/svg-catalog" as const;

export function buildSvgCatalogPublicUrl(slug: string): string {
  const safe = slug.trim();
  return `${SVG_CATALOG_PUBLIC_PATH}/${safe}.svg`;
}

export function resolvePlanSvgUrl(input: {
  publishedSvgRevisionId?: string | null;
}): string | null {
  const id = input.publishedSvgRevisionId?.trim();
  if (!id) return null;
  // Revision API path used by residual marketing thumbs only.
  return `/api/files/svg-revisions/${encodeURIComponent(id)}`;
}

/** Published plan-symbol URL allowlist (svg-catalog + revision + png-catalog). */
export function isPublishedPlanSymbolUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith(`${SVG_CATALOG_PUBLIC_PATH}/`) ||
    trimmed.startsWith("/api/files/svg-revisions/") ||
    trimmed.startsWith("/png-catalog/") ||
    trimmed.includes("planner-symbols/")
  );
}

export function isPublishedPngPlanUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith("/png-catalog/") ||
    trimmed.includes("planner-symbols/") ||
    (trimmed.startsWith("http") && trimmed.includes("/png-catalog/"))
  );
}
