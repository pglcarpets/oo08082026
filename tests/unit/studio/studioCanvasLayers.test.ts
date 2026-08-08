// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import * as fabric from "fabric";
import {
  collectUserLayerRows,
  isTooSmallDrawnShape,
} from "@studio/lib/studioCanvasLayers";

describe("studio: canvasLayers", () => {
  it("collects one layer for one tagged rectangle", () => {
    const rect = new fabric.Rect({ left: 10, top: 10, width: 100, height: 50, fill: "red" });
    (rect as fabric.FabricObject & { data?: Record<string, unknown> }).data = {
      id: "r1",
      label: "Rectangle",
    };
    const rows = collectUserLayerRows([rect]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.label).toBe("Rectangle");
  });

  it("ignores grid, sheet, guide, and preview helpers", () => {
    const rect = new fabric.Rect({ left: 0, top: 0, width: 10, height: 10, fill: "red" });
    (rect as fabric.FabricObject & { data?: Record<string, unknown> }).data = {
      id: "r1",
      label: "Rectangle",
    };
    const grid = new fabric.Line([0, 0, 10, 10], { selectable: false, evented: false });
    (grid as fabric.FabricObject & { data?: Record<string, unknown> }).data = {
      isGridLine: true,
    };
    const sheet = new fabric.Rect({ left: 0, top: 0, width: 100, height: 100, fill: "transparent" });
    (sheet as fabric.FabricObject & { data?: Record<string, unknown> }).data = {
      isSheet: true,
    };
    const preview = new fabric.Polyline([{ x: 0, y: 0 }, { x: 10, y: 10 }], {
      selectable: false,
      evented: false,
    });
    (preview as fabric.FabricObject & { data?: Record<string, unknown> }).data = {
      isPreview: true,
    };

    const rows = collectUserLayerRows([grid, sheet, preview, rect]);
    expect(rows).toHaveLength(1);
  });

  it("treats tiny click rectangles as discardable", () => {
    const rect = new fabric.Rect({ left: 10, top: 10, width: 1, height: 1, fill: "red" });
    expect(isTooSmallDrawnShape(rect, "rect")).toBe(true);
  });
});
