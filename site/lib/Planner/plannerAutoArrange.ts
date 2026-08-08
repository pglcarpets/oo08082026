"use client";
import type {
  ArrangeObstacle,
  ArrangePlacement,
  AutoArrangeOptions,
  AutoArrangeResult,
  FurnitureItem,
  PlannerSheet,
} from "@planner/lib/plannerTypes";
import {
  DEFAULT_ARRANGE_GAP_MM,
  DEFAULT_ARRANGE_MARGIN_MM,
} from "@planner/lib/plannerPalette";

type Rect = { x: number; y: number; w: number; h: number };

const rectsOverlap = (a: Rect, b: Rect): boolean => (
  a.x < b.x + b.w &&
  a.x + a.w > b.x &&
  a.y < b.y + b.h &&
  a.y + a.h > b.y
);

export const autoArrange = (
  items: FurnitureItem[],
  room: Pick<PlannerSheet, "width_mm" | "height_mm">,
  options: AutoArrangeOptions = {},
): AutoArrangeResult => {
  const gap = options.gap_mm ?? DEFAULT_ARRANGE_GAP_MM;
  const margin = options.margin_mm ?? DEFAULT_ARRANGE_MARGIN_MM;
  const sort = options.sort ?? "depth";
  const obstacles = Array.isArray(options.obstacles) ? options.obstacles : [];

  const expanded: FurnitureItem[] = [];
  for (const it of items) {
    const n = Math.max(1, Math.floor(it.count || 1));
    for (let i = 0; i < n; i++) expanded.push({ ...it });
  }

  const key = (a: FurnitureItem): number => {
    const d = a.dimensions;
    if (sort === "area") return -(d.width_mm * d.depth_mm);
    if (sort === "width") return -d.width_mm;
    if (sort === "none") return 0;
    return -d.depth_mm;
  };
  expanded.sort((a, b) => key(a) - key(b));

  const bounds = {
    x0: margin,
    y0: margin,
    x1: room.width_mm - margin,
    y1: room.height_mm - margin,
  };
  const usableW = bounds.x1 - bounds.x0;
  const usableH = bounds.y1 - bounds.y0;

  const paddedObstacles: Array<Rect & { kind: string }> = obstacles
    .filter((o): o is ArrangeObstacle => o !== null && o !== undefined && Number.isFinite(o.x_mm) && Number.isFinite(o.y_mm))
    .map((o) => ({
      x: o.x_mm - gap,
      y: o.y_mm - gap,
      w: Math.max(1, (o.width_mm || 0) + gap * 2),
      h: Math.max(1, (o.depth_mm || 0) + gap * 2),
      kind: o.kind || "obstacle",
    }));

  const placements: ArrangePlacement[] = [];
  const overflow: AutoArrangeResult["overflow"] = [];
  const candidates: Array<{ x: number; y: number }> = [{ x: bounds.x0, y: bounds.y0 }];

  const fitsAt = (x: number, y: number, w: number, d: number): boolean => {
    if (x < bounds.x0 || y < bounds.y0) return false;
    if (x + w > bounds.x1 || y + d > bounds.y1) return false;
    const rect: Rect = { x, y, w, h: d };
    for (const p of placements) {
      const pr: Rect = { x: p.x_mm - gap / 2, y: p.y_mm - gap / 2, w: p.width_mm + gap, h: p.depth_mm + gap };
      if (rectsOverlap(rect, pr)) return false;
    }
    for (const ob of paddedObstacles) {
      if (rectsOverlap(rect, ob)) return false;
    }
    return true;
  };

  const tryPlace = (w: number, d: number): { x: number; y: number } | null => {
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (fitsAt(c.x, c.y, w, d)) {
        candidates.splice(i, 1);
        return c;
      }
    }
    const step = Math.max(50, Math.min(200, Math.round(gap / 3) || 100));
    for (let y = bounds.y0; y + d <= bounds.y1; y += step) {
      for (let x = bounds.x0; x + w <= bounds.x1; x += step) {
        if (fitsAt(x, y, w, d)) return { x, y };
      }
    }
    return null;
  };

  for (const it of expanded) {
    let w = it.dimensions.width_mm;
    let d = it.dimensions.depth_mm;
    let rotation = 0;

    if ((w > usableW && d <= usableW) || (d > usableH && w <= usableH)) {
      [w, d] = [d, w];
      rotation = 90;
    }
    if (w > usableW || d > usableH) {
      overflow.push({ ...it, reason: "too_large" });
      continue;
    }

    let pos = tryPlace(w, d);
    if (!pos) {
      const rw = d;
      const rd = w;
      if (rw <= usableW && rd <= usableH) {
        pos = tryPlace(rw, rd);
        if (pos) {
          w = rw;
          d = rd;
          rotation = rotation === 90 ? 0 : 90;
        }
      }
    }
    if (!pos) {
      overflow.push({ ...it, reason: "no_space" });
      continue;
    }

    placements.push({
      item: it,
      x_mm: pos.x,
      y_mm: pos.y,
      width_mm: w,
      depth_mm: d,
      rotation_deg: rotation,
    });
    candidates.push({ x: pos.x + w + gap, y: pos.y });
    candidates.push({ x: pos.x, y: pos.y + d + gap });
    for (let i = candidates.length - 1; i >= 0; i--) {
      const c = candidates[i];
      if (c.x >= bounds.x1 || c.y >= bounds.y1) candidates.splice(i, 1);
    }
  }

  const roomArea = room.width_mm * room.height_mm;
  const usedArea = placements.reduce((acc, p) => acc + p.width_mm * p.depth_mm, 0);
  return { placements, overflow, usage: roomArea > 0 ? usedArea / roomArea : 0 };
};
