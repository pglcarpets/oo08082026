import { describe, expect, it } from "vitest";
import {
  renderBlock2DCentered,
  renderBlock2DToCanvas,
  resolveCanvasStrokeWidthMm,
} from "@/lib/catalog/renderBlock2DToCanvas";
import type { Block2D } from "@/lib/catalog/blocks2d";

describe("resolveCanvasStrokeWidthMm", () => {
  it("floors thin mm strokes under plan zoom so detail stays visible", () => {
    // scale 0.1 (typical Feasibility zoom) · 1.5mm → need ≥12.5mm user units for 1.25px
    expect(resolveCanvasStrokeWidthMm(1.5, 0.1, 1.25)).toBeCloseTo(12.5, 5);
    expect(resolveCanvasStrokeWidthMm(1.5, 1, 1.25)).toBe(1.5);
  });
});

function mockContext(): CanvasRenderingContext2D {
  const calls: string[] = [];
  const ctx = {
    calls,
    getTransform: () => ({ a: 0.1, b: 0, c: 0, d: 0.1, e: 0, f: 0 }),
    save: () => {
      calls.push("save");
    },
    restore: () => {
      calls.push("restore");
    },
    translate: () => {
      calls.push("translate");
    },
    rotate: () => {
      calls.push("rotate");
    },
    scale: () => {
      calls.push("scale");
    },
    beginPath: () => {
      calls.push("beginPath");
    },
    rect: () => {
      calls.push("rect");
    },
    roundRect: () => {
      calls.push("roundRect");
    },
    arc: () => {
      calls.push("arc");
    },
    moveTo: () => {
      calls.push("moveTo");
    },
    lineTo: () => {
      calls.push("lineTo");
    },
    fill: () => {
      calls.push("fill");
    },
    stroke: () => {
      calls.push("stroke");
    },
    setLineDash: () => {
      calls.push("setLineDash");
    },
    createLinearGradient: () => ({
      addColorStop: () => undefined,
    }),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "butt" as CanvasLineCap,
    shadowColor: "",
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  };
  return ctx as unknown as CanvasRenderingContext2D;
}

describe("renderBlock2DToCanvas", () => {
  it("draws rect prims without throwing", () => {
    const block: Block2D = {
      footprint: { L: 1200, D: 600, H: 750 },
      label: "desk",
      prims: [
        {
          kind: "rect",
          x: 0,
          y: 0,
          w: 1200,
          h: 600,
          fill: "#DED2B6",
          stroke: "#333",
          strokeWidth: 2,
          radius: 8,
        },
      ],
    };
    const ctx = mockContext();
    renderBlock2DToCanvas(ctx, block, {
      resolve: (t) => (t && t !== "none" ? String(t) : "transparent"),
    });
    const calls = (ctx as unknown as { calls: string[] }).calls;
    expect(calls).toContain("save");
    expect(calls).toContain("fill");
    expect(calls).toContain("restore");
  });

  it("centers block via renderBlock2DCentered", () => {
    const block: Block2D = {
      footprint: { L: 100, D: 50, H: 10 },
      label: "box",
      prims: [
        {
          kind: "rect",
          x: 0,
          y: 0,
          w: 100,
          h: 50,
          fill: "#fff",
        },
      ],
    };
    const ctx = mockContext();
    renderBlock2DCentered(ctx, block, {
      resolve: (t) => String(t ?? "transparent"),
    });
    const calls = (ctx as unknown as { calls: string[] }).calls;
    expect(calls.filter((c) => c === "translate").length).toBeGreaterThanOrEqual(1);
  });
});
