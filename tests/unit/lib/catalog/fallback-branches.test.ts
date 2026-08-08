import { beforeEach, describe, expect, it, vi } from "vitest";

describe("catalog fallback branches", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("parses folder-style ids and defaults empty categories to seating", async () => {
    vi.doMock("@/features/site/data/localCatalogIndex.json", () => ({
      default: [
        {
          id: "oando-seating--sway",
          name: "",
          images: [],
        },
        {
          slug: "",
          id: "",
          category_id: "unknown-xyz",
          name: "Skip Me",
        },
        {
          id: "orphan-product",
          category_id: "",
          name: "",
          images: [],
        },
      ],
    }));

    const { buildLocalCatalogFallbackProducts } = await import("@/lib/catalog/fallback");
    const products = buildLocalCatalogFallbackProducts();

    expect(products).toHaveLength(2);
    const sway = products.find((product) => product.slug === "oando-seating--sway");
    expect(sway?.category_id).toBe("seating");
    expect(sway?.name).toBe("Sway");
    expect(sway?.metadata?.sourceSlug).toBe("sway");

    const orphan = products.find((product) => product.slug === "orphan-product");
    expect(orphan?.category_id).toBe("seating");
    expect(orphan?.name).toBe("orphan-product");
  });

  it("handles non-array catalog index input", async () => {
    vi.doMock("@/features/site/data/localCatalogIndex.json", () => ({
      default: null,
    }));

    const { buildLocalCatalogFallbackProducts } = await import("@/lib/catalog/fallback");
    expect(buildLocalCatalogFallbackProducts()).toEqual([]);
  });
});