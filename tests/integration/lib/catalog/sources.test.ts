import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  canQueryCatalogDatabase,
  fetchCatalogProductsLive,
  fetchCatalogProductsByCategoryLive,
  fetchCatalogProductBySlugLive,
  fetchCatalogCategoryIdsLive,
} = vi.hoisted(() => ({
  canQueryCatalogDatabase: vi.fn(),
  fetchCatalogProductsLive: vi.fn(),
  fetchCatalogProductsByCategoryLive: vi.fn(),
  fetchCatalogProductBySlugLive: vi.fn(),
  fetchCatalogCategoryIdsLive: vi.fn(),
}));

vi.mock("@/lib/catalog/catalogDrizzle", () => ({
  canQueryCatalogDatabase,
  fetchCatalogProductsLive,
  fetchCatalogProductsByCategoryLive,
  fetchCatalogProductBySlugLive,
  fetchCatalogCategoryIdsLive,
}));

// Fallback resolution must stay hermetic: never let real R2 credentials in the
// environment leak a live snapshot into what is meant to be a pure local-fallback test.
vi.mock("@/lib/catalog/catalogSnapshotR2", () => ({
  fetchCatalogSnapshotProducts: vi.fn().mockResolvedValue(null),
}));

import {
  fetchAllProductsLive,
  fetchCategoryIdsLive,
  fetchProductByUrlKeyLive,
  fetchProductsByCategoryLive,
} from "@/lib/catalog/sources";
import { buildLocalCatalogFallbackProducts } from "@/lib/catalog/fallback";

const liveChair = {
  id: "live-1",
  category_id: "seating",
  name: "Live Chair",
  slug: "live-chair",
  images: [],
  specs: { dimensions: "", materials: [], features: [] },
  series_id: "seating-series",
  series_name: "Seating",
  created_at: "2024-01-01",
};

describe("catalog sources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canQueryCatalogDatabase.mockReturnValue(false);
    fetchCatalogProductsLive.mockResolvedValue(null);
    fetchCatalogProductsByCategoryLive.mockResolvedValue(null);
    fetchCatalogProductBySlugLive.mockResolvedValue(null);
    fetchCatalogCategoryIdsLive.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses local fallback when catalog DB is not configured", async () => {
    const products = await fetchAllProductsLive();
    expect(products.length).toBeGreaterThan(0);
    expect(products).toEqual(buildLocalCatalogFallbackProducts());
  });

  it("filters fallback products by category and slug", async () => {
    const fallback = buildLocalCatalogFallbackProducts();
    const categoryId = fallback[0].category_id;
    const slug = fallback[0].slug;

    const byCategory = await fetchProductsByCategoryLive(categoryId);
    expect(byCategory.every((product) => product.category_id === categoryId)).toBe(true);

    const bySlug = await fetchProductByUrlKeyLive(slug);
    expect(bySlug?.slug).toBe(slug);

    const missing = await fetchProductByUrlKeyLive("__missing-slug__");
    expect(missing).toBeNull();

    const categoryIds = await fetchCategoryIdsLive();
    expect(categoryIds.length).toBeGreaterThan(0);
    expect(categoryIds).toContain(categoryId);
  });

  it("returns live products from Drizzle when configured", async () => {
    canQueryCatalogDatabase.mockReturnValue(true);
    fetchCatalogProductsLive.mockResolvedValue([liveChair]);

    const products = await fetchAllProductsLive();
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe("Live Chair");
  });

  it("falls back when Drizzle returns null rows", async () => {
    canQueryCatalogDatabase.mockReturnValue(true);
    fetchCatalogProductsLive.mockResolvedValue(null);

    const products = await fetchAllProductsLive();
    expect(products.length).toBeGreaterThan(0);
    expect(products).toEqual(buildLocalCatalogFallbackProducts());
  });

  it("logs and falls back on Drizzle errors", async () => {
    canQueryCatalogDatabase.mockReturnValue(true);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchCatalogProductsLive.mockRejectedValue(new Error("permission denied for table catalog_products"));

    const products = await fetchAllProductsLive();
    expect(products).toEqual(buildLocalCatalogFallbackProducts());
    expect(consoleSpy).toHaveBeenCalledWith(
      "[getProducts] Catalog DB unavailable:",
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  it("loads distinct category ids from Drizzle rows", async () => {
    canQueryCatalogDatabase.mockReturnValue(true);
    fetchCatalogCategoryIdsLive.mockResolvedValue(["seating", "tables"]);

    const ids = await fetchCategoryIdsLive();
    expect(ids).toEqual(["seating", "tables"]);
  });

  it("fetches live products by category and url key", async () => {
    canQueryCatalogDatabase.mockReturnValue(true);
    const row = {
      id: "live-2",
      category_id: "tables",
      name: "Live Table",
      slug: "live-table",
      images: [],
      specs: { dimensions: "", materials: [], features: [] },
      series_id: "tables-series",
      series_name: "Tables",
      created_at: "2024-01-01",
    };
    fetchCatalogProductsByCategoryLive.mockResolvedValue([row]);
    fetchCatalogProductBySlugLive.mockResolvedValue(row);

    const byCategory = await fetchProductsByCategoryLive("tables");
    expect(byCategory).toHaveLength(1);
    expect(byCategory[0].slug).toBe("live-table");

    const bySlug = await fetchProductByUrlKeyLive("live-table");
    expect(bySlug?.name).toBe("Live Table");
  });

  it("handles category and url-key fetch failures with fallback", async () => {
    canQueryCatalogDatabase.mockReturnValue(true);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchCatalogProductsByCategoryLive.mockRejectedValue(new Error("permission denied"));
    fetchCatalogProductBySlugLive.mockRejectedValue(new Error("permission denied"));

    const fallback = buildLocalCatalogFallbackProducts();
    const categoryId = fallback[0].category_id;
    const byCategory = await fetchProductsByCategoryLive(categoryId);
    expect(byCategory.every((product) => product.category_id === categoryId)).toBe(true);

    const bySlug = await fetchProductByUrlKeyLive(fallback[0].slug);
    expect(bySlug?.slug).toBe(fallback[0].slug);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("falls back quietly when category id query returns null", async () => {
    canQueryCatalogDatabase.mockReturnValue(true);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchCatalogCategoryIdsLive.mockResolvedValue(null);

    const ids = await fetchCategoryIdsLive();
    expect(ids.length).toBeGreaterThan(0);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("falls back when category id query throws", async () => {
    canQueryCatalogDatabase.mockReturnValue(true);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchCatalogCategoryIdsLive.mockRejectedValue(new Error("network down"));

    const ids = await fetchCategoryIdsLive();
    expect(ids.length).toBeGreaterThan(0);
    expect(consoleSpy).toHaveBeenCalledWith(
      "[getCategoryIds] Catalog DB unavailable:",
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });
});
