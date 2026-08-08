import type { FurnitureDimensions } from "@planner/lib/plannerTypes";

/** Default catalog upload / placeholder furniture size (mm). */
export const DEFAULT_CATALOG_FURNITURE_DIMS_MM = {
  width_mm: 600,
  depth_mm: 600,
  height_mm: 750,
} as const satisfies FurnitureDimensions;

/** Extrusion height when catalog item omits height (mm). */
export const DEFAULT_SCENE_FURNITURE_HEIGHT_MM = DEFAULT_CATALOG_FURNITURE_DIMS_MM.height_mm;

/** Standard residential wall height for 3D scene extrusion (mm). */
export const PLANNER_WALL_HEIGHT_MM = 2700;
