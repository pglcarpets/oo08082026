import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { fetchCatalogProductsLive } = vi.hoisted(() => ({
  fetchCatalogProductsLive: vi.fn(),
}));

vi.mock("@/lib/catalog/catalogDrizzle", () => ({
  fetchCatalogProductsLive,
}));

import { buildProductStaticParams, deriveSourceSlug } from "@/lib/catalog/productStaticParams";

describe("product static params", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCatalogProductsLive.mockResolvedValue(null);
  });

  describe("deriveSourceSlug", () => {
    it("prefers metadata sourceSlug", () => {
      expect(
        deriveSourceSlug({
          metadata: { sourceSlug: "  sway  " },
          slug: "oando-seating--ignored",
        }),
      ).toBe("sway");
    });

    it("parses slug suffix after delimiter", () => {
      expect(deriveSourceSlug({ slug: "oando-seating--sway" })).toBe("sway");
      expect(deriveSourceSlug({ slug: "plain-slug" })).toBe("plain-slug");
      expect(deriveSourceSlug({ slug: "  " })).toBe("");
      expect(deriveSourceSlug({})).toBe("");
    });
  });

  describe("buildProductStaticParams", () => {
    it("merges fallback products and deduplicates by category and slug", async () => {
      const params = await buildProductStaticParams();
      expect(params.length).toBeGreaterThan(0);
      expect(new Set(params.map((entry) => `${entry.category}::${entry.product}`)).size).toBe(params.length);
      expect(params.every((entry) => entry.category.length > 0 && entry.product.length > 0)).toBe(true);
    });

    it("prefers canonical oando slugs when duplicate source keys exist", async () => {
      fetchCatalogProductsLive.mockResolvedValue([
        {
          id: "legacy-1",
          slug: "legacy-chair",
          category_id: "seating",
          name: "Task Chair",
          metadata: { sourceSlug: "task-chair" },
        },
        {
          id: "canonical-1",
          slug: "oando-seating--task-chair",
          category_id: "seating",
          name: "Task Chair",
          metadata: { sourceSlug: "task-chair" },
        },
      ]);

      const params = await buildProductStaticParams();
      const seatingTask = params.filter(
        (entry) => entry.category === "seating" && entry.product.includes("task-chair"),
      );
      expect(seatingTask.some((entry) => entry.product === "oando-seating--task-chair")).toBe(true);
      expect(seatingTask.some((entry) => entry.product === "legacy-chair")).toBe(false);
    });

    it("classifies category ids from series and product metadata", async () => {
      fetchCatalogProductsLive.mockResolvedValue([
        {
          id: "panel-1",
          slug: "oando-workstations--panel-desk",
          category_id: "unknown-workstations",
          series_name: "Panel Series",
          name: "Panel Desk",
          description: "Panel workstation",
          metadata: {},
        },
      ]);

      const params = await buildProductStaticParams();
      expect(params.some((entry) => entry.category === "workstations")).toBe(true);
    });

    it("skips rows without slug or source slug", async () => {
      fetchCatalogProductsLive.mockResolvedValue([
        { slug: "", category_id: "seating", name: "No Slug" },
        { slug: "   ", category_id: "seating", name: "Blank Slug" },
        { slug: "   ", category_id: "seating", name: "Blank Source", metadata: { sourceSlug: "   " } },
      ]);

      const params = await buildProductStaticParams();
      expect(params.some((entry) => entry.product === "")).toBe(false);
    });
  });
});
