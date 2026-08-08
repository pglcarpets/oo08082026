/**
 * Human-readable snap indicator for the planner status bar / canvas aids chrome.
 * Port of 20072026 `features/planner/lib/snapStatusLabel` into `@planner/lib/*`.
 *
 * Users see whether grid and object snapping are active, not a placeholder.
 */
export function buildSnapStatusLabel(snapEnabled: boolean, gridEnabled: boolean): string {
  if (!snapEnabled) {
    return "Off";
  }
  if (gridEnabled) {
    return "Grid + Objects";
  }
  return "Objects";
}

export function isSnapStatusActive(label: string): boolean {
  return label !== "Off" && label !== "Pending";
}
