import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  canQueryCatalogDatabase,
  fetchCatalogCategoriesLive,
  fetchCatalogProductsLive,
} = vi.hoisted(() => ({
  canQueryCatalogDatabase: vi.fn(),
  fetchCatalogCategoriesLive: vi.fn(),
  fetchCatalogProductsLive: vi.fn(),
}));

vi.mock("@/lib/catalog/catalogDrizzle", () => ({
  canQueryCatalogDatabase,
  fetchCatalogCategoriesLive,
  fetchCatalogProductsLive,
}));

describe("catalog tree", () => {
  beforeEach(() => {
    vi.stubEnv("CI", "");
    vi.stubEnv("NEXT_PHASE", "");
    vi.resetModules();
    vi.clearAllMocks();
    canQueryCatalogDatabase.mockReturnValue(true);
    fetchCatalogCategoriesLive.mockResolvedValue(null);
    fetchCatalogProductsLive.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds grouped categories with series from live Drizzle data", async () => {
    fetchCatalogCategoriesLive.mockResolvedValue([{ id: "seating", name: "Seating" }]);
    fetchCatalogProductsLive.mockResolvedValue([
      {
        id: "chair-1",
        category_id: "seating",
        name: "Mesh Chair",
        slug: "mesh-chair",
        series_id: "mesh-series",
        series_name: "Mesh",
        description: "Comfortable mesh chair",
        images: [],
        specs: { dimensions: "", materials: [], features: [] },
        created_at: "2024-01-01",
      },
    ]);

    const { buildCatalogLive } = await import("@/lib/catalog/catalogTree");
    const catalog = await buildCatalogLive();

    expect(catalog).toHaveLength(1);
    expect(catalog[0].id).toBe("seating");
    expect(catalog[0].series).toHaveLength(1);
    expect(catalog[0].series[0].products[0].name).toBe("Mesh Chair");
  });

  it("falls back to local products when Drizzle returns null rows", async () => {
    fetchCatalogCategoriesLive.mockResolvedValue(null);
    fetchCatalogProductsLive.mockResolvedValue(null);

    const { buildCatalogLive } = await import("@/lib/catalog/catalogTree");
    const catalog = await buildCatalogLive();
    expect(catalog.length).toBeGreaterThan(0);
    expect(catalog[0].series.length).toBeGreaterThan(0);
  });

  it("returns an empty catalog when live data has categories but no products", async () => {
    fetchCatalogCategoriesLive.mockResolvedValue([{ id: "seating", name: "Seating" }]);
    fetchCatalogProductsLive.mockResolvedValue([]);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { buildCatalogLive } = await import("@/lib/catalog/catalogTree");
    const catalog = await buildCatalogLive();
    expect(catalog).toEqual([]);
    consoleSpy.mockRestore();
  });

  it("skips empty categories and synthesizes series ids when missing", async () => {
    fetchCatalogCategoriesLive.mockResolvedValue([
      { id: "seating", name: "Seating" },
      { id: "empty-cat", name: "Empty" },
    ]);
    fetchCatalogProductsLive.mockResolvedValue([
      {
        id: "chair-1",
        category_id: "seating",
        name: "Chair",
        slug: "chair",
        description: "",
        images: [],
        specs: { dimensions: "", materials: [], features: [] },
        created_at: "2024-01-01",
      },
    ]);

    const { buildCatalogLive } = await import("@/lib/catalog/catalogTree");
    const catalog = await buildCatalogLive();
    expect(catalog).toHaveLength(1);
    expect(catalog[0].series[0].id).toBe("seating-series");
    expect(catalog[0].series[0].name).toBe("Series");
  });

  it("retries transient fetch failures before succeeding", async () => {
    fetchCatalogCategoriesLive.mockResolvedValue([{ id: "seating", name: "Seating" }]);
    fetchCatalogProductsLive
      .mockRejectedValueOnce(new Error("fetch failed: network timeout"))
      .mockResolvedValueOnce([
        {
          id: "chair-1",
          category_id: "seating",
          name: "Chair",
          slug: "chair",
          description: "",
          images: [],
          specs: { dimensions: "", materials: [], features: [] },
          created_at: "2024-01-01",
        },
      ]);

    const { buildCatalogLive } = await import("@/lib/catalog/catalogTree");
    const catalog = await buildCatalogLive();
    expect(catalog).toHaveLength(1);
    expect(fetchCatalogProductsLive).toHaveBeenCalledTimes(2);
  });

  it("logs non-missing product errors and falls back to local catalog", async () => {
    fetchCatalogCategoriesLive.mockResolvedValue([{ id: "seating", name: "Seating" }]);
    fetchCatalogProductsLive.mockRejectedValue(new Error("permission denied for table catalog_products"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { buildCatalogLive } = await import("@/lib/catalog/catalogTree");
    const catalog = await buildCatalogLive();
    expect(catalog.length).toBeGreaterThan(0);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
