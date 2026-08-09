/**
 * Re-export path kept for older inventory paths.
 * Authoritative env-host coverage: tests/unit/app/robots.test.ts
 */
import { describe, it, expect } from "vitest";
import robots from "@/app/robots";
import { ROBOTS_DISALLOW_PREFIXES } from "@/features/site/data/routeClassification";
import { SITE_URL } from "@/lib/siteUrl";

describe("robots.ts (stable import)", () => {
  it("returns valid robots config aligned with route classification", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const first = rules[0];
    expect(first?.userAgent).toBe("*");
    // Explicit major crawlers share the same allow/disallow map.
    const agents = rules.map((rule) => rule?.userAgent);
    expect(agents).toEqual(
      expect.arrayContaining(["*", "Googlebot", "Bingbot", "Googlebot-Image"]),
    );
    const sitemaps = Array.isArray(config.sitemap)
      ? config.sitemap
      : config.sitemap
        ? [config.sitemap]
        : [];
    expect(sitemaps[0]).toContain("/sitemap.xml");
    expect(first?.disallow).toEqual([...ROBOTS_DISALLOW_PREFIXES]);
    expect(first?.disallow).toContain("/portal/");
    expect(first?.disallow).toContain("/ooplanner/");
  });

  it("disallows admin, api, private planner, portal, dashboard, access, offline", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const disallow = rules[0]?.disallow ?? [];
    const disallowList = Array.isArray(disallow) ? disallow : [disallow];
    for (const prefix of [
      "/admin/",
      "/api/",
      "/portal/",
      "/dashboard/",
      "/access/",
      "/login/",
      "/ooplanner/",
      "/offline/",
      "/quote-cart/",
      "/choose-product/",
    ]) {
      expect(disallowList, prefix).toContain(prefix);
    }
    // Marketing planner landing stays allowlisted (not in disallow).
    expect(disallowList).not.toContain("/planner/");
    expect(disallowList).not.toContain("/products/");
  });

  it("uses SITE_URL host (never hardcoded localhost) for sitemap and host", () => {
    const config = robots();
    const host = String(config.host ?? "");
    const sitemaps = Array.isArray(config.sitemap)
      ? config.sitemap
      : config.sitemap
        ? [config.sitemap]
        : [];
    const sitemap = String(sitemaps[0] ?? "");
    expect(host).toBe(SITE_URL.replace(/\/+$/, ""));
    expect(sitemap).toBe(`${SITE_URL.replace(/\/+$/, "")}/sitemap.xml`);
    expect(host).not.toMatch(/localhost|127\.0\.0\.1/i);
    expect(sitemap).not.toMatch(/localhost|127\.0\.0\.1/i);
  });
});
