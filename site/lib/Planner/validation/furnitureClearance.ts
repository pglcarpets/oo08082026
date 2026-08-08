/**
 * Aisle clearance rule — edge-to-edge gap between non-overlapping furniture.
 */
import type { PlacedFurniture, ValidationIssue } from "./types";

export const DEFAULT_AISLE_CLEARANCE_MM = 900;

type Point = { x: number; y: number };
type Aabb = { minX: number; minY: number; maxX: number; maxY: number };

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

function footprintAabb(item: PlacedFurniture): Aabb {
  const corners = furnitureCorners(item);
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const corner of corners) {
    if (corner.x < minX) minX = corner.x;
    if (corner.y < minY) minY = corner.y;
    if (corner.x > maxX) maxX = corner.x;
    if (corner.y > maxY) maxY = corner.y;
  }
  return { minX, minY, maxX, maxY };
}

export function aabbEdgeGapMm(a: Aabb, b: Aabb): number {
  const gapX = Math.max(0, Math.max(b.minX - a.maxX, a.minX - b.maxX));
  const gapY = Math.max(0, Math.max(b.minY - a.maxY, a.minY - b.maxY));
  if (gapX === 0 && gapY === 0) return 0;
  if (gapX === 0) return gapY;
  if (gapY === 0) return gapX;
  return Math.hypot(gapX, gapY);
}

export function detectFurnitureClearance(
  furniture: readonly PlacedFurniture[],
  minClearanceMm: number = DEFAULT_AISLE_CLEARANCE_MM,
): ValidationIssue[] {
  if (furniture.length < 2 || minClearanceMm <= 0) return [];

  const ordered = [...furniture].sort((a, b) =>
    a.id === b.id ? 0 : a.id < b.id ? -1 : 1,
  );
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < ordered.length; i += 1) {
    const first = ordered[i];
    if (!first) continue;
    const aabbA = footprintAabb(first);

    for (let j = i + 1; j < ordered.length; j += 1) {
      const second = ordered[j];
      if (!second || first.id === second.id) continue;

      const gap = aabbEdgeGapMm(aabbA, footprintAabb(second));
      if (gap <= 0) continue;
      if (gap >= minClearanceMm) continue;

      const pairKey = `${first.id}\u0000${second.id}`;
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);

      issues.push({
        id: `aisle-clearance:${first.id}:${second.id}`,
        rule: "aisle-clearance",
        ruleId: "aisle-clearance",
        severity: "warning",
        objectIds: [first.id, second.id],
        message: `Clearance between "${first.id}" and "${second.id}" is ${Math.round(gap)} mm (min ${minClearanceMm} mm).`,
        remedy: `Increase spacing between "${first.id}" and "${second.id}" to at least ${minClearanceMm} mm.`,
        focusMm: {
          x: (first.xMm + second.xMm) / 2,
          y: (first.yMm + second.yMm) / 2,
        },
      });
    }
  }

  return issues;
}
