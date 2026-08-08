/**
 * Outside-room rule — sheet AABB when no wall polygons; optional room polygons.
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

function pointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i];
    const pj = polygon[j];
    if (!pi || !pj) continue;
    const intersect =
      pi.y > point.y !== pj.y > point.y &&
      point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y + 1e-12) + pi.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Sheet as a simple room polygon (top-left origin plan). */
export function sheetAsRoomPolygon(sheet: {
  widthMm: number;
  depthMm: number;
}): Point[] {
  return [
    { x: 0, y: 0 },
    { x: sheet.widthMm, y: 0 },
    { x: sheet.widthMm, y: sheet.depthMm },
    { x: 0, y: sheet.depthMm },
  ];
}

export function detectFurnitureOutsideRoom(
  furniture: readonly PlacedFurniture[],
  roomPolygons: readonly Point[][],
): ValidationIssue[] {
  if (roomPolygons.length === 0 || furniture.length === 0) return [];

  const issues: ValidationIssue[] = [];
  const ordered = [...furniture].sort((a, b) =>
    a.id === b.id ? 0 : a.id < b.id ? -1 : 1,
  );

  for (const item of ordered) {
    const centre = { x: item.xMm, y: item.yMm };
    const centreInside = roomPolygons.some(
      (poly) => poly.length >= 3 && pointInPolygon(centre, poly),
    );
    if (!centreInside) {
      issues.push({
        id: `room-boundary:${item.id}:outside`,
        rule: "room-boundary",
        ruleId: "room-boundary",
        severity: "error",
        objectIds: [item.id],
        message: `Furniture "${item.id}" is outside the room boundary.`,
        remedy: `Move "${item.id}" inside the room.`,
        focusMm: centre,
      });
      continue;
    }

    const corners = furnitureCorners(item);
    const cornerOutside = corners.some(
      (c) => !roomPolygons.some((poly) => poly.length >= 3 && pointInPolygon(c, poly)),
    );
    if (cornerOutside) {
      issues.push({
        id: `room-boundary:${item.id}:overhang`,
        rule: "room-boundary",
        ruleId: "room-boundary",
        severity: "warning",
        objectIds: [item.id],
        message: `Furniture "${item.id}" partially overhangs the room boundary.`,
        remedy: `Shift "${item.id}" fully inside the room.`,
        focusMm: centre,
      });
    }
  }

  return issues;
}
