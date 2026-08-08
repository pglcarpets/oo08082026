import { describe, expect, it } from "vitest";
import {
  arcSweepDegrees,
  arrowOutlinePoints,
  bboxFromPoints,
  freehandStrokeWidth,
  isFreehandTool,
  isStudioDragShapeTool,
  starPoints,
  trianglePoints,
} from "@studio/lib/studioShapeGeometry";

describe("shapeGeometry", () => {
  it("builds a triangle with tip at top-center of the drag box", () => {
    expect(trianglePoints({ left: 0, top: 0, width: 100, height: 80 })).toEqual([
      { x: 50, y: 0 },
      { x: 100, y: 80 },
      { x: 0, y: 80 },
    ]);
  });

  it("builds a 5-point star with 10 vertices", () => {
    const pts = starPoints({ left: 0, top: 0, width: 100, height: 100 });
    expect(pts).toHaveLength(10);
    expect(pts[0].y).toBeLessThan(pts[1].y);
  });

  it("builds an arrow outline from start to end", () => {
    const pts = arrowOutlinePoints({ x: 0, y: 0 }, { x: 100, y: 0 }, 20);
    expect(pts.length).toBe(7);
    expect(pts[3]).toEqual({ x: 100, y: 0 });
  });

  it("maps freehand family stroke widths", () => {
    expect(freehandStrokeWidth("brush")).toBe(8);
    expect(freehandStrokeWidth("pen")).toBe(1.25);
    expect(freehandStrokeWidth("freehand")).toBe(2);
    expect(isFreehandTool("brush")).toBe(true);
    expect(isFreehandTool("rect")).toBe(false);
  });

  it("classifies drag shape tools and arc sweep", () => {
    expect(isStudioDragShapeTool("roundedRect")).toBe(true);
    expect(isStudioDragShapeTool("brush")).toBe(false);
    expect(arcSweepDegrees({ left: 0, top: 0, width: 10, height: 10 })).toBe(40);
    expect(arcSweepDegrees({ left: 0, top: 0, width: 400, height: 10 })).toBe(320);
    expect(bboxFromPoints({ x: 10, y: 20 }, { x: 0, y: 5 })).toEqual({
      left: 0,
      top: 5,
      width: 10,
      height: 15,
    });
  });
});
