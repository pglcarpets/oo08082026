/**
 * Pure helpers for wall endpoint grips (transient UI).
 */

export type Point2D = { x: number; y: number };

export type WallGripEndpoint = "start" | "end";

export type WallForGrips = {
  id: string;
  start: Point2D;
  end: Point2D;
};

export const WALL_GRIP_KIND = "wall-grip" as const;
export const WALL_GRIP_RADIUS_PX = 7;

export type WallGripMeta = {
  wallId: string;
  endpoint: WallGripEndpoint;
};

/** Screen-space centres for start/end grips of a wall centreline (identity transform). */
export function wallEndpointGripPoints(wall: WallForGrips): {
  start: Point2D;
  end: Point2D;
} {
  return {
    start: { x: wall.start.x, y: wall.start.y },
    end: { x: wall.end.x, y: wall.end.y },
  };
}

export function wallGripAnchorPoint(
  wall: WallForGrips,
  endpoint: WallGripEndpoint,
): Point2D {
  return endpoint === "start" ? { ...wall.end } : { ...wall.start };
}

export function wallEndpointsAfterGripMove(
  wall: WallForGrips,
  endpoint: WallGripEndpoint,
  newPoint: Point2D,
): { start: Point2D; end: Point2D } {
  if (endpoint === "start") {
    return { start: { ...newPoint }, end: { ...wall.end } };
  }
  return { start: { ...wall.start }, end: { ...newPoint } };
}

export function resolveWallForEndpointGrips(
  walls: ReadonlyArray<WallForGrips>,
  selectedWallId: string | null | undefined,
): WallForGrips | null {
  if (!selectedWallId) return null;
  return walls.find((w) => w.id === selectedWallId) ?? null;
}

export function isWallGripData(data: unknown): data is WallGripMeta & { kind: typeof WALL_GRIP_KIND } {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    d.kind === WALL_GRIP_KIND &&
    typeof d.wallId === "string" &&
    (d.endpoint === "start" || d.endpoint === "end")
  );
}
