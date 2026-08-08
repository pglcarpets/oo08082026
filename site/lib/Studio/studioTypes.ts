import type { Canvas, FabricObject } from "fabric";
import type { ComponentType } from "react";

/**
 * Furniture Studio domain types. Owned by this app only — the Planner has its
 * own `plannerTypes.ts`. Nothing here may be imported across the app boundary.
 */

/** Custom fields the Studio attaches to Fabric objects. */
export type OoObjectData = {
  kind?: string;
  role?: string;
  itemId?: string;
  isGridLine?: boolean;
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

/** A catalog entry the Studio authors and saves. */
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

export type AlignAction =
  | "left"
  | "centerX"
  | "right"
  | "top"
  | "centerY"
  | "bottom"
  | "distH"
  | "distV"
  | "flipH"
  | "flipV"
  | "rotate90";

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

/** Context value the Studio shell hands to its dock panels. */
export type StudioBridge = {
  scalePxPerMm: number;
  propObj: OoFabricObject | null;
  setObjectProp: (patch: Record<string, unknown>) => void;
  applyFill: (c: string) => void;
  applyStroke: (c: string) => void;
  drawFill: string;
  drawStroke: string;
  activeTool: string;
  layers: LayerRow[];
  selectedIds: string[];
  hasSelection: boolean;
  hasSvg: boolean;
  onAiGenerate: (prompt: string) => void | Promise<void>;
  onAiSuggest: () => void | Promise<void>;
  onAiRestyle: () => void | Promise<void>;
  generating: boolean;
  layerSelect: (id: string) => void;
  layerToggleVisible: (id: string) => void;
  layerToggleLock: (id: string) => void;
  layerDelete: (id: string) => void;
  layerReorder: (id: string, delta: number) => void;
};
