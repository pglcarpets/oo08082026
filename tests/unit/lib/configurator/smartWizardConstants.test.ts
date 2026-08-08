/**
 * Name-mirror coverage for lib/configurator/smartWizardConstants.
 */
import { describe, expect, it } from "vitest";
import {
  ALIGNMENT_THRESHOLD,
  CURSOR_COLORS,
  ELEMENT_DEFAULTS,
  GRID_SIZE_DEFAULT,
  GRID_SNAP_THRESHOLD,
  GROUP_COLORS,
  SEAT_DROP_THRESHOLD,
  SHAPE_DEFAULTS,
  TABLE_SEAT_DEFAULTS,
  UNDO_LIMIT,
  WALL_SNAP_THRESHOLD,
  ZOOM_FACTOR,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  ZOOM_WHEEL_SENSITIVITY,
  getDefaults,
} from "@/lib/configurator/smartWizardConstants";

describe("smartWizardConstants", () => {
  it("exports grid, snap, zoom, and undo tuning values", () => {
    expect(GRID_SIZE_DEFAULT).toBe(12);
    expect(GRID_SNAP_THRESHOLD).toBe(6);
    expect(WALL_SNAP_THRESHOLD).toBe(8);
    expect(SEAT_DROP_THRESHOLD).toBe(20);
    expect(ZOOM_MIN).toBeLessThan(ZOOM_MAX);
    expect(ZOOM_STEP).toBe(0.1);
    expect(ZOOM_FACTOR).toBeGreaterThan(1);
    expect(ZOOM_WHEEL_SENSITIVITY).toBeGreaterThan(0);
    expect(UNDO_LIMIT).toBe(50);
    expect(ALIGNMENT_THRESHOLD).toBe(5);
  });

  it("exports palette and element defaults used by the canvas", () => {
    expect(GROUP_COLORS.length).toBeGreaterThan(0);
    expect(CURSOR_COLORS.length).toBeGreaterThan(0);
    expect(ELEMENT_DEFAULTS.desk.width).toBe(72);
    expect(ELEMENT_DEFAULTS.workstation.width).toBe(200);
    expect(TABLE_SEAT_DEFAULTS["table-conference"]).toBe(14);
    expect(SHAPE_DEFAULTS["desk/l-shape"].width).toBe(120);
  });
});

describe("getDefaults", () => {
  it("returns shape-specific defaults when a shape is provided", () => {
    expect(getDefaults("desk", "l-shape")).toEqual(
      SHAPE_DEFAULTS["desk/l-shape"],
    );
  });

  it("returns top-level shape defaults and element fallbacks", () => {
    expect(getDefaults("table-round")).toEqual(SHAPE_DEFAULTS["table-round"]);
    expect(getDefaults("chair")).toEqual(ELEMENT_DEFAULTS.chair);
    expect(getDefaults("not-a-real-element")).toBeUndefined();
  });
});
