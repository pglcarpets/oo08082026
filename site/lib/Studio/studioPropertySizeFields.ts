export type PropertySizeFields =
  | { kind: "length"; labels: { primary: "Length" } }
  | { kind: "box"; labels: { x: "Length"; y: "Depth"; z: "Height" } };

const LINE_TYPES = new Set(["line", "polyline", "path"]);

/** Which size controls the Properties panel should show for a fabric object type. */
export function propertySizeFields(objectType: string | undefined): PropertySizeFields {
  if (objectType && LINE_TYPES.has(objectType)) {
    return { kind: "length", labels: { primary: "Length" } };
  }
  return { kind: "box", labels: { x: "Length", y: "Depth", z: "Height" } };
}

type LineLike = {
  type?: string;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  scaleX?: number;
  scaleY?: number;
};

/** Canvas-space length of a fabric Line (accounts for object scale). */
export function lineLengthPx(obj: LineLike): number {
  const sx = obj.scaleX ?? 1;
  const sy = obj.scaleY ?? 1;
  const dx = ((obj.x2 ?? 0) - (obj.x1 ?? 0)) * sx;
  const dy = ((obj.y2 ?? 0) - (obj.y1 ?? 0)) * sy;
  return Math.hypot(dx, dy);
}

/**
 * Resize a line to `nextLengthPx` while keeping the midpoint fixed
 * and preserving direction.
 */
export function setLineLengthPx(
  obj: LineLike & { set: (p: Record<string, number>) => void },
  nextLengthPx: number,
): void {
  const cur = lineLengthPx(obj);
  if (!(cur > 0) || !(nextLengthPx > 0)) return;
  const sx = obj.scaleX ?? 1;
  const sy = obj.scaleY ?? 1;
  const x1 = obj.x1 ?? 0;
  const y1 = obj.y1 ?? 0;
  const x2 = obj.x2 ?? 0;
  const y2 = obj.y2 ?? 0;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = (x2 - x1) * sx;
  const dy = (y2 - y1) * sy;
  const ux = dx / cur;
  const uy = dy / cur;
  const half = nextLengthPx / 2;
  obj.set({
    x1: mx - (half * ux) / sx,
    y1: my - (half * uy) / sy,
    x2: mx + (half * ux) / sx,
    y2: my + (half * uy) / sy,
  });
}
