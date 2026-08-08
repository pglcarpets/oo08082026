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
const STATIC_SITEMAP_PATHS = [
  ...PUBLIC_INDEXABLE_STATIC_PATHS,
  ...PLANNER_MARKETING_SITEMAP_PATHS,
  ...SOLUTION_CATEGORY_SITEMAP_PATHS,
];

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_SITEMAP_PATHS.map((path) => ({
    url: sitemapUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : path.startsWith("/planner") ? 0.8 : 0.7,
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
        lastModified: now,
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
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.6,
          });
        }
      }
    }
  } catch {
    // Keep static sitemap if catalog fetch fails.
  }

  return entries;
}