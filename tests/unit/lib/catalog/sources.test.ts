import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchAllProductsLive,
  fetchProductsByCategoryLive,
  fetchProductByUrlKeyLive,
  fetchCategoryIdsLive,
} from "@/lib/catalog/sources";
import {
  canQueryCatalogDatabase,
  fetchCatalogProductsLive,
  fetchCatalogProductsByCategoryLive,
  fetchCatalogProductBySlugLive,
  fetchCatalogCategoryIdsLive,
} from "@/lib/catalog/catalogDrizzle";
import { resolveCatalogFallbackProducts } from "@/lib/catalog/catalogFallbackResolver";
import type { Product } from "@/lib/catalog/types";

vi.mock("@/lib/catalog/catalogDrizzle", () => ({
  canQueryCatalogDatabase: vi.fn(),
  fetchCatalogProductsLive: vi.fn(),
  fetchCatalogProductsByCategoryLive: vi.fn(),
  fetchCatalogProductBySlugLive: vi.fn(),
  fetchCatalogCategoryIdsLive: vi.fn(),
  fetchCatalogCategoriesLive: vi.fn(),
}));

vi.mock("@/lib/catalog/catalogFallbackResolver", () => ({
  resolveCatalogFallbackProducts: vi.fn(),
}));

vi.mock("@/lib/catalog/adapters", () => ({
  normalizeProducts: vi.fn((x: Product[]) => x),
}));

function sampleProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    category_id: "chairs",
    series: "series-a",
    name: "Chair A",
    slug: "chair-a",
    images: ["/assets/catalog/chair-a.jpg"],
    specs: {
      dimensions: "600 x 600 mm",
      materials: ["Mesh"],
      features: ["Adjustable"],
    },
    series_id: "series-a",
    series_name: "Series A",
    created_at: "2024-01-01",
    ...overrides,
  };
}

describe("sources", () => {
  const mockFallbackProducts = [
    sampleProduct({ slug: "chair-a", category_id: "chairs", name: "Chair A" }),
    sampleProduct({
      id: "prod-2",
      slug: "desk-b",
      category_id: "desks",
      name: "Desk B",
      series: "series-b",
      series_id: "series-b",
      series_name: "Series B",
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveCatalogFallbackProducts).mockResolvedValue(mockFallbackProducts);
  });

  describe("fetchAllProductsLive", () => {
    it("should return fallback products if catalog DB is not configured", async () => {
      vi.mocked(canQueryCatalogDatabase).mockReturnValue(false);
      const res = await fetchAllProductsLive();
      expect(res).toEqual(mockFallbackProducts);
    });

    it("should fetch products from Drizzle when configured", async () => {
      const live = [sampleProduct({ name: "Live A", slug: "live-a" })];
      vi.mocked(canQueryCatalogDatabase).mockReturnValue(true);
      vi.mocked(fetchCatalogProductsLive).mockResolvedValue(live);

      const res = await fetchAllProductsLive();
      expect(res).toEqual(live);
    });

    it("should return fallback if Drizzle returns null", async () => {
      vi.mocked(canQueryCatalogDatabase).mockReturnValue(true);
      vi.mocked(fetchCatalogProductsLive).mockResolvedValue(null);

      const res = await fetchAllProductsLive();
      expect(res).toEqual(mockFallbackProducts);
    });
  });

  describe("fetchProductsByCategoryLive", () => {
    it("should return filtered fallback if catalog DB is not configured", async () => {
      vi.mocked(canQueryCatalogDatabase).mockReturnValue(false);
      const res = await fetchProductsByCategoryLive("chairs");
      expect(res).toEqual([mockFallbackProducts[0]]);
    });

    it("should query Drizzle by category_id", async () => {
      const live = [sampleProduct({ name: "Live A", category_id: "chairs" })];
      vi.mocked(canQueryCatalogDatabase).mockReturnValue(true);
      vi.mocked(fetchCatalogProductsByCategoryLive).mockResolvedValue(live);

      const res = await fetchProductsByCategoryLive("chairs");
      expect(res).toEqual(live);
    });
  });

  describe("fetchProductByUrlKeyLive", () => {
    it("should find item in fallback list when DB unavailable", async () => {
      vi.mocked(canQueryCatalogDatabase).mockReturnValue(false);
      const res = await fetchProductByUrlKeyLive("desk-b");
      expect(res).toEqual(mockFallbackProducts[1]);
    });

    it("should fetch single product from Drizzle", async () => {
      const live = sampleProduct({ name: "Live A", slug: "chair-a" });
      vi.mocked(canQueryCatalogDatabase).mockReturnValue(true);
      vi.mocked(fetchCatalogProductBySlugLive).mockResolvedValue(live);

      const res = await fetchProductByUrlKeyLive("chair-a");
      expect(res).toEqual(live);
    });
  });

  describe("fetchCategoryIdsLive", () => {
    it("should return categories from fallback if DB unavailable", async () => {
      vi.mocked(canQueryCatalogDatabase).mockReturnValue(false);
      const res = await fetchCategoryIdsLive();
      expect(res).toEqual(["chairs", "desks"]);
    });

    it("should return categories from live db", async () => {
      vi.mocked(canQueryCatalogDatabase).mockReturnValue(true);
      vi.mocked(fetchCatalogCategoryIdsLive).mockResolvedValue(["chairs", "desks"]);

      const res = await fetchCategoryIdsLive();
      expect(res).toEqual(["chairs", "desks"]);
    });
  });
});
