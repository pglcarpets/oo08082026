import { describe, it, expect } from "vitest";
import {
  wallEndpointGripPoints,
  wallEndpointsAfterGripMove,
  wallGripAnchorPoint,
  resolveWallForEndpointGrips,
  isWallGripData,
  WALL_GRIP_KIND,
} from "@/lib/Planner/wallEndpointGrips";

describe("wallEndpointGrips", () => {
  const wall = {
    id: "w1",
    start: { x: 0, y: 0 },
    end: { x: 4000, y: 0 },
  };

  it("returns start/end grip points", () => {
    expect(wallEndpointGripPoints(wall)).toEqual({
      start: { x: 0, y: 0 },
      end: { x: 4000, y: 0 },
    });
  });

  it("moves start endpoint while anchoring end", () => {
    expect(wallGripAnchorPoint(wall, "start")).toEqual({ x: 4000, y: 0 });
    expect(wallEndpointsAfterGripMove(wall, "start", { x: 100, y: 50 })).toEqual({
      start: { x: 100, y: 50 },
      end: { x: 4000, y: 0 },
    });
  });

  it("moves end endpoint while anchoring start", () => {
    expect(wallGripAnchorPoint(wall, "end")).toEqual({ x: 0, y: 0 });
    expect(wallEndpointsAfterGripMove(wall, "end", { x: 3800, y: 120 })).toEqual({
      start: { x: 0, y: 0 },
      end: { x: 3800, y: 120 },
    });
  });

  it("resolves single selected wall", () => {
    expect(resolveWallForEndpointGrips([wall], "w1")?.id).toBe("w1");
    expect(resolveWallForEndpointGrips([wall], null)).toBeNull();
    expect(resolveWallForEndpointGrips([wall], undefined)).toBeNull();
    expect(resolveWallForEndpointGrips([wall], "missing")).toBeNull();
  });

  it("detects grip data and rejects false cases", () => {
    expect(
      isWallGripData({ kind: WALL_GRIP_KIND, wallId: "w1", endpoint: "start" }),
    ).toBe(true);
    expect(
      isWallGripData({ kind: WALL_GRIP_KIND, wallId: "w1", endpoint: "end" }),
    ).toBe(true);
    expect(isWallGripData({ kind: "wall" })).toBe(false);
    expect(isWallGripData(null)).toBe(false);
    expect(isWallGripData(undefined)).toBe(false);
    expect(isWallGripData("string")).toBe(false);
    expect(isWallGripData({ kind: WALL_GRIP_KIND, wallId: 1, endpoint: "start" })).toBe(
      false,
    );
    expect(
      isWallGripData({ kind: WALL_GRIP_KIND, wallId: "w1", endpoint: "middle" }),
    ).toBe(false);
    expect(isWallGripData({ kind: "other", wallId: "w1", endpoint: "start" })).toBe(
      false,
    );
  });
});
