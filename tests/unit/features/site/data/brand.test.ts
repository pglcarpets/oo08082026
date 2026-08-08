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
    expect(SITE_BRAND.description).toMatch(/Patna/i);
    expect(SITE_BRAND.ogImage).toMatch(/^\//);
  });

  it("includes organization and local-business descriptions for structured data", () => {
    expect(SITE_BRAND.organizationDescription.length).toBeGreaterThan(20);
    expect(SITE_BRAND.localBusinessDescription).toMatch(/Bihar/i);
  });
});
