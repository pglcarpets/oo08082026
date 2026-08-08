import { describe, expect, it } from "vitest";

import {
  DEFAULT_DERIVED_RULES,
  computeWorkstationFootprint,
  deriveModestyLength,
  deriveScreenLength,
  resolveFootprint,
  sharingPeopleCount,
  WORKSURFACE_HEIGHT_MM,
} from "@/lib/catalog/geometry";
import type { Product, WorkstationSpec } from "@/lib/catalog/types";

const straightSpec: WorkstationSpec = {
  shape: "straight",
  system: "leg",
  wireManagement: [],
  sharing: "non-sharing",
  seaterOptions: [2, 4],
  lengthOptions: [1200, 1350],
  depthOptions: [600, 750],
  heightMm: 750,
};

const lShapeSpec: WorkstationSpec = {
  shape: "l-shape",
  system: "partition",
  wireManagement: [],
  sharing: "non-sharing",
  seaterOptions: [2],
  lengthOptions: [1500],
  depthOptions: [600],
  heightMm: 750,
  armOptions: [1200, 1350],
};

describe("catalog geometry", () => {
  it("exposes default derived rules and worksurface height", () => {
    expect(DEFAULT_DERIVED_RULES.screenOffsetIntermediate).toBe(75);
    expect(DEFAULT_DERIVED_RULES.screenOffsetMain).toBe(150);
    expect(WORKSURFACE_HEIGHT_MM).toBe(750);
  });

  it("computes sharing people count with a floor of 2", () => {
    expect(sharingPeopleCount(0)).toBe(2);
    expect(sharingPeopleCount(1)).toBe(2);
    expect(sharingPeopleCount(4)).toBe(8);
    expect(sharingPeopleCount(4.9)).toBe(8);
  });

  it("computes straight workstation footprints from seaters and module length", () => {
    const footprint = computeWorkstationFootprint(straightSpec, {
      seaters: 4,
      length: 1200,
      depth: 600,
    });
    expect(footprint).toEqual({ L: 4800, D: 600, H: 750 });
  });

  it("defaults seaters to at least 1 and uses arm length for L-shape", () => {
    const withDefaultSeaters = computeWorkstationFootprint(straightSpec, {
      seaters: 0,
      length: 1200,
      depth: 600,
    });
    expect(withDefaultSeaters.L).toBe(1200);

    const lFootprint = computeWorkstationFootprint(lShapeSpec, {
      seaters: 2,
      length: 1500,
      depth: 600,
      armLength: 1350,
    });
    expect(lFootprint).toEqual({ L: 3000, D: 1350, H: 750 });

    const lFallbackArm = computeWorkstationFootprint(lShapeSpec, {
      seaters: 1,
      length: 1500,
      depth: 600,
    });
    expect(lFallbackArm.D).toBe(1200);
  });

  it("derives screen and modesty lengths with clamping", () => {
    expect(deriveScreenLength(600, "intermediate")).toBe(525);
    expect(deriveScreenLength(1200, "main")).toBe(1050);
    expect(deriveScreenLength(50, "main", { screenOffsetIntermediate: 75, screenOffsetMain: 150 })).toBe(0);
    expect(deriveModestyLength(2400)).toBe(2400);
  });

  it("resolves parametric footprints with selection defaults", () => {
    const product: Product = {
      id: "ws-1",
      category_id: "workstations",
      series: "linear",
      name: "Linear",
      slug: "linear",
      images: [],
      specs: { dimensions: "", materials: [], features: [] },
      series_id: "ws-linear",
      series_name: "Linear",
      created_at: "",
      sizingType: "parametric",
      workstation: straightSpec,
    };

    const footprint = resolveFootprint(product);
    expect(footprint).toEqual({ L: 2400, D: 600, H: 750 });

    const custom = resolveFootprint(product, { selection: { seaters: 3, length: 1350, depth: 750 } });
    expect(custom).toEqual({ L: 4050, D: 750, H: 750 });
  });

  it("resolves discrete and fixed footprints and handles missing geometry", () => {
    const discrete: Product = {
      id: "ped-1",
      category_id: "storage",
      series: "pedestal",
      name: "Pedestal",
      slug: "pedestal",
      images: [],
      specs: { dimensions: "", materials: [], features: [] },
      series_id: "storage-ped",
      series_name: "Pedestal",
      created_at: "",
      sizingType: "discrete",
      sizeOptions: [
        { sku: "PED-A", label: "A", dim: { L: 400, D: 450 } },
        { sku: "PED-B", label: "B", dim: { L: 500, D: 450 } },
      ],
    };

    expect(resolveFootprint(discrete)).toEqual({ L: 400, D: 450 });
    expect(resolveFootprint(discrete, { sizeSku: "PED-B" })).toEqual({ L: 500, D: 450 });
    expect(resolveFootprint({ ...discrete, sizeOptions: [] })).toBeNull();

    const fixed: Product = {
      ...discrete,
      sizingType: "fixed",
      defaultFootprint: { L: 900, D: 450, H: 750 },
      sizeOptions: undefined,
    };
    expect(resolveFootprint(fixed)).toEqual({ L: 900, D: 450, H: 750 });

    const legacy: Product = {
      ...fixed,
      sizingType: undefined,
      defaultFootprint: { L: 1200, D: 600 },
    };
    expect(resolveFootprint(legacy)).toEqual({ L: 1200, D: 600 });

    const missingParametric: Product = {
      ...discrete,
      sizingType: "parametric",
      workstation: undefined,
    };
    expect(resolveFootprint(missingParametric)).toBeNull();

    const unknownSizing = {
      ...fixed,
      sizingType: "custom" as Product["sizingType"],
    };
    expect(resolveFootprint(unknownSizing)).toEqual({ L: 900, D: 450, H: 750 });
  });
});