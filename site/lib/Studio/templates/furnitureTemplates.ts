/**
 * Static furniture templates for Studio empty-canvas / New CTA.
 * Pure data + geometry descriptors in mm — no Fabric, no Planner imports.
 */
import { OO_DRAW } from "@studio/lib/studioPalette";
import type { FurnitureDimensions } from "@studio/lib/studioTypes";

export type FurnitureTemplateShapeKind = "rect" | "ellipse" | "circle";

/** Local-space shape in mm; origin is top-left of the template footprint. */
export type FurnitureTemplateShape = {
  kind: FurnitureTemplateShapeKind;
  x_mm: number;
  y_mm: number;
  width_mm: number;
  depth_mm: number;
  /** Corner radius for rect (mm). Ignored for ellipse/circle. */
  rx_mm?: number;
  fill?: string;
  stroke?: string;
  label?: string;
};

export type FurnitureTemplateId = "desk" | "chair" | "storage";

export type FurnitureTemplate = {
  id: FurnitureTemplateId;
  name: string;
  category: string;
  description: string;
  dimensions: FurnitureDimensions;
  shapes: FurnitureTemplateShape[];
};

/** Canvas-ready shape list (px) for Fabric construction in the UI layer. */
export type TemplateCanvasShapeSpec = {
  kind: FurnitureTemplateShapeKind;
  left: number;
  top: number;
  width: number;
  height: number;
  rx?: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  label: string;
};

const DEFAULT_FILL = OO_DRAW.fill;
const DEFAULT_STROKE = OO_DRAW.stroke;
const FILL_ALT = OO_DRAW.fillAlt;

/** Desk 1400×700 top view: surface + cable tray / modesty strip. */
const DESK_TEMPLATE: FurnitureTemplate = {
  id: "desk",
  name: "Desk",
  category: "Desks",
  description: "Rectangular desk top with front modesty strip",
  dimensions: { width_mm: 1400, depth_mm: 700, height_mm: 750 },
  shapes: [
    {
      kind: "rect",
      x_mm: 0,
      y_mm: 0,
      width_mm: 1400,
      depth_mm: 700,
      rx_mm: 20,
      fill: DEFAULT_FILL,
      stroke: DEFAULT_STROKE,
      label: "Desk top",
    },
    {
      kind: "rect",
      x_mm: 40,
      y_mm: 520,
      width_mm: 1320,
      depth_mm: 140,
      rx_mm: 8,
      fill: FILL_ALT,
      stroke: DEFAULT_STROKE,
      label: "Modesty",
    },
  ],
};

/** Task chair 600×600: seat, backrest, base footprint. */
const CHAIR_TEMPLATE: FurnitureTemplate = {
  id: "chair",
  name: "Chair",
  category: "Seating",
  description: "Task chair seat, backrest, and circular base",
  dimensions: { width_mm: 600, depth_mm: 600, height_mm: 1050 },
  shapes: [
    {
      kind: "ellipse",
      x_mm: 150,
      y_mm: 380,
      width_mm: 300,
      depth_mm: 160,
      fill: FILL_ALT,
      stroke: DEFAULT_STROKE,
      label: "Base",
    },
    {
      kind: "rect",
      x_mm: 80,
      y_mm: 180,
      width_mm: 440,
      depth_mm: 320,
      rx_mm: 48,
      fill: DEFAULT_FILL,
      stroke: DEFAULT_STROKE,
      label: "Seat",
    },
    {
      kind: "rect",
      x_mm: 100,
      y_mm: 40,
      width_mm: 400,
      depth_mm: 160,
      rx_mm: 40,
      fill: FILL_ALT,
      stroke: DEFAULT_STROKE,
      label: "Backrest",
    },
  ],
};

/** Storage pedestal 400×600: body + drawer divisions. */
const STORAGE_TEMPLATE: FurnitureTemplate = {
  id: "storage",
  name: "Storage",
  category: "Storage",
  description: "Pedestal cabinet with drawer faces",
  dimensions: { width_mm: 400, depth_mm: 600, height_mm: 720 },
  shapes: [
    {
      kind: "rect",
      x_mm: 0,
      y_mm: 0,
      width_mm: 400,
      depth_mm: 600,
      rx_mm: 12,
      fill: DEFAULT_FILL,
      stroke: DEFAULT_STROKE,
      label: "Cabinet",
    },
    {
      kind: "rect",
      x_mm: 24,
      y_mm: 24,
      width_mm: 352,
      depth_mm: 170,
      rx_mm: 6,
      fill: FILL_ALT,
      stroke: DEFAULT_STROKE,
      label: "Drawer 1",
    },
    {
      kind: "rect",
      x_mm: 24,
      y_mm: 214,
      width_mm: 352,
      depth_mm: 170,
      rx_mm: 6,
      fill: FILL_ALT,
      stroke: DEFAULT_STROKE,
      label: "Drawer 2",
    },
    {
      kind: "rect",
      x_mm: 24,
      y_mm: 404,
      width_mm: 352,
      depth_mm: 170,
      rx_mm: 6,
      fill: FILL_ALT,
      stroke: DEFAULT_STROKE,
      label: "Drawer 3",
    },
  ],
};

export const FURNITURE_TEMPLATES: readonly FurnitureTemplate[] = [
  DESK_TEMPLATE,
  CHAIR_TEMPLATE,
  STORAGE_TEMPLATE,
] as const;

export function listFurnitureTemplates(): readonly FurnitureTemplate[] {
  return FURNITURE_TEMPLATES;
}

export function getFurnitureTemplate(
  id: string,
): FurnitureTemplate | undefined {
  return FURNITURE_TEMPLATES.find((t) => t.id === id);
}

export type ResolveTemplateShapesOptions = {
  scalePxPerMm: number;
  /** World centre of the placed footprint (px). */
  centerX: number;
  centerY: number;
  strokeWidth?: number;
};

/**
 * Convert template mm geometry to canvas px specs, centred at (centerX, centerY).
 */
export function resolveTemplateShapesToCanvas(
  template: FurnitureTemplate,
  opts: ResolveTemplateShapesOptions,
): TemplateCanvasShapeSpec[] {
  const scale = opts.scalePxPerMm;
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error("scalePxPerMm must be a positive finite number");
  }
  const strokeWidth = opts.strokeWidth ?? 1.5;
  const footW = template.dimensions.width_mm * scale;
  const footD = template.dimensions.depth_mm * scale;
  const originLeft = opts.centerX - footW / 2;
  const originTop = opts.centerY - footD / 2;

  return template.shapes.map((shape) => {
    const width = Math.max(1, shape.width_mm * scale);
    const height = Math.max(1, shape.depth_mm * scale);
    const left = originLeft + shape.x_mm * scale;
    const top = originTop + shape.y_mm * scale;
    const fill = shape.fill ?? DEFAULT_FILL;
    const stroke = shape.stroke ?? DEFAULT_STROKE;
    const label = shape.label ?? template.name;
    const base: TemplateCanvasShapeSpec = {
      kind: shape.kind,
      left,
      top,
      width,
      height,
      fill,
      stroke,
      strokeWidth,
      label,
    };
    if (shape.kind === "rect" && typeof shape.rx_mm === "number" && shape.rx_mm > 0) {
      base.rx = shape.rx_mm * scale;
    }
    return base;
  });
}

/** True when every shape has finite positive size and lies within the footprint (+small slack). */
export function isTemplateGeometryValid(template: FurnitureTemplate): boolean {
  const { width_mm, depth_mm, height_mm } = template.dimensions;
  if (
    !Number.isFinite(width_mm) ||
    !Number.isFinite(depth_mm) ||
    !Number.isFinite(height_mm) ||
    width_mm <= 0 ||
    depth_mm <= 0 ||
    height_mm <= 0
  ) {
    return false;
  }
  if (!template.shapes.length) return false;
  const slack = 1;
  for (const s of template.shapes) {
    if (
      !Number.isFinite(s.x_mm) ||
      !Number.isFinite(s.y_mm) ||
      !Number.isFinite(s.width_mm) ||
      !Number.isFinite(s.depth_mm) ||
      s.width_mm <= 0 ||
      s.depth_mm <= 0
    ) {
      return false;
    }
    if (s.x_mm < -slack || s.y_mm < -slack) return false;
    if (s.x_mm + s.width_mm > width_mm + slack) return false;
    if (s.y_mm + s.depth_mm > depth_mm + slack) return false;
  }
  return true;
}
