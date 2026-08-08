import { describe, expect, it } from "vitest";
import { snap, snapAngle } from "@planner/lib/plannerSnap";
import {
  toMm,
  fromMm,
  formatDim,
  pxToMm,
  mmToPx,
  MM_PER_INCH,
} from "@planner/lib/plannerUnits";
import { autoArrange } from "@planner/lib/plannerAutoArrange";
import {
  SCALE_PX_PER_MM,
  DEFAULT_WALL_THICKNESS_MM,
  DEFAULT_SHEET_MM,
  OO,
  OO_DRAW,
} from "@planner/lib/plannerPalette";
import type { FurnitureItem } from "@planner/lib/plannerTypes";

describe("planner geometry: snap", () => {
  it("snaps to grid", () => {
    expect(snap(0, 50)).toBe(0);
    expect(snap(24, 50)).toBe(0);
    expect(snap(25, 50)).toBe(50);
    expect(snap(74, 50)).toBe(50);
    expect(snap(75, 50)).toBe(100);
  });

  it("returns value when grid invalid", () => {
    expect(snap(33, 0)).toBe(33);
    expect(snap(33, -10)).toBe(33);
  });

  it("snaps angles to step", () => {
    expect(snapAngle(0)).toBe(0);
    expect(snapAngle(7)).toBe(0);
    expect(snapAngle(8)).toBe(15);
    expect(snapAngle(44, 45)).toBe(45);
  });
});

describe("planner geometry: units", () => {
  it("converts to/from mm", () => {
    expect(toMm(1, "in")).toBeCloseTo(MM_PER_INCH);
    expect(toMm(1, "cm")).toBe(10);
    expect(toMm(1, "m")).toBe(1000);
    expect(toMm(100, "mm")).toBe(100);
    expect(fromMm(25.4, "in")).toBeCloseTo(1);
    expect(fromMm(100, "cm")).toBe(10);
  });

  it("formats dimensions", () => {
    expect(formatDim(1200, "mm")).toBe("1200 mm");
    expect(formatDim(100, "cm")).toBe("10.0 cm");
    expect(formatDim(1000, "m")).toBe("1.00 m");
  });

  it("px ↔ mm at the plan sheet scale", () => {
    expect(SCALE_PX_PER_MM).toBe(0.05);
    expect(mmToPx(1000, SCALE_PX_PER_MM)).toBe(50);
    expect(pxToMm(50, SCALE_PX_PER_MM)).toBe(1000);
  });
});

describe("planner geometry: plan defaults", () => {
  it("exposes sheet and wall defaults", () => {
    expect(DEFAULT_WALL_THICKNESS_MM).toBe(150);
    expect(DEFAULT_SHEET_MM.width_mm).toBe(15000);
    expect(DEFAULT_SHEET_MM.height_mm).toBe(10000);
  });

  it("draw tokens are palette values", () => {
    expect(OO_DRAW.stroke).toBe(OO.ink900);
    expect(OO_DRAW.fill).toBe(OO.ecru100);
  });
});

describe("planner geometry: autoArrange", () => {
  const chair = (id: string, w = 600, d = 600): FurnitureItem => ({
    id,
    name: id,
    category: "Seating",
    dimensions: { width_mm: w, depth_mm: d, height_mm: 900 },
  });

  it("places items inside room with margin/gap", () => {
    const room = { width_mm: 5000, height_mm: 4000 };
    const result = autoArrange([chair("a"), chair("b")], room, {
      gap_mm: 300,
      margin_mm: 500,
    });
    expect(result.placements.length).toBe(2);
    expect(result.overflow.length).toBe(0);
    for (const p of result.placements) {
      expect(p.x_mm).toBeGreaterThanOrEqual(500);
      expect(p.y_mm).toBeGreaterThanOrEqual(500);
      expect(p.x_mm + p.width_mm).toBeLessThanOrEqual(5000 - 500);
      expect(p.y_mm + p.depth_mm).toBeLessThanOrEqual(4000 - 500);
    }
  });

  it("does not overlap placements (with gap)", () => {
    const room = { width_mm: 8000, height_mm: 6000 };
    const items = [chair("a"), chair("b"), chair("c"), chair("d")];
    const { placements } = autoArrange(items, room, { gap_mm: 200, margin_mm: 400 });
    expect(placements.length).toBe(4);
    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        const a = placements[i];
        const b = placements[j];
        const gap = 200;
        const overlap =
          a.x_mm < b.x_mm + b.width_mm + gap &&
          a.x_mm + a.width_mm + gap > b.x_mm &&
          a.y_mm < b.y_mm + b.depth_mm + gap &&
          a.y_mm + a.depth_mm + gap > b.y_mm;
        expect(overlap).toBe(false);
      }
    }
  });

  it("respects count expansion", () => {
    const room = { width_mm: 10000, height_mm: 8000 };
    const item = { ...chair("desk", 1200, 800), count: 3 };
    const { placements } = autoArrange([item], room, { gap_mm: 100, margin_mm: 200 });
    expect(placements.length).toBe(3);
  });

  it("overflows when room too small", () => {
    const room = { width_mm: 1000, height_mm: 1000 };
    const { placements, overflow } = autoArrange(
      [chair("huge", 2000, 2000)],
      room,
      { gap_mm: 0, margin_mm: 100 },
    );
    expect(placements.length).toBe(0);
    expect(overflow.length).toBeGreaterThan(0);
  });

  it("avoids obstacles", () => {
    const room = { width_mm: 6000, height_mm: 4000 };
    const { placements } = autoArrange([chair("a")], room, {
      gap_mm: 100,
      margin_mm: 200,
      obstacles: [{ x_mm: 200, y_mm: 200, width_mm: 5000, depth_mm: 500, kind: "wall" }],
    });
    expect(placements.length).toBe(1);
    const p = placements[0];
    // should not sit inside the obstacle band near top
    const inObstacle =
      p.x_mm < 200 + 5000 &&
      p.x_mm + p.width_mm > 200 &&
      p.y_mm < 200 + 500 &&
      p.y_mm + p.depth_mm > 200;
    expect(inObstacle).toBe(false);
  });
});
