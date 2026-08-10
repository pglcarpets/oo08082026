/**
 * Name-mirror: features/site/data/brand
 */

import { describe, expect, it } from "vitest";
import { SITE_BRAND } from "@/features/site/data/brand";

describe("SITE_BRAND", () => {
  it("defines company identity, default title, and OG image path", () => {
    expect(SITE_BRAND.companyName).toBe("One&Only");
    expect(SITE_BRAND.siteName).toBe("One&Only");
    expect(SITE_BRAND.titleSuffix).toBe("One&Only");
    expect(SITE_BRAND.defaultTitle).toContain("One&Only");
    expect(SITE_BRAND.defaultTitle).toMatch(/One and Only Furniture/i);
    expect(SITE_BRAND.description).toMatch(/India/i);
    expect(SITE_BRAND.description).toMatch(/One and Only Furniture/i);
    // National homepage copy must not read as a Patna-only brand.
    expect(SITE_BRAND.description).not.toMatch(/Patna|Ranchi|Jharkhand|Bihar/i);
    expect(SITE_BRAND.ogImage).toMatch(/^\//);
  });

  it("includes organization and local-business descriptions for structured data", () => {
    expect(SITE_BRAND.organizationDescription.length).toBeGreaterThan(20);
    expect(SITE_BRAND.localBusinessDescription).toMatch(/India/i);
    expect(SITE_BRAND.organizationDescription).not.toMatch(
      /Patna|Ranchi|Jharkhand|Bihar/i,
    );
    // Local business node may name the Patna HQ for maps / local queries.
    expect(SITE_BRAND.localBusinessDescription).toMatch(/Patna/i);
    expect(SITE_BRAND.localBusinessDescription).toMatch(/One and Only Furniture/i);
  });

  it("lists search aliases people actually type (One and Only…)", () => {
    expect(SITE_BRAND.legalName).toMatch(/One and Only Furniture/i);
    expect(SITE_BRAND.alternateNames).toEqual(
      expect.arrayContaining([
        "One and Only",
        "One and Only Furniture",
        "One and Only Patna",
        "One and Only Furniture Patna",
      ]),
    );
    expect(SITE_BRAND.brandKeywords).toEqual(
      expect.arrayContaining([
        "One and Only Furniture",
        "One and Only Patna",
        "office furniture Patna",
      ]),
    );
  });
});
