/**
 * Name-mirror: features/shared/catalog/types
 */

import { describe, expect, it } from "vitest";
import type {
  SharedCatalogSearchResult,
  SharedCategory,
  SharedProduct,
  SharedProductDimensions,
} from "@/features/shared/catalog/types";

describe("shared catalog types", () => {
  it("shapes products, categories, and search results", () => {
    const dimensions: SharedProductDimensions = {
      widthMm: 1400,
      depthMm: 700,
      heightMm: 750,
    };
    const product: SharedProduct = {
      id: "prod-1",
      name: "Linear desk",
      sku: "LD-1400",
      category_id: "cat-ws",
      price: null,
      dimensions,
      dimensionsLabel: "1400x700x750",
      finishes: ["oak"],
      tags: ["workstation"],
      imageUrl: "/assets/catalog/desk.webp",
      isActive: true,
    };
    const category: SharedCategory = {
      id: "cat-ws",
      name: "Workstations",
      slug: "workstations",
      parentId: "root",
    };
    const result: SharedCatalogSearchResult = {
      products: [product],
      total: 1,
      hasMore: false,
    };

    expect(result.products[0].price).toBeNull();
    expect(category.slug).toBe("workstations");
    expect(result.hasMore).toBe(false);
  });
});
