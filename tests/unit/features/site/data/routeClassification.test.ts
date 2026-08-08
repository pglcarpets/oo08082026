import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PUBLIC_INDEXABLE_ROUTES,
  PUBLIC_INDEXABLE_STATIC_PATHS,
  PLANNER_MARKETING_SITEMAP_PATHS,
  ROBOTS_DISALLOW_PREFIXES,
  SITE_ROUTE_CLASSIFICATION,
  SOLUTION_CATEGORY_IDS,
  SOLUTION_CATEGORY_SITEMAP_PATHS,
  getRouteClassification,
} from "@/features/site/data/routeClassification";

// tests/unit/features/site/data → repo root is five levels up; pages live under site/app.
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..", "..");
const SITE_PAGES_DIR = path.join(REPO_ROOT, "site", "app", "(site)");

function globPageRoutes(dir: string, base = ""): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      routes.push(...globPageRoutes(full, path.join(base, entry)));
    } else if (entry === "page.tsx") {
      routes.push(`/${base.replace(/\\/g, "/")}`);
    }
  }
  return routes;
}

const GLOBBED_ROUTES = globPageRoutes(SITE_PAGES_DIR).sort();

const CLASSIFIED_ROUTES = SITE_ROUTE_CLASSIFICATION.map((meta) => meta.route);

describe("SITE_ROUTE_CLASSIFICATION coverage", () => {
  it("classifies every globbed (site) page.tsx route", () => {
    expect(GLOBBED_ROUTES.length).toBeGreaterThan(0);
    for (const route of GLOBBED_ROUTES) {
      expect(CLASSIFIED_ROUTES, `missing classification for ${route}`).toContain(route);
    }
  });

  it("has no duplicate route keys", () => {
    const unique = new Set(CLASSIFIED_ROUTES);
    expect(unique.size).toBe(CLASSIFIED_ROUTES.length);
  });
});

describe("getRouteClassification resolution", () => {
  it("resolves static and dynamic primary routes", () => {
    expect(getRouteClassification("/")?.route).toBe("/");
    expect(getRouteClassification("/products")?.route).toBe("/products");
    expect(getRouteClassification("/products/workstations")?.route).toBe(
      "/products/[category]",
    );
    expect(getRouteClassification("/products/workstations/deskpro-x")?.route).toBe(
      "/products/[category]/[product]",
    );
    expect(getRouteClassification("/solutions/healthcare")?.route).toBe(
      "/solutions/[category]",
    );
  });

  it("prefers static segment patterns over fully dynamic peers", () => {
    // /products/category/seating must not be mis-read as /products/[category]/[product]
    expect(getRouteClassification("/products/category/seating")?.route).toBe(
      "/products/category/[slug]",
    );
    expect(getRouteClassification("/products/seating/chair-x")?.route).toBe(
      "/products/[category]/[product]",
    );
  });

  it("classifies resolved routes honestly", () => {
    expect(getRouteClassification("/catalog")?.classification).toBe("redirect");
    expect(getRouteClassification("/login")?.classification).toBe("redirect");
    expect(getRouteClassification("/login")?.indexable).toBe(false);
    expect(getRouteClassification("/login")?.canonicalUrl).toContain("/access");
    expect(getRouteClassification("/portal/guest/view/abc")?.classification).toBe(
      "protected",
    );
    expect(getRouteClassification("/tracking")?.classification).toBe("redirect");
    expect(getRouteClassification("/tracking")?.indexable).toBe(false);
    expect(getRouteClassification("/news")?.classification).toBe("redirect");
    expect(getRouteClassification("/gallery")?.classification).toBe("redirect");
  });

  it("classifies /access as workspace auth entry (not accessibility tools)", () => {
    const meta = getRouteClassification("/access");
    expect(meta?.classification).toBe("public");
    expect(meta?.indexable).toBe(false);
    expect(meta?.intent).toMatch(/sign-in|guest/i);
    expect(meta?.intent).not.toMatch(/accessibility/i);
    expect(meta?.primaryAction).toMatch(/sign in|guest/i);
  });

  it("classifies legacy products/category alias as non-indexable redirect", () => {
    const meta = getRouteClassification("/products/category/seating");
    expect(meta?.route).toBe("/products/category/[slug]");
    expect(meta?.classification).toBe("redirect");
    expect(meta?.indexable).toBe(false);
  });

  it("marks every classified redirect route non-indexable", () => {
    const redirects = SITE_ROUTE_CLASSIFICATION.filter(
      (meta) => meta.classification === "redirect",
    );
    expect(redirects.length).toBeGreaterThan(0);
    for (const meta of redirects) {
      expect(meta.indexable, meta.route).toBe(false);
    }
  });

  it("ignores query strings when matching", () => {
    expect(getRouteClassification("/login?next=/dashboard")?.route).toBe("/login");
  });
});

describe("PUBLIC_INDEXABLE_ROUTES derivation", () => {
  it("includes marketing routes and excludes noindex utilities", () => {
    expect(PUBLIC_INDEXABLE_ROUTES).toContain("/products");
    expect(PUBLIC_INDEXABLE_ROUTES).toContain("/about");
    expect(PUBLIC_INDEXABLE_ROUTES).not.toContain("/tracking");
    expect(PUBLIC_INDEXABLE_ROUTES).not.toContain("/quote-cart");
    expect(PUBLIC_INDEXABLE_ROUTES).not.toContain("/choose-product");
    expect(PUBLIC_INDEXABLE_ROUTES).not.toContain("/brochure");
    expect(PUBLIC_INDEXABLE_ROUTES).not.toContain("/portal");
  });

  it("exposes concrete static paths without dynamic segments", () => {
    expect(PUBLIC_INDEXABLE_STATIC_PATHS).toContain("/about");
    expect(PUBLIC_INDEXABLE_STATIC_PATHS).not.toContain("/choose-product");
    expect(PUBLIC_INDEXABLE_STATIC_PATHS.every((route) => !route.includes("["))).toBe(true);
  });

  it("lists planner marketing sitemap paths outside (site)", () => {
    expect(PLANNER_MARKETING_SITEMAP_PATHS).toContain("/planner");
    expect(PLANNER_MARKETING_SITEMAP_PATHS).not.toContain("/ooplanner");
  });

  it("disallows protected and utility prefixes in robots", () => {
    expect(ROBOTS_DISALLOW_PREFIXES).toContain("/portal/");
    expect(ROBOTS_DISALLOW_PREFIXES).toContain("/ooplanner/");
    expect(ROBOTS_DISALLOW_PREFIXES).toContain("/quote-cart/");
    expect(ROBOTS_DISALLOW_PREFIXES).toContain("/tracking/");
    expect(ROBOTS_DISALLOW_PREFIXES).toContain("/choose-product/");
    expect(ROBOTS_DISALLOW_PREFIXES).toContain("/login/");
    expect(ROBOTS_DISALLOW_PREFIXES).toContain("/access/");
    expect(ROBOTS_DISALLOW_PREFIXES).toContain("/admin/");
    expect(ROBOTS_DISALLOW_PREFIXES).toContain("/api/");
    expect(ROBOTS_DISALLOW_PREFIXES).toContain("/dashboard/");
    expect(ROBOTS_DISALLOW_PREFIXES).toContain("/offline/");
  });

  it("keeps solution sitemap paths in lockstep with SOLUTION_CATEGORY_IDS", () => {
    expect(SOLUTION_CATEGORY_SITEMAP_PATHS).toEqual(
      SOLUTION_CATEGORY_IDS.map((id) => `/solutions/${id}`),
    );
    expect(SOLUTION_CATEGORY_IDS).toContain("soft-seating");
    expect(SOLUTION_CATEGORY_IDS).toContain("education");
  });
});
