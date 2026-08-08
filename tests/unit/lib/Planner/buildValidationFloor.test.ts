import { describe, it, expect } from "vitest";
import { buildValidationFloorFromCanvas } from "@/lib/Planner/buildValidationFloor";

describe("buildValidationFloorFromCanvas", () => {
  const scale = 0.1; // 1 px = 10 mm
  const sheet = { width_mm: 10000, height_mm: 8000 };

  it("maps walls, furniture (center-origin), and attached openings", () => {
    const floor = buildValidationFloorFromCanvas(
      [
        {
          left: 10,
          top: 20,
          width: 12,
          height: 6,
          data: { kind: "furniture", id: "f1" },
        },
        {
          x1: 0,
          y1: 0,
          x2: 50,
          y2: 0,
          strokeWidth: 1,
          data: { kind: "wall", id: "w1" },
        },
        {
          left: 5,
          top: 0,
          width: 9,
          height: 1,
          data: {
            kind: "door",
            id: "d1",
            wallId: "w1",
            position: 0.4,
          },
        },
        {
          left: 20,
          top: 0,
          width: 12,
          height: 1,
          data: {
            kind: "window",
            id: "win1",
            wallId: "w1",
            position: 0.7,
          },
        },
      ],
      scale,
      sheet,
    );

    expect(floor.sheet).toEqual({ widthMm: 10000, depthMm: 8000 });
    expect(floor.walls).toHaveLength(1);
    expect(floor.walls[0]).toMatchObject({
      id: "w1",
      start: { x: 0, y: 0 },
      end: { x: 500, y: 0 },
    });

    // furnitureFromFabric top-left → furnitureToCenterOrigin
    expect(floor.furniture).toHaveLength(1);
    expect(floor.furniture[0]?.id).toBe("f1");
    expect(floor.furniture[0]?.xMm).toBe(10 / scale + (12 / scale) / 2); // 100 + 60
    expect(floor.furniture[0]?.yMm).toBe(20 / scale + (6 / scale) / 2); // 200 + 30

    expect(floor.doors).toHaveLength(1);
    expect(floor.doors[0]).toMatchObject({
      id: "d1",
      wallId: "w1",
      position: 0.4,
      kind: "door",
      width: 90,
    });

    expect(floor.windows).toHaveLength(1);
    expect(floor.windows[0]).toMatchObject({
      id: "win1",
      wallId: "w1",
      position: 0.7,
      kind: "window",
      width: 120,
    });
  });

  it("filters doors/windows without wallId or position", () => {
    const floor = buildValidationFloorFromCanvas(
      [
        {
          x1: 0,
          y1: 0,
          x2: 40,
          y2: 0,
          strokeWidth: 1,
          data: { kind: "wall", id: "w1" },
        },
        {
          left: 1,
          top: 0,
          width: 9,
          height: 1,
          data: { kind: "door", id: "orphan-door" },
        },
        {
          left: 2,
          top: 0,
          width: 9,
          height: 1,
          data: { kind: "door", id: "no-pos", wallId: "w1" },
        },
        {
          left: 3,
          top: 0,
          width: 10,
          height: 1,
          data: { kind: "window", id: "orphan-win", position: 0.5 },
        },
      ],
      scale,
      sheet,
    );

    expect(floor.doors).toEqual([]);
    expect(floor.windows).toEqual([]);
  });

  it("defaults door/window widths when fabric width is zero", () => {
    const floor = buildValidationFloorFromCanvas(
      [
        {
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 0,
          strokeWidth: 1,
          data: { kind: "wall", id: "w1" },
        },
        {
          left: 10,
          top: 0,
          width: 0,
          height: 1,
          data: {
            kind: "door",
            id: "d-zero",
            wallId: "w1",
            position: 0.3,
          },
        },
        {
          left: 40,
          top: 0,
          width: 0,
          height: 1,
          data: {
            kind: "window",
            id: "win-zero",
            wallId: "w1",
            position: 0.6,
          },
        },
      ],
      scale,
      sheet,
    );

    expect(floor.doors[0]?.width).toBe(900);
    expect(floor.windows[0]?.width).toBe(1200);
  });

  it("accepts null canvas and empty scene", () => {
    const floor = buildValidationFloorFromCanvas(null, scale, sheet);
    expect(floor.furniture).toEqual([]);
    expect(floor.walls).toEqual([]);
    expect(floor.doors).toEqual([]);
    expect(floor.windows).toEqual([]);
    expect(floor.sheet.widthMm).toBe(10000);
  });
});
