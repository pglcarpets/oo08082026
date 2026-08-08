/**
 * Fabric v7-safe canvas serialize helpers for Planner.
 * `toJSON()` takes no properties; use `toObject(extraProps)` for custom `data`.
 */
import type { Canvas } from "fabric";

export const PLANNER_FABRIC_OBJECT_PROPS = [
  "data",
  "selectable",
  "evented",
  "lockRotation",
  "lockScalingX",
  "lockScalingY",
] as const;

export type FabricSerializeCanvas = Pick<Canvas, "toObject">;

export function serializeFabricCanvas(
  canvas: FabricSerializeCanvas,
  propertiesToInclude: readonly string[] = PLANNER_FABRIC_OBJECT_PROPS,
): Record<string, unknown> {
  return canvas.toObject([...propertiesToInclude]) as Record<string, unknown>;
}

export function serializeFabricCanvasJson(
  canvas: FabricSerializeCanvas,
  propertiesToInclude: readonly string[] = PLANNER_FABRIC_OBJECT_PROPS,
): string {
  return JSON.stringify(serializeFabricCanvas(canvas, propertiesToInclude));
}
