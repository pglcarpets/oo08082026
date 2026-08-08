export type DrawColorMode = "fill" | "stroke";

export type DrawColorDefaults = {
  fill: string;
  stroke: string;
};

const STROKE_PRIMARY = new Set(["line", "path", "polyline"]);

export function isStrokePrimaryType(type: string | undefined): boolean {
  return !!type && STROKE_PRIMARY.has(type);
}

/** Map a Color panel pick onto fabric props for a given object. */
export function colorPatchForObject(
  mode: DrawColorMode,
  color: string,
  objectType: string | undefined,
): { fill?: string; stroke?: string } {
  if (mode === "stroke") return { stroke: color };
  if (isStrokePrimaryType(objectType)) return { stroke: color };
  return { fill: color };
}

export function mergeDrawDefaults(
  current: DrawColorDefaults,
  mode: DrawColorMode,
  color: string,
): DrawColorDefaults {
  if (mode === "fill") return { ...current, fill: color };
  return { ...current, stroke: color };
}

/** When drawing stroke-primary tools, Fill-mode picks should also refresh stroke default. */
export function mergeDrawDefaultsForTool(
  current: DrawColorDefaults,
  mode: DrawColorMode,
  color: string,
  tool: string,
): DrawColorDefaults {
  const next = mergeDrawDefaults(current, mode, color);
  if (mode === "fill" && (tool === "line" || tool === "freehand" || tool === "pen" || tool === "brush" || tool === "polygon" || tool === "arrow" || tool === "arc")) {
    return { ...next, stroke: color };
  }
  return next;
}
