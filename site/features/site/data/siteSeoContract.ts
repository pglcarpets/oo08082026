/**
 * SITE-SEO-01 / 03 / 04 ó pure contracts for indexability, uniqueness, and
 * structured-data field parity. Browser recheck still required for PASS.
 */

import type { Metadata } from "next";
import {
  PUBLIC_INDEXABLE_STATIC_PATHS,
  SITE_ROUTE_CLASSIFICATION,
  type SiteRouteMeta,
} from "./routeClassification";
import {
  ABOUT_PAGE_METADATA,
  CAREER_PAGE_METADATA,
  COMPARE_PAGE_METADATA,
  CONTACT_PAGE_METADATA,
  DOWNLOADS_PAGE_METADATA,
  PLANNER_FEATURES_PAGE_METADATA,
  PLANNER_HELP_PAGE_METADATA,
  PLANNER_LANDING_PAGE_METADATA,
  PLANNING_PAGE_METADATA,
  PRIVACY_PAGE_METADATA,
  PRODUCTS_PAGE_METADATA,
  CLIENTS_PAGE_METADATA,
  REFUND_POLICY_PAGE_METADATA,
  SERVICE_PAGE_METADATA,
  SHOWROOMS_PAGE_METADATA,
  SOLUTIONS_PAGE_METADATA,
  SUSTAINABILITY_PAGE_METADATA,
  TERMS_PAGE_METADATA,
  TRUSTED_BY_PAGE_METADATA,
} from "./routeMetadata";
import { SITE_BRAND } from "./brand";
import { buildPageMetadata, buildProductJsonLd } from "./seo";
import { SITE_URL } from "@/lib/siteUrl";

/** Static indexable paths that must own unique title + description + canonical. */
export const SEO01_STATIC_METADATA: ReadonlyArray<{
  readonly path: string;
  readonly metadata: Metadata;
}> = [
  {
    path: "/",
    metadata: buildPageMetadata(SITE_URL, {
      title: SITE_BRAND.defaultTitle,
      description: SITE_BRAND.description,
      path: "/",
    }),
  },
  { path: "/about", metadata: ABOUT_PAGE_METADATA },
  { path: "/products", metadata: PRODUCTS_PAGE_METADATA },
  { path: "/solutions", metadata: SOLUTIONS_PAGE_METADATA },
  { path: "/planning", metadata: PLANNING_PAGE_METADATA },
  { path: "/planner", metadata: PLANNER_LANDING_PAGE_METADATA },
  { path: "/planner/help", metadata: PLANNER_HELP_PAGE_METADATA },
  { path: "/planner/features", metadata: PLANNER_FEATURES_PAGE_METADATA },
  { path: "/contact", metadata: CONTACT_PAGE_METADATA },
  { path: "/downloads", metadata: DOWNLOADS_PAGE_METADATA },
  { path: "/career", metadata: CAREER_PAGE_METADATA },
  { path: "/compare", metadata: COMPARE_PAGE_METADATA },
  { path: "/trusted-by", metadata: TRUSTED_BY_PAGE_METADATA },
  { path: "/showrooms", metadata: SHOWROOMS_PAGE_METADATA },
  { path: "/privacy", metadata: PRIVACY_PAGE_METADATA },
  { path: "/terms", metadata: TERMS_PAGE_METADATA },
  { path: "/refund-and-return-policy", metadata: REFUND_POLICY_PAGE_METADATA },
  { path: "/sustainability", metadata: SUSTAINABILITY_PAGE_METADATA },
  { path: "/clients", metadata: CLIENTS_PAGE_METADATA },
  { path: "/service", metadata: SERVICE_PAGE_METADATA },
  {
    path: "/sitemap",
    metadata: buildPageMetadata(SITE_URL, {
      title: "Sitemap | One&Only office furniture routes",
      description:
        "HTML sitemap of public One&Only pages ù products, solutions, planning, service, planner, and company routes.",
      path: "/sitemap",
    }),
  },
];

export function metadataTitleString(meta: Metadata): string {
  const title = meta.title;
  if (typeof title === "string") {return title;}
  if (title && typeof title === "object" && "absolute" in title && title.absolute) {
    return String(title.absolute);
  }
  if (title && typeof title === "object" && "default" in title && title.default) {
    return String(title.default);
  }
  return "";
}

export function listDuplicateTitles(
  entries: ReadonlyArray<{ path: string; metadata: Metadata }>,
): string[] {
  const seen = new Map<string, string>();
  const dups: string[] = [];
  for (const entry of entries) {
    const title = metadataTitleString(entry.metadata).trim().toLowerCase();
    if (!title) {
      dups.push(`${entry.path}: empty title`);
      continue;
    }
    const prior = seen.get(title);
    if (prior) {
      dups.push(`${entry.path} duplicates ${prior}: ${title}`);
    } else {
      seen.set(title, entry.path);
    }
  }
  return dups;
}

export function indexableStaticPathsMissingMetadata(
  classified: readonly SiteRouteMeta[] = SITE_ROUTE_CLASSIFICATION,
  registry: ReadonlyArray<{ path: string }> = SEO01_STATIC_METADATA,
): string[] {
  const registered = new Set(registry.map((entry) => entry.path));
  return classified
    .filter(
      (meta) =>
        meta.classification === "public" &&
        meta.indexable &&
        !meta.route.includes("["),
    )
    .map((meta) => meta.route)
    .filter((route) => !registered.has(route));
}

export function publicNoindexRoutes(
  classified: readonly SiteRouteMeta[] = SITE_ROUTE_CLASSIFICATION,
): string[] {
  return classified
    .filter(
      (meta) =>
        meta.classification === "public" &&
        !meta.indexable &&
        !meta.route.includes("["),
    )
    .map((meta) => meta.route);
}

export function sitemapMustExcludePaths(
  classified: readonly SiteRouteMeta[] = SITE_ROUTE_CLASSIFICATION,
): string[] {
  return classified
    .filter((meta) => !meta.indexable && !meta.route.includes("["))
    .map((meta) => meta.route);
}

/** Paths that classification marks indexable and static (for sitemap inclusion). */
export function expectedStaticSitemapPaths(): readonly string[] {
  return PUBLIC_INDEXABLE_STATIC_PATHS;
}

function significantTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

/**
 * SITE-SEO-04 helper ó product JSON-LD must be a pure projection of visible
 * fields (no offers) and the visible name/description/url must stay coherent
 * with each other (rejects silent field drift).
 */
export function productJsonLdMatchesVisible(
  siteUrl: string,
  visible: {
    name: string;
    description: string;
    url: string;
    image: string | readonly string[];
    sku?: string;
  },
): boolean {
  const name = visible.name.trim();
  const description = visible.description.trim();
  if (!name || !description) {return false;}

  const nameTokens = significantTokens(name);
  if (nameTokens.length === 0) {return false;}

  const urlLower = visible.url.toLowerCase();
  const descLower = description.toLowerCase();
  // Name tokens must appear in the product URL slug/path (identity drift guard).
  if (!nameTokens.some((token) => urlLower.includes(token))) {return false;}
  // Description must still relate to the product name, or be a full product blurb
  // (rejects empty/stub drift like "drifted" while allowing category-level copy).
  const descriptionMentionsName = nameTokens.some((token) =>
    descLower.includes(token),
  );
  if (!descriptionMentionsName && description.length < 24) {return false;}

  const ld = buildProductJsonLd(siteUrl, visible);
  if (ld.name !== visible.name) {return false;}
  if (ld.description !== visible.description) {return false;}
  if (ld.url.replace(/\/+$/, "") !== visible.url.replace(/\/+$/, "")) {return false;}
  if ("offers" in ld) {return false;}
  if (visible.sku && ld.sku !== visible.sku) {return false;}
  return true;
}
