import { describe, expect, it } from "vitest";

import { buildLocalCatalogFallbackProducts } from "@/lib/catalog/fallback";

describe("catalog fallback", () => {
  it("builds normalized local catalog products from the index", () => {
    const first = buildLocalCatalogFallbackProducts();
    const second = buildLocalCatalogFallbackProducts();

    expect(first.length).toBeGreaterThan(0);
    expect(second).toBe(first);
    expect(first.every((product) => product.slug.length > 0)).toBe(true);
    expect(first.every((product) => product.category_id.length > 0)).toBe(true);
    expect(first.every((product) => /^[0-9a-f-]{36}$/.test(product.id))).toBe(true);
    expect(first.every((product) => product.metadata?.source === "local-catalog-fallback")).toBe(true);
  });

  it("normalizes oando category tokens and stores source metadata", () => {
    const products = buildLocalCatalogFallbackProducts();
    const sway = products.find((product) => product.name.includes("Sway"));
    expect(sway).toBeDefined();
    expect(sway!.category_id).not.toMatch(/^oando-/);
    expect(sway!.metadata?.sourceSlug).not.toEqual("");
    expect(sway!.metadata?.category).toBe(sway!.category_id);
  });

  it("sorts products alphabetically by name", () => {
    const products = buildLocalCatalogFallbackProducts();
    const names = products.map((product) => product.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });
});
