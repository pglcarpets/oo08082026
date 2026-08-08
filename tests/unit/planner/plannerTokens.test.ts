import { describe, expect, it } from "vitest";
import {
  DEFAULT_CATALOG_FURNITURE_DIMS_MM,
  DEFAULT_SCENE_FURNITURE_HEIGHT_MM,
  PLANNER_WALL_HEIGHT_MM,
} from "@planner/lib/plannerTokens";

describe("plannerTokens", () => {
  it("exposes catalog furniture defaults", () => {
    expect(DEFAULT_CATALOG_FURNITURE_DIMS_MM).toEqual({
      width_mm: 600,
      depth_mm: 600,
      height_mm: 750,
    });
    expect(DEFAULT_SCENE_FURNITURE_HEIGHT_MM).toBe(750);
  });

  it("exposes wall extrusion height", () => {
    expect(PLANNER_WALL_HEIGHT_MM).toBe(2700);
  });
});
