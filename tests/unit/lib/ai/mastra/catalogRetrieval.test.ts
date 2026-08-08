/**
 * Catalog retrieval for the AI advisor prompt — LanceDB vector recall, Orama
 * lexical recall, catalog-order tail. Vector layer is mocked (no embedder key
 * in unit runs); the Orama layer runs for real.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

import type { RetrievableProduct } from "@/lib/ai/mastra/catalogRetrieval";

const { searchCatalogVectors } = vi.hoisted(() => ({
  searchCatalogVectors: vi.fn(),
}));

vi.mock("@/lib/ai/mastra/catalogRag", () => ({
  searchCatalogVectors,
}));

const { retrieveCatalogProducts } = await import("@/lib/ai/mastra/catalogRetrieval");

function product(
  slug: string,
  name: string,
  extra: Partial<RetrievableProduct> = {},
): RetrievableProduct {
  return {
    id: `id-${slug}`,
    slug,
    name,
    category_id: "seating",
    ...extra,
  };
}

const CATALOG: RetrievableProduct[] = [
  product("aero-desk", "Aero Height Adjustable Desk", { category_id: "workstations" }),
  product("nimbus-chair", "Nimbus Ergonomic Task Chair", {
    metadata: { tags: ["ergonomic", "mesh"] },
  }),
  product("vault-locker", "Vault Personal Locker", { category_id: "storages" }),
  product("halo-table", "Halo Conference Table", { category_id: "tables" }),
];

describe("retrieveCatalogProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchCatalogVectors.mockResolvedValue([]);
  });

  it("returns nothing for an empty catalog or non-positive limit", async () => {
    await expect(retrieveCatalogProducts("chair", [], 5)).resolves.toEqual({
      products: [],
      sources: [],
    });
    await expect(retrieveCatalogProducts("chair", CATALOG, 0)).resolves.toEqual({
      products: [],
      sources: [],
    });
    expect(searchCatalogVectors).not.toHaveBeenCalled();
  });

  it("falls back to catalog order for a too-short query", async () => {
    const result = await retrieveCatalogProducts("a", CATALOG, 2);
    expect(result.products.map((p) => p.slug)).toEqual(["aero-desk", "nimbus-chair"]);
    expect(result.sources).toEqual(["catalog-order"]);
    expect(searchCatalogVectors).not.toHaveBeenCalled();
  });

  it("ranks lexical matches ahead of catalog order", async () => {
    const result = await retrieveCatalogProducts("ergonomic task chair", CATALOG, 3);
    expect(result.products[0]?.slug).toBe("nimbus-chair");
    expect(result.products).toHaveLength(3);
    expect(result.sources).toContain("lexical");
  });

  it("puts LanceDB vector hits first, matched by product id", async () => {
    searchCatalogVectors.mockResolvedValue([
      { id: "product:id-vault-locker", score: 0.9 },
      { id: "category:storages", score: 0.8 },
      { id: "product:id-halo-table", score: 0.7 },
    ]);

    const result = await retrieveCatalogProducts("ergonomic task chair", CATALOG, 4);
    expect(result.products.map((p) => p.slug).slice(0, 2)).toEqual([
      "vault-locker",
      "halo-table",
    ]);
    expect(result.sources[0]).toBe("vector");
    // No duplicates, whole catalog covered by the tail filler.
    expect(new Set(result.products.map((p) => p.slug)).size).toBe(4);
  });

  it("degrades to lexical + catalog order when vector recall throws", async () => {
    searchCatalogVectors.mockRejectedValue(new Error("lancedb offline"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await retrieveCatalogProducts("locker", CATALOG, 2);
    expect(result.products[0]?.slug).toBe("vault-locker");
    expect(result.sources).not.toContain("vector");
    expect(errorSpy).toHaveBeenCalledWith(
      "[catalog-retrieval] vector recall failed:",
      expect.any(Error),
    );
    errorSpy.mockRestore();
  });

  it("caps results at the requested limit", async () => {
    const result = await retrieveCatalogProducts("desk", CATALOG, 1);
    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.slug).toBe("aero-desk");
  });
});
