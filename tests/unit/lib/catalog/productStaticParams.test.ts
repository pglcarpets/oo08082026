import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildProductStaticParams, deriveSourceSlug } from "@/lib/catalog/productStaticParams";
import { fetchCatalogProductsLive } from "@/lib/catalog/catalogDrizzle";
import { buildLocalCatalogFallbackProducts } from "@/lib/catalog/fallback";
import type { Product } from "@/lib/catalog/types";

vi.mock("@/lib/catalog/catalogDrizzle", () => ({
  fetchCatalogProductsLive: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/lib/catalog/fallback", () => ({
  buildLocalCatalogFallbackProducts: vi.fn(() => []),
}));

vi.mock("@/lib/catalog/site/categories", () => ({
  normalizeRequestedCategoryId: vi.fn((c: string) => c),
  classifyToRequestedCategory: vi.fn(() => "seating"),
}));

function sampleProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    category_id: "seating",
    series: "Sway",
    name: "Sway Chair",
    slug: "oando-seating--sway",
    images: ["img1.jpg"],
    flagship_image: "img1.jpg",
    specs: {
      dimensions: "600 x 600 mm",
      materials: ["Mesh"],
      features: [],
    },
    series_id: "sway",
    series_name: "Sway",
    created_at: "2024-01-01",
    metadata: { sourceSlug: "sway" },
    ...overrides,
  };
}

describe("productStaticParams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("derives source slug correctly", () => {
    expect(deriveSourceSlug({ slug: "oando-seating--sway" })).toBe("sway");
    expect(deriveSourceSlug({ slug: "simple-slug" })).toBe("simple-slug");
    expect(deriveSourceSlug({ metadata: { sourceSlug: "meta-slug" } })).toBe("meta-slug");
  });

  it("builds static params successfully", async () => {
    const mockProduct = sampleProduct();
    vi.mocked(buildLocalCatalogFallbackProducts).mockReturnValueOnce([mockProduct]);
    vi.mocked(fetchCatalogProductsLive).mockResolvedValueOnce([]);

    const params = await buildProductStaticParams();
    expect(params.length).toBe(1);
    expect(params[0]).toEqual({ category: "seating", product: "oando-seating--sway" });
  });
});
