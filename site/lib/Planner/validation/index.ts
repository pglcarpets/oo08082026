export type {
  ValidationIssue,
  ValidationRuleId,
  ValidationSeverity,
  PlacedFurniture,
  ValidationFloor,
  ValidationWall,
  ValidationOpening,
} from "./types";
export { runFloorValidation, countBySeverity } from "./runValidation";
export type { ValidationResult } from "./runValidation";
export { detectFurnitureOverlaps, aabbsOverlap } from "./furnitureOverlap";
export { detectFurnitureClearance, DEFAULT_AISLE_CLEARANCE_MM } from "./furnitureClearance";
export { detectFurnitureWallCollisions, wallAsPlacedFurniture } from "./furnitureWallCollision";
export {
  detectFurnitureOutsideRoom,
  sheetAsRoomPolygon,
} from "./furnitureRoomBoundary";
export {
  detectOpeningClearanceConflicts,
  openingClearanceAsPlaced,
  DEFAULT_OPENING_CLEARANCE_MM,
} from "./openingClearance";
