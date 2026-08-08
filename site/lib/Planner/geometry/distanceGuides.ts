/**
 * Distance guides for furniture placement — pure plan-mm geometry.
 */

export type Point2D = { x: number; y: number };

export type BoundingBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type DistanceGuide = {
  kind: "furniture" | "wall";
  targetId: string;
  distanceMm: number;
  from: Point2D;
  to: Point2D;
  axis: "x" | "y" | "free";
};

export type CenteredFurnitureRect = {
  id: string;
  cxMm: number;
  cyMm: number;
  widthMm: number;
  depthMm: number;
  rotationDeg?: number;
};

export const DEFAULT_DISTANCE_GUIDE_MAX_MM = 5000;
export const DEFAULT_DISTANCE_GUIDE_MAX_COUNT = 6;

function positiveSize(n: number, fallback: number): number {
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function aabbFromCenteredFurniture(item: CenteredFurnitureRect): BoundingBox {
  const width = positiveSize(item.widthMm, 1);
  const depth = positiveSize(item.depthMm, 1);
  const rot = ((item.rotationDeg ?? 0) * Math.PI) / 180;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const hx = width / 2;
  const hy = depth / 2;
  const locals: readonly Point2D[] = [
    { x: -hx, y: -hy },
    { x: hx, y: -hy },
    { x: hx, y: hy },
    { x: -hx, y: hy },
  ];
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const local of locals) {
    const x = item.cxMm + local.x * cos - local.y * sin;
    const y = item.cyMm + local.x * sin + local.y * cos;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

/** Edge-to-edge gap between AABBs; 0 if overlap/touch. */
export function aabbGapMm(a: BoundingBox, b: BoundingBox): {
  gap: number;
  axis: "x" | "y" | "free";
  from: Point2D;
  to: Point2D;
} {
  const gapX = Math.max(0, Math.max(b.minX - a.maxX, a.minX - b.maxX));
  const gapY = Math.max(0, Math.max(b.minY - a.maxY, a.minY - b.maxY));

  if (gapX === 0 && gapY === 0) {
    return {
      gap: 0,
      axis: "free",
      from: { x: (a.minX + a.maxX) / 2, y: (a.minY + a.maxY) / 2 },
      to: { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 },
    };
  }

  if (gapX === 0) {
    const x = (Math.max(a.minX, b.minX) + Math.min(a.maxX, b.maxX)) / 2;
    if (a.maxY <= b.minY) {
      return {
        gap: gapY,
        axis: "y",
        from: { x, y: a.maxY },
        to: { x, y: b.minY },
      };
    }
    return {
      gap: gapY,
      axis: "y",
      from: { x, y: a.minY },
      to: { x, y: b.maxY },
    };
  }

  if (gapY === 0) {
    const y = (Math.max(a.minY, b.minY) + Math.min(a.maxY, b.maxY)) / 2;
    if (a.maxX <= b.minX) {
      return {
        gap: gapX,
        axis: "x",
        from: { x: a.maxX, y },
        to: { x: b.minX, y },
      };
    }
    return {
      gap: gapX,
      axis: "x",
      from: { x: a.minX, y },
      to: { x: b.maxX, y },
    };
  }

  return {
    gap: Math.hypot(gapX, gapY),
    axis: "free",
    from: { x: (a.minX + a.maxX) / 2, y: (a.minY + a.maxY) / 2 },
    to: { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 },
  };
}

/**
 * Nearest distance guides from an active furniture AABB to other furniture.
 */
export function collectFurnitureDistanceGuides(input: {
  active: CenteredFurnitureRect;
  others: readonly CenteredFurnitureRect[];
  maxDistanceMm?: number;
  maxGuides?: number;
}): DistanceGuide[] {
  const maxDistanceMm = input.maxDistanceMm ?? DEFAULT_DISTANCE_GUIDE_MAX_MM;
  const maxGuides = input.maxGuides ?? DEFAULT_DISTANCE_GUIDE_MAX_COUNT;
  const activeBox = aabbFromCenteredFurniture(input.active);
  const guides: DistanceGuide[] = [];

  for (const other of input.others) {
    if (other.id === input.active.id) continue;
    const gap = aabbGapMm(activeBox, aabbFromCenteredFurniture(other));
    if (gap.gap <= 0 || gap.gap > maxDistanceMm) continue;
    guides.push({
      kind: "furniture",
      targetId: other.id,
      distanceMm: gap.gap,
      from: gap.from,
      to: gap.to,
      axis: gap.axis,
    });
  }

  guides.sort((a, b) => a.distanceMm - b.distanceMm);
  return guides.slice(0, maxGuides);
}
