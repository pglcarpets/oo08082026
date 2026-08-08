import { describe, it, expect } from "vitest";
import {
  alignEntities,
  distributeEntities,
  applyAlignAction,
  type AlignAction,
} from "@/lib/Planner/geometry/alignDistribute";

describe("alignDistribute", () => {
  const three = [
    { id: "a", xMm: 100, yMm: 0, widthMm: 50, depthMm: 40 },
    { id: "b", xMm: 300, yMm: 20, widthMm: 50, depthMm: 40 },
    { id: "c", xMm: 500, yMm: 40, widthMm: 50, depthMm: 40 },
  ];

  it("left-aligns three rects to min x", () => {
    const updates = alignEntities(three, "x", "min");
    expect(updates).toHaveLength(3);
    expect(updates.every((u) => u.xMm === 100)).toBe(true);
  });

  it("center-aligns on x", () => {
    // span min=100 max=550 → center 325; each width 50 → left 300
    const updates = alignEntities(three, "x", "center");
    expect(updates.every((u) => u.xMm === 300)).toBe(true);
  });

  it("max-aligns on x (right edges)", () => {
    // max trailing = 550; each left = 500
    const updates = alignEntities(three, "x", "max");
    expect(updates.every((u) => u.xMm === 500)).toBe(true);
  });

  it("aligns on y anchors", () => {
    const top = alignEntities(three, "y", "min");
    expect(top.every((u) => u.yMm === 0)).toBe(true);

    const bottom = alignEntities(three, "y", "max");
    // max trailing = 40+40=80
    expect(bottom.every((u) => u.yMm === 40)).toBe(true);

    const mid = alignEntities(three, "y", "center");
    // center of 0..80 is 40; size 40 → y = 20
    expect(mid.every((u) => u.yMm === 20)).toBe(true);
  });

  it("returns empty when fewer than 2 entities for align", () => {
    expect(alignEntities(three.slice(0, 1), "x", "min")).toEqual([]);
    expect(alignEntities([], "x", "min")).toEqual([]);
  });

  it("distributes equal gaps along x for 3+ items", () => {
    const updates = distributeEntities(three, "x");
    expect(updates).toHaveLength(3);
    const byId = Object.fromEntries(updates.map((u) => [u.id, u]));
    expect(byId.a?.xMm).toBe(100);
    expect(byId.c?.xMm).toBe(500);
    expect(byId.b?.xMm).toBe(300);
  });

  it("distributes equal gaps along y (distV)", () => {
    const vertical = [
      { id: "a", xMm: 0, yMm: 0, widthMm: 40, depthMm: 50 },
      { id: "b", xMm: 0, yMm: 100, widthMm: 40, depthMm: 50 },
      { id: "c", xMm: 0, yMm: 300, widthMm: 40, depthMm: 50 },
    ];
    const updates = distributeEntities(vertical, "y");
    const byId = Object.fromEntries(updates.map((u) => [u.id, u]));
    expect(byId.a?.yMm).toBe(0);
    expect(byId.c?.yMm).toBe(300);
    // span 0..350, sizes 150, free 200, gap 100 → b at 50+100=150
    expect(byId.b?.yMm).toBe(150);
  });

  it("requires 3 entities for distribute", () => {
    expect(distributeEntities(three.slice(0, 2), "x")).toEqual([]);
  });

  it("distributes with sparse-safe iteration on sorted list", () => {
    // Uneven sizes force middle repositioning on both axes
    const mixed = [
      { id: "a", xMm: 0, yMm: 0, widthMm: 10, depthMm: 20 },
      { id: "b", xMm: 40, yMm: 50, widthMm: 30, depthMm: 10 },
      { id: "c", xMm: 100, yMm: 200, widthMm: 20, depthMm: 40 },
    ];
    const hx = distributeEntities(mixed, "x");
    expect(hx).toHaveLength(3);
    expect(hx.find((u) => u.id === "a")?.xMm).toBe(0);
    expect(hx.find((u) => u.id === "c")?.xMm).toBe(100);
    // span 0..120, sizes 60, free 60, gap 30 → b at 10+30=40 (may equal prior)
    expect(hx.find((u) => u.id === "b")?.xMm).toBe(40);

    const hy = distributeEntities(mixed, "y");
    expect(hy).toHaveLength(3);
    expect(hy.find((u) => u.id === "a")?.yMm).toBe(0);
    expect(hy.find((u) => u.id === "c")?.yMm).toBe(200);
    // span 0..240, sizes 70, free 170, gap 85 → b at 20+85=105
    expect(hy.find((u) => u.id === "b")?.yMm).toBe(105);
  });

  it("applyAlignAction covers every action", () => {
    const pair = three.slice(0, 2);
    const left = applyAlignAction(pair, "left");
    expect(left.every((u) => u.xMm === 100)).toBe(true);

    const centerX = applyAlignAction(pair, "centerX");
    // min 100 max 350 → center 225 → left 200 for width 50
    expect(centerX.every((u) => u.xMm === 200)).toBe(true);

    const right = applyAlignAction(pair, "right");
    expect(right.every((u) => u.xMm === 300)).toBe(true);

    const top = applyAlignAction(pair, "top");
    expect(top.every((u) => u.yMm === 0)).toBe(true);

    const centerY = applyAlignAction(pair, "centerY");
    // min 0 max 60 → center 30 → y 10 for depth 40
    expect(centerY.every((u) => u.yMm === 10)).toBe(true);

    const bottom = applyAlignAction(pair, "bottom");
    expect(bottom.every((u) => u.yMm === 20)).toBe(true);

    const distH = applyAlignAction(three, "distH");
    expect(distH).toHaveLength(3);

    const distV = applyAlignAction(
      [
        { id: "a", xMm: 0, yMm: 0, widthMm: 10, depthMm: 10 },
        { id: "b", xMm: 0, yMm: 50, widthMm: 10, depthMm: 10 },
        { id: "c", xMm: 0, yMm: 100, widthMm: 10, depthMm: 10 },
      ],
      "distV",
    );
    expect(distV).toHaveLength(3);

    // Exhaustive switch default is unreachable with AlignAction union, but
    // cast exercises the defensive empty return if present.
    expect(applyAlignAction(pair, "unknown" as AlignAction)).toEqual([]);
  });
});
