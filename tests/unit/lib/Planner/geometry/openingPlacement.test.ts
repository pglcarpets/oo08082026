import { describe, it, expect } from "vitest";
import {
  placeOpeningOnNearestWall,
  clampOpeningCenterAlongMm,
  wallOpeningPickToleranceMm,
  OPENING_END_MARGIN_MM,
  OPENING_PICK_SLACK_MM,
} from "@/lib/Planner/geometry/openingPlacement";

describe("placeOpeningOnNearestWall", () => {
  const walls = [
    { id: "w1", x1Mm: 0, y1Mm: 0, x2Mm: 5000, y2Mm: 0, thicknessMm: 150 },
  ];

  it("places door centre on wall within pick tolerance", () => {
    const result = placeOpeningOnNearestWall({
      pointMm: { x: 2500, y: 40 },
      walls,
      openingWidthMm: 900,
    });
    expect("rejected" in result).toBe(false);
    if ("rejected" in result) return;
    expect(result.wallId).toBe("w1");
    expect(result.position).toBeGreaterThan(0.1);
    expect(result.position).toBeLessThan(0.9);
    expect(result.yMm).toBe(0);
  });

  it("rejects when click is far from any wall", () => {
    const result = placeOpeningOnNearestWall({
      pointMm: { x: 2500, y: 2000 },
      walls,
      openingWidthMm: 900,
    });
    expect(result).toEqual({ rejected: true, reason: "off-wall" });
  });

  it("rejects when no walls", () => {
    const result = placeOpeningOnNearestWall({
      pointMm: { x: 0, y: 0 },
      walls: [],
      openingWidthMm: 900,
    });
    expect(result).toEqual({ rejected: true, reason: "no-walls" });
  });

  it("rejects wall-too-short for wide openings", () => {
    const short = [
      { id: "short", x1Mm: 0, y1Mm: 0, x2Mm: 1000, y2Mm: 0, thicknessMm: 150 },
    ];
    const result = placeOpeningOnNearestWall({
      pointMm: { x: 500, y: 0 },
      walls: short,
      openingWidthMm: 900,
    });
    // 1000 < 900 + 2*80
    expect(result).toEqual({ rejected: true, reason: "wall-too-short" });
  });

  it("rejects wall-end when clamped centre is at extreme end", () => {
    // Long wall; click near start so clamp pushes to min along but t still at extreme
    // for a short-enough wall relative to opening so t ends near 0.02 or 0.98
    // Use wall where min along / length is still <= 0.02 after clamp... actually
    // wall-end triggers when t <= 0.02 or t >= 0.98 after clamp.
    // clampOpeningCenterAlongMm with opening that nearly fills wall:
    // length = 1100, opening 900 → min = 450+80=530, max=1100-530=570 → ok not end
    // For wall-end: need t after clamp still at ends. That happens when min > max
    // path is avoided by wall-too-short first. Looking at code:
    // if length < opening + 2*margin → wall-too-short first.
    // So wall-end needs length >= opening+2*margin AND t at extreme.
    // Click at t=0 with long wall: clamp moves to min = half+margin, t = min/length.
    // For t <= 0.02: min/length <= 0.02 → (w/2+80)/L <= 0.02 → w/2+80 <= 0.02L
    // With w=900: 450+80=530 <= 0.02L → L >= 26500. So very long wall + click at end?
    // Actually if click is at end, clamp moves inward so t should be > 0.02 for normal doors.
    // Wait: if along is at end and clamp works, t should be fine.
    // wall-end: after clamp, t <= 0.02. That means the clamped position is still near end.
    // When min > max, clamp returns L/2 — but that's only if min > max which is
    // length < opening + 2*margin which is wall-too-short first.
    //
    // Hmm: can we hit wall-end? With opening width 0: min = 80, max = L-80.
    // Click at 0: clamp to 80, t=80/L. For L=1000, t=0.08 > 0.02. For L=3000, t≈0.027.
    // For L=5000, t=0.016 ≤ 0.02 → wall-end!
    const long = [
      { id: "long", x1Mm: 0, y1Mm: 0, x2Mm: 5000, y2Mm: 0, thicknessMm: 150 },
    ];
    const result = placeOpeningOnNearestWall({
      pointMm: { x: 0, y: 0 },
      walls: long,
      openingWidthMm: 0,
    });
    expect(result).toEqual({ rejected: true, reason: "wall-end" });
  });

  it("picks the nearest of multiple walls", () => {
    const multi = [
      { id: "far", x1Mm: 0, y1Mm: 500, x2Mm: 5000, y2Mm: 500, thicknessMm: 100 },
      { id: "near", x1Mm: 0, y1Mm: 0, x2Mm: 5000, y2Mm: 0, thicknessMm: 100 },
    ];
    const result = placeOpeningOnNearestWall({
      pointMm: { x: 2500, y: 20 },
      walls: multi,
      openingWidthMm: 900,
    });
    expect("rejected" in result).toBe(false);
    if ("rejected" in result) return;
    expect(result.wallId).toBe("near");
  });

  it("skips zero-length walls and can still reject off-wall", () => {
    const result = placeOpeningOnNearestWall({
      pointMm: { x: 100, y: 100 },
      walls: [
        { id: "dot", x1Mm: 0, y1Mm: 0, x2Mm: 0, y2Mm: 0, thicknessMm: 150 },
      ],
      openingWidthMm: 900,
    });
    // distance to zero-length wall is hypot(100,100)≈141; tol = 75+80=155
    // matches then wall-too-short (or off-wall if outside tol)
    expect("rejected" in result).toBe(true);
  });

  it("updates best wall when a closer projection is found", () => {
    const multi = [
      { id: "far", x1Mm: 0, y1Mm: 100, x2Mm: 5000, y2Mm: 100, thicknessMm: 200 },
      { id: "near", x1Mm: 0, y1Mm: 0, x2Mm: 5000, y2Mm: 0, thicknessMm: 200 },
    ];
    const result = placeOpeningOnNearestWall({
      pointMm: { x: 2500, y: 30 },
      walls: multi,
      openingWidthMm: 900,
    });
    expect("rejected" in result).toBe(false);
    if ("rejected" in result) return;
    expect(result.wallId).toBe("near");
  });

  it("keeps nearer wall when a farther-in-tolerance wall is also considered", () => {
    // tol for thickness 200 = 100+80 = 180. Point at y=20:
    // near wall y=0 distance 20; mid wall y=80 distance 60; far wall y=150 distance 130.
    // All within 180; best stays "near" when later walls are farther.
    const multi = [
      { id: "near", x1Mm: 0, y1Mm: 0, x2Mm: 5000, y2Mm: 0, thicknessMm: 200 },
      { id: "mid", x1Mm: 0, y1Mm: 80, x2Mm: 5000, y2Mm: 80, thicknessMm: 200 },
      { id: "far", x1Mm: 0, y1Mm: 150, x2Mm: 5000, y2Mm: 150, thicknessMm: 200 },
    ];
    const result = placeOpeningOnNearestWall({
      pointMm: { x: 2500, y: 20 },
      walls: multi,
      openingWidthMm: 900,
    });
    expect("rejected" in result).toBe(false);
    if ("rejected" in result) return;
    expect(result.wallId).toBe("near");
  });

  it("uses mid t when zero-length wall bypasses wall-too-short via negative width", () => {
    // length 0 < openingWidth + 2*margin → when openingWidth = -200: 0 < -40 is false
    // so wall-too-short is skipped; t falls back to 0.5; then wall-end rejects (0.5 is fine actually)
    // 0.5 is between 0.02 and 0.98 so placement succeeds at the zero point.
    const result = placeOpeningOnNearestWall({
      pointMm: { x: 0, y: 0 },
      walls: [
        { id: "dot", x1Mm: 0, y1Mm: 0, x2Mm: 0, y2Mm: 0, thicknessMm: 150 },
      ],
      openingWidthMm: -200,
    });
    expect("rejected" in result).toBe(false);
    if ("rejected" in result) return;
    expect(result.position).toBe(0.5);
    expect(result.xMm).toBe(0);
    expect(result.yMm).toBe(0);
  });
});

describe("clampOpeningCenterAlongMm", () => {
  it("clamps within end margins", () => {
    expect(clampOpeningCenterAlongMm(5000, 0, 900)).toBe(450 + OPENING_END_MARGIN_MM);
    expect(clampOpeningCenterAlongMm(5000, 5000, 900)).toBe(
      5000 - 450 - OPENING_END_MARGIN_MM,
    );
    expect(clampOpeningCenterAlongMm(5000, 2500, 900)).toBe(2500);
  });

  it("returns mid-wall when margins leave no valid range", () => {
    expect(clampOpeningCenterAlongMm(1000, 100, 900)).toBe(500);
  });
});

describe("wallOpeningPickToleranceMm", () => {
  it("uses half thickness plus slack", () => {
    expect(
      wallOpeningPickToleranceMm({
        id: "w",
        x1Mm: 0,
        y1Mm: 0,
        x2Mm: 1,
        y2Mm: 0,
        thicknessMm: 200,
      }),
    ).toBe(100 + OPENING_PICK_SLACK_MM);
  });

  it("falls back to 150mm thickness when non-positive", () => {
    expect(
      wallOpeningPickToleranceMm({
        id: "w",
        x1Mm: 0,
        y1Mm: 0,
        x2Mm: 1,
        y2Mm: 0,
        thicknessMm: 0,
      }),
    ).toBe(75 + OPENING_PICK_SLACK_MM);
  });
});
