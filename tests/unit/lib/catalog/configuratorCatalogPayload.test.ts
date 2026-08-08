import { describe, expect, it } from "vitest";

import { buildConfiguratorRow } from "@/lib/catalog/configuratorCatalogPayload";

const validWorkstation = {
  shape: "straight",
  system: "leg",
  wireManagement: ["raceway"],
  sharing: "non-sharing",
  seaterOptions: [2, 4],
  lengthOptions: [1200],
  depthOptions: [600],
  heightMm: 750,
};

describe("configurator catalog payload", () => {
  it("rejects missing required fields", () => {
    expect(buildConfiguratorRow({})).toEqual({ error: "name is required" });
    expect(buildConfiguratorRow({ name: "Desk" })).toEqual({ error: "category is required" });
    expect(buildConfiguratorRow({ name: "Desk", category: "workstations", sizing_type: "bogus" })).toEqual({
      error: "sizing_type must be one of parametric, discrete, fixed",
    });
  });

  it("validates sizing-type-specific geometry", () => {
    expect(
      buildConfiguratorRow({
        name: "Linear",
        category: "workstations",
        sizing_type: "parametric",
      }),
    ).toEqual({ error: "parametric products require a valid `workstation` spec" });

    expect(
      buildConfiguratorRow({
        name: "Pedestal",
        category: "storage",
        sizing_type: "discrete",
        size_options: [],
      }),
    ).toEqual({
      error: "discrete products require a non-empty `size_options` array of { sku, label, dim }",
    });

    expect(
      buildConfiguratorRow({
        name: "Planter",
        category: "accessories",
        sizing_type: "fixed",
      }),
    ).toEqual({ error: "fixed products require a `default_footprint` { L, D, H? }" });
  });

  it("builds normalized rows for each sizing type", () => {
    const parametric = buildConfiguratorRow({
      name: "Linear Workstation",
      category: "workstations",
      sizing_type: "parametric",
      workstation: validWorkstation,
      brand_name: "DeskPro",
      derived_rules: { screenOffsetIntermediate: 75, screenOffsetMain: 150 },
    });
    expect("row" in parametric).toBe(true);
    if ("row" in parametric) {
      expect(parametric.row.slug).toBe("linear-workstation");
      expect(parametric.row.workstation).toEqual(validWorkstation);
      expect(parametric.row.active).toBe(true);
    }

    const discrete = buildConfiguratorRow({
      name: "Pedestal",
      category: "storage",
      sizing_type: "discrete",
      slug: "custom-pedestal",
      size_options: [{ sku: "PED-1", label: "1 Drawer", dim: { L: 400, D: 450 } }],
      materials: ["  Steel ", "", "Laminate"],
      active: false,
    });
    expect("row" in discrete).toBe(true);
    if ("row" in discrete) {
      expect(discrete.row.slug).toBe("custom-pedestal");
      expect(discrete.row.materials).toEqual(["Steel", "Laminate"]);
      expect(discrete.row.active).toBe(false);
    }

    const fixed = buildConfiguratorRow({
      name: "Planter",
      category: "accessories",
      sizing_type: "fixed",
      default_footprint: { L: 500, D: 500, H: 900 },
      family: "Greenery",
      thumbnail_url: "https://example.com/planter.png",
    });
    expect("row" in fixed).toBe(true);
    if ("row" in fixed) {
      expect(fixed.row.default_footprint).toEqual({ L: 500, D: 500, H: 900 });
      expect(fixed.row.family).toBe("Greenery");
      expect(fixed.row.thumbnail_url).toBe("https://example.com/planter.png");
    }
  });
});