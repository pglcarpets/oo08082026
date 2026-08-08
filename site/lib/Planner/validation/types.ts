/**
 * Planner floor validation issue model (fork-local).
 */

export type ValidationRuleId =
  | "furniture-overlap"
  | "wall-collision"
  | "opening-obstruction"
  | "room-boundary"
  | "aisle-clearance";

export type ValidationSeverity = "error" | "warning" | "advisory";

export type ValidationIssue = {
  id: string;
  /** Alias used by UI; same as ruleId. */
  rule: ValidationRuleId;
  ruleId: ValidationRuleId;
  severity: ValidationSeverity;
  objectIds: string[];
  message: string;
  remedy: string;
  focusMm?: { x: number; y: number };
};

/** Center-origin furniture footprint (mm). */
export type PlacedFurniture = {
  id: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  depthMm: number;
  rotationDeg?: number;
};

export type ValidationWall = {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  thickness: number;
};

export type ValidationOpening = {
  id: string;
  wallId: string;
  position: number;
  width: number;
  kind: "door" | "window";
};

export type ValidationFloor = {
  sheet: { widthMm: number; depthMm: number };
  walls: ValidationWall[];
  doors: ValidationOpening[];
  windows: ValidationOpening[];
  furniture: PlacedFurniture[];
};
