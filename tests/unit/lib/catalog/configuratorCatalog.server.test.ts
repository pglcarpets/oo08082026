/**
 * Name-mirror coverage for lib/catalog/configuratorCatalog.server.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const orderBy = vi.fn();
const where = vi.fn(() => ({ orderBy }));
const from = vi.fn(() => ({ where }));
const select = vi.fn(() => ({ from }));
const isProductsDatabaseConfigured = vi.fn();

vi.mock("server-only", () => ({}));

vi.mock("@/platform/drizzle/databaseUrls", () => ({
  isProductsDatabaseConfigured: () => isProductsDatabaseConfigured(),
}));

vi.mock("@/platform/drizzle/productsDb", () => ({
  productsDb: { select },
}));

vi.mock("@/platform/drizzle/schema/catalog", () => ({
  configuratorProducts: {
    id: "id",
    slug: "slug",
    name: "name",
    category: "category",
    family: "family",
    brand_name: "brand_name",
    sizing_type: "sizing_type",
    workstation: "workstation",
    size_options: "size_options",
    default_footprint: "default_footprint",
    derived_rules: "derived_rules",
    materials: "materials",
    thumbnail_url: "thumbnail_url",
    model_3d_url: "model_3d_url",
    description: "description",
    active: "active",
    created_at: "created_at",
    updated_at: "updated_at",
  },
}));

vi.mock("drizzle-orm", () => ({
  and: (...args: unknown[]) => args,
  asc: (value: unknown) => value,
  eq: (a: unknown, b: unknown) => ({ a, b }),
}));

describe("fetchAdminConfiguratorCatalog", () => {
  beforeEach(() => {
    vi.resetModules();
    orderBy.mockReset();
    where.mockClear();
    from.mockClear();
    select.mockClear();
    isProductsDatabaseConfigured.mockReset();
  });

  it("returns null when products database is not configured", async () => {
    isProductsDatabaseConfigured.mockReturnValue(false);
    const { fetchAdminConfiguratorCatalog } = await import(
      "@/lib/catalog/configuratorCatalog.server"
    );
    await expect(fetchAdminConfiguratorCatalog({})).resolves.toBeNull();
    expect(select).not.toHaveBeenCalled();
  });

  it("maps active filter rows from products db", async () => {
    isProductsDatabaseConfigured.mockReturnValue(true);
    orderBy.mockResolvedValue([
      {
        id: "1",
        slug: "desk-linear",
        name: "Linear Desk",
        category: "workstations",
        family: "Linear",
        brand_name: "DeskPro",
        sizing_type: "parametric",
        workstation: { shape: "straight" },
        size_options: null,
        default_footprint: null,
        derived_rules: null,
        materials: ["laminate"],
        thumbnail_url: null,
        model_3d_url: null,
        description: "desk",
        active: true,
        created_at: "2026-01-01",
        updated_at: "2026-01-02",
      },
    ]);

    const { fetchAdminConfiguratorCatalog } = await import(
      "@/lib/catalog/configuratorCatalog.server"
    );
    const rows = await fetchAdminConfiguratorCatalog({
      category: "workstations",
      active: true,
    });

    expect(rows).toHaveLength(1);
    expect(rows?.[0]?.slug).toBe("desk-linear");
    expect(rows?.[0]?.workstation).toEqual({ shape: "straight" });
    expect(select).toHaveBeenCalled();
  });
});
