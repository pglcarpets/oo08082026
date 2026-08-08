import { describe, it, expect } from "vitest";
import {
  snapPoint,
  compareSnapCandidates,
} from "@/lib/Planner/plannerSnapManager";

describe("snapPoint", () => {
  const walls = [
    { id: "w1", x1Mm: 0, y1Mm: 0, x2Mm: 4000, y2Mm: 0, thicknessMm: 100 },
  ];

  it("snaps to grid when no geometry is closer", () => {
    const r = snapPoint({
      xMm: 103,
      yMm: 97,
      walls: [],
      furniture: [],
      gridMm: 50,
      thresholdMm: 20,
    });
    expect(r.xMm).toBe(100);
    expect(r.yMm).toBe(100);
    expect(r.type).toBe("grid");
    expect(r.active).toBe(true);
  });

  it("prefers wall endpoint over grid when inside threshold", () => {
    const r = snapPoint({
      xMm: 12,
      yMm: 8,
      walls,
      furniture: [],
      gridMm: 50,
      thresholdMm: 25,
    });
    expect(r.xMm).toBe(0);
    expect(r.yMm).toBe(0);
    expect(r.type).toBe("corner");
    expect(r.sourceId).toBe("w1");
    expect(r.active).toBe(true);
  });

  it("snaps to wall midpoint", () => {
    const r = snapPoint({
      xMm: 2005,
      yMm: 10,
      walls,
      furniture: [],
      gridMm: 50,
      thresholdMm: 20,
    });
    expect(r.xMm).toBe(2000);
    expect(r.yMm).toBe(0);
    expect(r.type).toBe("midpoint");
  });

  it("snaps to wall centerline away from midpoint", () => {
    const r = snapPoint({
      xMm: 1000,
      yMm: 12,
      walls,
      furniture: [],
      gridMm: 50,
      thresholdMm: 20,
      preferGeometry: true,
    });
    expect(r.active).toBe(true);
    expect(r.type).toBe("centerline");
    expect(r.sourceId).toBe("w1");
    expect(r.yMm).toBe(0);
    expect(r.xMm).toBeCloseTo(1000, 5);
  });

  it("snaps to furniture edge points", () => {
    const furniture = [
      {
        id: "desk",
        xMm: 1000,
        yMm: 1000,
        widthMm: 800,
        depthMm: 400,
        rotationDeg: 0,
      },
    ];
    const r = snapPoint({
      xMm: 1005,
      yMm: 1002,
      walls: [],
      furniture,
      gridMm: 50,
      thresholdMm: 20,
    });
    expect(r.active).toBe(true);
    expect(r.type).toBe("edge");
    expect(r.sourceId).toBe("desk");
    expect(r.xMm).toBe(1000);
    expect(r.yMm).toBe(1000);
  });

  it("returns inactive when far from grid and geometry", () => {
    const r = snapPoint({
      xMm: 23,
      yMm: 23,
      walls: [],
      furniture: [],
      gridMm: 50,
      thresholdMm: 5,
    });
    expect(r.active).toBe(false);
    expect(r.xMm).toBe(23);
    expect(r.yMm).toBe(23);
  });

  it("with threshold 0 only snaps exact grid hits", () => {
    const exact = snapPoint({
      xMm: 100,
      yMm: 100,
      walls,
      furniture: [],
      gridMm: 50,
      thresholdMm: 0,
    });
    expect(exact.active).toBe(true);
    expect(exact.type).toBe("grid");

    const near = snapPoint({
      xMm: 103,
      yMm: 100,
      walls,
      furniture: [],
      gridMm: 50,
      thresholdMm: 0,
    });
    expect(near.active).toBe(false);
    // geometry is skipped when thr is 0
    expect(near.xMm).toBe(103);
  });

  it("can prefer grid over geometry when preferGeometry is false", () => {
    // Point near wall corner (0,0) and also near grid 50
    const r = snapPoint({
      xMm: 40,
      yMm: 5,
      walls,
      furniture: [],
      gridMm: 50,
      thresholdMm: 50,
      preferGeometry: false,
    });
    expect(r.active).toBe(true);
    // Without geometry preference, nearest distance wins: grid (50,0) is ~10.3, corner is ~40.3
    expect(r.type).toBe("grid");
    expect(r.xMm).toBe(50);
    expect(r.yMm).toBe(0);
  });

  it("handles zero-length walls as a point candidate", () => {
    const r = snapPoint({
      xMm: 5,
      yMm: 5,
      walls: [
        { id: "dot", x1Mm: 0, y1Mm: 0, x2Mm: 0, y2Mm: 0, thicknessMm: 50 },
      ],
      furniture: [],
      gridMm: 0,
      thresholdMm: 20,
    });
    expect(r.active).toBe(true);
    expect(r.type).toBe("corner");
    expect(r.xMm).toBe(0);
    expect(r.yMm).toBe(0);
  });

  it("returns inactive with empty candidates when gridMm is 0 and thr is 0", () => {
    const r = snapPoint({
      xMm: 11,
      yMm: 22,
      walls: [],
      furniture: [],
      gridMm: 0,
      thresholdMm: 0,
    });
    expect(r.active).toBe(false);
    expect(r.distanceMm).toBe(0);
  });

  it("prefers geometry over a closer grid when preferGeometry is true", () => {
    // Grid snaps to (50,0); wall corner at (0,0). Point (40,5):
    // grid distance ~10.3, corner ~40.3 — both under thr 50.
    // preferGeometry should pick corner (or centerline) over grid.
    const r = snapPoint({
      xMm: 40,
      yMm: 5,
      walls,
      furniture: [],
      gridMm: 50,
      thresholdMm: 50,
      preferGeometry: true,
    });
    expect(r.active).toBe(true);
    expect(r.type).not.toBe("grid");
  });

  it("snaps to multiple furniture edge midpoints and far corners", () => {
    const furniture = [
      {
        id: "box",
        xMm: 0,
        yMm: 0,
        widthMm: 200,
        depthMm: 100,
        rotationDeg: 0,
      },
    ];
    // Near top-edge midpoint (100, 0)
    const mid = snapPoint({
      xMm: 100,
      yMm: 8,
      walls: [],
      furniture,
      gridMm: 0,
      thresholdMm: 15,
    });
    expect(mid.active).toBe(true);
    expect(mid.type).toBe("edge");
    expect(mid.xMm).toBe(100);
    expect(mid.yMm).toBe(0);

    // Near right-edge midpoint (200, 50)
    const right = snapPoint({
      xMm: 205,
      yMm: 50,
      walls: [],
      furniture,
      gridMm: 0,
      thresholdMm: 15,
    });
    expect(right.active).toBe(true);
    expect(right.sourceId).toBe("box");
    expect(right.xMm).toBe(200);
  });
});

describe("compareSnapCandidates", () => {
  const thr = 50;
  const grid = { type: "grid" as const, distanceMm: 10, priority: 4 };
  const corner = { type: "corner" as const, distanceMm: 40, priority: 0 };
  const mid = { type: "midpoint" as const, distanceMm: 40, priority: 1 };

  it("prefers geometry over grid in both comparator argument orders", () => {
    expect(compareSnapCandidates(corner, grid, thr, true)).toBe(-1);
    expect(compareSnapCandidates(grid, corner, thr, true)).toBe(1);
  });

  it("falls back to distance then priority when preferGeometry is false", () => {
    expect(compareSnapCandidates(grid, corner, thr, false)).toBeLessThan(0);
    expect(compareSnapCandidates(corner, mid, thr, true)).toBeLessThan(0);
    expect(
      compareSnapCandidates(
        { type: "edge", distanceMm: 5, priority: 3 },
        { type: "edge", distanceMm: 5, priority: 3 },
        thr,
        true,
      ),
    ).toBe(0);
  });

  it("does not prefer geometry when either distance exceeds threshold", () => {
    const farCorner = { type: "corner" as const, distanceMm: 60, priority: 0 };
    // farCorner outside thr → pure distance compare
    expect(compareSnapCandidates(grid, farCorner, thr, true)).toBeLessThan(0);
  });
});
