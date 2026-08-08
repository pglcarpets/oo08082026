/**
 * Name-mirror coverage for lib/catalog/site/getProducts.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchAllProductsLive = vi.fn();
const fetchCategoryIdsLive = vi.fn();
const fetchProductByUrlKeyLive = vi.fn();
const fetchProductsByCategoryLive = vi.fn();
const buildCatalogLive = vi.fn();

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

vi.mock("@/features/site/data/fallbacks", () => ({
  CATALOG_REVALIDATE_SECONDS: 60,
}));

vi.mock("@/lib/catalog/catalogTree", () => ({
  buildCatalogLive: () => buildCatalogLive(),
}));

vi.mock("@/lib/catalog/sources", () => ({
  fetchAllProductsLive: () => fetchAllProductsLive(),
  fetchCategoryIdsLive: () => fetchCategoryIdsLive(),
  fetchProductByUrlKeyLive: (key: string) => fetchProductByUrlKeyLive(key),
  fetchProductsByCategoryLive: (id: string) => fetchProductsByCategoryLive(id),
}));

describe("catalog/site/getProducts", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchAllProductsLive.mockReset();
    fetchCategoryIdsLive.mockReset();
    fetchProductByUrlKeyLive.mockReset();
    fetchProductsByCategoryLive.mockReset();
    buildCatalogLive.mockReset();

    fetchAllProductsLive.mockResolvedValue([{ id: "prod1", name: "Product 1" }]);
    fetchCategoryIdsLive.mockResolvedValue(["cat1", "cat2"]);
    fetchProductByUrlKeyLive.mockResolvedValue({ id: "prod1", name: "Product 1" });
    fetchProductsByCategoryLive.mockResolvedValue([{ id: "prod1", name: "Product 1" }]);
    buildCatalogLive.mockResolvedValue([{ id: "cat1", name: "Category 1" }]);
  });

  it("exports catalog accessors that resolve through sources", async () => {
    const mod = await import("@/lib/catalog/site/getProducts");

    await expect(mod.getProducts()).resolves.toEqual([
      { id: "prod1", name: "Product 1" },
    ]);
    await expect(mod.getProductsFresh()).resolves.toEqual([
      { id: "prod1", name: "Product 1" },
    ]);
    await expect(mod.getProductsByCategory("cat1")).resolves.toEqual([
      { id: "prod1", name: "Product 1" },
    ]);
    await expect(mod.getProductByUrlKey("prod-slug")).resolves.toEqual({
      id: "prod1",
      name: "Product 1",
    });
    await expect(mod.getProductBySlug("prod-slug")).resolves.toEqual({
      id: "prod1",
      name: "Product 1",
    });
    await expect(mod.getCatalog()).resolves.toEqual([
      { id: "cat1", name: "Category 1" },
    ]);
    await expect(mod.getCategoryIds()).resolves.toEqual(["cat1", "cat2"]);
  });
});
