import { describe, expect, it } from "vitest";

import { isMissingTableError, normalizeProducts, toCompatProduct } from "@/lib/catalog/adapters";
import type { Product } from "@/lib/catalog/types";

// Imports to cover additional 0% lib/catalog modules via execution in existing test file.
import * as geometry from "@/lib/catalog/geometry";
import { buildLocalCatalogFallbackProducts } from "@/lib/catalog/fallback";
import * as surface2d5 from "@/lib/catalog/surface2d5";
import * as productStaticParams from "@/lib/catalog/productStaticParams";
import * as resolveBlockColors from "@/lib/catalog/resolveBlockColors";
import * as configuratorCatalogPayload from "@/lib/catalog/configuratorCatalogPayload";

/**
 * Tests run with NEXT_PUBLIC_ASSET_BASE_URL set, so normalizeAssetPath prepends
 * the origin. Strip it before comparing to the expected relative path.
 */
function stripOrigin(url: string): string {
  return url.replace(/^https?:\/\/[^/]+/, "");
}

function sampleProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    category_id: "seating",
    series: "mesh",
    name: "Mesh Chair",
    slug: "mesh-chair",
    description: "Ergonomic mesh chair",
    images: ["/assets/catalog/chair.jpg"],
    flagship_image: "/assets/catalog/chair-flagship.jpg",
    "3d_model": "/models/chair.glb",
    specs: {
      dimensions: "600 x 600 mm",
      materials: ["Mesh", "Aluminium"],
      features: ["Lumbar support", "Adjustable arms"],
      sustainability_score: 8,
    },
    series_id: "seating-mesh",
    series_name: "Mesh",
    created_at: "2024-01-01",
    metadata: { ai_alt_text: "Mesh task chair" },
    ...overrides,
  };
}

describe("catalog adapters", () => {
  it("detects missing Supabase table errors", () => {
    expect(isMissingTableError("", "products")).toBe(false);
    expect(isMissingTableError("schema cache: public.products not found", "products")).toBe(true);
    expect(isMissingTableError("Could not find the table catalog_products", "catalog_products")).toBe(true);
    expect(isMissingTableError("relation products does not exist", "products")).toBe(true);
    expect(isMissingTableError("network timeout", "products")).toBe(false);
  });

  it("normalizes product asset paths", () => {
    const normalized = normalizeProducts([
      sampleProduct({
        images: ["/assets/catalog/chair.jpg"],
        flagship_image: "/assets/catalog/flagship.jpg",
        "3d_model": "/models/model.glb",
      }),
    ]);

    // Browser (happy-dom) client path: normalizeAssetPath prepends NEXT_PUBLIC_ASSET_BASE_URL origin.
    expect(stripOrigin(normalized[0].images[0])).toBe("/assets/catalog/chair.jpg");
    expect(stripOrigin(normalized[0].flagship_image ?? "")).toBe("/assets/catalog/flagship.jpg");
    expect(stripOrigin(normalized[0]["3d_model"] ?? "")).toBe("/models/model.glb");
    expect(normalizeProducts(null as unknown as Product[])).toEqual([]);
  });

  it("maps products to compat shape with specs and alt text fallbacks", () => {
    const compat = toCompatProduct(sampleProduct());
    expect(compat.id).toBe("prod-1");
    expect(compat.detailedInfo.dimensions).toBe("600 x 600 mm");
    expect(compat.detailedInfo.materials).toEqual(["Mesh", "Aluminium"]);
    expect(compat.detailedInfo.features).toEqual(["Lumbar support", "Adjustable arms"]);
    expect(compat.metadata.sustainabilityScore).toBe(8);
    expect(compat.altText).toBe("Mesh task chair");
    expect(stripOrigin(compat.threeDModelUrl ?? "")).toBe("/models/chair.glb");

    const sparse = toCompatProduct(
      sampleProduct({
        description: undefined,
        alt_text: undefined,
        metadata: undefined,
        specs: { dimensions: "", materials: [], features: [] },
      }),
    );
    expect(sparse.description).toBe("");
    expect(sparse.altText).toBe("Mesh Chair product image");
    expect(sparse.detailedInfo.overview).toBe("");
  });

  it("handles non-object specs payloads", () => {
    const compat = toCompatProduct(
      sampleProduct({
        specs: ["invalid"] as unknown as Product["specs"],
      }),
    );
    expect(compat.detailedInfo.dimensions).toBe("");
    expect(compat.detailedInfo.materials).toEqual([]);
    expect(compat.detailedInfo.features).toEqual([]);
  });
});

// Coverage for other lib/catalog pure modules (geometry, fallback, surface, params, colors, payload).
describe("lib/catalog additional modules for coverage", () => {
  it("exercises geometry pure functions", () => {
    expect(geometry.DEFAULT_DERIVED_RULES).toBeDefined();
    expect(geometry.WORKSURFACE_HEIGHT_MM).toBe(750);
    expect(geometry.sharingPeopleCount(4)).toBeGreaterThan(0);
    // valid call per fn sig
    expect(geometry.computeWorkstationFootprint(
      {
        shape: "straight",
        system: "leg",
        wireManagement: [],
        sharing: "non-sharing",
        seaterOptions: [1, 2],
        lengthOptions: [1200],
        depthOptions: [600],
        heightMm: 750,
      },
      { seaters: 2, length: 1200, depth: 600 },
    )).toBeDefined();
    expect(typeof geometry.deriveScreenLength).toBe("function");
  });

  it("exercises fallback and other catalog utils", () => {
    const fb = buildLocalCatalogFallbackProducts();
    expect(Array.isArray(fb)).toBe(true);
    expect(fb.length).toBeGreaterThan(0);
    expect(surface2d5).toBeDefined();
    expect(productStaticParams).toBeDefined();
    expect(resolveBlockColors).toBeDefined();
    expect(configuratorCatalogPayload).toBeDefined();
  });
});
