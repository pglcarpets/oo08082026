import type { FabricObject } from "fabric";
import type { LayerRow, OoFabricObject } from "@planner/lib/plannerTypes";

/** Shapes smaller than this are treated as accidental clicks. */
export const MIN_DRAW_SIZE_PX = 4;

export function isCanvasHelperObject(o: FabricObject): boolean {
  const oo = o as OoFabricObject;
  const data = oo.data;
  if (
    data?.isGridLine ||
    data?.isSheet ||
    data?.isGuide ||
    data?.isPreview ||
    data?.isDimPreview
  ) {
    return true;
  }
  return oo.excludeFromExport === true && !data?.id;
}

export function isUserLayerObject(o: FabricObject): boolean {
  if (isCanvasHelperObject(o)) return false;
  const id = (o as OoFabricObject).data?.id;
  return typeof id === "string" && id.length > 0;
}

function labelFor(o: OoFabricObject): string {
  return String(o.data?.label ?? o.type ?? "Object");
}

export function collectUserLayerRows(objects: FabricObject[]): LayerRow[] {
  return objects
    .filter(isUserLayerObject)
    .map((o) => {
      const oo = o as OoFabricObject;
      return {
        id: String(oo.data?.id),
        label: labelFor(oo),
        visible: o.visible !== false,
        locked: !!o.lockMovementX,
      };
    });
}

export function isTooSmallDrawnShape(o: FabricObject, tool: string): boolean {
  const min = MIN_DRAW_SIZE_PX;
  if (tool === "rect" || tool === "roundedRect" || tool === "triangle" || tool === "star" || tool === "ellipse") {
    return o.getScaledWidth() < min && o.getScaledHeight() < min;
  }
  if (tool === "circle" || tool === "arc") {
    const ellipse = o as FabricObject & { rx?: number; ry?: number; radius?: number };
    const sx = o.scaleX ?? 1;
    const sy = o.scaleY ?? 1;
    if (typeof ellipse.radius === "number") {
      return ellipse.radius * 2 * Math.max(sx, sy) < min;
    }
    return (ellipse.rx ?? 0) * 2 * sx < min && (ellipse.ry ?? 0) * 2 * sy < min;
  }
  if (tool === "line" || tool === "wall" || tool === "arrow") {
    const line = o as FabricObject & { x1?: number; y1?: number; x2?: number; y2?: number };
    if (typeof line.x1 === "number") {
      const dx = (line.x2 ?? 0) - (line.x1 ?? 0);
      const dy = (line.y2 ?? 0) - (line.y1 ?? 0);
      return Math.hypot(dx, dy) < min;
    }
    return o.getScaledWidth() < min && o.getScaledHeight() < min;
  }
  return false;
}

export function isDragDrawTool(tool: string): boolean {
  return (
    tool === "rect" ||
    tool === "roundedRect" ||
    tool === "circle" ||
    tool === "ellipse" ||
    tool === "triangle" ||
    tool === "star" ||
    tool === "line" ||
    tool === "arrow" ||
    tool === "arc" ||
    tool === "wall"
  );
}
