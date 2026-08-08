/**
 * SITE-SEO-01, SITE-SEO-03, SITE-SEO-04 — unit contracts.
 * Browser/prod recheck still required before checklist PASS.
 */

import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  PLANNER_MARKETING_SITEMAP_PATHS,
  PUBLIC_INDEXABLE_STATIC_PATHS,
  ROBOTS_DISALLOW_PREFIXES,
  SITE_ROUTE_CLASSIFICATION,
  getRouteClassification,
} from "@/features/site/data/routeClassification";
import {
  SEO01_STATIC_METADATA,
  expectedStaticSitemapPaths,
  indexableStaticPathsMissingMetadata,
  listDuplicateTitles,
  metadataTitleString,
  productJsonLdMatchesVisible,
  publicNoindexRoutes,
  sitemapMustExcludePaths,
} from "@/features/site/data/siteSeoContract";
import {
  buildPageMetadata,
  buildProductJsonLd,
  countBrandPipeSegments,
  resolveDocumentTitle,
} from "@/features/site/data/seo";
import {
  ACCESS_PAGE_METADATA,
  CHOOSE_PRODUCT_PAGE_METADATA,
  QUOTE_CART_PAGE_METADATA,
} from "@/features/site/data/routeMetadata";
import { SITE_URL } from "@/lib/siteUrl";
import { SITE_BRAND } from "@/features/site/data/brand";

function normalizeSitemapPathname(path: string): string {
  if (path === "/") {
    return "/";
  }
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

function sitemapUrlsIncludeExactPath(urls: readonly string[], path: string): boolean {
  const target = normalizeSitemapPathname(path);
  return urls.some((url) => normalizeSitemapPathname(new URL(url).pathname) === target);
}

describe("SITE-SEO-01 unique title, description, canonical", () => {
  it("registers metadata for every static indexable public path", () => {
    expect(indexableStaticPathsMissingMetadata()).toEqual([]);
  });

  it("gives each static marketing page a unique non-empty title and description", () => {
    const dups = listDuplicateTitles(SEO01_STATIC_METADATA);
    expect(dups).toEqual([]);

    for (const entry of SEO01_STATIC_METADATA) {
      const title = metadataTitleString(entry.metadata);
      expect(title.length, entry.path).toBeGreaterThan(3);
      expect(String(entry.metadata.description ?? "").length, entry.path).toBeGreaterThan(
        20,
      );
      const canonical = entry.metadata.alternates?.canonical;
      expect(canonical, entry.path).toBeDefined();
      expect(String(canonical), entry.path).toContain(entry.path === "/" ? "" : entry.path);
    }
  });

  it("SF-02: static titles are absolute and never double the brand suffix", () => {
    for (const entry of SEO01_STATIC_METADATA) {
      const raw = entry.metadata.title;
      expect(raw && typeof raw === "object" && "absolute" in raw, entry.path).toBe(true);
      const title = metadataTitleString(entry.metadata);
      expect(countBrandPipeSegments(title), entry.path).toBeLessThanOrEqual(1);
      expect(title, entry.path).not.toMatch(
        new RegExp(
          `${SITE_BRAND.titleSuffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[|–—-]\\s*${SITE_BRAND.titleSuffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
          "i",
        ),
      );
      // resolveDocumentTitle is idempotent on absolute page titles
      expect(resolveDocumentTitle(title), entry.path).toBe(title);
    }
  });

  it("host honesty: static canonicals use SITE_URL origin, never localhost", () => {
    const origin = new URL(SITE_URL).origin;
    for (const entry of SEO01_STATIC_METADATA) {
      const canonical = String(entry.metadata.alternates?.canonical ?? "");
      expect(canonical, entry.path).toMatch(new RegExp(`^${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
      expect(canonical, entry.path).not.toMatch(/localhost|127\.0\.0\.1/i);
    }
  });

  it("covers the same set as PUBLIC_INDEXABLE_STATIC_PATHS", () => {
    expect([...expectedStaticSitemapPaths()].sort()).toEqual(
      [...PUBLIC_INDEXABLE_STATIC_PATHS].sort(),
    );
  });
});

describe("SITE-SEO-03 sitemap, robots, classification agreement", () => {
  it("classifies brochure aliases as redirects (not indexable documents)", () => {
    expect(getRouteClassification("/brochure")?.classification).toBe("redirect");
    expect(getRouteClassification("/brochure")?.indexable).toBe(false);
    expect(getRouteClassification("/download-brochure")?.classification).toBe(
      "redirect",
    );
    expect(getRouteClassification("/download-brochure")?.indexable).toBe(false);
  });

  it("marks auth and cart utilities noindex in classification", () => {
    for (const route of [
      "/quote-cart",
      "/tracking",
      "/access",
      "/repo-store",
      "/choose-product",
    ]) {
      expect(getRouteClassification(route)?.indexable, route).toBe(false);
    }
  });

  it("classifies retired repo-store as redirect home", () => {
    expect(getRouteClassification("/repo-store")?.classification).toBe("redirect");
    expect(getRouteClassification("/repo-store")?.canonicalUrl).toContain("/");
  });

  it("emits robots noindex on utility page metadata", () => {
    for (const meta of [
      QUOTE_CART_PAGE_METADATA,
      ACCESS_PAGE_METADATA,
      CHOOSE_PRODUCT_PAGE_METADATA,
    ]) {
      expect(meta.robots).toEqual({ index: false, follow: false });
    }
  });

  it("classifies retired portal SVG catalog as redirect + noindex", () => {
    expect(getRouteClassification("/portal/svg-catalog")?.classification).toBe(
      "redirect",
    );
    expect(getRouteClassification("/portal/svg-catalog")?.indexable).toBe(false);
    expect(getRouteClassification("/portal/svg-catalog/[slug]")?.classification).toBe(
      "redirect",
    );
    expect(getRouteClassification("/portal/svg-catalog/[slug]")?.indexable).toBe(
      false,
    );
    expect(getRouteClassification("/portal/svg-catalog")?.canonicalUrl).toContain(
      "/products",
    );
  });

  it("robots.txt disallows protected and utility prefixes", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const disallow = rules[0]?.disallow ?? [];
    const disallowList = Array.isArray(disallow) ? disallow : [disallow];
    for (const prefix of ROBOTS_DISALLOW_PREFIXES) {
      expect(disallowList).toContain(prefix);
    }
    expect(disallowList).toContain("/quote-cart/");
    expect(disallowList).toContain("/tracking/");
    expect(disallowList).toContain("/choose-product/");
    expect(disallowList).toContain("/portal/");
    expect(disallowList).toContain("/admin/");
    expect(disallowList).toContain("/api/");
    expect(disallowList).toContain("/dashboard/");
    expect(disallowList).toContain("/access/");
    expect(disallowList).toContain("/offline/");
    expect(disallowList).toContain("/ooplanner/");
  });

  it("sitemap includes only indexable static + planner marketing paths", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    for (const path of PUBLIC_INDEXABLE_STATIC_PATHS) {
      if (path === "/") {
        expect(urls.some((url) => /^https?:\/\/[^/]+\/$/.test(url)), "missing /").toBe(true);
      } else {
        expect(sitemapUrlsIncludeExactPath(urls, path), `missing ${path}`).toBe(true);
      }
    }
    for (const path of PLANNER_MARKETING_SITEMAP_PATHS) {
      expect(sitemapUrlsIncludeExactPath(urls, path), `missing planner ${path}`).toBe(true);
    }

    for (const path of sitemapMustExcludePaths()) {
      if (path === "/_not-found") continue;
      expect(sitemapUrlsIncludeExactPath(urls, path), `must exclude ${path}`).toBe(false);
    }
  });

  it("does not list redirect-only or noindex utilities as public indexable", () => {
    expect(PUBLIC_INDEXABLE_STATIC_PATHS).not.toContain("/brochure");
    expect(PUBLIC_INDEXABLE_STATIC_PATHS).not.toContain("/download-brochure");
    expect(PUBLIC_INDEXABLE_STATIC_PATHS).not.toContain("/choose-product");
    expect(publicNoindexRoutes()).toContain("/quote-cart");
  });

  it("buildPageMetadata defaults indexable and can force noindex", () => {
    const indexed = buildPageMetadata("https://example.com", {
      title: "A",
      description: "A long enough description for SEO tests.",
      path: "/a",
    });
    expect(indexed.robots).toEqual({ index: true, follow: true });

    const blocked = buildPageMetadata("https://example.com", {
      title: "B",
      description: "A long enough description for SEO tests.",
      path: "/b",
      indexable: false,
    });
    expect(blocked.robots).toEqual({ index: false, follow: false });
  });
});

describe("SITE-SEO-04 structured data matches visible product fields", () => {
  it("buildProductJsonLd copies name, description, url, sku and invents no offers", () => {
    const visible = {
      name: "Desk Pro X",
      description: "Modular workstation for open offices.",
      url: "https://example.com/products/workstations/desk-pro-x",
      image: "/assets/catalog/desk.webp",
      sku: "desk-pro-x",
    };
    expect(productJsonLdMatchesVisible("https://example.com", visible)).toBe(
      true,
    );
    const ld = buildProductJsonLd("https://example.com", visible);
    expect(ld["@type"]).toBe("Product");
    expect(ld["@id"]).toBe(
      "https://example.com/products/workstations/desk-pro-x#product",
    );
    expect(ld.image).toBe("https://example.com/assets/catalog/desk.webp");
    expect(ld).not.toHaveProperty("offers");
  });

  it("classifies every (site) route with an access decision", () => {
    expect(SITE_ROUTE_CLASSIFICATION.length).toBeGreaterThan(20);
    for (const meta of SITE_ROUTE_CLASSIFICATION) {
      expect(["public", "protected", "redirect", "not-found", "removed"]).toContain(
        meta.classification,
      );
      expect(typeof meta.indexable).toBe("boolean");
    }
  });
});
