/**
 * Fabric v7-safe canvas serialize/deserialize helpers for Studio.
 * `toJSON()` takes no properties; use `toObject(extraProps)` for custom `data`.
 */
import type { Canvas } from "fabric";

export const STUDIO_FABRIC_OBJECT_PROPS = [
  "data",
  "selectable",
  "evented",
  "lockRotation",
  "lockScalingX",
  "lockScalingY",
] as const;

export type FabricSerializeCanvas = Pick<Canvas, "toObject">;

/** Serialize canvas including custom object fields (Fabric v7). */
export function serializeFabricCanvas(
  canvas: FabricSerializeCanvas,
  propertiesToInclude: readonly string[] = STUDIO_FABRIC_OBJECT_PROPS,
): Record<string, unknown> {
  return canvas.toObject([...propertiesToInclude]) as Record<string, unknown>;
}

export function serializeFabricCanvasJson(
  canvas: FabricSerializeCanvas,
  propertiesToInclude: readonly string[] = STUDIO_FABRIC_OBJECT_PROPS,
): string {
  return JSON.stringify(serializeFabricCanvas(canvas, propertiesToInclude));
}
