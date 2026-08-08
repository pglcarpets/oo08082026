import { describe, expect, it } from "vitest";

import { productToRow, rowToProduct, type ConfiguratorProductRow } from "@/lib/catalog/configuratorCatalog";
import type { Product } from "@/lib/catalog/types";

const sampleProduct: Product = {
  id: "oando-ws-linear",
  category_id: "workstations",
  series: "linear",
  name: "Linear Workstation",
  slug: "oando-ws-linear",
  description: "Parametric desk",
  images: [],
  family: "Linear",
  brandName: "DeskPro",
  sizingType: "parametric",
  workstation: {
    shape: "straight",
    system: "leg",
    wireManagement: [],
    sharing: "non-sharing",
    seaterOptions: [2],
    lengthOptions: [1200],
    depthOptions: [600],
    heightMm: 750,
  },
  derivedRules: { screenOffsetIntermediate: 75, screenOffsetMain: 150 },
  thumbnailUrl: "/thumb.png",
  model3dUrl: "/model.glb",
  specs: { dimensions: "", materials: ["Laminate"], features: [] },
  series_id: "workstations-linear",
  series_name: "Linear",
  created_at: "2024-01-01",
  metadata: { source: "seed" },
};

describe("configurator catalog mapping", () => {
  it("maps products to configurator rows", () => {
    const row = productToRow(sampleProduct);
    expect(row.slug).toBe("oando-ws-linear");
    expect(row.category).toBe("workstations");
    expect(row.sizing_type).toBe("parametric");
    expect(row.materials).toEqual(["Laminate"]);
    expect(row.thumbnail_url).toBe("/thumb.png");
    expect(row.model_3d_url).toBe("/model.glb");
  });

  it("throws when a product has no sizing type", () => {
    expect(() => productToRow({ ...sampleProduct, sizingType: undefined })).toThrow(/no sizingType/);
  });

  it("round-trips rows back to typed products", () => {
    const row: ConfiguratorProductRow = productToRow(sampleProduct);
    const product = rowToProduct({
      ...row,
      created_at: "2020-01-01",
      updated_at: "2020-02-01",
    });

    expect(product.id).toBe("oando-ws-linear");
    expect(product.category_id).toBe("workstations");
    expect(product.sizingType).toBe("parametric");
    expect(product.workstation?.shape).toBe("straight");
    expect(product.sizeOptions).toBeUndefined();
    expect(product.metadata?.source).toBe("configurator-catalog");
    expect(product.created_at).toBe("2020-01-01");
  });

  it("maps family values into series metadata", () => {
    const product = rowToProduct({
      slug: "panel-desk",
      name: "Panel Desk",
      category: "workstations",
      family: "Panel Series",
      brand_name: "DeskPro",
      sizing_type: "parametric",
      workstation: sampleProduct.workstation ?? null,
      size_options: [],
      default_footprint: null,
      derived_rules: null,
      materials: ["Laminate"],
      thumbnail_url: null,
      model_3d_url: null,
      description: "Panel workstation",
    });

    expect(product.series).toBe("panel-series");
    expect(product.series_id).toBe("workstations-panel-series");
    expect(product.series_name).toBe("Panel Series");
    expect(product.family).toBe("Panel Series");
  });

  it("handles nullable family and empty size options", () => {
    const row = rowToProduct({
      slug: "pedestal",
      name: "Pedestal",
      category: "storage",
      family: null,
      brand_name: null,
      sizing_type: "discrete",
      workstation: null,
      size_options: [],
      default_footprint: null,
      derived_rules: null,
      materials: [],
      thumbnail_url: null,
      model_3d_url: null,
      description: null,
    });

    expect(row.series).toBe("storage");
    expect(row.series_id).toBe("storage-storage");
    expect(row.sizeOptions).toBeUndefined();
    expect(row.family).toBeUndefined();
  });
});