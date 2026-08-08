import type { PlannerFurnitureBoq } from "./types";

export function exportBoqJson(boq: PlannerFurnitureBoq): string {
  return `${JSON.stringify(boq, null, 2)}\n`;
}
