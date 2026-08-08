/**
 * Opening clearance — furniture must not block door/window free space.
 */
import { aabbsOverlap } from "./furnitureOverlap";
import type {
  PlacedFurniture,
  ValidationIssue,
  ValidationOpening,
  ValidationWall,
} from "./types";

export const DEFAULT_OPENING_CLEARANCE_MM = 900;

export function openingClearanceAsPlaced(
  opening: ValidationOpening,
  wall: ValidationWall,
  clearanceMm: number = DEFAULT_OPENING_CLEARANCE_MM,
): PlacedFurniture | null {
  if (clearanceMm <= 0 || opening.width <= 0) return null;
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) return null;
  if (opening.position < 0 || opening.position > 1) return null;

  const cx = wall.start.x + dx * opening.position;
  const cy = wall.start.y + dy * opening.position;

  return {
    id: opening.id,
    xMm: cx,
    yMm: cy,
    widthMm: opening.width,
    depthMm: wall.thickness + 2 * clearanceMm,
    rotationDeg: (Math.atan2(dy, dx) * 180) / Math.PI,
  };
}

export function detectOpeningClearanceConflicts(
  furniture: readonly PlacedFurniture[],
  walls: readonly ValidationWall[],
  doors: readonly ValidationOpening[],
  windows: readonly ValidationOpening[],
  clearanceMm: number = DEFAULT_OPENING_CLEARANCE_MM,
): ValidationIssue[] {
  if (furniture.length === 0) return [];
  const openings = [...doors, ...windows].sort((a, b) =>
    a.id === b.id ? 0 : a.id < b.id ? -1 : 1,
  );
  if (openings.length === 0) return [];

  const wallById = new Map(walls.map((wall) => [wall.id, wall]));
  const orderedFurniture = [...furniture].sort((a, b) =>
    a.id === b.id ? 0 : a.id < b.id ? -1 : 1,
  );
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();

  for (const opening of openings) {
    const wall = wallById.get(opening.wallId);
    if (!wall) continue;
    const zone = openingClearanceAsPlaced(opening, wall, clearanceMm);
    if (!zone) continue;

    for (const item of orderedFurniture) {
      if (!aabbsOverlap(item, zone)) continue;
      const key = `${item.id}\u0000${opening.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      issues.push({
        id: `opening-obstruction:${item.id}:${opening.id}`,
        rule: "opening-obstruction",
        ruleId: "opening-obstruction",
        severity: "warning",
        objectIds: [item.id, opening.id],
        message: `Furniture "${item.id}" blocks ${opening.kind} "${opening.id}".`,
        remedy: `Keep clearance in front of ${opening.kind} "${opening.id}".`,
        focusMm: { x: item.xMm, y: item.yMm },
      });
    }
  }

  return issues;
}
