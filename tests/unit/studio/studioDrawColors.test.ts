import { describe, expect, it } from "vitest";
import {
  colorPatchForObject,
  isStrokePrimaryType,
  mergeDrawDefaults,
  mergeDrawDefaultsForTool,
} from "@studio/lib/studioDrawColors";

describe("drawColors", () => {
  it("treats lines and paths as stroke-primary", () => {
    expect(isStrokePrimaryType("line")).toBe(true);
    expect(isStrokePrimaryType("path")).toBe(true);
    expect(isStrokePrimaryType("polyline")).toBe(true);
    expect(isStrokePrimaryType("rect")).toBe(false);
  });

  it("maps fill picks on lines to stroke so color is visible", () => {
    expect(colorPatchForObject("fill", "#FF0000", "line")).toEqual({ stroke: "#FF0000" });
    expect(colorPatchForObject("fill", "#00FF00", "rect")).toEqual({ fill: "#00FF00" });
    expect(colorPatchForObject("stroke", "#0000FF", "line")).toEqual({ stroke: "#0000FF" });
  });

  it("updates draw defaults for the active channel", () => {
    expect(
      mergeDrawDefaults({ fill: "#aaa", stroke: "#111" }, "fill", "#FF0000"),
    ).toEqual({ fill: "#FF0000", stroke: "#111" });
    expect(
      mergeDrawDefaults({ fill: "#aaa", stroke: "#111" }, "stroke", "#00FF00"),
    ).toEqual({ fill: "#aaa", stroke: "#00FF00" });
  });

  it("mirrors fill picks into stroke when the active tool is line-like", () => {
    expect(
      mergeDrawDefaultsForTool({ fill: "#aaa", stroke: "#111" }, "fill", "#FF0000", "line"),
    ).toEqual({ fill: "#FF0000", stroke: "#FF0000" });
    expect(
      mergeDrawDefaultsForTool({ fill: "#aaa", stroke: "#111" }, "fill", "#FF0000", "rect"),
    ).toEqual({ fill: "#FF0000", stroke: "#111" });
  });
});
