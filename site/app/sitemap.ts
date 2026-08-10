import type { MetadataRoute } from "next";
import { getCatalog } from '@/lib/catalog/site/getProducts';
import { buildRequestedCategoryCatalog } from '@/lib/catalog/site/categories';
import {
  PLANNER_MARKETING_SITEMAP_PATHS,
  PUBLIC_INDEXABLE_STATIC_PATHS,
  SOLUTION_CATEGORY_SITEMAP_PATHS,
} from "@/features/site/data/routeClassification";
import { buildCanonicalUrl, sanitizeCanonicalPath } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";

const BASE_URL = SITE_URL.replace(/\/+$/, "");

/** Public marketing/product paths only — never admin/api/private shells. */
const STATIC_SITEMAP_PATHS = Array.from(
  new Set<string>([
    ...PUBLIC_INDEXABLE_STATIC_PATHS,
    ...PLANNER_MARKETING_SITEMAP_PATHS,
    ...SOLUTION_CATEGORY_SITEMAP_PATHS,
  ]),
);

/**
 * Stable lastModified reference for static marketing routes.
 *
 * Captured ONCE per server instance (cold start), NOT on every sitemap()
 * invocation. Previously this used `new Date()` inside sitemap(), so every
 * edge-cache refresh stamped all entries with a fresh identical "now" — Google
 * then saw every URL as modified-in-lockstep periodically, which devalues
 * <lastmod> as a per-URL freshness / crawl-prioritization signal. A stable
 * epoch only shifts when a new instance cold-starts (far rarer than a cache
 * miss), so lastmod stays coherent across cache refreshes.
 *
 * Catalog product/category entries still fall back to this epoch; plumbing
 * real per-URL `created_at`/`updated_at` from the catalog is a follow-up.
 */
const SITEMAP_EPOCH = new Date();

/** Catalog id/slug segments — reject host injection and path traversal. */
function isSafeSitemapSegment(segment: unknown): segment is string {
  return typeof segment === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._~-]*$/.test(segment);
}

function sitemapUrl(path: string): string {
  // Same host-safe builder as page canonicals — never emit foreign origins.
  return buildCanonicalUrl(BASE_URL, path);
}

function isPublicProductSitemapPath(path: string): boolean {
  const safe = sanitizeCanonicalPath(path);
  if (safe === "/") {
    return false;
  }
  // Only /products/{category}/ and /products/{category}/{slug}/ from catalog.
  return /^\/products\/[a-zA-Z0-9][a-zA-Z0-9._~-]*(\/[a-zA-Z0-9][a-zA-Z0-9._~-]*)?\/$/.test(
    safe,
  );
}

/** Higher priority = stronger crawl signal for commercial / conversion URLs. */
function staticPathPriority(path: string): number {
  if (path === "/") return 1;
  if (path === "/products" || path.startsWith("/products/")) return 0.95;
  if (path === "/solutions" || path.startsWith("/solutions/")) return 0.9;
  if (path === "/planning" || path === "/planner" || path.startsWith("/planner/")) {
    return 0.85;
  }
  if (path === "/contact" || path === "/showrooms" || path === "/downloads") {
    return 0.85;
  }
  if (path === "/clients" || path === "/trusted-by" || path === "/about") return 0.75;
  if (path === "/privacy" || path === "/terms" || path === "/refund-and-return-policy") {
    return 0.3;
  }
  return 0.65;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = SITEMAP_EPOCH;
  const entries: MetadataRoute.Sitemap = STATIC_SITEMAP_PATHS.map((path) => ({
    url: sitemapUrl(path),
    lastModified,
    changeFrequency:
      path === "/" || path === "/products"
        ? "daily"
        : path.startsWith("/products/")
          ? "weekly"
          : "weekly",
    priority: staticPathPriority(path),
  }));

  try {
    const catalog = buildRequestedCategoryCatalog(await getCatalog());
    for (const category of catalog) {
      if (!isSafeSitemapSegment(category.id)) {
        continue;
      }
      const categoryPath = `/products/${category.id}`;
      if (!isPublicProductSitemapPath(categoryPath)) {
        continue;
      }
      entries.push({
        url: sitemapUrl(categoryPath),
        lastModified,
        changeFrequency: "weekly",
        priority: 0.8,
      });

      for (const series of category.series) {
        for (const product of series.products) {
          const slug = product.slug || product.id;
          if (!isSafeSitemapSegment(slug)) {
            continue;
          }
          const productPath = `/products/${category.id}/${slug}`;
          if (!isPublicProductSitemapPath(productPath)) {
            continue;
          }
          entries.push({
            url: sitemapUrl(productPath),
            lastModified,
            changeFrequency: "monthly",
            priority: 0.6,
          });
        }
      }
    }
  } catch {
    // Keep static sitemap if catalog fetch fails.
  }

  // Dedupe by canonical URL (static lists can overlap; catalog may re-emit categories).
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}