import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadProductsCategoryTiles } from "@/components/home/CategoryGrid";
import { buildRequestedCategoryCatalog } from "@/lib/catalog/site/categories";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));

vi.mock("@/lib/assetPaths", () => ({
  normalizeAssetPath: (value: string | null | undefined) =>
    typeof value === "string" ? value.trim() : "",
}));

vi.mock("@/lib/catalog/site/getProducts", () => ({
  getCatalog: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/catalog/site/categories", () => ({
  buildRequestedCategoryCatalog: vi.fn().mockReturnValue([
    {
      id: "seating",
      name: "Seating",
      series: [
        {
          products: [
            {
              images: ["/assets/catalog/products/dauble paper tray.jpg"],
            },
          ],
        },
      ],
    },
  ]),
  getCatalogCategoryHref: (id: string) => `/products/${id}`,
  getCatalogCategoryLabel: (_id: string, name: string) => `Label for ${name}`,
}));

describe("loadProductsCategoryTiles", () => {
  beforeEach(() => {
    vi.mocked(buildRequestedCategoryCatalog).mockReturnValue([
      {
        id: "seating",
        name: "Seating",
        series: [
          {
            products: [
              {
                images: ["/assets/catalog/products/dauble paper tray.jpg"],
              },
            ],
          },
        ],
      },
    ] as never);
  });

  it("maps live catalog categories into products hub tiles", async () => {
    const tiles = await loadProductsCategoryTiles();

    expect(tiles).toEqual([
      {
        id: "seating",
        name: "Label for Seating",
        href: "/products/seating",
        image: "/assets/marketing/ui/categories/seating-clean.webp",
        productCount: 1,
      },
    ]);
  });

  it("returns empty list when catalog is offline", async () => {
    vi.mocked(buildRequestedCategoryCatalog).mockReturnValue([]);

    const tiles = await loadProductsCategoryTiles();
    expect(tiles).toEqual([]);
  });
});
