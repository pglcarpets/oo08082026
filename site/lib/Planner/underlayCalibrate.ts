/**
 * Underlay scale calibration pure helpers.
 * Two plan points + known real-world distance → mm per image pixel.
 */

export type UnderlayPoint = { x: number; y: number };

export const UNDERLAY_KNOWN_WIDTH_5M_MM = 5_000;
export const UNDERLAY_KNOWN_WIDTH_10M_MM = 10_000;
export const DEFAULT_ASSUMED_ROOM_WIDTH_MM = UNDERLAY_KNOWN_WIDTH_10M_MM;

export type UnderlayCalibratePickSession =
  | { phase: "pick-a"; knownLengthMm: number }
  | { phase: "pick-b"; knownLengthMm: number; pointA: UnderlayPoint };

export type UnderlayCalibratePickResult =
  | { kind: "need-second"; session: Extract<UnderlayCalibratePickSession, { phase: "pick-b" }> }
  | {
      kind: "complete";
      pointA: UnderlayPoint;
      pointB: UnderlayPoint;
      knownLengthMm: number;
      mmPerPx: number;
    };

export function startUnderlayPick(knownLengthMm: number): UnderlayCalibratePickSession {
  return { phase: "pick-a", knownLengthMm };
}

export function completeUnderlayPick(
  session: UnderlayCalibratePickSession,
  point: UnderlayPoint,
): UnderlayCalibratePickResult {
  if (session.phase === "pick-a") {
    return {
      kind: "need-second",
      session: { phase: "pick-b", knownLengthMm: session.knownLengthMm, pointA: point },
    };
  }
  const dx = point.x - session.pointA.x;
  const dy = point.y - session.pointA.y;
  const pxDist = Math.hypot(dx, dy);
  const mmPerPx = pxDist > 0 ? session.knownLengthMm / pxDist : 0;
  return {
    kind: "complete",
    pointA: session.pointA,
    pointB: point,
    knownLengthMm: session.knownLengthMm,
    mmPerPx,
  };
}

export function scaleFactorFromKnownWidth(input: {
  imageWidthPx: number;
  knownWidthMm: number;
}): number {
  if (input.imageWidthPx <= 0) return 0;
  return input.knownWidthMm / input.imageWidthPx;
}

export function isSupportedFloorPlanImage(file: Pick<File, "type" | "name">): boolean {
  const mime = (file.type || "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  const name = file.name.toLowerCase();
  return /\.(png|jpe?g|webp|gif|bmp|avif|tif{1,2})$/i.test(name);
}
