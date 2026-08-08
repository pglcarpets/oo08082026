import { describe, it, expect, vi, beforeEach } from "vitest";

import { CATALOG_SNAPSHOT_R2_KEY } from "@/lib/catalog/catalogSnapshotConstants";
import {
  fetchCatalogSnapshotFromR2,
  fetchCatalogSnapshotProducts,
} from "@/lib/catalog/catalogSnapshotR2";
import { resolveCatalogFallbackProducts } from "@/lib/catalog/catalogFallbackResolver";
import type { Product } from "@/lib/catalog/types";

// Mock server-only (no-op in tests)
vi.mock("server-only", () => ({}));

// Hoisted mocks for r2 and fallback to control async paths
const mockReadR2 = vi.hoisted(() => vi.fn());

vi.mock("@/lib/storage/r2Catalog", () => ({
  readR2ObjectText: mockReadR2,
}));

const mockBuildLocal = vi.hoisted(() => vi.fn());
const mockNormalize = vi.hoisted(() => vi.fn((p: Product[]) => p));

vi.mock("@/lib/catalog/fallback", () => ({
  buildLocalCatalogFallbackProducts: mockBuildLocal,
}));

vi.mock("@/lib/catalog/adapters", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    normalizeProducts: mockNormalize,
  };
});

// Advance time to bust the 5min cache in snapshotR2 on every call
let mockTime = 1_000_000;
vi.spyOn(Date, "now").mockImplementation(() => (mockTime += 600_000));

function makeProduct(name: string, overrides: Partial<Product> = {}): Product {
  return {
    id: `id-${name}`,
    category_id: "seating",
    series: "test",
    name,
    slug: name.toLowerCase(),
    description: undefined,
    images: [],
    flagship_image: undefined,
    "3d_model": undefined,
    specs: {
      dimensions: "",
      materials: [],
      features: [],
    },
    series_id: "",
    series_name: "",
    created_at: "",
    metadata: undefined,
    ...overrides,
  };
}

describe("catalogSnapshotConstants", () => {
  it("exports the expected R2 key", () => {
    expect(CATALOG_SNAPSHOT_R2_KEY).toBe("backups/catalog/catalog-latest.json");
  });
});

describe("catalogSnapshotR2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when R2 read yields no raw or invalid json", async () => {
    mockReadR2.mockResolvedValue(null);
    const snap = await fetchCatalogSnapshotFromR2();
    expect(snap).toBeNull();

    mockReadR2.mockResolvedValue("not-json{");
    const bad = await fetchCatalogSnapshotFromR2();
    expect(bad).toBeNull();
  });

  it("fetchCatalogSnapshotProducts extracts products or null (covers parse)", async () => {
    mockReadR2.mockResolvedValue(
      JSON.stringify({ version: 1, exportedAt: "t", products: [makeProduct("Sofa")], categoryIds: [] }),
    );
    const prods = await fetchCatalogSnapshotProducts();
    expect(prods?.length).toBe(1);
    expect(prods?.[0].name).toBe("Sofa");

    mockReadR2.mockResolvedValue(JSON.stringify({ version: 1, exportedAt: "t", products: [], categoryIds: [] }));
    const empty = await fetchCatalogSnapshotProducts();
    expect(empty).toBeNull();
  });
});

describe("catalogFallbackResolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prefers R2 snapshot products when available (normalized + sorted)", async () => {
    const r2Prods = [makeProduct("Zeta"), makeProduct("Alpha")];
    mockReadR2.mockResolvedValue(
      JSON.stringify({ version: 1, exportedAt: "t", products: r2Prods, categoryIds: [] }),
    );
    mockNormalize.mockReturnValueOnce(r2Prods);

    const result = await resolveCatalogFallbackProducts();
    expect(result.map((p) => p.name)).toEqual(["Alpha", "Zeta"]);
    expect(mockNormalize).toHaveBeenCalled();
    expect(mockBuildLocal).not.toHaveBeenCalled();
  });

  it("falls back to local build when no R2 products", async () => {
    mockReadR2.mockResolvedValue(null);
    const local = [makeProduct("Local1")];
    mockBuildLocal.mockReturnValueOnce(local);

    const result = await resolveCatalogFallbackProducts();
    // use toEqual because resolver returns (possibly normalized) array, not identical ref
    expect(result).toEqual(local);
    expect(mockBuildLocal).toHaveBeenCalledTimes(1);
  });
});
