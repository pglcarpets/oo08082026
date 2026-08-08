/**
 * Align / distribute entities in plan mm (min-edge / top-left convention).
 */

export type AlignAxis = "x" | "y";
export type AlignAnchor = "min" | "center" | "max";
export type DistributeAxis = "x" | "y";

export type PositionedEntity = {
  id: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  depthMm: number;
};

export type EntityPositionUpdate = { id: string; xMm: number; yMm: number };

function extents(entities: readonly PositionedEntity[], axis: AlignAxis) {
  let min = Infinity;
  let max = -Infinity;
  for (const e of entities) {
    const pos = axis === "x" ? e.xMm : e.yMm;
    const size = axis === "x" ? e.widthMm : e.depthMm;
    if (pos < min) min = pos;
    if (pos + size > max) max = pos + size;
  }
  return { min, max };
}

export function alignEntities(
  entities: readonly PositionedEntity[],
  axis: AlignAxis,
  anchor: AlignAnchor,
): EntityPositionUpdate[] {
  if (entities.length < 2) return [];

  const { min, max } = extents(entities, axis);

  let target: number;
  if (anchor === "min") target = min;
  else if (anchor === "max") target = max;
  else target = (min + max) / 2;

  return entities.map((e) => {
    const size = axis === "x" ? e.widthMm : e.depthMm;
    const newPos =
      anchor === "center" ? target - size / 2 : anchor === "min" ? target : target - size;
    return {
      id: e.id,
      xMm: axis === "x" ? newPos : e.xMm,
      yMm: axis === "y" ? newPos : e.yMm,
    };
  });
}

export function distributeEntities(
  entities: readonly PositionedEntity[],
  axis: DistributeAxis,
): EntityPositionUpdate[] {
  if (entities.length < 3) return [];

  const sorted = [...entities].sort((a, b) =>
    axis === "x" ? a.xMm - b.xMm : a.yMm - b.yMm,
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return [];

  const firstLeading = axis === "x" ? first.xMm : first.yMm;
  const lastLeading = axis === "x" ? last.xMm : last.yMm;
  const lastSize = axis === "x" ? last.widthMm : last.depthMm;
  const lastTrailing = lastLeading + lastSize;
  const totalSpan = lastTrailing - firstLeading;
  const totalSize = sorted.reduce(
    (sum, e) => sum + (axis === "x" ? e.widthMm : e.depthMm),
    0,
  );
  const free = totalSpan - totalSize;
  const gap = free / (sorted.length - 1);

  const updates: EntityPositionUpdate[] = [];
  let leading = firstLeading;
  for (let i = 0; i < sorted.length; i += 1) {
    const e = sorted[i];
    if (!e) continue;
    const size = axis === "x" ? e.widthMm : e.depthMm;
    if (i === 0) {
      updates.push({ id: e.id, xMm: e.xMm, yMm: e.yMm });
      leading = firstLeading + size + gap;
      continue;
    }
    if (i === sorted.length - 1) {
      updates.push({ id: e.id, xMm: e.xMm, yMm: e.yMm });
      continue;
    }
    updates.push({
      id: e.id,
      xMm: axis === "x" ? leading : e.xMm,
      yMm: axis === "y" ? leading : e.yMm,
    });
    leading = leading + size + gap;
  }

  return updates;
}

export type AlignAction =
  | "left"
  | "centerX"
  | "right"
  | "top"
  | "centerY"
  | "bottom"
  | "distH"
  | "distV";

export function applyAlignAction(
  entities: readonly PositionedEntity[],
  action: AlignAction,
): EntityPositionUpdate[] {
  switch (action) {
    case "left":
      return alignEntities(entities, "x", "min");
    case "centerX":
      return alignEntities(entities, "x", "center");
    case "right":
      return alignEntities(entities, "x", "max");
    case "top":
      return alignEntities(entities, "y", "min");
    case "centerY":
      return alignEntities(entities, "y", "center");
    case "bottom":
      return alignEntities(entities, "y", "max");
    case "distH":
      return distributeEntities(entities, "x");
    case "distV":
      return distributeEntities(entities, "y");
    default:
      return [];
  }
}
