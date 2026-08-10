import type { Canvas, FabricObject } from "fabric";
import type { ComponentType } from "react";

/**
 * Floor Planner domain types. Owned by this app only — Studio has its own
 * `studioTypes.ts`. Nothing here may be imported across the app boundary.
 */

/** Custom fields the Planner attaches to Fabric objects. */
export type OoObjectData = {
  kind?: string;
  role?: string;
  itemId?: string;
  isGridLine?: boolean;
  isSheet?: boolean;
  isGuide?: boolean;
  isPreview?: boolean;
  isDimPreview?: boolean;
  label?: string;
  dimensions?: FurnitureDimensions;
  [key: string]: unknown;
};

export type OoObjectProps = {
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  angle?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  [key: string]: unknown;
};

export type OoFabricObject = FabricObject & {
  data?: OoObjectData;
  __props?: OoObjectProps;
  __dimLabel?: unknown;
  excludeFromExport?: boolean;
};

export type FabricRef = { current: Canvas | null };

export type FurnitureDimensions = {
  width_mm: number;
  depth_mm: number;
  height_mm: number;
};

/** A catalog entry the Planner places on a plan (read-only from the Planner's side). */
export type FurnitureItem = {
  id: string;
  name: string;
  category: string;
  subcategory?: string | null;
  tags?: string[];
  dimensions: FurnitureDimensions;
  top_png_url?: string | null;
  top_svg_url?: string | null;
  thumb_url?: string | null;
  thumbnail_url?: string | null;
  is_custom?: boolean;
  count?: number;
  [key: string]: unknown;
};

export type PlannerSheet = {
  width_mm: number;
  height_mm: number;
  unit: string;
  scale_px_per_mm: number;
};

export type PlannerProject = {
  id: string;
  name: string;
  thumbnail_url?: string | null;
  objects_count: number;
  updated_at: string;
  /** Present on full load/save payloads from `/api/Planner/projects`. */
  canvas_json?: string | Record<string, unknown>;
  sheet?: Partial<PlannerSheet> & { width_mm?: number };
  layers?: unknown;
  user_id?: string | null;
  created_at?: string;
};

export type LayerRow = {
  id: string;
  label: string;
  visible: boolean;
  locked: boolean;
};

export type ContextMenuItem = {
  id?: string;
  label?: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
  onClick?: () => void;
};

export type ToolRailEntry = {
  id: string;
  icon: string;
  label: string;
  shortcut?: string;
  divider?: boolean;
};

export type ArrangeObstacle = {
  x_mm: number;
  y_mm: number;
  width_mm: number;
  depth_mm: number;
  kind?: string;
};

export type ArrangePlacement = {
  item: FurnitureItem;
  x_mm: number;
  y_mm: number;
  width_mm: number;
  depth_mm: number;
  rotation_deg: number;
};

export type AutoArrangeOptions = {
  gap_mm?: number;
  margin_mm?: number;
  sort?: "area" | "depth" | "width" | "none";
  obstacles?: ArrangeObstacle[];
};

export type AutoArrangeResult = {
  placements: ArrangePlacement[];
  overflow: Array<FurnitureItem & { reason?: string }>;
  usage: number;
};

export type DockPanelPosition = {
  direction: string;
  referencePanel?: string;
};

export type DockPanelDef = {
  id: string;
  title: string;
  render: ComponentType;
  group?: string;
  position?: DockPanelPosition;
};

export type DockviewApiLike = {
  panels?: unknown[];
  getPanel: (id: string) =>
    | {
        api?: {
          close: () => void;
          setActive?: () => void;
        };
      }
    | undefined;
  addPanel: (opts: {
    id: string;
    component: string;
    title: string;
    position?: { direction: string; referencePanel: string };
  }) => void;
  fromJSON: (layout: unknown) => void;
  toJSON: () => unknown;
  onDidLayoutChange: (cb: () => void) => void;
  onDidRemovePanel?: (cb: () => void) => void;
};

/** Context value the Planner shell hands to its dock panels. */
export type PlannerBridge = {
  fabricRef: FabricRef;
  scalePxPerMm: number;
  sheet: PlannerSheet;
  setSheet: (s: PlannerSheet) => void;
  propObj: OoFabricObject | null;
  setObjectProp: (patch: Record<string, unknown>) => void;
  applyFill: (c: string) => void;
  applyStroke: (c: string) => void;
  layers: LayerRow[];
  selectedIds: string[];
  sceneVersion: number;
  layerSelect: (id: string) => void;
  layerToggleVisible: (id: string) => void;
  layerToggleLock: (id: string) => void;
  layerDelete: (id: string) => void;
  layerReorder: (id: string, delta: number) => void;
  /** Place a catalog item onto the canvas (center of the current viewport
   * by default) — the click/keyboard equivalent of the existing
   * drag-and-drop drop handler, so keyboard-only and click users can place
   * furniture too. */
  placeFurnitureItem: (item: FurnitureItem) => void;
};
