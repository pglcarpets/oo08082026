/**
 * Live floor validation for Review + ValidationPanel.
 */
import type { ValidationFloor, ValidationIssue } from "./types";
import { detectFurnitureOverlaps } from "./furnitureOverlap";
import { detectFurnitureClearance } from "./furnitureClearance";
import { detectFurnitureWallCollisions } from "./furnitureWallCollision";
import {
  detectFurnitureOutsideRoom,
  sheetAsRoomPolygon,
} from "./furnitureRoomBoundary";
import { detectOpeningClearanceConflicts } from "./openingClearance";

export type ValidationResult = {
  issues: ValidationIssue[];
  errors: number;
  warnings: number;
  advisories: number;
};

export function countBySeverity(issues: readonly ValidationIssue[]): {
  errors: number;
  warnings: number;
  advisories: number;
} {
  let errors = 0;
  let warnings = 0;
  let advisories = 0;
  for (const issue of issues) {
    if (issue.severity === "error") errors += 1;
    else if (issue.severity === "warning") warnings += 1;
    else if (issue.severity === "advisory") advisories += 1;
  }
  return { errors, warnings, advisories };
}

/** Sort key for ValidationPanel: errors first, then warnings, then advisories; id tie-break. */
export function compareValidationIssues(
  a: ValidationIssue,
  b: ValidationIssue,
): number {
  const severityRank = (s: ValidationIssue["severity"]) =>
    s === "error" ? 0 : s === "warning" ? 1 : 2;
  const bySeverity = severityRank(a.severity) - severityRank(b.severity);
  if (bySeverity !== 0) return bySeverity;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Rules: furniture-overlap (error), wall-collision (error), room-boundary
 * (error/warning vs sheet), aisle-clearance (warning), opening-obstruction (warning).
 */
export function runFloorValidation(floor: ValidationFloor): ValidationResult {
  const furnitureList = floor.furniture;
  const roomPolygons = [sheetAsRoomPolygon(floor.sheet)];

  const issues: ValidationIssue[] = [
    ...detectFurnitureOverlaps(furnitureList),
    ...detectFurnitureWallCollisions(furnitureList, floor.walls),
    ...detectFurnitureOutsideRoom(furnitureList, roomPolygons),
    ...detectFurnitureClearance(furnitureList),
    ...detectOpeningClearanceConflicts(
      furnitureList,
      floor.walls,
      floor.doors,
      floor.windows,
    ),
  ];

  issues.sort(compareValidationIssues);

  return {
    issues,
    ...countBySeverity(issues),
  };
}
