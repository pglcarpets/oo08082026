import { describe, it, expect } from "vitest";
import {
  FURNITURE_TEMPLATES,
  getFurnitureTemplate,
  isTemplateGeometryValid,
  listFurnitureTemplates,
  resolveTemplateShapesToCanvas,
} from "@/lib/Studio/templates/furnitureTemplates";

describe("furnitureTemplates", () => {
  it("exports desk, chair, and storage templates", () => {
    const list = listFurnitureTemplates();
    expect(list).toHaveLength(3);
    expect(list.map((t) => t.id).sort()).toEqual(["chair", "desk", "storage"]);
    expect(FURNITURE_TEMPLATES).toHaveLength(3);
  });

  it("getFurnitureTemplate resolves known ids and misses unknown", () => {
    expect(getFurnitureTemplate("desk")?.name).toBe("Desk");
    expect(getFurnitureTemplate("chair")?.category).toBe("Seating");
    expect(getFurnitureTemplate("storage")?.dimensions.width_mm).toBe(400);
    expect(getFurnitureTemplate("nope")).toBeUndefined();
  });

  it("each template has valid metadata and in-footprint shapes", () => {
    for (const t of listFurnitureTemplates()) {
      expect(t.name.trim().length).toBeGreaterThan(0);
      expect(t.category.trim().length).toBeGreaterThan(0);
      expect(t.shapes.length).toBeGreaterThan(0);
      expect(isTemplateGeometryValid(t)).toBe(true);
    }
  });

  it("resolveTemplateShapesToCanvas centres footprint and scales mm → px", () => {
    const desk = getFurnitureTemplate("desk");
    expect(desk).toBeDefined();
    if (!desk) return;

    const scale = 0.2;
    const centerX = 500;
    const centerY = 400;
    const specs = resolveTemplateShapesToCanvas(desk, {
      scalePxPerMm: scale,
      centerX,
      centerY,
    });

    expect(specs.length).toBe(desk.shapes.length);
    const footW = desk.dimensions.width_mm * scale;
    const footD = desk.dimensions.depth_mm * scale;
    // First shape is full desk top at local 0,0
    expect(specs[0].kind).toBe("rect");
    expect(specs[0].left).toBeCloseTo(centerX - footW / 2);
    expect(specs[0].top).toBeCloseTo(centerY - footD / 2);
    expect(specs[0].width).toBeCloseTo(footW);
    expect(specs[0].height).toBeCloseTo(footD);
    expect(specs[0].rx).toBeGreaterThan(0);
    expect(specs[0].label).toBe("Desk top");
  });

  it("resolveTemplateShapesToCanvas rejects non-positive scale", () => {
    const chair = getFurnitureTemplate("chair");
    expect(chair).toBeDefined();
    if (!chair) return;
    expect(() =>
      resolveTemplateShapesToCanvas(chair, {
        scalePxPerMm: 0,
        centerX: 0,
        centerY: 0,
      }),
    ).toThrow(/scalePxPerMm/);
  });

  it("storage template yields four canvas shapes (body + drawers)", () => {
    const storage = getFurnitureTemplate("storage");
    expect(storage).toBeDefined();
    if (!storage) return;
    const specs = resolveTemplateShapesToCanvas(storage, {
      scalePxPerMm: 0.2,
      centerX: 100,
      centerY: 100,
    });
    expect(specs).toHaveLength(4);
    expect(specs.every((s) => s.width > 0 && s.height > 0)).toBe(true);
  });
});
