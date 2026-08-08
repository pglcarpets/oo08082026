export type Pt = { x: number; y: number };

export type BBox = { left: number; top: number; width: number; height: number };

export function bboxFromPoints(a: Pt, b: Pt): BBox {
  const left = Math.min(a.x, b.x);
  const top = Math.min(a.y, b.y);
  return {
    left,
    top,
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}

/** Equilateral-ish triangle inscribed in the drag box (tip at top center). */
export function trianglePoints(box: BBox): Pt[] {
  const { left, top, width, height } = box;
  return [
    { x: left + width / 2, y: top },
    { x: left + width, y: top + height },
    { x: left, y: top + height },
  ];
}

/** 5-point star inscribed in the drag box. */
export function starPoints(box: BBox, points = 5): Pt[] {
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  const outerR = Math.min(box.width, box.height) / 2;
  const innerR = outerR * 0.4;
  const pts: Pt[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  return pts;
}

/** Arrow shaft + triangular head as polygon points (closed outline). */
export function arrowOutlinePoints(start: Pt, end: Pt, headSize = 14): Pt[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const shaftW = Math.max(2, headSize * 0.28);
  const head = Math.min(headSize, len * 0.45);
  const baseX = end.x - ux * head;
  const baseY = end.y - uy * head;
  return [
    { x: start.x + px * shaftW, y: start.y + py * shaftW },
    { x: baseX + px * shaftW, y: baseY + py * shaftW },
    { x: baseX + px * head * 0.55, y: baseY + py * head * 0.55 },
    { x: end.x, y: end.y },
    { x: baseX - px * head * 0.55, y: baseY - py * head * 0.55 },
    { x: baseX - px * shaftW, y: baseY - py * shaftW },
    { x: start.x - px * shaftW, y: start.y - py * shaftW },
  ];
}

/** Sweep degrees for an arc from drag size (40°…320°). */
export function arcSweepDegrees(box: BBox): number {
  const span = Math.max(box.width, box.height);
  return Math.min(320, Math.max(40, span));
}

export type FreehandKind = "freehand" | "pen" | "brush";

export function isFreehandTool(tool: string): tool is FreehandKind {
  return tool === "freehand" || tool === "pen" || tool === "brush";
}

/** Stroke width in px for freehand-family tools. */
export function freehandStrokeWidth(tool: string): number {
  if (tool === "brush") return 8;
  if (tool === "pen") return 1.25;
  return 2;
}

export const STUDIO_DRAG_SHAPE_TOOLS = [
  "rect",
  "roundedRect",
  "circle",
  "ellipse",
  "triangle",
  "star",
  "line",
  "arrow",
  "arc",
] as const;

export type StudioDragShapeTool = (typeof STUDIO_DRAG_SHAPE_TOOLS)[number];

export function isStudioDragShapeTool(tool: string): tool is StudioDragShapeTool {
  return (STUDIO_DRAG_SHAPE_TOOLS as readonly string[]).includes(tool);
}
