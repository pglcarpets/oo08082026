/**
 * Project a click onto the nearest wall centreline for door/window placement.
 */

import type { PlannerMmWall } from "@planner/lib/fabricGeometryBridge";

export const DEFAULT_DOOR_WIDTH_MM = 900;
export const DEFAULT_WINDOW_WIDTH_MM = 1200;
export const OPENING_END_MARGIN_MM = 80;
export const OPENING_PICK_SLACK_MM = 80;

export type OpeningPlacementRejectReason =
  | "off-wall"
  | "wall-end"
  | "wall-too-short"
  | "no-walls";

export type ResolvedOpeningPlacement = {
  wallId: string;
  /** Normalized centre along host wall (0–1). */
  position: number;
  angleRadians: number;
  xMm: number;
  yMm: number;
  widthMm: number;
};

export type OpeningPlacementResult =
  | ResolvedOpeningPlacement
  | { rejected: true; reason: OpeningPlacementRejectReason };

function wallLengthMm(wall: PlannerMmWall): number {
  return Math.hypot(wall.x2Mm - wall.x1Mm, wall.y2Mm - wall.y1Mm);
}

function projectOntoWall(
  point: { x: number; y: number },
  wall: PlannerMmWall,
): { t: number; along: number; distance: number; x: number; y: number } {
  const dx = wall.x2Mm - wall.x1Mm;
  const dy = wall.y2Mm - wall.y1Mm;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) {
    return {
      t: 0,
      along: 0,
      distance: Math.hypot(point.x - wall.x1Mm, point.y - wall.y1Mm),
      x: wall.x1Mm,
      y: wall.y1Mm,
    };
  }
  const raw =
    ((point.x - wall.x1Mm) * dx + (point.y - wall.y1Mm) * dy) / lengthSq;
  const t = Math.max(0, Math.min(1, raw));
  const x = wall.x1Mm + dx * t;
  const y = wall.y1Mm + dy * t;
  return {
    t,
    along: t * Math.sqrt(lengthSq),
    distance: Math.hypot(point.x - x, point.y - y),
    x,
    y,
  };
}

export function wallOpeningPickToleranceMm(wall: PlannerMmWall): number {
  const thickness = wall.thicknessMm > 0 ? wall.thicknessMm : 150;
  return thickness / 2 + OPENING_PICK_SLACK_MM;
}

export function clampOpeningCenterAlongMm(
  wallLengthUnits: number,
  alongMm: number,
  openingWidthMm: number,
  endMarginMm = OPENING_END_MARGIN_MM,
): number {
  const half = openingWidthMm / 2;
  const min = half + endMarginMm;
  const max = wallLengthUnits - half - endMarginMm;
  if (min > max) return wallLengthUnits / 2;
  return Math.max(min, Math.min(max, alongMm));
}

/**
 * Place a door/window centre on the nearest wall within pick tolerance.
 */
export function placeOpeningOnNearestWall(input: {
  pointMm: { x: number; y: number };
  walls: readonly PlannerMmWall[];
  openingWidthMm: number;
}): OpeningPlacementResult {
  const { pointMm, walls, openingWidthMm } = input;
  if (walls.length === 0) return { rejected: true, reason: "no-walls" };

  let best: {
    wall: PlannerMmWall;
    proj: ReturnType<typeof projectOntoWall>;
  } | null = null;

  for (const wall of walls) {
    const proj = projectOntoWall(pointMm, wall);
    const tol = wallOpeningPickToleranceMm(wall);
    if (proj.distance > tol) continue;
    if (!best || proj.distance < best.proj.distance) {
      best = { wall, proj };
    }
  }

  if (!best) return { rejected: true, reason: "off-wall" };

  const length = wallLengthMm(best.wall);
  if (length < openingWidthMm + 2 * OPENING_END_MARGIN_MM) {
    return { rejected: true, reason: "wall-too-short" };
  }

  const along = clampOpeningCenterAlongMm(length, best.proj.along, openingWidthMm);
  const t = length > 0 ? along / length : 0.5;
  if (t <= 0.02 || t >= 0.98) {
    return { rejected: true, reason: "wall-end" };
  }

  const dx = best.wall.x2Mm - best.wall.x1Mm;
  const dy = best.wall.y2Mm - best.wall.y1Mm;
  const x = best.wall.x1Mm + dx * t;
  const y = best.wall.y1Mm + dy * t;

  return {
    wallId: best.wall.id,
    position: t,
    angleRadians: Math.atan2(dy, dx),
    xMm: x,
    yMm: y,
    widthMm: openingWidthMm,
  };
}
