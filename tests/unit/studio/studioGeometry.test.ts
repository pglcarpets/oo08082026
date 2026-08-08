import { describe, expect, it } from "vitest";
import { snap, snapAngle } from "@studio/lib/studioSnap";
import {
  toMm,
  fromMm,
  formatDim,
  pxToMm,
  mmToPx,
  MM_PER_INCH,
} from "@studio/lib/studioUnits";
import {
  SCALE_PX_PER_MM,
  OO,
  OO_DRAW,
} from "@studio/lib/studioPalette";

describe("studio geometry: snap", () => {
  it("snaps to grid", () => {
    expect(snap(0, 50)).toBe(0);
    expect(snap(24, 50)).toBe(0);
    expect(snap(25, 50)).toBe(50);
    expect(snap(74, 50)).toBe(50);
    expect(snap(75, 50)).toBe(100);
  });

  it("returns value when grid invalid", () => {
    expect(snap(33, 0)).toBe(33);
    expect(snap(33, -10)).toBe(33);
  });

  it("snaps angles to step", () => {
    expect(snapAngle(0)).toBe(0);
    expect(snapAngle(7)).toBe(0);
    expect(snapAngle(8)).toBe(15);
    expect(snapAngle(44, 45)).toBe(45);
  });
});

describe("studio geometry: units", () => {
  it("converts to/from mm", () => {
    expect(toMm(1, "in")).toBeCloseTo(MM_PER_INCH);
    expect(toMm(1, "cm")).toBe(10);
    expect(toMm(1, "m")).toBe(1000);
    expect(toMm(100, "mm")).toBe(100);
    expect(fromMm(25.4, "in")).toBeCloseTo(1);
    expect(fromMm(100, "cm")).toBe(10);
  });

  it("formats dimensions", () => {
    expect(formatDim(1200, "mm")).toBe("1200 mm");
    expect(formatDim(100, "cm")).toBe("10.0 cm");
    expect(formatDim(1000, "m")).toBe("1.00 m");
  });

  it("px ↔ mm at the furniture drawing scale", () => {
    expect(SCALE_PX_PER_MM).toBe(0.2);
    expect(mmToPx(1000, SCALE_PX_PER_MM)).toBe(200);
    expect(pxToMm(200, SCALE_PX_PER_MM)).toBe(1000);
  });
});

describe("studio geometry: draw defaults", () => {
  it("draw tokens are palette values", () => {
    expect(OO_DRAW.stroke).toBe(OO.ink900);
    expect(OO_DRAW.fill).toBe(OO.ecru100);
    expect(OO_DRAW.fillAlt).toBe(OO.ecru200);
  });
});
