/**
 * Advanced snap: grid, wall corners/midpoints/centerline samples, furniture edges.
 * Pure mm-space helpers for the Fabric planner fork.
 */

import type { PlannerMmRect, PlannerMmWall } from "@planner/lib/fabricGeometryBridge";

export type SnapType = "grid" | "corner" | "centerline" | "edge" | "midpoint";

export type SnapResult = {
  xMm: number;
  yMm: number;
  active: boolean;
  type?: SnapType;
  sourceId?: string;
  distanceMm: number;
};

export type SnapPointInput = {
  xMm: number;
  yMm: number;
  walls: readonly PlannerMmWall[];
  furniture: readonly PlannerMmRect[];
  gridMm: number;
  thresholdMm: number;
  /** Prefer geometry over grid when both within threshold (default true). */
  preferGeometry?: boolean;
};

type Candidate = {
  xMm: number;
  yMm: number;
  type: SnapType;
  sourceId?: string;
  distanceMm: number;
  priority: number; // lower = better when distances equal
};

const GEOMETRY_PRIORITY: Record<SnapType, number> = {
  corner: 0,
  midpoint: 1,
  centerline: 2,
  edge: 3,
  grid: 4,
};

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

function closestOnSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { x: number; y: number; t: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-12) return { x: x1, y: y1, t: 0 };
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return { x: x1 + dx * t, y: y1 + dy * t, t };
}

function collectGeometryCandidates(
  xMm: number,
  yMm: number,
  walls: readonly PlannerMmWall[],
  furniture: readonly PlannerMmRect[],
  thresholdMm: number,
): Candidate[] {
  const out: Candidate[] = [];

  for (const wall of walls) {
    const corners = [
      { x: wall.x1Mm, y: wall.y1Mm, type: "corner" as const },
      { x: wall.x2Mm, y: wall.y2Mm, type: "corner" as const },
      {
        x: (wall.x1Mm + wall.x2Mm) / 2,
        y: (wall.y1Mm + wall.y2Mm) / 2,
        type: "midpoint" as const,
      },
    ];
    for (const c of corners) {
      const d = dist(xMm, yMm, c.x, c.y);
      if (d <= thresholdMm) {
        out.push({
          xMm: c.x,
          yMm: c.y,
          type: c.type,
          sourceId: wall.id,
          distanceMm: d,
          priority: GEOMETRY_PRIORITY[c.type],
        });
      }
    }
    const onSeg = closestOnSegment(xMm, yMm, wall.x1Mm, wall.y1Mm, wall.x2Mm, wall.y2Mm);
    const dSeg = dist(xMm, yMm, onSeg.x, onSeg.y);
    // Near midpoints, the midpoint candidate already covers the segment; skip
    // centerline so mid-snap can win over a pure projection.
    const nearMid = onSeg.t > 0.45 && onSeg.t < 0.55;
    if (dSeg <= thresholdMm && onSeg.t > 0.02 && onSeg.t < 0.98 && !nearMid) {
      out.push({
        xMm: onSeg.x,
        yMm: onSeg.y,
        type: "centerline",
        sourceId: wall.id,
        distanceMm: dSeg,
        priority: GEOMETRY_PRIORITY.centerline,
      });
    }
  }

  for (const item of furniture) {
    const edges = [
      { x: item.xMm, y: item.yMm },
      { x: item.xMm + item.widthMm, y: item.yMm },
      { x: item.xMm, y: item.yMm + item.depthMm },
      { x: item.xMm + item.widthMm, y: item.yMm + item.depthMm },
      { x: item.xMm + item.widthMm / 2, y: item.yMm },
      { x: item.xMm + item.widthMm / 2, y: item.yMm + item.depthMm },
      { x: item.xMm, y: item.yMm + item.depthMm / 2 },
      { x: item.xMm + item.widthMm, y: item.yMm + item.depthMm / 2 },
    ];
    for (const e of edges) {
      const d = dist(xMm, yMm, e.x, e.y);
      if (d <= thresholdMm) {
        out.push({
          xMm: e.x,
          yMm: e.y,
          type: "edge",
          sourceId: item.id,
          distanceMm: d,
          priority: GEOMETRY_PRIORITY.edge,
        });
      }
    }
  }

  return out;
}

/** Candidate ranking — geometry preferred over grid when both within threshold. */
export function compareSnapCandidates(
  a: Pick<Candidate, "type" | "distanceMm" | "priority">,
  b: Pick<Candidate, "type" | "distanceMm" | "priority">,
  thr: number,
  preferGeometry: boolean,
): number {
  if (preferGeometry) {
    const aGeo = a.type !== "grid";
    const bGeo = b.type !== "grid";
    if (aGeo !== bGeo && a.distanceMm <= thr && b.distanceMm <= thr) {
      return aGeo ? -1 : 1;
    }
  }
  if (a.distanceMm !== b.distanceMm) return a.distanceMm - b.distanceMm;
  return a.priority - b.priority;
}

/**
 * Snap a plan-mm point to the nearest grid or geometry feature within threshold.
 */
export function snapPoint(input: SnapPointInput): SnapResult {
  const {
    xMm,
    yMm,
    walls,
    furniture,
    gridMm,
    thresholdMm,
    preferGeometry = true,
  } = input;

  const thr = thresholdMm > 0 ? thresholdMm : 0;
  const candidates: Candidate[] = [];

  if (gridMm > 0) {
    const gx = Math.round(xMm / gridMm) * gridMm;
    const gy = Math.round(yMm / gridMm) * gridMm;
    const d = dist(xMm, yMm, gx, gy);
    if (d <= thr || thr === 0) {
      // Always consider grid; if thr===0 only exact matches (d===0)
      if (thr === 0 ? d < 1e-9 : d <= thr) {
        candidates.push({
          xMm: gx,
          yMm: gy,
          type: "grid",
          distanceMm: d,
          priority: GEOMETRY_PRIORITY.grid,
        });
      }
    }
  }

  if (thr > 0) {
    candidates.push(
      ...collectGeometryCandidates(xMm, yMm, walls, furniture, thr),
    );
  }

  if (candidates.length === 0) {
    return { xMm, yMm, active: false, distanceMm: 0 };
  }

  candidates.sort((a, b) => compareSnapCandidates(a, b, thr, preferGeometry));

  const best = candidates[0]!;

  return {
    xMm: best.xMm,
    yMm: best.yMm,
    active: true,
    type: best.type,
    sourceId: best.sourceId,
    distanceMm: best.distanceMm,
  };
}
