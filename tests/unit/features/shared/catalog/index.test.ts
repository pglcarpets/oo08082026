/**
 * Name-mirror: features/shared/catalog/index
 */

import { describe, expect, it } from "vitest";
import {
  RELEASED_CATALOG_PRODUCT_SCHEMA_VERSION,
  ReleasedAvailabilitySchema,
} from "@/features/shared/catalog/index";
import type { SharedProduct } from "@/features/shared/catalog/index";

describe("shared catalog index", () => {
  it("re-exports released catalog contract values", () => {
    expect(RELEASED_CATALOG_PRODUCT_SCHEMA_VERSION).toBe(1);
    expect(ReleasedAvailabilitySchema.parse("available")).toBe("available");
    expect(ReleasedAvailabilitySchema.safeParse("bogus").success).toBe(false);
  });

  it("re-exports SharedProduct type contract", () => {
    const product: SharedProduct = {
      id: "p1",
      name: "Desk",
      sku: "DESK-1",
      category_id: "workstations",
      price: 12000,
      dimensions: { widthMm: 1200, depthMm: 600, heightMm: 750 },
      isActive: true,
    };
    expect(product.sku).toBe("DESK-1");
    expect(product.dimensions?.widthMm).toBe(1200);
  });
});
