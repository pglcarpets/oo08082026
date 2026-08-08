import { describe, expect, it } from "vitest";

import {
  extrusionDepth,
  roundSurface2_5DPrims,
  SUBTLE_SURFACE_GRAD,
  surface2_5DPrims,
  SURFACE_2_5D,
} from "@/lib/catalog/surface2d5";

describe("catalog surface2d5", () => {
  it("clamps extrusion depth based on footprint size", () => {
    expect(extrusionDepth(200, 200)).toBe(24);
    expect(extrusionDepth(2000, 2000)).toBe(56);
    expect(extrusionDepth(800, 600)).toBeGreaterThanOrEqual(24);
    expect(extrusionDepth(800, 600)).toBeLessThanOrEqual(56);
  });

  it("builds rectangular surface primitives with gradient and highlights", () => {
    const prims = surface2_5DPrims(0, 0, 1200, 600);
    expect(prims.length).toBeGreaterThan(4);
    expect(prims.some((prim) => prim.kind === "rect" && prim.fillLinearGradientColorStops === SUBTLE_SURFACE_GRAD)).toBe(true);
    expect(prims.some((prim) => prim.kind === "line")).toBe(true);
    expect(SURFACE_2_5D.top).toBe("var(--color-ecru-200)");
  });

  it("builds round surface primitives with layered circles", () => {
    const prims = roundSurface2_5DPrims(450, 450, 300);
    expect(prims.filter((prim) => prim.kind === "circle").length).toBeGreaterThanOrEqual(3);
    expect(prims.some((prim) => prim.kind === "circle" && prim.fillLinearGradientColorStops === SUBTLE_SURFACE_GRAD)).toBe(true);
  });
});