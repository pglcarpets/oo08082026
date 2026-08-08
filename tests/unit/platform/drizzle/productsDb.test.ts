// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/platform/drizzle/createPostgresDrizzle", () => ({
  createPostgresDrizzle: vi.fn(),
}));

vi.mock("@/platform/drizzle/databaseUrls", () => ({
  resolveProductsDatabaseUrl: vi.fn(),
}));

import { createPostgresDrizzle } from "@/platform/drizzle/createPostgresDrizzle";
import { resolveProductsDatabaseUrl } from "@/platform/drizzle/databaseUrls";

describe("platform/drizzle/productsDb", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("throws when PRODUCTS_DATABASE_URL is missing", async () => {
    vi.mocked(resolveProductsDatabaseUrl).mockReturnValue(null);

    const { getProductsDb } = await import("@/platform/drizzle/productsDb");

    expect(() => getProductsDb()).toThrow(
      /PRODUCTS_DATABASE_URL is missing/,
    );
    expect(createPostgresDrizzle).not.toHaveBeenCalled();
  });

  it("creates and caches a drizzle client", async () => {
    const mockDb = { select: vi.fn(), tag: "products-db" };
    vi.mocked(resolveProductsDatabaseUrl).mockReturnValue("postgres://products/db");
    vi.mocked(createPostgresDrizzle).mockReturnValue(
      mockDb as unknown as ReturnType<typeof createPostgresDrizzle>,
    );

    const { getProductsDb } = await import("@/platform/drizzle/productsDb");

    const first = getProductsDb();
    const second = getProductsDb();

    expect(first).toBe(mockDb);
    expect(second).toBe(mockDb);
    expect(createPostgresDrizzle).toHaveBeenCalledTimes(1);
    expect(createPostgresDrizzle).toHaveBeenCalledWith("postgres://products/db");
  });

  it("productsDb proxy forwards property access to getProductsDb()", async () => {
    const select = vi.fn();
    const mockDb = { select, tag: "products-proxy" };
    vi.mocked(resolveProductsDatabaseUrl).mockReturnValue("postgres://products/db");
    vi.mocked(createPostgresDrizzle).mockReturnValue(
      mockDb as unknown as ReturnType<typeof createPostgresDrizzle>,
    );

    const { productsDb } = await import("@/platform/drizzle/productsDb");

    expect(productsDb.select).toBe(select);
    expect((productsDb as { tag?: string }).tag).toBe("products-proxy");
  });
});
