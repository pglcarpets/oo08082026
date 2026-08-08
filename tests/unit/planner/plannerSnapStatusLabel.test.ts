import { describe, expect, it } from "vitest";
import {
  buildSnapStatusLabel,
  isSnapStatusActive,
} from "@planner/lib/plannerSnapStatusLabel";

/**
 * Human-readable snap indicator for planner chrome.
 * Port contract from 20072026 snapStatusLabel (pure lib).
 *
 * Production change that fails these tests: wrong Off / Grid+Objects / Objects
 * mapping, or treating "Off"/"Pending" as active.
 */
describe("plannerSnapStatusLabel: buildSnapStatusLabel", () => {
  it("returns Off when object snap is disabled (grid flag ignored)", () => {
    expect(buildSnapStatusLabel(false, true)).toBe("Off");
    expect(buildSnapStatusLabel(false, false)).toBe("Off");
  });

  it("returns Grid + Objects when snap and grid are both enabled", () => {
    expect(buildSnapStatusLabel(true, true)).toBe("Grid + Objects");
  });

  it("returns Objects when snap is on but grid is off", () => {
    expect(buildSnapStatusLabel(true, false)).toBe("Objects");
  });
});

describe("plannerSnapStatusLabel: isSnapStatusActive", () => {
  it("is inactive for Off and Pending", () => {
    expect(isSnapStatusActive("Off")).toBe(false);
    expect(isSnapStatusActive("Pending")).toBe(false);
  });

  it("is active for any other non-empty status label", () => {
    expect(isSnapStatusActive("Grid + Objects")).toBe(true);
    expect(isSnapStatusActive("Objects")).toBe(true);
    expect(isSnapStatusActive("Custom")).toBe(true);
  });
});

/**
 * Consumer contract for Planner.tsx canvas-aids chrome:
 * label text + data-active flag derived only from buildSnapStatusLabel + isSnapStatusActive.
 * Production change that fails: Planner wiring label/active independently of this map.
 */
describe("plannerSnapStatusLabel: Planner consumer chrome contract", () => {
  function consumerChrome(snapEnabled: boolean, gridEnabled: boolean) {
    const label = buildSnapStatusLabel(snapEnabled, gridEnabled);
    const active = isSnapStatusActive(label);
    return {
      label,
      dataActive: active ? "true" : "false",
      testId: "snap-status-label" as const,
    };
  }

  it("maps store defaults (snap+grid on) to Grid + Objects / active", () => {
    expect(consumerChrome(true, true)).toEqual({
      label: "Grid + Objects",
      dataActive: "true",
      testId: "snap-status-label",
    });
  });

  it("maps snap off to Off / inactive regardless of grid", () => {
    expect(consumerChrome(false, true)).toEqual({
      label: "Off",
      dataActive: "false",
      testId: "snap-status-label",
    });
    expect(consumerChrome(false, false).dataActive).toBe("false");
  });

  it("maps snap on + grid off to Objects / active", () => {
    expect(consumerChrome(true, false)).toEqual({
      label: "Objects",
      dataActive: "true",
      testId: "snap-status-label",
    });
  });
});
