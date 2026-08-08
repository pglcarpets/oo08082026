/**
 * Name-mirror coverage for lib/catalog/catalogFallbackResolver.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchCatalogSnapshotProducts = vi.fn();
const buildLocalCatalogFallbackProducts = vi.fn();
const normalizeProducts = vi.fn((products: Array<{ name: string }>) => products);

vi.mock("server-only", () => ({}));

vi.mock("@/lib/catalog/catalogSnapshotR2", () => ({
  fetchCatalogSnapshotProducts: () => fetchCatalogSnapshotProducts(),
}));

vi.mock("@/lib/catalog/fallback", () => ({
  buildLocalCatalogFallbackProducts: () => buildLocalCatalogFallbackProducts(),
}));

vi.mock("@/lib/catalog/adapters", () => ({
  normalizeProducts: (products: Array<{ name: string }>) =>
    normalizeProducts(products),
}));

describe("resolveCatalogFallbackProducts", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchCatalogSnapshotProducts.mockReset();
    buildLocalCatalogFallbackProducts.mockReset();
    normalizeProducts.mockClear();
  });

  it("prefers normalized R2 snapshot products when present", async () => {
    fetchCatalogSnapshotProducts.mockResolvedValue([
      { name: "Zebra" },
      { name: "Alpha" },
    ]);
    normalizeProducts.mockImplementation(
      (products: Array<{ name: string }>) => products,
    );

    const { resolveCatalogFallbackProducts } = await import(
      "@/lib/catalog/catalogFallbackResolver"
    );
    const products = await resolveCatalogFallbackProducts();

    expect(normalizeProducts).toHaveBeenCalled();
    expect(products.map((p) => p.name)).toEqual(["Alpha", "Zebra"]);
    expect(buildLocalCatalogFallbackProducts).not.toHaveBeenCalled();
  });

  it("falls back to local catalog when R2 snapshot is empty", async () => {
    fetchCatalogSnapshotProducts.mockResolvedValue([]);
    buildLocalCatalogFallbackProducts.mockReturnValue([
      { name: "Local Product" },
    ]);

    const { resolveCatalogFallbackProducts } = await import(
      "@/lib/catalog/catalogFallbackResolver"
    );
    await expect(resolveCatalogFallbackProducts()).resolves.toEqual([
      { name: "Local Product" },
    ]);
  });

  it("falls back to local catalog when R2 snapshot is null", async () => {
    fetchCatalogSnapshotProducts.mockResolvedValue(null);
    buildLocalCatalogFallbackProducts.mockReturnValue([{ name: "Bundled" }]);

    const { resolveCatalogFallbackProducts } = await import(
      "@/lib/catalog/catalogFallbackResolver"
    );
    await expect(resolveCatalogFallbackProducts()).resolves.toEqual([
      { name: "Bundled" },
    ]);
  });
});
