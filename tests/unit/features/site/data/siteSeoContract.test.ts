// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Metadata } from "next";

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

describe("siteSeoContract (name-mirror)", () => {
  it("registers metadata for every static indexable public path", () => {
    expect(indexableStaticPathsMissingMetadata()).toEqual([]);
    expect(SEO01_STATIC_METADATA.length).toBeGreaterThan(10);
  });

  it("metadataTitleString handles string, absolute, and default title shapes", () => {
    expect(metadataTitleString({ title: "Plain" })).toBe("Plain");
    expect(
      metadataTitleString({ title: { absolute: "Absolute title" } } as Metadata),
    ).toBe("Absolute title");
    expect(
      metadataTitleString({ title: { default: "Default title" } } as Metadata),
    ).toBe("Default title");
    expect(metadataTitleString({})).toBe("");
  });

  it("listDuplicateTitles flags empty and colliding titles", () => {
    const entries: Array<{ path: string; metadata: Metadata }> = [
      { path: "/a", metadata: { title: "Same" } },
      { path: "/b", metadata: { title: "Same" } },
      { path: "/c", metadata: { title: "   " } },
    ];
    const dups = listDuplicateTitles(entries);
    expect(dups.some((d) => d.includes("/b duplicates /a"))).toBe(true);
    expect(dups.some((d) => d.includes("/c: empty title"))).toBe(true);
  });

  it("exposes sitemap include/exclude helpers from classification", () => {
    const expected = expectedStaticSitemapPaths();
    expect(expected).toContain("/");
    expect(expected).toContain("/products");
    expect(publicNoindexRoutes().length).toBeGreaterThan(0);
    expect(sitemapMustExcludePaths().length).toBeGreaterThan(0);
  });

  it("productJsonLdMatchesVisible confirms visible field parity without offers", () => {
    const visible = {
      name: "Side Table",
      description: "Compact side table",
      url: "https://example.com/products/tables/side-table-001",
      image: "https://example.com/assets/catalog/side-table.webp",
      sku: "OFL-TBL-001",
    };
    expect(productJsonLdMatchesVisible("https://example.com", visible)).toBe(
      true,
    );
    // Trailing slash on absolute URL still matches after normalize.
    expect(
      productJsonLdMatchesVisible("https://example.com", {
        ...visible,
        url: `${visible.url}/`,
      }),
    ).toBe(true);
  });
});

