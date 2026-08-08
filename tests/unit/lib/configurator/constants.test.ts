import { describe, expect, it } from "vitest";
import {
  ALIGNMENT_THRESHOLD,
  ELEMENT_DEFAULTS,
  getDefaults,
  GRID_SIZE_DEFAULT,
  GROUP_COLORS,
  SHAPE_DEFAULTS,
  TABLE_SEAT_DEFAULTS,
  UNDO_LIMIT,
  ZOOM_FACTOR,
  ZOOM_MAX,
  ZOOM_MIN,
} from "@/lib/configurator/smartWizardConstants";

describe("configurator constants", () => {
  it("exports grid, zoom, and undo tuning values", () => {
    expect(GRID_SIZE_DEFAULT).toBe(12);
    expect(ZOOM_MIN).toBeLessThan(ZOOM_MAX);
    expect(ZOOM_FACTOR).toBeGreaterThan(1);
    expect(UNDO_LIMIT).toBe(50);
    expect(ALIGNMENT_THRESHOLD).toBe(5);
  });

  it("exports palette and seat defaults with expected keys", () => {
    expect(GROUP_COLORS.length).toBeGreaterThan(0);
    expect(ELEMENT_DEFAULTS.desk.width).toBe(72);
    expect(TABLE_SEAT_DEFAULTS["table-conference"]).toBe(14);
    expect(SHAPE_DEFAULTS["desk/l-shape"].width).toBe(120);
  });
});

describe("getDefaults", () => {
  it("returns shape-specific defaults when a shape is provided", () => {
    const defaults = getDefaults("desk", "l-shape");
    expect(defaults).toEqual(SHAPE_DEFAULTS["desk/l-shape"]);
  });

  it("returns top-level shape defaults for standalone shape types", () => {
    expect(getDefaults("table-round")).toEqual(SHAPE_DEFAULTS["table-round"]);
  });

  it("falls back to element defaults for plain types", () => {
    expect(getDefaults("workstation")).toEqual(ELEMENT_DEFAULTS.workstation);
    expect(getDefaults("chair")).toEqual(ELEMENT_DEFAULTS.chair);
  });

  it("returns undefined for unknown types", () => {
    expect(getDefaults("not-a-real-element")).toBeUndefined();
    expect(getDefaults("desk", "nonexistent-shape")).toEqual(ELEMENT_DEFAULTS.desk);
  });
});