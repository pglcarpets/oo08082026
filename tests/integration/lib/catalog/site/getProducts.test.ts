import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
  fetchAllProductsLive,
  fetchProductsByCategoryLive,
  fetchProductByUrlKeyLive,
  fetchCategoryIdsLive,
  buildCatalogLive,
} = vi.hoisted(() => ({
  fetchAllProductsLive: vi.fn(),
  fetchProductsByCategoryLive: vi.fn(),
  fetchProductByUrlKeyLive: vi.fn(),
  fetchCategoryIdsLive: vi.fn(),
  buildCatalogLive: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

vi.mock("@/lib/catalog/sources", () => ({
  fetchAllProductsLive,
  fetchProductsByCategoryLive,
  fetchProductByUrlKeyLive,
  fetchCategoryIdsLive,
}));

vi.mock("@/lib/catalog/catalogTree", () => ({
  buildCatalogLive,
}));

import {
  getCatalog,
  getCategoryIds,
  getProductBySlug,
  getProductByUrlKey,
  getProducts,
  getProductsByCategory,
  getProductsFresh,
} from "@/lib/catalog/site/getProducts";

const sampleProduct = {
  id: "p1",
  category_id: "seating",
  series: "Mesh",
  name: "Mesh Task",
  slug: "seating-mesh-task",
  images: [],
  specs: { dimensions: "", materials: [], features: [] },
  series_id: "s1",
  series_name: "Mesh",
  created_at: "2026-01-01",
};

const sampleCatalog = [
  {
    id: "seating",
    name: "Seating",
    description: "Seating",
    series: [],
  },
];

describe("site catalog getProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAllProductsLive.mockResolvedValue([sampleProduct]);
    fetchProductsByCategoryLive.mockResolvedValue([sampleProduct]);
    fetchProductByUrlKeyLive.mockResolvedValue(sampleProduct);
    fetchCategoryIdsLive.mockResolvedValue(["seating", "tables"]);
    buildCatalogLive.mockResolvedValue(sampleCatalog);
  });

  it("getProducts returns cached product list", async () => {
    await expect(getProducts()).resolves.toEqual([sampleProduct]);
    expect(fetchAllProductsLive).toHaveBeenCalledTimes(1);
  });

  it("getProductsFresh bypasses cache wrapper", async () => {
    await expect(getProductsFresh()).resolves.toEqual([sampleProduct]);
    expect(fetchAllProductsLive).toHaveBeenCalledTimes(1);
  });

  it("getProductsByCategory fetches category scoped products", async () => {
    await expect(getProductsByCategory("seating")).resolves.toEqual([sampleProduct]);
    expect(fetchProductsByCategoryLive).toHaveBeenCalledWith("seating");
  });

  it("getProductByUrlKey fetches a single product", async () => {
    await expect(getProductByUrlKey("seating-mesh-task")).resolves.toEqual(sampleProduct);
    expect(fetchProductByUrlKeyLive).toHaveBeenCalledWith("seating-mesh-task");
  });

  it("getProductBySlug delegates to getProductByUrlKey", async () => {
    await expect(getProductBySlug("seating-mesh-task")).resolves.toEqual(sampleProduct);
    expect(fetchProductByUrlKeyLive).toHaveBeenCalledWith("seating-mesh-task");
  });

  it("getCatalog returns built catalog tree", async () => {
    await expect(getCatalog()).resolves.toEqual(sampleCatalog);
    expect(buildCatalogLive).toHaveBeenCalledTimes(1);
  });

  it("getCategoryIds returns live category ids without cache", async () => {
    await expect(getCategoryIds()).resolves.toEqual(["seating", "tables"]);
    expect(fetchCategoryIdsLive).toHaveBeenCalledTimes(1);
  });

  it("propagates null product lookups", async () => {
    fetchProductByUrlKeyLive.mockResolvedValue(null);
    await expect(getProductByUrlKey("missing")).resolves.toBeNull();
    await expect(getProductBySlug("missing")).resolves.toBeNull();
  });
});