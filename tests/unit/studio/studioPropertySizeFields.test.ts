import { describe, expect, it } from "vitest";
import {
  lineLengthPx,
  propertySizeFields,
  setLineLengthPx,
} from "@studio/lib/studioPropertySizeFields";

describe("propertySizeFields", () => {
  it("uses length for stroke-primary line objects", () => {
    expect(propertySizeFields("line")).toEqual({
      kind: "length",
      labels: { primary: "Length" },
    });
  });

  it("uses furniture plan labels for closed shapes", () => {
    expect(propertySizeFields("rect")).toEqual({
      kind: "box",
      labels: { x: "Length", y: "Depth", z: "Height" },
    });
    expect(propertySizeFields("ellipse")).toEqual({
      kind: "box",
      labels: { x: "Length", y: "Depth", z: "Height" },
    });
  });

  it("computes and resizes line length around the midpoint", () => {
    const line = {
      type: "line",
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
      scaleX: 1,
      scaleY: 1,
      set(p: Record<string, number>) {
        Object.assign(this, p);
      },
    };
    expect(lineLengthPx(line)).toBe(100);
    setLineLengthPx(line, 200);
    expect(lineLengthPx(line)).toBeCloseTo(200);
    expect((line.x1 + line.x2) / 2).toBeCloseTo(50);
  });
});
