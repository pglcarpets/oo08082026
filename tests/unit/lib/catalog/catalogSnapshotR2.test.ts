/**
 * Name-mirror coverage for lib/catalog/catalogSnapshotR2.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const readR2ObjectText = vi.fn();

vi.mock("server-only", () => ({}));

vi.mock("@/lib/storage/r2Catalog", () => ({
  readR2ObjectText: (key: string) => readR2ObjectText(key),
}));

vi.mock("@/lib/catalog/catalogSnapshotConstants", () => ({
  CATALOG_SNAPSHOT_R2_KEY: "backups/catalog/catalog-latest.json",
}));

describe("catalogSnapshotR2", () => {
  beforeEach(() => {
    vi.resetModules();
    readR2ObjectText.mockReset();
  });

  it("returns null when R2 has no object", async () => {
    readR2ObjectText.mockResolvedValue(null);
    const { fetchCatalogSnapshotFromR2, fetchCatalogSnapshotProducts } =
      await import("@/lib/catalog/catalogSnapshotR2");

    await expect(fetchCatalogSnapshotFromR2()).resolves.toBeNull();
    await expect(fetchCatalogSnapshotProducts()).resolves.toBeNull();
  });

  it("parses a valid snapshot and exposes products", async () => {
    readR2ObjectText.mockResolvedValue(
      JSON.stringify({
        version: 1,
        exportedAt: "2026-07-01T00:00:00.000Z",
        products: [{ id: "p1", name: "Chair" }],
        categoryIds: ["seating"],
      }),
    );

    const { fetchCatalogSnapshotFromR2, fetchCatalogSnapshotProducts } =
      await import("@/lib/catalog/catalogSnapshotR2");

    const snapshot = await fetchCatalogSnapshotFromR2();
    expect(snapshot?.version).toBe(1);
    expect(snapshot?.products).toHaveLength(1);
    await expect(fetchCatalogSnapshotProducts()).resolves.toEqual([
      { id: "p1", name: "Chair" },
    ]);
    expect(readR2ObjectText).toHaveBeenCalledWith(
      "backups/catalog/catalog-latest.json",
    );
  });

  it("returns null for invalid JSON or missing products array", async () => {
    readR2ObjectText.mockResolvedValue("{not-json");
    const mod = await import("@/lib/catalog/catalogSnapshotR2");
    await expect(mod.fetchCatalogSnapshotFromR2()).resolves.toBeNull();

    vi.resetModules();
    readR2ObjectText.mockResolvedValue(JSON.stringify({ version: 1 }));
    const mod2 = await import("@/lib/catalog/catalogSnapshotR2");
    await expect(mod2.fetchCatalogSnapshotFromR2()).resolves.toBeNull();
  });

  it("returns null products when snapshot products array is empty", async () => {
    readR2ObjectText.mockResolvedValue(
      JSON.stringify({
        version: 1,
        exportedAt: "2026-07-01T00:00:00.000Z",
        products: [],
        categoryIds: [],
      }),
    );
    const { fetchCatalogSnapshotProducts } = await import(
      "@/lib/catalog/catalogSnapshotR2"
    );
    await expect(fetchCatalogSnapshotProducts()).resolves.toBeNull();
  });
});
