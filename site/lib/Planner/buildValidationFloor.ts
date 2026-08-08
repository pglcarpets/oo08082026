/**
 * Build ValidationFloor from Fabric scene + sheet (pure).
 */
import {
  collectSceneGeometry,
  furnitureToCenterOrigin,
  type FabricLikeCanvas,
  type FabricLikeObject,
} from "@planner/lib/fabricGeometryBridge";
import type { ValidationFloor } from "@planner/lib/validation/types";

export function buildValidationFloorFromCanvas(
  canvas: FabricLikeCanvas | FabricLikeObject[] | null | undefined,
  scalePxPerMm: number,
  sheet: { width_mm: number; height_mm: number },
): ValidationFloor {
  const scene = collectSceneGeometry(canvas, scalePxPerMm);
  return {
    sheet: { widthMm: sheet.width_mm, depthMm: sheet.height_mm },
    walls: scene.walls.map((w) => ({
      id: w.id,
      start: { x: w.x1Mm, y: w.y1Mm },
      end: { x: w.x2Mm, y: w.y2Mm },
      thickness: w.thicknessMm,
    })),
    doors: scene.doors
      .filter((d) => d.wallId && typeof d.position === "number")
      .map((d) => ({
        id: d.id,
        wallId: d.wallId as string,
        position: d.position as number,
        width: d.widthMm > 0 ? d.widthMm : 900,
        kind: "door" as const,
      })),
    windows: scene.windows
      .filter((w) => w.wallId && typeof w.position === "number")
      .map((w) => ({
        id: w.id,
        wallId: w.wallId as string,
        position: w.position as number,
        width: w.widthMm > 0 ? w.widthMm : 1200,
        kind: "window" as const,
      })),
    furniture: scene.furniture.map(furnitureToCenterOrigin),
  };
}
