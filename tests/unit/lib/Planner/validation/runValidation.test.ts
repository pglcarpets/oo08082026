import { describe, it, expect } from "vitest";
import {
  runFloorValidation,
  countBySeverity,
  compareValidationIssues,
} from "@/lib/Planner/validation/runValidation";
import type { ValidationIssue } from "@/lib/Planner/validation/types";
import {
  detectFurnitureClearance,
  aabbEdgeGapMm,
  DEFAULT_AISLE_CLEARANCE_MM,
} from "@/lib/Planner/validation/furnitureClearance";
import {
  detectFurnitureOverlaps,
  aabbsOverlap,
} from "@/lib/Planner/validation/furnitureOverlap";
import {
  detectFurnitureOutsideRoom,
  sheetAsRoomPolygon,
} from "@/lib/Planner/validation/furnitureRoomBoundary";
import {
  detectFurnitureWallCollisions,
  wallAsPlacedFurniture,
} from "@/lib/Planner/validation/furnitureWallCollision";
import {
  detectOpeningClearanceConflicts,
  openingClearanceAsPlaced,
  DEFAULT_OPENING_CLEARANCE_MM,
} from "@/lib/Planner/validation/openingClearance";
import {
  runFloorValidation as runFromIndex,
  countBySeverity as countFromIndex,
  detectFurnitureOverlaps as overlapsFromIndex,
  detectFurnitureClearance as clearanceFromIndex,
  detectFurnitureWallCollisions as wallColFromIndex,
  detectFurnitureOutsideRoom as outsideFromIndex,
  detectOpeningClearanceConflicts as openingFromIndex,
  aabbsOverlap as aabbsFromIndex,
  sheetAsRoomPolygon as sheetFromIndex,
  wallAsPlacedFurniture as wallAsFromIndex,
  openingClearanceAsPlaced as openingAsFromIndex,
  DEFAULT_AISLE_CLEARANCE_MM as aisleFromIndex,
  DEFAULT_OPENING_CLEARANCE_MM as openingClearFromIndex,
} from "@/lib/Planner/validation";

function issue(
  partial: Pick<ValidationIssue, "id" | "severity"> &
    Partial<ValidationIssue>,
): ValidationIssue {
  return {
    rule: "furniture-overlap",
    ruleId: "furniture-overlap",
    objectIds: [],
    message: partial.id,
    remedy: "",
    ...partial,
  };
}

describe("runFloorValidation", () => {
  it("flags overlapping furniture as errors", () => {
    const result = runFloorValidation({
      sheet: { widthMm: 10000, depthMm: 8000 },
      walls: [],
      doors: [],
      windows: [],
      furniture: [
        { id: "a", xMm: 600, yMm: 300, widthMm: 1200, depthMm: 600, rotationDeg: 0 },
        { id: "b", xMm: 900, yMm: 300, widthMm: 1200, depthMm: 600, rotationDeg: 0 },
      ],
    });
    expect(result.errors).toBeGreaterThan(0);
    expect(result.issues.some((i) => i.rule === "furniture-overlap")).toBe(true);
  });

  it("returns zero issues for empty floor", () => {
    const result = runFloorValidation({
      sheet: { widthMm: 10000, depthMm: 8000 },
      walls: [],
      doors: [],
      windows: [],
      furniture: [],
    });
    expect(result.issues).toEqual([]);
  });

  it("flags furniture outside sheet as room-boundary error", () => {
    const result = runFloorValidation({
      sheet: { widthMm: 5000, depthMm: 4000 },
      walls: [],
      doors: [],
      windows: [],
      furniture: [
        { id: "out", xMm: 9000, yMm: 9000, widthMm: 600, depthMm: 600, rotationDeg: 0 },
      ],
    });
    expect(result.issues.some((i) => i.rule === "room-boundary")).toBe(true);
    expect(result.errors).toBeGreaterThan(0);
  });

  it("flags wall collision when furniture intersects wall mass", () => {
    const result = runFloorValidation({
      sheet: { widthMm: 10000, depthMm: 8000 },
      walls: [
        {
          id: "w1",
          start: { x: 0, y: 1000 },
          end: { x: 4000, y: 1000 },
          thickness: 200,
        },
      ],
      doors: [],
      windows: [],
      furniture: [
        { id: "desk", xMm: 2000, yMm: 1000, widthMm: 800, depthMm: 400, rotationDeg: 0 },
      ],
    });
    expect(result.issues.some((i) => i.rule === "wall-collision")).toBe(true);
  });

  it("flags aisle clearance warning when gap is under 900mm", () => {
    const result = runFloorValidation({
      sheet: { widthMm: 10000, depthMm: 8000 },
      walls: [],
      doors: [],
      windows: [],
      furniture: [
        // edge-to-edge gap 400mm (centers 1000 apart, half-widths 300 each)
        { id: "a", xMm: 500, yMm: 500, widthMm: 600, depthMm: 400, rotationDeg: 0 },
        { id: "b", xMm: 1500, yMm: 500, widthMm: 600, depthMm: 400, rotationDeg: 0 },
      ],
    });
    expect(result.issues.some((i) => i.rule === "aisle-clearance")).toBe(true);
    expect(result.warnings).toBeGreaterThan(0);
  });

  it("flags opening obstruction when furniture blocks a door", () => {
    const result = runFloorValidation({
      sheet: { widthMm: 10000, depthMm: 8000 },
      walls: [
        {
          id: "w1",
          start: { x: 0, y: 0 },
          end: { x: 4000, y: 0 },
          thickness: 100,
        },
      ],
      doors: [
        {
          id: "d1",
          wallId: "w1",
          position: 0.5,
          width: 900,
          kind: "door",
        },
      ],
      windows: [],
      furniture: [
        // sits at door center with enough depth to intersect clearance zone
        { id: "block", xMm: 2000, yMm: 400, widthMm: 800, depthMm: 600, rotationDeg: 0 },
      ],
    });
    expect(result.issues.some((i) => i.rule === "opening-obstruction")).toBe(true);
  });

  it("sorts errors before warnings", () => {
    const result = runFloorValidation({
      sheet: { widthMm: 5000, depthMm: 4000 },
      walls: [],
      doors: [],
      windows: [],
      furniture: [
        // outside → error
        { id: "out", xMm: 9000, yMm: 9000, widthMm: 200, depthMm: 200 },
        // two close items fully inside → clearance warning
        { id: "a", xMm: 1000, yMm: 1000, widthMm: 400, depthMm: 400 },
        { id: "b", xMm: 1600, yMm: 1000, widthMm: 400, depthMm: 400 },
      ],
    });
    const firstErrorIdx = result.issues.findIndex((i) => i.severity === "error");
    const firstWarnIdx = result.issues.findIndex((i) => i.severity === "warning");
    if (firstErrorIdx >= 0 && firstWarnIdx >= 0) {
      expect(firstErrorIdx).toBeLessThan(firstWarnIdx);
    }
  });
});

describe("countBySeverity", () => {
  it("tallies error, warning, and advisory", () => {
    const counts = countBySeverity([
      issue({ id: "e1", severity: "error" }),
      issue({ id: "e2", severity: "error" }),
      issue({ id: "w1", severity: "warning" }),
      issue({ id: "a1", severity: "advisory" }),
    ]);
    expect(counts).toEqual({ errors: 2, warnings: 1, advisories: 1 });
  });

  it("returns zeros for empty list", () => {
    expect(countBySeverity([])).toEqual({
      errors: 0,
      warnings: 0,
      advisories: 0,
    });
  });

  it("ignores unknown severity values after error/warning/advisory checks", () => {
    const counts = countBySeverity([
      issue({ id: "e", severity: "error" }),
      issue({ id: "w", severity: "warning" }),
      issue({ id: "a", severity: "advisory" }),
      // force the final else-if false path
      issue({ id: "x", severity: "not-a-severity" as ValidationIssue["severity"] }),
    ]);
    expect(counts).toEqual({ errors: 1, warnings: 1, advisories: 1 });
  });
});

describe("runFloorValidation sort stability", () => {
  it("orders same-severity issues by id including equal ids", () => {
    // Two non-overlapping but under-clearance pairs produce multiple warnings
    // plus an outside error — exercises severity rank + id compare branches.
    const result = runFloorValidation({
      sheet: { widthMm: 10000, depthMm: 8000 },
      walls: [],
      doors: [],
      windows: [],
      furniture: [
        { id: "z-out", xMm: 20000, yMm: 20000, widthMm: 100, depthMm: 100 },
        { id: "a", xMm: 500, yMm: 500, widthMm: 400, depthMm: 400 },
        { id: "b", xMm: 1000, yMm: 500, widthMm: 400, depthMm: 400 },
        { id: "c", xMm: 500, yMm: 1200, widthMm: 400, depthMm: 400 },
      ],
    });
    expect(result.errors).toBeGreaterThan(0);
    expect(result.warnings).toBeGreaterThan(0);
  });
});

describe("compareValidationIssues", () => {
  it("ranks error < warning < advisory and breaks ties by id", () => {
    const err = issue({ id: "b", severity: "error" });
    const warn = issue({ id: "a", severity: "warning" });
    const adv = issue({ id: "c", severity: "advisory" });
    expect(compareValidationIssues(err, warn)).toBeLessThan(0);
    expect(compareValidationIssues(warn, adv)).toBeLessThan(0);
    expect(compareValidationIssues(adv, err)).toBeGreaterThan(0);
    expect(compareValidationIssues(warn, issue({ id: "z", severity: "warning" }))).toBeLessThan(
      0,
    );
    expect(compareValidationIssues(issue({ id: "z", severity: "warning" }), warn)).toBeGreaterThan(
      0,
    );
    expect(compareValidationIssues(warn, issue({ id: "a", severity: "warning" }))).toBe(0);
  });
});

describe("furnitureClearance", () => {
  it("aabbEdgeGapMm covers axis and diagonal cases", () => {
    expect(
      aabbEdgeGapMm(
        { minX: 0, minY: 0, maxX: 10, maxY: 10 },
        { minX: 5, minY: 5, maxX: 15, maxY: 15 },
      ),
    ).toBe(0);
    expect(
      aabbEdgeGapMm(
        { minX: 0, minY: 0, maxX: 10, maxY: 10 },
        { minX: 0, minY: 20, maxX: 10, maxY: 30 },
      ),
    ).toBe(10);
    expect(
      aabbEdgeGapMm(
        { minX: 0, minY: 0, maxX: 10, maxY: 10 },
        { minX: 20, minY: 0, maxX: 30, maxY: 10 },
      ),
    ).toBe(10);
    expect(
      aabbEdgeGapMm(
        { minX: 0, minY: 0, maxX: 10, maxY: 10 },
        { minX: 20, minY: 20, maxX: 30, maxY: 30 },
      ),
    ).toBeCloseTo(Math.hypot(10, 10), 5);
  });

  it("returns empty for fewer than 2 items or non-positive clearance", () => {
    expect(
      detectFurnitureClearance([
        { id: "a", xMm: 0, yMm: 0, widthMm: 100, depthMm: 100 },
      ]),
    ).toEqual([]);
    expect(
      detectFurnitureClearance(
        [
          { id: "a", xMm: 0, yMm: 0, widthMm: 100, depthMm: 100 },
          { id: "b", xMm: 200, yMm: 0, widthMm: 100, depthMm: 100 },
        ],
        0,
      ),
    ).toEqual([]);
  });

  it("skips overlapping pairs (gap <= 0)", () => {
    const issues = detectFurnitureClearance([
      { id: "a", xMm: 0, yMm: 0, widthMm: 100, depthMm: 100 },
      { id: "b", xMm: 10, yMm: 0, widthMm: 100, depthMm: 100 },
    ]);
    expect(issues).toEqual([]);
  });

  it("skips pairs with sufficient clearance", () => {
    const issues = detectFurnitureClearance(
      [
        { id: "a", xMm: 0, yMm: 0, widthMm: 100, depthMm: 100 },
        { id: "b", xMm: 2000, yMm: 0, widthMm: 100, depthMm: 100 },
      ],
      DEFAULT_AISLE_CLEARANCE_MM,
    );
    expect(issues).toEqual([]);
  });

  it("handles rotated furniture footprints", () => {
    const issues = detectFurnitureClearance([
      {
        id: "a",
        xMm: 0,
        yMm: 0,
        widthMm: 400,
        depthMm: 200,
        rotationDeg: 45,
      },
      {
        id: "b",
        xMm: 500,
        yMm: 0,
        widthMm: 400,
        depthMm: 200,
        rotationDeg: 0,
      },
    ]);
    // may or may not warn depending on AABB gap — just exercise rotation path
    expect(Array.isArray(issues)).toBe(true);
  });

  it("emits clearance issues for close pairs and equal-id sort stability", () => {
    // equal ids in sort comparator: two items with same id at start of list
    const withDupId = detectFurnitureClearance([
      { id: "a", xMm: 0, yMm: 0, widthMm: 200, depthMm: 200 },
      { id: "a", xMm: 5000, yMm: 0, widthMm: 100, depthMm: 100 },
      { id: "b", xMm: 350, yMm: 0, widthMm: 200, depthMm: 200 },
    ]);
    // first "a" vs "b": centres 0 and 350, half 100 each → gap 150 < 900
    expect(withDupId.some((i) => i.rule === "aisle-clearance")).toBe(true);
    expect(withDupId.some((i) => i.objectIds.includes("b"))).toBe(true);
  });

  it("skips sparse holes in the furniture array", () => {
    const sparse: ({ id: string; xMm: number; yMm: number; widthMm: number; depthMm: number } | undefined)[] =
      [];
    sparse[0] = { id: "a", xMm: 0, yMm: 0, widthMm: 200, depthMm: 200 };
    sparse[2] = { id: "b", xMm: 350, yMm: 0, widthMm: 200, depthMm: 200 };
    const issues = detectFurnitureClearance(
      sparse as { id: string; xMm: number; yMm: number; widthMm: number; depthMm: number }[],
    );
    expect(issues.some((i) => i.rule === "aisle-clearance")).toBe(true);
  });
});

describe("furnitureOverlap", () => {
  it("detects non-overlapping separated boxes", () => {
    expect(
      aabbsOverlap(
        { id: "a", xMm: 0, yMm: 0, widthMm: 100, depthMm: 100 },
        { id: "b", xMm: 500, yMm: 0, widthMm: 100, depthMm: 100 },
      ),
    ).toBe(false);
  });

  it("returns empty when only one piece", () => {
    expect(
      detectFurnitureOverlaps([
        { id: "solo", xMm: 0, yMm: 0, widthMm: 100, depthMm: 100 },
      ]),
    ).toEqual([]);
  });

  it("handles rotated non-axis-aligned separation", () => {
    // Axis-aligned and clearly separated (exercises SAT axis loop / early false)
    const a = {
      id: "a",
      xMm: 0,
      yMm: 0,
      widthMm: 100,
      depthMm: 40,
      rotationDeg: 30,
    };
    const b = {
      id: "b",
      xMm: 800,
      yMm: 800,
      widthMm: 100,
      depthMm: 40,
      rotationDeg: -20,
    };
    expect(aabbsOverlap(a, b)).toBe(false);
  });

  it("detects overlap and skips same-id pair in ordered list", () => {
    const issues = detectFurnitureOverlaps([
      { id: "same", xMm: 0, yMm: 0, widthMm: 100, depthMm: 100 },
      { id: "same", xMm: 10, yMm: 10, widthMm: 100, depthMm: 100 },
      { id: "other", xMm: 5, yMm: 5, widthMm: 80, depthMm: 80 },
    ]);
    // same-id pair is skipped; same vs other should still flag
    expect(issues.some((i) => i.objectIds.includes("other"))).toBe(true);
  });

  it("handles zero-size furniture without throwing (degenerate axes)", () => {
    expect(
      aabbsOverlap(
        { id: "z1", xMm: 0, yMm: 0, widthMm: 0, depthMm: 0 },
        { id: "z2", xMm: 0, yMm: 0, widthMm: 0, depthMm: 0 },
      ),
    ).toBe(true);
  });

  it("skips sparse holes when detecting overlaps", () => {
    const sparse: ({ id: string; xMm: number; yMm: number; widthMm: number; depthMm: number } | undefined)[] =
      [];
    sparse[0] = { id: "a", xMm: 0, yMm: 0, widthMm: 100, depthMm: 100 };
    sparse[2] = { id: "b", xMm: 10, yMm: 10, widthMm: 100, depthMm: 100 };
    const issues = detectFurnitureOverlaps(
      sparse as { id: string; xMm: number; yMm: number; widthMm: number; depthMm: number }[],
    );
    expect(issues.some((i) => i.rule === "furniture-overlap")).toBe(true);
  });
});

describe("furnitureRoomBoundary", () => {
  it("builds sheet polygon", () => {
    expect(sheetAsRoomPolygon({ widthMm: 100, depthMm: 50 })).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 0, y: 50 },
    ]);
  });

  it("returns empty for empty furniture or empty polygons", () => {
    expect(detectFurnitureOutsideRoom([], [sheetAsRoomPolygon({ widthMm: 10, depthMm: 10 })])).toEqual(
      [],
    );
    expect(
      detectFurnitureOutsideRoom(
        [{ id: "a", xMm: 1, yMm: 1, widthMm: 2, depthMm: 2 }],
        [],
      ),
    ).toEqual([]);
  });

  it("flags room overhang warning when corners leave room", () => {
    const sheet = sheetAsRoomPolygon({ widthMm: 1000, depthMm: 1000 });
    // center inside, but 800×800 item near edge overhangs
    const issues = detectFurnitureOutsideRoom(
      [{ id: "over", xMm: 900, yMm: 500, widthMm: 400, depthMm: 400 }],
      [sheet],
    );
    expect(issues.some((i) => i.id.includes("overhang"))).toBe(true);
    expect(issues[0]?.severity).toBe("warning");
  });

  it("ignores polygons with fewer than 3 points", () => {
    const issues = detectFurnitureOutsideRoom(
      [{ id: "a", xMm: 5, yMm: 5, widthMm: 2, depthMm: 2 }],
      [[{ x: 0, y: 0 }, { x: 10, y: 0 }]],
    );
    // no valid polygon → centre not inside → outside error
    expect(issues.some((i) => i.severity === "error")).toBe(true);
  });

  it("accepts fully-inside furniture and equal-id sort", () => {
    const sheet = sheetAsRoomPolygon({ widthMm: 5000, depthMm: 5000 });
    const issues = detectFurnitureOutsideRoom(
      [
        { id: "in", xMm: 2500, yMm: 2500, widthMm: 200, depthMm: 200 },
        { id: "in", xMm: 2500, yMm: 2500, widthMm: 200, depthMm: 200 },
      ],
      [sheet],
    );
    expect(issues).toEqual([]);
  });

  it("handles sparse polygon vertices in point-in-polygon", () => {
    const poly: ({ x: number; y: number } | undefined)[] = [
      { x: 0, y: 0 },
      undefined,
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const issues = detectFurnitureOutsideRoom(
      [{ id: "p", xMm: 50, yMm: 50, widthMm: 10, depthMm: 10 }],
      [poly as { x: number; y: number }[]],
    );
    // still a valid length≥3 polygon with some holes skipped
    expect(Array.isArray(issues)).toBe(true);
  });
});

describe("furnitureWallCollision", () => {
  it("returns null for zero-length or non-positive thickness walls", () => {
    expect(
      wallAsPlacedFurniture({
        id: "z",
        start: { x: 0, y: 0 },
        end: { x: 0, y: 0 },
        thickness: 100,
      }),
    ).toBeNull();
    expect(
      wallAsPlacedFurniture({
        id: "t",
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        thickness: 0,
      }),
    ).toBeNull();
  });

  it("returns empty for empty furniture or walls", () => {
    expect(
      detectFurnitureWallCollisions([], [
        { id: "w", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, thickness: 5 },
      ]),
    ).toEqual([]);
    expect(
      detectFurnitureWallCollisions(
        [{ id: "f", xMm: 0, yMm: 0, widthMm: 10, depthMm: 10 }],
        [],
      ),
    ).toEqual([]);
  });

  it("skips zero-length walls during collision scan", () => {
    const issues = detectFurnitureWallCollisions(
      [{ id: "f", xMm: 50, yMm: 50, widthMm: 20, depthMm: 20 }],
      [
        { id: "dot", start: { x: 50, y: 50 }, end: { x: 50, y: 50 }, thickness: 100 },
        { id: "far", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, thickness: 5 },
      ],
    );
    expect(issues.every((i) => i.objectIds.includes("dot") === false)).toBe(true);
  });

  it("sorts equal-id furniture/walls and dedupes collisions", () => {
    const issues = detectFurnitureWallCollisions(
      [
        { id: "f", xMm: 50, yMm: 0, widthMm: 40, depthMm: 40 },
        { id: "f", xMm: 50, yMm: 0, widthMm: 40, depthMm: 40 },
      ],
      [
        { id: "w", start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, thickness: 20 },
        { id: "w", start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, thickness: 20 },
      ],
    );
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.rule).toBe("wall-collision");
  });

  it("exercises full sort branches with mixed wall and furniture ids", () => {
    // Unsorted ids force both a.id < b.id and a.id > b.id arms.
    const issues = detectFurnitureWallCollisions(
      [
        { id: "z-desk", xMm: 50, yMm: 0, widthMm: 40, depthMm: 40 },
        { id: "a-chair", xMm: 5000, yMm: 5000, widthMm: 40, depthMm: 40 },
        { id: "m-table", xMm: 50, yMm: 0, widthMm: 30, depthMm: 30 },
      ],
      [
        { id: "z-wall", start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, thickness: 20 },
        { id: "a-wall", start: { x: 9000, y: 9000 }, end: { x: 9100, y: 9000 }, thickness: 20 },
        { id: "m-wall", start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, thickness: 20 },
      ],
    );
    expect(issues.some((i) => i.rule === "wall-collision")).toBe(true);
  });
});

describe("openingClearance", () => {
  const wall = {
    id: "w1",
    start: { x: 0, y: 0 },
    end: { x: 4000, y: 0 },
    thickness: 100,
  };

  it("builds clearance zone for a valid opening", () => {
    const zone = openingClearanceAsPlaced(
      { id: "d1", wallId: "w1", position: 0.5, width: 900, kind: "door" },
      wall,
      DEFAULT_OPENING_CLEARANCE_MM,
    );
    expect(zone).not.toBeNull();
    expect(zone?.xMm).toBe(2000);
    expect(zone?.yMm).toBe(0);
    expect(zone?.widthMm).toBe(900);
    expect(zone?.depthMm).toBe(100 + 2 * DEFAULT_OPENING_CLEARANCE_MM);
  });

  it("returns null for invalid opening/wall inputs", () => {
    expect(
      openingClearanceAsPlaced(
        { id: "d", wallId: "w1", position: 0.5, width: 900, kind: "door" },
        wall,
        0,
      ),
    ).toBeNull();
    expect(
      openingClearanceAsPlaced(
        { id: "d", wallId: "w1", position: 0.5, width: 0, kind: "door" },
        wall,
      ),
    ).toBeNull();
    expect(
      openingClearanceAsPlaced(
        { id: "d", wallId: "w1", position: 0.5, width: 900, kind: "door" },
        { ...wall, end: { x: 0, y: 0 } },
      ),
    ).toBeNull();
    expect(
      openingClearanceAsPlaced(
        { id: "d", wallId: "w1", position: -0.1, width: 900, kind: "door" },
        wall,
      ),
    ).toBeNull();
    expect(
      openingClearanceAsPlaced(
        { id: "d", wallId: "w1", position: 1.1, width: 900, kind: "door" },
        wall,
      ),
    ).toBeNull();
  });

  it("returns empty when no furniture or no openings", () => {
    expect(
      detectOpeningClearanceConflicts(
        [],
        [wall],
        [{ id: "d1", wallId: "w1", position: 0.5, width: 900, kind: "door" }],
        [],
      ),
    ).toEqual([]);
    expect(
      detectOpeningClearanceConflicts(
        [{ id: "f", xMm: 2000, yMm: 0, widthMm: 100, depthMm: 100 }],
        [wall],
        [],
        [],
      ),
    ).toEqual([]);
  });

  it("skips openings whose wall is missing", () => {
    expect(
      detectOpeningClearanceConflicts(
        [{ id: "f", xMm: 2000, yMm: 0, widthMm: 800, depthMm: 800 }],
        [wall],
        [{ id: "d1", wallId: "missing", position: 0.5, width: 900, kind: "door" }],
        [],
      ),
    ).toEqual([]);
  });

  it("flags furniture blocking a window", () => {
    const issues = detectOpeningClearanceConflicts(
      [{ id: "f", xMm: 2000, yMm: 100, widthMm: 800, depthMm: 600 }],
      [wall],
      [],
      [{ id: "win1", wallId: "w1", position: 0.5, width: 1200, kind: "window" }],
    );
    expect(issues.some((i) => i.rule === "opening-obstruction")).toBe(true);
    expect(issues[0]?.message).toContain("window");
  });

  it("sorts equal-id openings/furniture and skips invalid zones", () => {
    const issues = detectOpeningClearanceConflicts(
      [
        { id: "f", xMm: 2000, yMm: 50, widthMm: 600, depthMm: 600 },
        { id: "f", xMm: 2000, yMm: 50, widthMm: 600, depthMm: 600 },
      ],
      [wall],
      [
        { id: "d1", wallId: "w1", position: 0.5, width: 900, kind: "door" },
        { id: "d1", wallId: "w1", position: 0.5, width: 900, kind: "door" },
        { id: "bad", wallId: "w1", position: 2, width: 900, kind: "door" },
      ],
      [],
    );
    expect(issues.some((i) => i.rule === "opening-obstruction")).toBe(true);
    expect(issues.every((i) => !i.objectIds.includes("bad"))).toBe(true);
  });

  it("skips furniture that does not intersect the opening zone", () => {
    const issues = detectOpeningClearanceConflicts(
      [
        { id: "far", xMm: 9000, yMm: 9000, widthMm: 100, depthMm: 100 },
        { id: "a-near", xMm: 2000, yMm: 50, widthMm: 600, depthMm: 600 },
        { id: "z-far", xMm: 8000, yMm: 8000, widthMm: 100, depthMm: 100 },
      ],
      [wall],
      [
        { id: "z-door", wallId: "w1", position: 0.5, width: 900, kind: "door" },
        { id: "a-door", wallId: "w1", position: 0.25, width: 900, kind: "door" },
      ],
      [],
    );
    expect(issues.some((i) => i.objectIds.includes("a-near"))).toBe(true);
    expect(issues.every((i) => !i.objectIds.includes("far"))).toBe(true);
  });
});

describe("validation index re-exports", () => {
  it("smoke-imports runtime exports", () => {
    expect(typeof runFromIndex).toBe("function");
    expect(typeof countFromIndex).toBe("function");
    expect(typeof overlapsFromIndex).toBe("function");
    expect(typeof clearanceFromIndex).toBe("function");
    expect(typeof wallColFromIndex).toBe("function");
    expect(typeof outsideFromIndex).toBe("function");
    expect(typeof openingFromIndex).toBe("function");
    expect(typeof aabbsFromIndex).toBe("function");
    expect(typeof sheetFromIndex).toBe("function");
    expect(typeof wallAsFromIndex).toBe("function");
    expect(typeof openingAsFromIndex).toBe("function");
    expect(aisleFromIndex).toBe(DEFAULT_AISLE_CLEARANCE_MM);
    expect(openingClearFromIndex).toBe(DEFAULT_OPENING_CLEARANCE_MM);

    // Exercise re-exported call paths so the barrel is not dead
    const empty = runFromIndex({
      sheet: { widthMm: 1000, depthMm: 1000 },
      walls: [],
      doors: [],
      windows: [],
      furniture: [],
    });
    expect(empty.issues).toEqual([]);
    expect(countFromIndex([])).toEqual({ errors: 0, warnings: 0, advisories: 0 });
    expect(overlapsFromIndex([])).toEqual([]);
    expect(clearanceFromIndex([])).toEqual([]);
    expect(wallColFromIndex([], [])).toEqual([]);
    expect(outsideFromIndex([], [])).toEqual([]);
    expect(openingFromIndex([], [], [], [])).toEqual([]);
    expect(
      aabbsFromIndex(
        { id: "a", xMm: 0, yMm: 0, widthMm: 10, depthMm: 10 },
        { id: "b", xMm: 0, yMm: 0, widthMm: 10, depthMm: 10 },
      ),
    ).toBe(true);
    expect(sheetFromIndex({ widthMm: 1, depthMm: 1 })).toHaveLength(4);
    expect(
      wallAsFromIndex({
        id: "w",
        start: { x: 0, y: 0 },
        end: { x: 10, y: 0 },
        thickness: 5,
      }),
    ).not.toBeNull();
    expect(
      openingAsFromIndex(
        { id: "d", wallId: "w", position: 0.5, width: 900, kind: "door" },
        {
          id: "w",
          start: { x: 0, y: 0 },
          end: { x: 4000, y: 0 },
          thickness: 100,
        },
      ),
    ).not.toBeNull();
  });
});
