/**
 * Fabric object → plan-mm geometry bridge (pure).
 * Positions use min-edge (top-left) convention for rects; walls use centreline endpoints.
 */

export type PlannerMmRect = {
  id: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  depthMm: number;
  rotationDeg: number;
  catalogId?: string;
  label?: string;
};

export type PlannerMmWall = {
  id: string;
  x1Mm: number;
  y1Mm: number;
  x2Mm: number;
  y2Mm: number;
  thicknessMm: number;
};

export type PlannerMmOpening = {
  id: string;
  kind: "door" | "window";
  xMm: number;
  yMm: number;
  widthMm: number;
  depthMm: number;
  rotationDeg: number;
  wallId?: string;
  position?: number;
};

export type PlannerSceneGeometry = {
  furniture: PlannerMmRect[];
  walls: PlannerMmWall[];
  doors: PlannerMmOpening[];
  windows: PlannerMmOpening[];
};

/** Duck-typed Fabric-like object — no fabric import required. */
export type FabricLikeObject = {
  left?: number | null;
  top?: number | null;
  width?: number | null;
  height?: number | null;
  scaleX?: number | null;
  scaleY?: number | null;
  angle?: number | null;
  strokeWidth?: number | null;
  x1?: number | null;
  y1?: number | null;
  x2?: number | null;
  y2?: number | null;
  data?: {
    id?: unknown;
    kind?: unknown;
    label?: unknown;
    furniture_id?: unknown;
    wallId?: unknown;
    position?: unknown;
    dimensions?: { width_mm?: number; depth_mm?: number };
    [key: string]: unknown;
  } | null;
};

export type FabricLikeCanvas = {
  getObjects?: () => FabricLikeObject[];
  objects?: FabricLikeObject[];
};

function finite(n: unknown, fallback = 0): number {
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function objectId(obj: FabricLikeObject, fallback: string): string {
  const id = obj.data?.id;
  return typeof id === "string" && id.trim() ? id : fallback;
}

function scaledSize(obj: FabricLikeObject): { w: number; h: number } {
  const w = finite(obj.width) * finite(obj.scaleX, 1);
  const h = finite(obj.height) * finite(obj.scaleY, 1);
  return { w: Math.abs(w), h: Math.abs(h) };
}

/** px → mm using scale_px_per_mm (px per mm). */
export function pxToMm(px: number, scalePxPerMm: number): number {
  if (!scalePxPerMm || scalePxPerMm <= 0) return 0;
  return px / scalePxPerMm;
}

export function mmToPx(mm: number, scalePxPerMm: number): number {
  return mm * scalePxPerMm;
}

export function furnitureFromFabric(
  obj: FabricLikeObject,
  scalePxPerMm: number,
): PlannerMmRect | null {
  if (obj.data?.kind !== "furniture") return null;
  const { w, h } = scaledSize(obj);
  const dimW = obj.data.dimensions?.width_mm;
  const dimD = obj.data.dimensions?.depth_mm;
  const widthMm =
    typeof dimW === "number" && dimW > 0 ? dimW : pxToMm(w, scalePxPerMm);
  const depthMm =
    typeof dimD === "number" && dimD > 0 ? dimD : pxToMm(h, scalePxPerMm);
  const catalogId =
    typeof obj.data.furniture_id === "string" ? obj.data.furniture_id : undefined;
  const label = typeof obj.data.label === "string" ? obj.data.label : undefined;
  return {
    id: objectId(obj, catalogId || "furniture"),
    xMm: pxToMm(finite(obj.left), scalePxPerMm),
    yMm: pxToMm(finite(obj.top), scalePxPerMm),
    widthMm,
    depthMm,
    rotationDeg: finite(obj.angle),
    catalogId,
    label,
  };
}

export function wallFromFabric(
  obj: FabricLikeObject,
  scalePxPerMm: number,
): PlannerMmWall | null {
  if (obj.data?.kind !== "wall") return null;
  const x1 = obj.x1;
  const y1 = obj.y1;
  const x2 = obj.x2;
  const y2 = obj.y2;
  if (
    typeof x1 !== "number" ||
    typeof y1 !== "number" ||
    typeof x2 !== "number" ||
    typeof y2 !== "number"
  ) {
    // Fallback: rect-like wall
    const { w, h } = scaledSize(obj);
    const left = finite(obj.left);
    const top = finite(obj.top);
    return {
      id: objectId(obj, "wall"),
      x1Mm: pxToMm(left, scalePxPerMm),
      y1Mm: pxToMm(top, scalePxPerMm),
      x2Mm: pxToMm(left + w, scalePxPerMm),
      y2Mm: pxToMm(top + h, scalePxPerMm),
      thicknessMm: Math.max(1, pxToMm(finite(obj.strokeWidth, 1), scalePxPerMm)),
    };
  }
  return {
    id: objectId(obj, "wall"),
    x1Mm: pxToMm(x1, scalePxPerMm),
    y1Mm: pxToMm(y1, scalePxPerMm),
    x2Mm: pxToMm(x2, scalePxPerMm),
    y2Mm: pxToMm(y2, scalePxPerMm),
    thicknessMm: Math.max(1, pxToMm(finite(obj.strokeWidth, 1), scalePxPerMm)),
  };
}

function openingFromFabric(
  obj: FabricLikeObject,
  scalePxPerMm: number,
  kind: "door" | "window",
): PlannerMmOpening | null {
  if (obj.data?.kind !== kind) return null;
  const { w, h } = scaledSize(obj);
  const wallId = typeof obj.data.wallId === "string" ? obj.data.wallId : undefined;
  const position =
    typeof obj.data.position === "number" && Number.isFinite(obj.data.position)
      ? obj.data.position
      : undefined;
  return {
    id: objectId(obj, kind),
    kind,
    xMm: pxToMm(finite(obj.left), scalePxPerMm),
    yMm: pxToMm(finite(obj.top), scalePxPerMm),
    widthMm: pxToMm(w, scalePxPerMm),
    depthMm: pxToMm(h, scalePxPerMm),
    rotationDeg: finite(obj.angle),
    wallId,
    position,
  };
}

export function collectSceneGeometry(
  canvas: FabricLikeCanvas | FabricLikeObject[] | null | undefined,
  scalePxPerMm: number,
): PlannerSceneGeometry {
  const objects: FabricLikeObject[] = Array.isArray(canvas)
    ? canvas
    : canvas?.getObjects?.() ?? canvas?.objects ?? [];

  const furniture: PlannerMmRect[] = [];
  const walls: PlannerMmWall[] = [];
  const doors: PlannerMmOpening[] = [];
  const windows: PlannerMmOpening[] = [];

  objects.forEach((obj, index) => {
    if (obj.data?.isGridLine || obj.data?.isSheet || obj.data?.isGuide || obj.data?.isPreview) {
      return;
    }
    const f = furnitureFromFabric(obj, scalePxPerMm);
    if (f) {
      if (!f.id || f.id === "furniture") f.id = `furniture_${index}`;
      furniture.push(f);
      return;
    }
    const w = wallFromFabric(obj, scalePxPerMm);
    if (w) {
      if (!w.id || w.id === "wall") w.id = `wall_${index}`;
      walls.push(w);
      return;
    }
    const d = openingFromFabric(obj, scalePxPerMm, "door");
    if (d) {
      if (!d.id || d.id === "door") d.id = `door_${index}`;
      doors.push(d);
      return;
    }
    const win = openingFromFabric(obj, scalePxPerMm, "window");
    if (win) {
      if (!win.id || win.id === "window") win.id = `window_${index}`;
      windows.push(win);
    }
  });

  return { furniture, walls, doors, windows };
}

/** Convert top-left furniture rect to center-origin for SAT validation. */
export function furnitureToCenterOrigin(rect: PlannerMmRect): {
  id: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  depthMm: number;
  rotationDeg: number;
} {
  return {
    id: rect.id,
    xMm: rect.xMm + rect.widthMm / 2,
    yMm: rect.yMm + rect.depthMm / 2,
    widthMm: rect.widthMm,
    depthMm: rect.depthMm,
    rotationDeg: rect.rotationDeg,
  };
}
