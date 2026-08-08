import type { FurnitureDimensions } from "@studio/lib/studioTypes";

/** Default furniture size for save dialog, 3D preview, and canvas import (mm). */
export const DEFAULT_FURNITURE_DIMS_MM = {
  width_mm: 600,
  depth_mm: 600,
  height_mm: 750,
} as const satisfies FurnitureDimensions;

/** Neutral cube used when AI metadata omits dimensions (mm). */
export const DEFAULT_AI_DIMENSIONS_MM = {
  width_mm: 600,
  depth_mm: 600,
  height_mm: 600,
} as const satisfies FurnitureDimensions;
