import { describe, it, expect } from "vitest";
import {
  collectFurnitureDistanceGuides,
  aabbFromCenteredFurniture,
  aabbGapMm,
  DEFAULT_DISTANCE_GUIDE_MAX_COUNT,
} from "@/lib/Planner/geometry/distanceGuides";

describe("distanceGuides", () => {
  it("computes nearest edge gap between active and neighbor", () => {
    const active = {
      id: "a",
      cxMm: 300,
      cyMm: 300,
      widthMm: 200,
      depthMm: 200,
    };
    const other = {
      id: "b",
      cxMm: 800,
      cyMm: 300,
      widthMm: 200,
      depthMm: 200,
    };
    // a: 200-400 x, b: 700-900 x → gap 300
    const gap = aabbGapMm(
      aabbFromCenteredFurniture(active),
      aabbFromCenteredFurniture(other),
    );
    expect(gap.gap).toBe(300);
    expect(gap.axis).toBe("x");

    const guides = collectFurnitureDistanceGuides({
      active,
      others: [other],
    });
    expect(guides).toHaveLength(1);
    expect(guides[0]?.distanceMm).toBe(300);
    expect(guides[0]?.targetId).toBe("b");
  });

  it("computes y-axis gap when boxes stack vertically", () => {
    const a = { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    const b = { minX: 0, minY: 250, maxX: 100, maxY: 350 };
    const gap = aabbGapMm(a, b);
    expect(gap.axis).toBe("y");
    expect(gap.gap).toBe(150);
    expect(gap.from).toEqual({ x: 50, y: 100 });
    expect(gap.to).toEqual({ x: 50, y: 250 });

    // active below neighbor
    const gapFlip = aabbGapMm(b, a);
    expect(gapFlip.axis).toBe("y");
    expect(gapFlip.gap).toBe(150);
    expect(gapFlip.from.y).toBe(250);
    expect(gapFlip.to.y).toBe(100);
  });

  it("computes x-axis gap when active is to the right of neighbor", () => {
    const left = { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    const right = { minX: 200, minY: 0, maxX: 300, maxY: 100 };
    const gap = aabbGapMm(right, left);
    expect(gap.axis).toBe("x");
    expect(gap.gap).toBe(100);
    expect(gap.from.x).toBe(200);
    expect(gap.to.x).toBe(100);
  });

  it("uses free axis for diagonal separation", () => {
    const a = { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    const b = { minX: 200, minY: 200, maxX: 300, maxY: 300 };
    const gap = aabbGapMm(a, b);
    expect(gap.axis).toBe("free");
    expect(gap.gap).toBeCloseTo(Math.hypot(100, 100), 5);
  });

  it("returns free zero gap when boxes overlap", () => {
    const a = { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    const b = { minX: 50, minY: 50, maxX: 150, maxY: 150 };
    const gap = aabbGapMm(a, b);
    expect(gap.gap).toBe(0);
    expect(gap.axis).toBe("free");
  });

  it("ignores overlapping neighbors", () => {
    const guides = collectFurnitureDistanceGuides({
      active: { id: "a", cxMm: 0, cyMm: 0, widthMm: 100, depthMm: 100 },
      others: [{ id: "b", cxMm: 10, cyMm: 10, widthMm: 100, depthMm: 100 }],
    });
    expect(guides).toHaveLength(0);
  });

  it("excludes self id and respects maxGuides cap", () => {
    const active = {
      id: "active",
      cxMm: 0,
      cyMm: 0,
      widthMm: 100,
      depthMm: 100,
    };
    const others = Array.from({ length: 10 }, (_, i) => ({
      id: `n${i}`,
      cxMm: 300 + i * 50,
      cyMm: 0,
      widthMm: 100,
      depthMm: 100,
    }));
    others.push({ ...active }); // self

    const guides = collectFurnitureDistanceGuides({
      active,
      others,
      maxGuides: 3,
      maxDistanceMm: 5000,
    });
    expect(guides).toHaveLength(3);
    expect(guides.every((g) => g.targetId !== "active")).toBe(true);
    // nearest first
    expect(guides[0]?.distanceMm).toBeLessThanOrEqual(guides[1]!.distanceMm);
    expect(guides[1]?.distanceMm).toBeLessThanOrEqual(guides[2]!.distanceMm);
  });

  it("defaults maxGuides when not provided", () => {
    const active = { id: "a", cxMm: 0, cyMm: 0, widthMm: 50, depthMm: 50 };
    const others = Array.from({ length: 12 }, (_, i) => ({
      id: `o${i}`,
      cxMm: 200 + i * 80,
      cyMm: 0,
      widthMm: 50,
      depthMm: 50,
    }));
    const guides = collectFurnitureDistanceGuides({ active, others });
    expect(guides.length).toBeLessThanOrEqual(DEFAULT_DISTANCE_GUIDE_MAX_COUNT);
  });

  it("falls back invalid sizes and supports rotated AABB", () => {
    const box = aabbFromCenteredFurniture({
      id: "rot",
      cxMm: 0,
      cyMm: 0,
      widthMm: 0,
      depthMm: -1,
      rotationDeg: 45,
    });
    // positiveSize falls back to 1 for both → unit square rotated
    expect(box.minX).toBeLessThan(0);
    expect(box.maxX).toBeGreaterThan(0);
    expect(box.minY).toBeLessThan(0);
    expect(box.maxY).toBeGreaterThan(0);
  });

  it("skips neighbors beyond maxDistanceMm", () => {
    const guides = collectFurnitureDistanceGuides({
      active: { id: "a", cxMm: 0, cyMm: 0, widthMm: 100, depthMm: 100 },
      others: [{ id: "far", cxMm: 5000, cyMm: 0, widthMm: 100, depthMm: 100 }],
      maxDistanceMm: 500,
    });
    expect(guides).toHaveLength(0);
  });
});
