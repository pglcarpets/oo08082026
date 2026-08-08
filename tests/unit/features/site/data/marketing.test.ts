/**
 * Name-mirror: features/site/data/marketing
 */

import { describe, expect, it } from "vitest";
import { PRODUCT_CATEGORY_SECTION } from "@/features/site/data/marketing";

describe("PRODUCT_CATEGORY_SECTION", () => {
  it("defines table guide and catalog category cards", () => {
    expect(PRODUCT_CATEGORY_SECTION.eyebrow).toBe("Our range");
    expect(PRODUCT_CATEGORY_SECTION.tableRows).toHaveLength(4);
    expect(PRODUCT_CATEGORY_SECTION.items.length).toBeGreaterThanOrEqual(6);
    expect(PRODUCT_CATEGORY_SECTION.cta.href).toBe("/products");
    for (const item of PRODUCT_CATEGORY_SECTION.items) {
      expect(item.href).toMatch(/^\/products/);
      expect(item.image).toMatch(/^\//);
    }
  });
});
