import { describe, expect, it } from "vitest";
import {
  PLANNER_MARKETING_SITEMAP_PATHS,
  PUBLIC_INDEXABLE_STATIC_PATHS,
  SOLUTION_CATEGORY_IDS,
  SOLUTION_CATEGORY_SITEMAP_PATHS,
} from "@/features/site/data/routeClassification";
import {
  ADMIN_HTML_SITEMAP_PATHS,
  buildSitemapCsv,
  buildSitemapCsvRows,
  buildSitemapSections,
  getHtmlSitemapHrefs,
  getSitemapConceptualOverlaps,
  getSitemapDuplicateHrefs,
} from "@/features/site/data/htmlSitemap";

describe("htmlSitemap buildSitemapSections", () => {
  const sections = buildSitemapSections();
  const hrefs = getHtmlSitemapHrefs(sections);

  it("includes all indexable static paths from routeClassification", () => {
    for (const path of PUBLIC_INDEXABLE_STATIC_PATHS) {
      expect(hrefs).toContain(path);
    }
  });

  it("includes planner marketing and solution category sitemap paths", () => {
    for (const path of PLANNER_MARKETING_SITEMAP_PATHS) {
      expect(hrefs).toContain(path);
    }
    for (const path of SOLUTION_CATEGORY_SITEMAP_PATHS) {
      expect(hrefs).toContain(path);
    }
  });

  it("includes product category catalog paths", () => {
    for (const id of SOLUTION_CATEGORY_IDS) {
      expect(hrefs).toContain(`/products/${id}`);
    }
  });

  it("includes the XML sitemap link and all admin HTML routes", () => {
    expect(hrefs).toContain("/sitemap.xml");
    for (const path of ADMIN_HTML_SITEMAP_PATHS) {
      expect(hrefs).toContain(path);
    }
  });

  it("excludes protected and noindex utility routes outside the admin section", () => {
    const blocked = [
      "/quote-cart",
      "/tracking",
      "/access",
      "/portal",
      "/dashboard",
      "/api/health",
      "/ooplanner/",
      "/planner/canvas",
      "/planner/guest",
      "/choose-product",
    ];
    for (const path of blocked) {
      expect(hrefs.some((href) => href === path || href.startsWith(`${path}/`))).toBe(false);
    }
  });

  it("organizes links into six sections including admin", () => {
    expect(sections.map((section) => section.heading)).toEqual([
      "Products & catalog",
      "Solutions",
      "Planner",
      "Company & service",
      "Legal & policies",
      "Admin",
    ]);
    expect(sections.every((section) => section.links.length > 0)).toBe(true);
  });

  it("does not repeat the same href across multiple sections", () => {
    expect(getSitemapDuplicateHrefs(sections)).toEqual([]);
  });

  it("documents conceptual product/solution category overlaps by slug", () => {
    const overlaps = getSitemapConceptualOverlaps(sections);
    expect(overlaps).toHaveLength(SOLUTION_CATEGORY_IDS.length);
    expect(overlaps.map((overlap) => overlap.slug)).toEqual([...SOLUTION_CATEGORY_IDS]);
  });

  it("exports CSV rows for every HTML sitemap link", () => {
    const rows = buildSitemapCsvRows(sections);
    expect(rows).toHaveLength(hrefs.length);
    expect(rows.some((row) => row.section === "Admin" && row.inXmlSitemap === "no")).toBe(true);
    expect(buildSitemapCsv(sections).split("\n")[0]).toBe(
      "section,path,label,audience,in_xml_sitemap,conceptual_pair_slug",
    );
  });
});
