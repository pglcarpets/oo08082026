/**
 * Furniture overlap rule — rotation-aware OBB intersection (SAT).
 */
import type { PlacedFurniture, ValidationIssue } from "./types";

type Point = { x: number; y: number };

function furnitureCorners(item: PlacedFurniture): readonly Point[] {
  const radians = ((item.rotationDeg ?? 0) * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const halfWidth = item.widthMm / 2;
  const halfDepth = item.depthMm / 2;
  const locals: readonly Point[] = [
    { x: -halfWidth, y: -halfDepth },
    { x: halfWidth, y: -halfDepth },
    { x: halfWidth, y: halfDepth },
    { x: -halfWidth, y: halfDepth },
  ];
  return locals.map((local) => ({
    x: item.xMm + local.x * cos - local.y * sin,
    y: item.yMm + local.x * sin + local.y * cos,
  }));
}

function projectOntoAxis(corners: readonly Point[], axis: Point): { min: number; max: number } {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const corner of corners) {
    const projection = corner.x * axis.x + corner.y * axis.y;
    if (projection < min) min = projection;
    if (projection > max) max = projection;
  }
  return { min, max };
}

function axesFromCorners(corners: readonly Point[]): Point[] {
  const axes: Point[] = [];
  for (let index = 0; index < corners.length; index += 1) {
    const current = corners[index];
    const next = corners[(index + 1) % corners.length];
    if (!current || !next) continue;
    const edgeX = next.x - current.x;
    const edgeY = next.y - current.y;
    const length = Math.hypot(edgeX, edgeY);
    if (length < 1e-9) continue;
    axes.push({ x: -edgeY / length, y: edgeX / length });
  }
  return axes;
}

function intervalsOverlap(
  left: { min: number; max: number },
  right: { min: number; max: number },
): boolean {
  return left.max >= right.min && right.max >= left.min;
}

export function aabbsOverlap(a: PlacedFurniture, b: PlacedFurniture): boolean {
  const cornersA = furnitureCorners(a);
  const cornersB = furnitureCorners(b);
  const axes = [...axesFromCorners(cornersA), ...axesFromCorners(cornersB)];

  for (const axis of axes) {
    const projectionA = projectOntoAxis(cornersA, axis);
    const projectionB = projectOntoAxis(cornersB, axis);
    if (!intervalsOverlap(projectionA, projectionB)) {
      return false;
    }
  }
  return true;
}

export function detectFurnitureOverlaps(
  furniture: readonly PlacedFurniture[],
): ValidationIssue[] {
  const orderedFurniture = [...furniture].sort((a, b) =>
    a.id === b.id ? 0 : a.id < b.id ? -1 : 1,
  );
  const issues: ValidationIssue[] = [];
  const seenPairs = new Set<string>();

  for (let firstIndex = 0; firstIndex < orderedFurniture.length; firstIndex += 1) {
    const first = orderedFurniture[firstIndex];
    if (!first) continue;

    for (let secondIndex = firstIndex + 1; secondIndex < orderedFurniture.length; secondIndex += 1) {
      const second = orderedFurniture[secondIndex];
      if (!second || first.id === second.id || !aabbsOverlap(first, second)) continue;

      const pairKey = `${first.id}\u0000${second.id}`;
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      issues.push({
        id: `furniture-overlap:${first.id}:${second.id}`,
        rule: "furniture-overlap",
        ruleId: "furniture-overlap",
        severity: "error",
        objectIds: [first.id, second.id],
        message: `Furniture items "${first.id}" and "${second.id}" overlap.`,
        remedy: `Move "${second.id}" away from "${first.id}" to clear the overlap.`,
        focusMm: {
          x: (first.xMm + second.xMm) / 2,
          y: (first.yMm + second.yMm) / 2,
        },
      });
    }
  }

  return issues;
}
