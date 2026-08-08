"use client";
import { collectUserLayerRows, isDragDrawTool, isTooSmallDrawnShape } from "@studio/lib/studioCanvasLayers";
import { OO, OO_DRAW, SCALE_PX_PER_MM, ooFontSans, ooFontSansShort } from "@studio/lib/studioPalette";
import { DEFAULT_FURNITURE_DIMS_MM } from "@studio/lib/studioTokens";
import type { DockviewApiLike, FurnitureDimensions, OoFabricObject, ToolRailEntry } from "@studio/lib/studioTypes";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import * as fabric from "fabric";
import type { ModifiedEvent, TPointerEvent, TPointerEventInfo } from "fabric";
import { useFabric } from "@studio/hooks/useStudioFabric";
import { useHistory } from "@studio/hooks/useStudioHistory";
import { useKeyboardShortcuts } from "@studio/hooks/useStudioKeyboardShortcuts";
import { useCanvasCore } from "@studio/hooks/useStudioCanvasCore";
import { useStudioUIStore } from "@studio/store/studioUiStore";
import { useCatalogStore } from "@studio/store/studioCatalogStore";
import { ToolRail } from "@studio/components/StudioToolRail";
import { PhIcon } from "@studio/components/ui/StudioPhIcon";
import { ContextMenu } from "@studio/components/StudioContextMenu";
import { ViewportControls } from "@studio/components/StudioViewportControls";
import { Rulers } from "@studio/components/StudioRulers";
import { aiApi } from "@studio/components/StudioAiPanel";
import { AlignBar } from "@studio/components/StudioAlignBar";
import { DockShell } from "@studio/components/StudioDockShell";
import { StudioTopToolbar, type ToolbarItemHandler } from "@studio/components/StudioTopToolbar";
import { SidePanelResizeHandle } from "@studio/components/ui/StudioSidePanelResizeHandle";
import { usePanelResize } from "@studio/components/ui/useStudioPanelResize";
import { DraggableCanvasOverlay } from "@studio/components/ui/StudioDraggableCanvasOverlay";
import { FloatingPanel } from "@studio/components/ui/StudioFloatingPanel";
import { ExportMenu } from "@studio/components/ui/StudioExportMenu";
import { DockPanelButtons } from "@studio/components/ui/StudioDockPanelButtons";
import { StudioContext } from "@studio/hooks/useStudioDockBridge";
import { StudioPropsPanel, StudioColorPanel, StudioAiPanel, StudioLayersPanel } from "@studio/components/dock/StudioDockPanels";
import { snap as snapVal } from "@studio/lib/studioSnap";
import {
  exportPNG,
  exportJPEG,
  exportSVG,
  exportCanvasJson,
  canvasJsonToDownloadText,
  downloadDataUrl,
  downloadText,
  exportTightPNG,
  exportTightJPEG,
} from "@studio/lib/studioExporters";
import {
  STUDIO_IMPORT_ACCEPT,
  detectStudioImportKind,
  parseStudioCanvasJson,
  readFileAsDataUrl,
  readFileAsText,
} from "@studio/lib/studioImporters";
import {
  colorPatchForObject,
  mergeDrawDefaultsForTool,
  type DrawColorDefaults,
} from "@studio/lib/studioDrawColors";
import { setLineLengthPx } from "@studio/lib/studioPropertySizeFields";
import {
  arcSweepDegrees,
  arrowOutlinePoints,
  bboxFromPoints,
  freehandStrokeWidth,
  isFreehandTool,
  starPoints,
  trianglePoints,
} from "@studio/lib/studioShapeGeometry";
import { ensureAndActivateDockPanel } from "@studio/lib/studioEnsureDockPanel";
import { downloadDxf } from "@studio/lib/studioDxfExport";
import { createFurniture, publishFurniture } from "@studio/lib/studioApi";
import {
  getFurnitureTemplate,
  listFurnitureTemplates,
  resolveTemplateShapesToCanvas,
  type FurnitureTemplateId,
} from "@studio/lib/templates/furnitureTemplates";
import { useRuntimeFeatureFlags } from "@/lib/hooks/useRuntimeFeatureFlags";

const DEFAULT_STROKE = OO_DRAW.stroke;
const DEFAULT_FILL = OO_DRAW.fill;

type LayerItem = {
  id: string | undefined;
  label: string;
  visible: boolean;
  locked: boolean;
};

type PropObjProps = {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  fill: string | fabric.TFiller | null;
  stroke: string | null;
  strokeWidth: number;
  opacity: number;
  rx: number;
};

type PropObjState = {
  __props: PropObjProps;
  __obj: OoFabricObject;
} | null;

type SaveDataState = {
  name: string;
  category: string;
  subcategory: string;
  tags: string;
  width_mm: number;
  depth_mm: number;
  height_mm: number;
  notes: string;
};

type AiSuggestion = {
  name?: string;
  category?: string;
  tags?: string[];
  dimensions?: FurnitureDimensions;
  svg?: string;
};

type Point2D = { x: number; y: number };

const asOo = (obj: fabric.FabricObject): OoFabricObject => obj as OoFabricObject;

const getErrorMessage = (e: unknown): string => {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null && "message" in e) return String((e as { message: unknown }).message);
  return String(e);
};

const getApiErrorMessage = (e: unknown): string => {
  if (typeof e === "object" && e !== null && "response" in e) {
    const resp = (e as { response?: { data?: { detail?: unknown } } }).response;
    if (resp?.data?.detail !== null && resp?.data?.detail !== undefined) return String(resp.data.detail);
  }
  return getErrorMessage(e);
};

const STUDIO_TOOLS = [
  { id: "select", label: "Select", icon: "cursor", shortcut: "V" },
  { id: "pan", label: "Pan", icon: "hand", shortcut: "H" },
  { divider: true },
  { id: "rect", label: "Rectangle", icon: "rect", shortcut: "R" },
  { id: "roundedRect", label: "Rounded rect", icon: "roundedRect" },
  { id: "circle", label: "Circle", icon: "circle", shortcut: "C" },
  { id: "ellipse", label: "Ellipse", icon: "ellipse" },
  { id: "triangle", label: "Triangle", icon: "triangle" },
  { id: "star", label: "Star", icon: "star" },
  { id: "line", label: "Line", icon: "line", shortcut: "L" },
  { id: "arrow", label: "Arrow", icon: "arrow" },
  { id: "arc", label: "Arc", icon: "arc" },
  { id: "polygon", label: "Polygon", icon: "polygon", shortcut: "P" },
  { divider: true },
  { id: "freehand", label: "Freehand", icon: "freehand", shortcut: "M" },
  { id: "pen", label: "Pen", icon: "pen" },
  { id: "brush", label: "Brush", icon: "brush" },
  { divider: true },
  { id: "text", label: "Text", icon: "text", shortcut: "T" },
  { id: "dimension", label: "Measure", icon: "dimension", shortcut: "D" },
] as ToolRailEntry[];

const STUDIO_LEFT_PANELS = [
  { id: "color", title: "Color", render: StudioColorPanel },
  { id: "layers", title: "Layers", render: StudioLayersPanel, position: { direction: "below" } },
];

const STUDIO_RIGHT_PANELS = [
  { id: "props", title: "Properties", render: StudioPropsPanel },
];

const nextObjId = (() => { let n = 0; return () => `o${Date.now().toString(36)}_${(++n).toString(36)}`; })();
const tag = (obj: OoFabricObject, label?: string): OoFabricObject => {
  obj.data = obj.data || {};
  if (!obj.data.id) obj.data.id = nextObjId();
  if (label) obj.data.label = label;
  return obj;
};
const Studio = () => {
  const { wrapperRef, canvasElRef, fabricRef, ready } = useFabric({ background: OO.canvasBg });
  const showToast = useStudioUIStore((s) => s.showToast);
  const snapEnabled = useStudioUIStore((s) => s.snapEnabled);
  const toggleSnap = useStudioUIStore((s) => s.toggleSnap);
  const showGrid = useStudioUIStore((s) => s.showGrid);
  const toggleGrid = useStudioUIStore((s) => s.toggleGrid);
  const gridSize = useStudioUIStore((s) => s.gridSize);
  const refreshCatalog = useCatalogStore((s) => s.refresh);
  const addCatalogItem = useCatalogStore((s) => s.addItem);
  const { enabled: flag } = useRuntimeFeatureFlags();

  const [tool, setTool] = useState("select");
  const [drawColors, setDrawColors] = useState<DrawColorDefaults>({
    fill: DEFAULT_FILL,
    stroke: DEFAULT_STROKE,
  });
  const drawColorsRef = useRef(drawColors);
  drawColorsRef.current = drawColors;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [propObj, setPropObj] = useState<PropObjState>(null);
  const [cursorMm, setCursorMm] = useState({ x: 0, y: 0 });
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveData, setSaveData] = useState<SaveDataState>({ name: "", category: "Seating", subcategory: "", tags: "", ...DEFAULT_FURNITURE_DIMS_MM, notes: "" });
  const [saving, setSaving] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  useEffect(() => {
    // Fixed-width side panels otherwise squeeze the canvas to nothing below the
    // design system's own sm breakpoint (--breakpoint-sm: 640px); collapse both
    // so the canvas stays usable, and let the dock-tab overlay buttons reopen
    // them on demand — the same mechanism already used when a panel empties out.
    const mql = window.matchMedia("(max-width: 639px)");
    const collapseForNarrowViewport = (narrow: boolean) => {
      if (!narrow) return;
      setLeftCollapsed(true);
      setRightCollapsed(true);
    };
    collapseForNarrowViewport(mql.matches);
    const onChange = (e: MediaQueryListEvent) => collapseForNarrowViewport(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  const [activeLeftDock, setActiveLeftDock] = useState("color");
  const [aiFloatOpen, setAiFloatOpen] = useState(false);
  const [activeRightDock, setActiveRightDock] = useState("props");
  const leftDockApiRef = useRef<DockviewApiLike | null>(null);
  const rightDockApiRef = useRef<DockviewApiLike | null>(null);
  const pendingLeftFocusRef = useRef<string | null>(null);
  const pendingRightFocusRef = useRef<string | null>(null);
  const leftPanel = usePanelResize({
    storageKey: "studio.panel.left.w",
    defaultWidth: 300,
    edge: "start",
  });
  const rightPanel = usePanelResize({
    storageKey: "studio.panel.right.w",
    defaultWidth: 340,
    edge: "end",
  });
  const [autoFit, setAutoFit] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null); // last AI meta suggestion
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const clipRef = useRef<OoFabricObject | null>(null);
  const activeCountRef = useRef(0);

  const history = useHistory(fabricRef, ready);
  const core = useCanvasCore({ fabricRef, ready, scale: SCALE_PX_PER_MM, snapEnabled, gridSize, tool, wrapperRef, onCursorMm: setCursorMm });

  const focusDockPanel = useCallback((side: "left" | "right", panelId: string) => {
    if (side === "left") {
      pendingLeftFocusRef.current = panelId;
      setLeftCollapsed(false);
      setActiveLeftDock(panelId);
      const tryFocus = () => {
        if (ensureAndActivateDockPanel(leftDockApiRef.current, STUDIO_LEFT_PANELS, panelId)) {
          pendingLeftFocusRef.current = null;
          return true;
        }
        return false;
      };
      queueMicrotask(() => {
        if (tryFocus()) return;
        requestAnimationFrame(() => {
          if (tryFocus()) return;
          window.setTimeout(tryFocus, 50);
        });
      });
      return;
    }
    pendingRightFocusRef.current = panelId;
    setRightCollapsed(false);
    setActiveRightDock(panelId);
    const tryFocus = () => {
      if (ensureAndActivateDockPanel(rightDockApiRef.current, STUDIO_RIGHT_PANELS, panelId)) {
        pendingRightFocusRef.current = null;
        return true;
      }
      return false;
    };
    queueMicrotask(() => {
      if (tryFocus()) return;
      requestAnimationFrame(() => {
        if (tryFocus()) return;
        window.setTimeout(tryFocus, 50);
      });
    });
  }, []);

  useEffect(() => {
    if (!autoFit || !ready) return;
    const runFit = () => {
      core.fitToContent();
    };
    // After sibling effects (grid/sheet) paint for this ready tick
    const t = window.setTimeout(runFit, 0);
    const onResize = () => {
      runFit();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [autoFit, ready, core.fitToContent]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      const root = document.querySelector(".oostudio-root .app-root") || document.documentElement;
      if (root instanceof HTMLElement) await root.requestFullscreen();
    } catch {
      showToast("Fullscreen not available", "error");
    }
  }, [showToast]);

  // ——— Grid
  const drawGrid = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    c.getObjects().filter((o) => asOo(o).data?.isGridLine).forEach((o) => c.remove(o));
    if (!showGrid) { c.requestRenderAll(); return; }
    const w = c.getWidth() * 3;
    const h = c.getHeight() * 3;
    const gridPx = gridSize * SCALE_PX_PER_MM;
    const majorEvery = 5;
    for (let x = -w; x <= w; x += gridPx) {
      const isMajor = Math.round(x / gridPx) % majorEvery === 0;
      const line = new fabric.Line([x, -h, x, h], { stroke: isMajor ? OO.canvasGridMajor : OO.canvasGridMinor, strokeWidth: 1, selectable: false, evented: false, excludeFromExport: true, objectCaching: false, hoverCursor: "default" });
      asOo(line).data = { isGridLine: true };
      c.add(line); c.sendObjectToBack(line);
    }
    for (let y = -h; y <= h; y += gridPx) {
      const isMajor = Math.round(y / gridPx) % majorEvery === 0;
      const line = new fabric.Line([-w, y, w, y], { stroke: isMajor ? OO.canvasGridMajor : OO.canvasGridMinor, strokeWidth: 1, selectable: false, evented: false, excludeFromExport: true, objectCaching: false, hoverCursor: "default" });
      asOo(line).data = { isGridLine: true };
      c.add(line); c.sendObjectToBack(line);
    }
    c.requestRenderAll();
  }, [fabricRef, showGrid, gridSize]);

  useEffect(() => { if (ready) drawGrid(); }, [ready, drawGrid]);
  useEffect(() => { if (ready) drawGrid(); }, [core.zoom, ready, drawGrid]);

  const refreshLayers = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    setLayers(collectUserLayerRows(c.getObjects()).reverse());
  }, [fabricRef]);

  // Selection sync
  useEffect(() => {
    if (!ready) return;
    const c = fabricRef.current;
    if (!c) return;
    const onSel = () => {
      const active = c.getActiveObject();
      if (!active) { setPropObj(null); setSelectedIds([]); activeCountRef.current = 0; return; }
      const list = c.getActiveObjects();
      activeCountRef.current = list.length;
      setSelectedIds(list.map((o) => asOo(o).data?.id).filter((id): id is string => typeof id === "string"));
      const activeOo = asOo(active);
      const fill = active.fill;
      const stroke = active.stroke;
      setPropObj({
        __props: {
          left: active.left ?? 0,
          top: active.top ?? 0,
          width: active.getScaledWidth(),
          height: active.getScaledHeight(),
          angle: active.angle || 0,
          fill: typeof fill === "string" || fill === null || fill === undefined ? fill : String(fill),
          stroke: typeof stroke === "string" || stroke === null || stroke === undefined ? stroke : String(stroke),
          strokeWidth: active.strokeWidth ?? 0,
          opacity: active.opacity ?? 1,
          rx: active instanceof fabric.Rect ? active.rx || 0 : 0,
        },
        __obj: activeOo,
      });
    };
    const clear = () => { setSelectedIds([]); setPropObj(null); activeCountRef.current = 0; };
    const modified = () => { onSel(); refreshLayers(); };
    c.on("selection:created", onSel);
    c.on("selection:updated", onSel);
    c.on("selection:cleared", clear);
    c.on("object:modified", modified);
    c.on("object:added", refreshLayers);
    c.on("object:removed", refreshLayers);
    return () => {
      c.off("selection:created", onSel); c.off("selection:updated", onSel);
      c.off("selection:cleared", clear);
      c.off("object:modified", modified);
      c.off("object:added", refreshLayers); c.off("object:removed", refreshLayers);
    };
  }, [ready, fabricRef, refreshLayers]);

  // Snap while moving
  useEffect(() => {
    if (!ready) return;
    const c = fabricRef.current;
    if (!c) return;
    const gridPx = gridSize * SCALE_PX_PER_MM;
    const onMoving = (opt: ModifiedEvent<TPointerEvent>) => {
      if (!snapEnabled) return;
      const t = asOo(opt.target);
      if (!t || t.data?.isGridLine) return;
      t.set({ left: snapVal(t.left ?? 0, gridPx), top: snapVal(t.top ?? 0, gridPx) });
    };
    // rotation snap when Shift held
    const onRotating = (opt: ModifiedEvent<TPointerEvent>) => {
      const t = opt.target;
      if (!t) return;
      if (opt.e && "shiftKey" in opt.e && opt.e.shiftKey) t.set({ angle: Math.round((t.angle || 0) / 15) * 15 });
    };
    c.on("object:moving", onMoving);
    c.on("object:rotating", onRotating);
    return () => { c.off("object:moving", onMoving); c.off("object:rotating", onRotating); };
  }, [ready, fabricRef, snapEnabled, gridSize]);

  // Drawing tools
  useEffect(() => {
    if (!ready) return;
    const c = fabricRef.current;
    if (!c) return;
    c.isDrawingMode = false;
    c.selection = tool === "select";
    c.defaultCursor = tool === "pan" ? "grab" : (tool === "select" ? "default" : "crosshair");
    c.getObjects().forEach((o) => {
      const oo = asOo(o);
      if (oo.data?.isGridLine || oo.data?.isGuide) return;
      o.selectable = tool === "select";
      o.evented = tool === "select";
    });
    if (isFreehandTool(tool)) {
      c.isDrawingMode = true;
      c.freeDrawingBrush = new fabric.PencilBrush(c);
      c.freeDrawingBrush.color = drawColorsRef.current.stroke;
      c.freeDrawingBrush.width = freehandStrokeWidth(tool);
      const onPathCreated = (opt: { path: fabric.FabricObject }) => {
        const path = opt.path;
        if (!path) return;
        const label = tool === "brush" ? "Brush" : tool === "pen" ? "Pen" : "Freehand";
        tag(asOo(path), label);
        c.fire("object:modified", { target: path });
      };
      c.on("path:created", onPathCreated);
      return () => {
        c.off("path:created", onPathCreated);
        c.isDrawingMode = false;
      };
    }
    let drawing: OoFabricObject | null = null;
    let start: Point2D | null = null;
    let polyPoints: Point2D[] | null = null;
    let polyPreview: OoFabricObject | null = null;
    let dimStart: Point2D | null = null;
    const snapPoint = (p: Point2D): Point2D => {
      if (!snapEnabled) return p;
      const gp = gridSize * SCALE_PX_PER_MM;
      return { x: snapVal(p.x, gp), y: snapVal(p.y, gp) };
    };
    const onDown = (opt: TPointerEventInfo<TPointerEvent>) => {
      const raw = opt.scenePoint;
      if (!raw) return;
      if (opt.e && "button" in opt.e && opt.e.button !== 0) return;
      if (isDragDrawTool(tool) && drawing) return;
      const p = snapPoint(raw);
      const { fill: drawFill, stroke: drawStroke } = drawColorsRef.current;
      if (tool === "rect") {
        drawing = tag(new fabric.Rect({ left: p.x, top: p.y, width: 1, height: 1, fill: drawFill, stroke: drawStroke, strokeWidth: 1.5, strokeUniform: true }), "Rectangle");
        c.add(drawing); start = p;
      } else if (tool === "roundedRect") {
        drawing = tag(new fabric.Rect({ left: p.x, top: p.y, width: 1, height: 1, rx: 12, ry: 12, fill: drawFill, stroke: drawStroke, strokeWidth: 1.5, strokeUniform: true }), "Rounded rect");
        c.add(drawing); start = p;
      } else if (tool === "circle") {
        drawing = tag(new fabric.Circle({ left: p.x, top: p.y, radius: 1, fill: drawFill, stroke: drawStroke, strokeWidth: 1.5, strokeUniform: true }), "Circle");
        c.add(drawing); start = p;
      } else if (tool === "ellipse") {
        drawing = tag(new fabric.Ellipse({ left: p.x, top: p.y, rx: 1, ry: 1, fill: drawFill, stroke: drawStroke, strokeWidth: 1.5, strokeUniform: true }), "Ellipse");
        c.add(drawing); start = p;
      } else if (tool === "triangle") {
        drawing = tag(new fabric.Polygon(trianglePoints({ left: p.x, top: p.y, width: 1, height: 1 }), { fill: drawFill, stroke: drawStroke, strokeWidth: 1.5, strokeUniform: true }), "Triangle");
        c.add(drawing); start = p;
      } else if (tool === "star") {
        drawing = tag(new fabric.Polygon(starPoints({ left: p.x, top: p.y, width: 1, height: 1 }), { fill: drawFill, stroke: drawStroke, strokeWidth: 1.5, strokeUniform: true }), "Star");
        c.add(drawing); start = p;
      } else if (tool === "line") {
        drawing = tag(new fabric.Line([p.x, p.y, p.x, p.y], { stroke: drawStroke, strokeWidth: 2, strokeUniform: true }), "Line");
        c.add(drawing); start = p;
      } else if (tool === "arrow") {
        drawing = tag(new fabric.Polygon(arrowOutlinePoints(p, p), { fill: drawFill, stroke: drawStroke, strokeWidth: 1, strokeUniform: true }), "Arrow");
        c.add(drawing); start = p;
      } else if (tool === "arc") {
        drawing = tag(new fabric.Circle({
          left: p.x, top: p.y, radius: 1,
          startAngle: 0, endAngle: 90,
          fill: "transparent", stroke: drawStroke, strokeWidth: 2, strokeUniform: true,
        }), "Arc");
        c.add(drawing); start = p;
      } else if (tool === "polygon") {
        if (!polyPoints) polyPoints = [];
        polyPoints.push({ x: p.x, y: p.y });
        if (polyPreview) c.remove(polyPreview);
        if (polyPoints.length >= 2) {
          polyPreview = new fabric.Polyline([...polyPoints], { stroke: drawStroke, strokeWidth: 1.5, fill: "transparent", strokeDashArray: [4, 4], selectable: false, evented: false, excludeFromExport: true });
          asOo(polyPreview).data = { isPreview: true };
          c.add(polyPreview);
        }
      } else if (tool === "text") {
        const t = new fabric.IText("Text", { left: p.x, top: p.y, fontSize: 16, fill: drawStroke, fontFamily: ooFontSans() });
        tag(t, "Text"); c.add(t); c.setActiveObject(t); setTool("select");
      } else if (tool === "dimension") {
        if (!dimStart) {
          dimStart = p;
          drawing = new fabric.Line([p.x, p.y, p.x, p.y], { stroke: OO.obb600, strokeWidth: 1, strokeDashArray: [4, 3], selectable: false, evented: false });
          asOo(drawing).data = { isDimPreview: true };
          drawing.excludeFromExport = true;
          c.add(drawing);
        } else {
          const dx = p.x - dimStart.x, dy = p.y - dimStart.y;
          const distMm = Math.round(Math.sqrt(dx * dx + dy * dy) / SCALE_PX_PER_MM);
          const mid = { x: (p.x + dimStart.x) / 2, y: (p.y + dimStart.y) / 2 };
          const line = new fabric.Line([dimStart.x, dimStart.y, p.x, p.y], { stroke: OO.obb600, strokeWidth: 1, strokeUniform: true, selectable: false, evented: false });
          const label = new fabric.Text(`${distMm} mm`, { left: mid.x, top: mid.y - 12, fontSize: 11, fontFamily: ooFontSansShort(), fill: OO.obb600, originX: "center", originY: "center", selectable: false, evented: false });
          const g = new fabric.Group([line, label], {});
          tag(g, `↔ ${distMm}mm`);
          if (drawing) c.remove(drawing);
          drawing = null;
          c.add(g);
          dimStart = null;
        }
      }
    };
    const onMove = (opt: TPointerEventInfo<TPointerEvent>) => {
      if (!drawing || (!start && !dimStart)) return;
      const raw = opt.scenePoint;
      if (!raw) return;
      const p = snapPoint(raw);
      if (tool === "rect" && start && drawing) {
        drawing.set({ width: Math.abs(p.x - start.x), height: Math.abs(p.y - start.y), left: Math.min(p.x, start.x), top: Math.min(p.y, start.y) });
      } else if (tool === "roundedRect" && start && drawing) {
        const w = Math.abs(p.x - start.x);
        const h = Math.abs(p.y - start.y);
        const r = Math.min(12, Math.min(w, h) / 4);
        drawing.set({ width: w, height: h, left: Math.min(p.x, start.x), top: Math.min(p.y, start.y), rx: r, ry: r });
      } else if (tool === "circle" && start && drawing) {
        const r = Math.max(Math.abs(p.x - start.x), Math.abs(p.y - start.y)) / 2;
        drawing.set({ radius: Math.max(1, r), left: Math.min(p.x, start.x), top: Math.min(p.y, start.y) });
      } else if (tool === "ellipse" && start && drawing) {
        const rx = Math.abs(p.x - start.x) / 2;
        const ry = Math.abs(p.y - start.y) / 2;
        drawing.set({ rx, ry, left: Math.min(p.x, start.x), top: Math.min(p.y, start.y) });
      } else if ((tool === "triangle" || tool === "star") && start && drawing) {
        const box = bboxFromPoints(start, p);
        const pts = tool === "triangle" ? trianglePoints(box) : starPoints(box);
        drawing.set({ points: pts });
        drawing.setCoords();
      } else if (tool === "line" && start && drawing) {
        drawing.set({ x2: p.x, y2: p.y });
      } else if (tool === "arrow" && start && drawing) {
        drawing.set({ points: arrowOutlinePoints(start, p) });
        drawing.setCoords();
      } else if (tool === "arc" && start && drawing) {
        const box = bboxFromPoints(start, p);
        const r = Math.max(box.width, box.height) / 2;
        drawing.set({
          radius: Math.max(1, r),
          left: box.left,
          top: box.top,
          startAngle: 0,
          endAngle: arcSweepDegrees(box),
        });
      } else if (tool === "dimension" && dimStart && drawing) {
        drawing.set({ x2: p.x, y2: p.y });
      }
      c.requestRenderAll();
    };
    const onUp = () => {
      if (drawing && start && tool !== "dimension") {
        if (isTooSmallDrawnShape(drawing, tool)) {
          c.remove(drawing);
        } else {
          drawing.setCoords();
          c.fire("object:modified", { target: drawing });
          // Mirror the text tool: select what was just drawn and hand control
          // back to the select tool so properties/color are immediately editable
          // (previously the draw tool stayed active and nothing was selected).
          c.setActiveObject(drawing);
          setTool("select");
        }
        drawing = null;
        start = null;
        c.requestRenderAll();
      }
    };
    const onDbl = () => {
      if (tool === "polygon" && polyPoints && polyPoints.length >= 3) {
        if (polyPreview) c.remove(polyPreview);
        const { fill: drawFill, stroke: drawStroke } = drawColorsRef.current;
        const poly = new fabric.Polygon([...polyPoints], { fill: drawFill, stroke: drawStroke, strokeWidth: 1.5, strokeUniform: true });
        tag(poly, "Polygon"); c.add(poly);
        polyPoints = null; polyPreview = null;
        c.fire("object:modified", { target: poly });
        c.setActiveObject(poly);
        setTool("select");
      }
    };
    c.on("mouse:down", onDown);
    c.on("mouse:move", onMove);
    c.on("mouse:up", onUp);
    c.on("mouse:dblclick", onDbl);
    return () => {
      c.off("mouse:down", onDown); c.off("mouse:move", onMove);
      c.off("mouse:up", onUp); c.off("mouse:dblclick", onDbl);
      if (polyPreview) c.remove(polyPreview);
      if (drawing && drawing.data?.isDimPreview) c.remove(drawing);
    };
  }, [ready, tool, fabricRef, snapEnabled, gridSize]);

  useEffect(() => {
    if (!ready || !isFreehandTool(tool)) return;
    const c = fabricRef.current;
    if (c?.freeDrawingBrush) {
      c.freeDrawingBrush.color = drawColors.stroke;
      c.freeDrawingBrush.width = freehandStrokeWidth(tool);
    }
  }, [ready, tool, drawColors.stroke, fabricRef]);

  // Actions
  const setObjectProp = (patch: Record<string, unknown>) => {
    const c = fabricRef.current;
    if (!c) return;
    const active = c.getActiveObject();
    if (!active) return;
    const p = { ...patch };
    if (p.length !== undefined && active.type === "line") {
      setLineLengthPx(active as fabric.Line & { set: (q: Record<string, number>) => void }, Number(p.length));
      delete p.length;
    }
    if (p.height_mm !== undefined) {
      const oo = asOo(active);
      const prev = (oo.data?.dimensions && typeof oo.data.dimensions === "object")
        ? (oo.data.dimensions as Record<string, number>)
        : {};
      oo.data = {
        ...oo.data,
        dimensions: {
          width_mm: prev.width_mm ?? DEFAULT_FURNITURE_DIMS_MM.width_mm,
          depth_mm: prev.depth_mm ?? DEFAULT_FURNITURE_DIMS_MM.depth_mm,
          height_mm: Number(p.height_mm) || DEFAULT_FURNITURE_DIMS_MM.height_mm,
        },
      };
      delete p.height_mm;
    }
    if (p.width !== undefined) { const s = active.getScaledWidth(); const w = Number(p.width); active.scaleX *= w / s; delete p.width; }
    if (p.height !== undefined) { const s = active.getScaledHeight(); const h = Number(p.height); active.scaleY *= h / s; delete p.height; }
    if (Object.keys(p).length) active.set(p);
    active.setCoords();
    c.fire("object:modified", { target: active });
    c.requestRenderAll();
  };

  const applyFill = (color: string) => {
    setDrawColors((prev) => mergeDrawDefaultsForTool(prev, "fill", color, tool));
    const c = fabricRef.current;
    if (!c) return;
    const list = c.getActiveObjects();
    list.forEach((o) => o.set(colorPatchForObject("fill", color, o.type)));
    c.requestRenderAll();
    if (list.length) c.fire("object:modified", { target: list[0] });
  };
  const applyStroke = (color: string) => {
    setDrawColors((prev) => mergeDrawDefaultsForTool(prev, "stroke", color, tool));
    const c = fabricRef.current;
    if (!c) return;
    const list = c.getActiveObjects();
    list.forEach((o) => o.set(colorPatchForObject("stroke", color, o.type)));
    c.requestRenderAll();
    if (list.length) c.fire("object:modified", { target: list[0] });
  };

  const deleteSelected = () => {
    const c = fabricRef.current;
    if (!c) return;
    c.getActiveObjects().forEach((o) => c.remove(o));
    c.discardActiveObject();
    c.requestRenderAll();
  };
  const duplicateSelected = async () => {
    const c = fabricRef.current;
    if (!c) return;
    const a = c.getActiveObject();
    if (!a) return;
    const cl = asOo(await a.clone(["data"]));
    cl.set({ left: (a.left || 0) + 20, top: (a.top || 0) + 20 });
    tag(cl, asOo(a).data?.label as string | undefined);
    c.add(cl);
    c.setActiveObject(cl);
    c.requestRenderAll();
  };
  const groupSelected = () => {
    const c = fabricRef.current;
    if (!c) return;
    const objs = c.getActiveObjects();
    if (objs.length < 2) return;
    objs.forEach((o) => c.remove(o));
    const g = tag(new fabric.Group(objs), "Group");
    c.add(g);
    c.setActiveObject(g);
    c.requestRenderAll();
  };
  const ungroupSelected = () => {
    const c = fabricRef.current;
    if (!c) return;
    const a = c.getActiveObject();
    if (!a || a.type !== "group" || !(a instanceof fabric.Group)) return;
    c.remove(a);
    const items = a.removeAll();
    c.add(...items);
    const selection = new fabric.ActiveSelection(items, { canvas: c });
    c.setActiveObject(selection);
    c.requestRenderAll();
  };
  const selectAll = () => {
    const c = fabricRef.current;
    if (!c) return;
    const objs = c.getObjects().filter((o) => !asOo(o).data?.isGridLine && !asOo(o).data?.isGuide);
    if (!objs.length) return;
    const sel = new fabric.ActiveSelection(objs, { canvas: c });
    c.setActiveObject(sel);
    c.requestRenderAll();
  };
  const copySel = async () => {
    const c = fabricRef.current;
    if (!c) return;
    const a = c.getActiveObject();
    if (!a) return;
    clipRef.current = asOo(await a.clone(["data"]));
    showToast("Copied");
  };
  const pasteSel = async () => {
    const c = fabricRef.current;
    if (!c || !clipRef.current) return;
    const cl = asOo(await clipRef.current.clone(["data"]));
    cl.set({ left: (cl.left || 0) + 20, top: (cl.top || 0) + 20 });
    tag(cl, cl.data?.label as string | undefined);
    c.add(cl);
    c.setActiveObject(cl);
    c.requestRenderAll();
  };

  // Layer ops
  const findById = (id: string) => fabricRef.current?.getObjects().find((o) => asOo(o).data?.id === id);
  const layerToggleVisible = (id: string) => { const c = fabricRef.current; const o = findById(id); if (!c || !o) return; o.visible = !o.visible; c.requestRenderAll(); refreshLayers(); };
  const layerToggleLock = (id: string) => { const c = fabricRef.current; const o = findById(id); if (!c || !o) return; const l = !o.lockMovementX; o.set({ lockMovementX: l, lockMovementY: l, lockScalingX: l, lockScalingY: l, lockRotation: l, selectable: !l }); c.requestRenderAll(); refreshLayers(); };
  const layerDelete = (id: string) => { const c = fabricRef.current; const o = findById(id); if (!c || !o) return; c.remove(o); c.requestRenderAll(); };
  const layerReorder = (id: string, dir: number) => { const c = fabricRef.current; const o = findById(id); if (!c || !o) return; if (dir < 0) c.bringObjectForward(o); else c.sendObjectBackwards(o); c.requestRenderAll(); refreshLayers(); };
  const layerSelect = (id: string) => { const c = fabricRef.current; const o = findById(id); if (!c || !o) return; c.setActiveObject(o); c.requestRenderAll(); };
  const rotate90 = () => { const c = fabricRef.current; if (!c) return; const a = c.getActiveObject(); if (!a) return; a.set({ angle: (a.angle || 0) + 90 }); a.setCoords(); c.fire("object:modified", { target: a }); c.requestRenderAll(); };

  // Align / distribute / flip
  const doAlign = (mode: string) => {
    const c = fabricRef.current;
    if (!c) return;
    const active = c.getActiveObject();
    if (!active) return;
    if (mode === "flipH" || mode === "flipV") {
      if (active instanceof fabric.ActiveSelection) {
        active.getObjects().forEach((o) => o.set(mode === "flipH" ? { flipX: !o.flipX } : { flipY: !o.flipY }));
      } else {
        active.set(mode === "flipH" ? { flipX: !active.flipX } : { flipY: !active.flipY });
      }
      c.requestRenderAll(); c.fire("object:modified", { target: active }); return;
    }
    if (mode === "rotate90") { rotate90(); return; }
    if (!(active instanceof fabric.ActiveSelection)) return;
    const objs = active.getObjects();
    if (objs.length < 2) return;
    const boxes = objs.map((o) => ({ o, b: o.getBoundingRect() }));
    // Bounding of selection group
    const minL = Math.min(...boxes.map((box) => box.b.left));
    const minT = Math.min(...boxes.map((box) => box.b.top));
    const maxR = Math.max(...boxes.map((box) => box.b.left + box.b.width));
    const maxB = Math.max(...boxes.map((box) => box.b.top + box.b.height));
    const cx = (minL + maxR) / 2;
    const cy = (minT + maxB) / 2;
    // Dissolve active selection so alignment deltas apply in canvas space.
    const canvasSel = c.getActiveObject();
    if (!(canvasSel instanceof fabric.ActiveSelection)) return;
    const list = canvasSel.getObjects();
    c.remove(canvasSel);
    list.forEach((item) => c.add(item));
    const newSel = new fabric.ActiveSelection(list, { canvas: c });
    c.setActiveObject(newSel);
    const applyDelta = (o: fabric.FabricObject, dx: number, dy: number) => { o.set({ left: (o.left || 0) + dx, top: (o.top || 0) + dy }); o.setCoords(); };
    list.forEach((o) => {
      const b = o.getBoundingRect();
      if (mode === "left") applyDelta(o, minL - b.left, 0);
      else if (mode === "right") applyDelta(o, maxR - (b.left + b.width), 0);
      else if (mode === "centerX") applyDelta(o, cx - (b.left + b.width / 2), 0);
      else if (mode === "top") applyDelta(o, 0, minT - b.top);
      else if (mode === "bottom") applyDelta(o, 0, maxB - (b.top + b.height));
      else if (mode === "centerY") applyDelta(o, 0, cy - (b.top + b.height / 2));
    });
    if (mode === "distH" || mode === "distV") {
      const sorted = [...list].sort((a, b) => {
        const ba = a.getBoundingRect(); const bb = b.getBoundingRect();
        return mode === "distH" ? (ba.left - bb.left) : (ba.top - bb.top);
      });
      const first = sorted[0].getBoundingRect();
      const last = sorted[sorted.length - 1].getBoundingRect();
      if (mode === "distH") {
        const total = (last.left) - (first.left + first.width);
        const totalOthersW = sorted.slice(1, -1).reduce((acc, o) => acc + o.getBoundingRect().width, 0);
        const gap = (total - totalOthersW) / (sorted.length - 1);
        let cursor = first.left + first.width + gap;
        sorted.slice(1, -1).forEach((o) => {
          const b = o.getBoundingRect();
          applyDelta(o, cursor - b.left, 0);
          cursor += b.width + gap;
        });
      } else {
        const total = (last.top) - (first.top + first.height);
        const totalOthersH = sorted.slice(1, -1).reduce((acc, o) => acc + o.getBoundingRect().height, 0);
        const gap = (total - totalOthersH) / (sorted.length - 1);
        let cursor = first.top + first.height + gap;
        sorted.slice(1, -1).forEach((o) => {
          const b = o.getBoundingRect();
          applyDelta(o, 0, cursor - b.top);
          cursor += b.height + gap;
        });
      }
    }
    c.requestRenderAll();
    const modifiedTarget = c.getActiveObject();
    if (modifiedTarget) c.fire("object:modified", { target: modifiedTarget });
  };

  // Exports
  const withGridHidden = <T,>(fn: (c: fabric.Canvas) => T): T | undefined => {
    const c = fabricRef.current;
    if (!c) return undefined;
    const grid = c.getObjects().filter((o) => asOo(o).data?.isGridLine);
    grid.forEach((g) => { g.visible = false; });
    c.requestRenderAll();
    try {
      return fn(c);
    } finally {
      grid.forEach((g) => { g.visible = true; });
      c.requestRenderAll();
    }
  };

  const doExportPNG = () => {
    const url = withGridHidden((c) => exportTightPNG(c, 3) || exportPNG(c));
    if (!url) return;
    downloadDataUrl(url, "furniture.png");
    showToast("Exported PNG");
  };
  const doExportJPG = () => {
    const url = withGridHidden((c) => exportTightJPEG(c, 3) || exportJPEG(c));
    if (!url) return;
    downloadDataUrl(url, "furniture.jpg");
    showToast("Exported JPG");
  };
  const doExportSVG = () => {
    const result = withGridHidden((c) => exportSVG(c));
    if (!result) return;
    downloadDataUrl(result.dataUrl, "furniture.svg");
    showToast("Exported SVG");
  };
  const doExportJSON = () => {
    const c = fabricRef.current;
    if (!c) return;
    // Strip grid lines from the dump so re-import does not duplicate chrome.
    const json = exportCanvasJson(c);
    if (Array.isArray(json.objects)) {
      json.objects = (json.objects as Array<{ data?: { isGridLine?: boolean } }>).filter(
        (o) => !o?.data?.isGridLine,
      );
    }
    downloadText(canvasJsonToDownloadText(json), "furniture.json", "application/json;charset=utf-8");
    showToast("Exported JSON");
  };
  const doExportDXF = () => {
    try {
      const c = fabricRef.current;
      if (!c || c.getObjects().filter((o) => !asOo(o).data?.isGridLine).length === 0) {
        showToast("Draw something first", "error"); return;
      }
      downloadDxf(c, "furniture", { pxPerMm: SCALE_PX_PER_MM });
      showToast("Exported DXF (mm, layered)");
    } catch (e) {
      showToast(`DXF failed: ${getErrorMessage(e)}`, "error");
    }
  };

  const importFileRef = useRef<HTMLInputElement | null>(null);
  const [topbarSlot, setTopbarSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setTopbarSlot(document.getElementById("topbar-actions-slot"));
  }, []);

  const newDrawing = () => {
    const c = fabricRef.current; if (!c) return;
    c.getObjects().filter((o) => !asOo(o).data?.isGridLine).forEach((o) => c.remove(o));
    c.discardActiveObject(); c.requestRenderAll();
    drawGrid();
    setTemplateMenuOpen(false);
    showToast("New drawing");
  };

  // Compute stats of drawn objects
  const getDrawnBounds = () => {
    const c = fabricRef.current;
    if (!c) return null;
    const drawn = c.getObjects().filter((o) => !asOo(o).data?.isGridLine && !asOo(o).data?.isGuide);
    if (drawn.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    drawn.forEach((o) => { const b = o.getBoundingRect(); minX = Math.min(minX, b.left); minY = Math.min(minY, b.top); maxX = Math.max(maxX, b.left + b.width); maxY = Math.max(maxY, b.top + b.height); });
    return { minX, minY, maxX, maxY, wMm: Math.max(50, Math.round((maxX - minX) / SCALE_PX_PER_MM)), dMm: Math.max(50, Math.round((maxY - minY) / SCALE_PX_PER_MM)) };
  };

  const openSave = () => {
    const b = getDrawnBounds();
    if (!b) { showToast("Draw something first", "error"); return; }
    setSaveData((s) => ({
      ...s,
      name: aiSuggestion?.name || s.name,
      category: aiSuggestion?.category || s.category,
      tags: aiSuggestion?.tags?.join(", ") || s.tags,
      width_mm: aiSuggestion?.dimensions?.width_mm || b.wMm,
      depth_mm: aiSuggestion?.dimensions?.depth_mm || b.dMm,
      height_mm: aiSuggestion?.dimensions?.height_mm || s.height_mm || DEFAULT_FURNITURE_DIMS_MM.height_mm,
    }));
    setSaveOpen(true);
  };

  const doSave = async () => {
    setSaving(true);
    try {
      const c = fabricRef.current;
      if (!c) return;
      const topPng = exportTightPNG(c, 3);
      const grid = c.getObjects().filter((o) => asOo(o).data?.isGridLine);
      grid.forEach((g) => { g.visible = false; });
      c.requestRenderAll();
      const { dataUrl: topSvg } = exportSVG(c);
      grid.forEach((g) => { g.visible = true; });
      c.requestRenderAll();
      const topFabric = c.toObject(["data"]);
      const payload = {
        name: saveData.name || "Untitled",
        category: saveData.category,
        subcategory: saveData.subcategory || null,
        tags: (saveData.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
        dimensions: { width_mm: Number(saveData.width_mm) || 100, depth_mm: Number(saveData.depth_mm) || 100, height_mm: Number(saveData.height_mm) || 100 },
        notes: saveData.notes || null,
        top_png: topPng, top_svg: topSvg, top_fabric_json: topFabric, is_custom: true,
      };
      const item = await createFurniture(payload);
      addCatalogItem(item);
      let publishNote = "";
      if (flag("studioPublishCatalog") && item?.id) {
        try {
          // Guest/member save always publishes as draft; live promotion is admin-only on the API.
          const published = await publishFurniture(String(item.id), { goLive: false });
          publishNote = ` · catalog v${published.version} (${published.slug})`;
        } catch (pubErr) {
          publishNote = ` · publish deferred: ${getErrorMessage(pubErr)}`;
        }
      }
      showToast(`Saved "${item.name}" to catalog${publishNote}`);
      setSaveOpen(false);
    } catch (e) {
      showToast(`Save failed: ${getErrorMessage(e)}`, "error");
    } finally { setSaving(false); }
  };

  type ShortcutHandlers = {
    undo?: () => void;
    redo?: () => void;
    delete?: () => void;
    duplicate?: () => void;
    group?: () => void;
    save?: () => void;
    selectAll?: () => void;
    copy?: () => void;
    paste?: () => void;
    escape?: () => void;
    tool?: (t: string) => void;
  };

  useKeyboardShortcuts({
    undo: history.undo, redo: history.redo,
    delete: deleteSelected, duplicate: duplicateSelected, group: groupSelected,
    save: openSave, selectAll, copy: copySel, paste: pasteSel,
    escape: () => setTool("select"), tool: (t: string) => setTool(t),
  } as ShortcutHandlers, [history.undo, history.redo] as never[]);

  useEffect(() => { refreshCatalog(); }, [refreshCatalog]);

  // Import helpers
  const viewportCenterPx = (c: fabric.Canvas) => {
    const cw = c.getWidth() || 800;
    const ch = c.getHeight() || 600;
    const vpt = c.viewportTransform || [1, 0, 0, 1, 0, 0];
    const zx = vpt[0] || 1;
    const zy = vpt[3] || 1;
    return {
      x: (cw / 2 - vpt[4]) / zx,
      y: (ch / 2 - vpt[5]) / zy,
    };
  };

  const clearUserObjects = (c: fabric.Canvas) => {
    c.getObjects().filter((o) => !asOo(o).data?.isGridLine).forEach((o) => c.remove(o));
  };

  const importSvgToCanvas = async (svgString: string, dimensions: Partial<FurnitureDimensions> | undefined) => {
    const c = fabricRef.current;
    if (!c) throw new Error("Canvas not ready");
    clearUserObjects(c);
    let res;
    try {
      res = await fabric.loadSVGFromString(svgString);
    } catch (err) {
      console.error("[Studio] loadSVGFromString threw:", err);
      throw new Error(`SVG parse failed: ${getErrorMessage(err)}`);
    }
    const rawObjs = res?.objects || [];
    const cleaned = rawObjs.filter((o): o is fabric.FabricObject => o !== null && o !== undefined);
    if (cleaned.length === 0) throw new Error("SVG produced no drawable objects");

    let g;
    try {
      g = fabric.util.groupSVGElements(cleaned, res?.options || {});
    } catch (err) {
      console.warn("[Studio] groupSVGElements failed, falling back to fabric.Group:", err);
      g = null;
    }
    if (!g || !(g instanceof fabric.Object)) {
      g = new fabric.Group(cleaned, {});
    }

    const targetWpx = Math.max(20, (dimensions?.width_mm || DEFAULT_FURNITURE_DIMS_MM.width_mm) * SCALE_PX_PER_MM);
    const targetHpx = Math.max(20, (dimensions?.depth_mm || DEFAULT_FURNITURE_DIMS_MM.depth_mm) * SCALE_PX_PER_MM);

    let bw = g.width || 0;
    let bh = g.height || 0;
    if (!bw || !bh) {
      try {
        const br = g.getBoundingRect ? g.getBoundingRect() : null;
        if (br) { bw = bw || br.width; bh = bh || br.height; }
      } catch { /* ignore */ }
    }
    if (!bw) bw = targetWpx;
    if (!bh) bh = targetHpx;

    const sx = targetWpx / bw;
    const sy = targetHpx / bh;
    const center = viewportCenterPx(c);
    g.set({ left: center.x - targetWpx / 2, top: center.y - targetHpx / 2, scaleX: sx, scaleY: sy });
    tag(g, "Imported SVG");
    c.add(g);
    c.setActiveObject(g);
    c.requestRenderAll();
  };

  const importJsonToCanvas = async (text: string) => {
    const c = fabricRef.current;
    if (!c) throw new Error("Canvas not ready");
    const parsed = parseStudioCanvasJson(text);
    if (!parsed.ok) throw new Error(parsed.error);
    clearUserObjects(c);
    const loaded = c.loadFromJSON(parsed.json);
    if (loaded && typeof (loaded as Promise<unknown>).then === "function") {
      await loaded;
    }
    drawGrid();
    c.requestRenderAll();
  };

  const importImageToCanvas = async (file: File) => {
    const c = fabricRef.current;
    if (!c) throw new Error("Canvas not ready");
    const dataUrl = await readFileAsDataUrl(file);
    const img = await fabric.FabricImage.fromURL(dataUrl, { crossOrigin: "anonymous" });
    const center = viewportCenterPx(c);
    const maxW = (c.getWidth() || 800) * 0.6;
    const maxH = (c.getHeight() || 600) * 0.6;
    const iw = img.width || maxW;
    const ih = img.height || maxH;
    const scale = Math.min(1, maxW / iw, maxH / ih);
    img.set({
      left: center.x - (iw * scale) / 2,
      top: center.y - (ih * scale) / 2,
      scaleX: scale,
      scaleY: scale,
    });
    const tagged = tag(img, file.name || "Imported image");
    tagged.data = { ...tagged.data, kind: "image" };
    c.add(img);
    c.setActiveObject(img);
    c.requestRenderAll();
  };

  const applyFurnitureTemplate = useCallback((id: FurnitureTemplateId | string) => {
    const template = getFurnitureTemplate(id);
    const c = fabricRef.current;
    if (!template || !c) {
      showToast("Template not available", "error");
      return;
    }
    clearUserObjects(c);
    const center = viewportCenterPx(c);
    const specs = resolveTemplateShapesToCanvas(template, {
      scalePxPerMm: SCALE_PX_PER_MM,
      centerX: center.x,
      centerY: center.y,
    });
    const added: fabric.FabricObject[] = [];
    for (const s of specs) {
      let obj: fabric.FabricObject;
      if (s.kind === "rect") {
        obj = new fabric.Rect({
          left: s.left,
          top: s.top,
          width: s.width,
          height: s.height,
          rx: s.rx ?? 0,
          ry: s.rx ?? 0,
          fill: s.fill,
          stroke: s.stroke,
          strokeWidth: s.strokeWidth,
          strokeUniform: true,
        });
      } else {
        // ellipse + circle share Fabric Ellipse (rx/ry from box)
        obj = new fabric.Ellipse({
          left: s.left,
          top: s.top,
          rx: Math.max(0.5, s.width / 2),
          ry: Math.max(0.5, s.height / 2),
          fill: s.fill,
          stroke: s.stroke,
          strokeWidth: s.strokeWidth,
          strokeUniform: true,
        });
      }
      tag(asOo(obj), s.label);
      c.add(obj);
      added.push(obj);
    }
    if (added.length === 1) {
      c.setActiveObject(added[0]);
    } else if (added.length > 1) {
      c.setActiveObject(new fabric.ActiveSelection(added, { canvas: c }));
    }
    if (added[0]) c.fire("object:modified", { target: added[0] });
    c.requestRenderAll();
    setSaveData((prev) => ({
      ...prev,
      name: template.name,
      category: template.category,
      width_mm: template.dimensions.width_mm,
      depth_mm: template.dimensions.depth_mm,
      height_mm: template.dimensions.height_mm,
    }));
    setTemplateMenuOpen(false);
    showToast(`Loaded ${template.name} template`);
  }, [showToast]);

  const doImportFile = () => {
    importFileRef.current?.click();
  };

  const onImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const kind = detectStudioImportKind(file);
      if (kind === "svg") {
        const text = await readFileAsText(file);
        await importSvgToCanvas(text, undefined);
      } else if (kind === "json") {
        const text = await readFileAsText(file);
        await importJsonToCanvas(text);
      } else if (kind === "image") {
        await importImageToCanvas(file);
      } else {
        throw new Error("Unsupported file type. Use SVG, JSON, PNG, JPG, WEBP, GIF, BMP, or AVIF.");
      }
      showToast(`Imported ${file.name}`);
    } catch (e) {
      showToast(`Import failed: ${getErrorMessage(e)}`, "error");
    }
  };

  const onAiGenerate = async (prompt: string) => {
    setGenerating(true);
    try {
      const res = await aiApi.generate(prompt);
      await importSvgToCanvas(res.svg, res.dimensions);
      setAiSuggestion(res);
      setSaveData((s) => ({
        ...s,
        name: res.name || s.name,
        category: res.category || s.category,
        tags: (res.tags || []).join(", "),
        width_mm: res.dimensions?.width_mm || s.width_mm,
        depth_mm: res.dimensions?.depth_mm || s.depth_mm,
        height_mm: res.dimensions?.height_mm || s.height_mm,
      }));
      showToast(`Generated "${res.name}"`);
    } catch (e) {
      showToast(`AI generate failed: ${getApiErrorMessage(e)}`, "error");
    } finally { setGenerating(false); }
  };
  const onAiSuggest = async () => {
    setGenerating(true);
    try {
      const c = fabricRef.current;
      if (!c) return;
      const grid = c.getObjects().filter((o) => asOo(o).data?.isGridLine);
      grid.forEach((g) => { g.visible = false; });
      c.requestRenderAll();
      const { svg } = exportSVG(c);
      grid.forEach((g) => { g.visible = true; });
      c.requestRenderAll();
      const res = await aiApi.suggest(svg, "Furniture top view symbol");
      setAiSuggestion(res);
      setSaveData((s) => ({
        ...s,
        name: res.name || s.name,
        category: res.category || s.category,
        tags: (res.tags || []).join(", "),
        width_mm: res.dimensions?.width_mm || s.width_mm,
        depth_mm: res.dimensions?.depth_mm || s.depth_mm,
        height_mm: res.dimensions?.height_mm || s.height_mm,
      }));
      showToast(`AI suggests: ${res.name} (${res.dimensions?.width_mm}×${res.dimensions?.depth_mm}×${res.dimensions?.height_mm}mm)`);
    } catch (e) {
      showToast(`AI suggest failed: ${getApiErrorMessage(e)}`, "error");
    } finally { setGenerating(false); }
  };
  const onAiRestyle = async () => {
    setGenerating(true);
    try {
      const c = fabricRef.current;
      if (!c) return;
      const grid = c.getObjects().filter((o) => asOo(o).data?.isGridLine);
      grid.forEach((g) => { g.visible = false; });
      c.requestRenderAll();
      const { svg } = exportSVG(c);
      grid.forEach((g) => { g.visible = true; });
      c.requestRenderAll();
      const res = await aiApi.restyle(svg, "Clean up geometry, simplify, straighten edges");
      const b = getDrawnBounds();
      const dims = { width_mm: b?.wMm || DEFAULT_FURNITURE_DIMS_MM.width_mm, depth_mm: b?.dMm || DEFAULT_FURNITURE_DIMS_MM.depth_mm };
      await importSvgToCanvas(res.svg, dims);
      showToast("Restyled");
    } catch (e) {
      showToast(`Restyle failed: ${getApiErrorMessage(e)}`, "error");
    } finally { setGenerating(false); }
  };

  // Context menu
  const buildContextMenu = () => {
    const c = fabricRef.current;
    const active = c?.getActiveObject();
    const hasActive = !!active;
    return [
      { id: "copy", label: "Copy", icon: "copy", shortcut: "⌘C", onClick: copySel, disabled: !hasActive },
      { id: "paste", label: "Paste", icon: "copy", shortcut: "⌘V", onClick: pasteSel, disabled: !clipRef.current },
      { id: "duplicate", label: "Duplicate", icon: "copy", shortcut: "⌘D", onClick: duplicateSelected, disabled: !hasActive },
      { separator: true },
      { id: "rotate90", label: "Rotate 90°", icon: "redo", onClick: rotate90, disabled: !hasActive },
      { id: "flipH", label: "Flip horizontal", icon: "redo", onClick: () => doAlign("flipH"), disabled: !hasActive },
      { id: "flipV", label: "Flip vertical", icon: "redo", onClick: () => doAlign("flipV"), disabled: !hasActive },
      { id: "group", label: "Group", icon: "group", shortcut: "⌘G", onClick: groupSelected, disabled: !(active && active.type === "activeselection") },
      { id: "ungroup", label: "Ungroup", icon: "group", onClick: ungroupSelected, disabled: !(active && active.type === "group") },
      { separator: true },
      { id: "forward", label: "Bring forward", icon: "arrowUp", onClick: () => { if (active && c) { c.bringObjectForward(active); c.requestRenderAll(); refreshLayers(); } }, disabled: !hasActive },
      { id: "backward", label: "Send backward", icon: "arrowDown", onClick: () => { if (active && c) { c.sendObjectBackwards(active); c.requestRenderAll(); refreshLayers(); } }, disabled: !hasActive },
      { separator: true },
      { id: "delete", label: "Delete", icon: "trash", shortcut: "Del", onClick: deleteSelected, disabled: !hasActive },
    ];
  };

  const hasSvg = layers.length > 0;

  const studioCtx = {
    scalePxPerMm: SCALE_PX_PER_MM,
    propObj, setObjectProp, applyFill, applyStroke,
    drawFill: drawColors.fill, drawStroke: drawColors.stroke, activeTool: tool,
    layers, selectedIds, hasSelection: !!propObj, hasSvg,
    onAiGenerate, onAiSuggest, onAiRestyle, generating,
    layerSelect, layerToggleVisible, layerToggleLock, layerDelete, layerReorder,
  };

  const hasSelectionForAlign = selectedIds.length >= 1;
  const hasSelectionForDistribute = selectedIds.length >= 3;
  const toolbarHandlers: Record<string, ToolbarItemHandler> = {
    new: { onClick: newDrawing },
    import: {
      content: flag("studioImportFiles") ? (
        <button className="btn btn--sm" onClick={doImportFile} data-testid="btn-import-file" data-legacy-testid="btn-import-svg" type="button" title="Import SVG, JSON, PNG, JPG, WEBP, GIF, BMP, AVIF">
          <PhIcon name="upload" size={16} /> Import
        </button>
      ) : null,
    },
    save: {
      content: flag("studioPublishCatalog") ? (
        <button className="btn btn--primary btn--sm" onClick={openSave} data-testid="btn-save" type="button">
          <PhIcon name="save" size={16} /> Save
        </button>
      ) : null,
    },
    undo: { onClick: history.undo, disabled: !history.canUndo },
    redo: { onClick: history.redo, disabled: !history.canRedo },
    align: { onClick: () => { doAlign("centerX"); doAlign("centerY"); }, disabled: !hasSelectionForAlign },
    distribute: { onClick: () => doAlign("distH"), disabled: !hasSelectionForDistribute },
    flip: { onClick: () => doAlign("flipH"), disabled: !hasSelectionForAlign },
    rotate: { onClick: () => doAlign("rotate90"), disabled: !hasSelectionForAlign },
    grid: { onClick: toggleGrid, active: showGrid },
    snap: { onClick: toggleSnap, active: snapEnabled },
    fit: { onClick: core.fitToContent },
    export: {
      content: (
        <ExportMenu
          sections={[
            {
              id: "drawing",
              heading: "Drawing",
              items: [
                flag("studioExportSvg") ? { id: "svg", label: "SVG", onSelect: doExportSVG, testId: "btn-export-svg" } : null,
                flag("studioExportJson") ? { id: "json", label: "JSON", onSelect: doExportJSON, testId: "btn-export-json" } : null,
                flag("studioExportPng") ? { id: "png", label: "PNG", onSelect: doExportPNG, testId: "btn-export-png" } : null,
                flag("studioExportJpg") ? { id: "jpg", label: "JPG", onSelect: doExportJPG, testId: "btn-export-jpg" } : null,
                flag("studioExportDxf") ? { id: "dxf", label: "DXF", onSelect: doExportDXF, testId: "btn-export-dxf" } : null,
              ].filter((item): item is NonNullable<typeof item> => item !== null),
            },
          ].filter((section) => section.items.length > 0)}
        />
      ),
    },
  };

  return (
    <StudioContext.Provider value={studioCtx as never}>
    <div className="studio-stack">
      <StudioTopToolbar handlers={toolbarHandlers} />
    <div className="workspace" data-testid="studio-workspace">
      <aside
        className="side-panel side-panel--left side-panel--dock"
        data-testid="studio-left-panel"
        aria-label="Studio catalog and tools"
        data-collapsed={leftCollapsed}
        style={{
          width: leftCollapsed ? 0 : leftPanel.width,
          display: leftCollapsed ? "none" : undefined,
        }}
      >
        {!leftCollapsed && (
          <DockShell
            panels={STUDIO_LEFT_PANELS}
            storageKey="studio.dock.left.v10"
            onEmpty={() => {
              leftDockApiRef.current = null;
              setLeftCollapsed(true);
            }}
            onReadyApi={(api) => {
              leftDockApiRef.current = api;
              const pending = pendingLeftFocusRef.current;
              if (pending) {
                ensureAndActivateDockPanel(api, STUDIO_LEFT_PANELS, pending);
                pendingLeftFocusRef.current = null;
              }
            }}
          />
        )}
        <SidePanelResizeHandle edge="end" active={leftPanel.active} {...leftPanel.handleProps} />
      </aside>
      <ToolRail tools={STUDIO_TOOLS} activeTool={tool} onSelect={setTool}
        extras={<>
          <button type="button" className="icon-btn" onClick={history.undo} title="Undo (⌘Z)" aria-label="Undo" data-testid="btn-undo"><PhIcon name="undo" size={20} /></button>
          <button type="button" className="icon-btn" onClick={history.redo} title="Redo (⌘Y)" aria-label="Redo" data-testid="btn-redo"><PhIcon name="redo" size={20} /></button>
        </>}
      />
      <div className="canvas-stage" data-testid="canvas-stage" data-rulers="true">
        <div ref={wrapperRef} className="canvas-stage__inner">
          <canvas ref={canvasElRef} data-testid="studio-canvas" />
        </div>
        {ready && !hasSvg && (
          <div className="canvas-empty-cta" data-testid="studio-empty-cta">
            <p className="canvas-empty-cta__title">Empty canvas</p>
            <p className="canvas-empty-cta__body">Draw shapes or start from a template</p>
            <div className="canvas-empty-cta__actions">
              {listFurnitureTemplates().map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="btn btn--sm"
                  data-testid={`empty-template-${t.id}`}
                  onClick={() => applyFurnitureTemplate(t.id)}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <p className="canvas-empty-cta__hint">Start from template</p>
          </div>
        )}
        <Rulers fabricRef={fabricRef} scale={SCALE_PX_PER_MM} zoom={core.zoom} cursorMm={cursorMm} offset={undefined} />
        <DraggableCanvasOverlay storageKey="oostudio.canvas-overlay.v1">
          <DockPanelButtons
            items={[
              { id: "color", label: "Color", testId: "dock-tab-color" },
              { id: "layers", label: "Layers", testId: "dock-tab-layers" },
            ]}
            activeId={leftCollapsed ? null : activeLeftDock}
            onSelect={(id) => focusDockPanel("left", id)}
          />
          <div className="overlay-sep" />
          <DockPanelButtons
            items={[
              { id: "props", label: "Properties", testId: "dock-tab-props" },
            ]}
            activeId={rightCollapsed ? null : activeRightDock}
            onSelect={(id) => focusDockPanel("right", id)}
          />
          <div className="overlay-sep" />
          <button type="button" className="btn btn--sm" data-active={aiFloatOpen} onClick={() => setAiFloatOpen((v) => !v)} title="AI" aria-label="AI assist" data-testid="toggle-ai-float">AI</button>
          <button type="button" className="btn btn--sm" data-active={showGrid} onClick={toggleGrid} title="Grid" aria-label="Toggle grid" data-testid="toggle-grid"><PhIcon name="grid" size={16} /></button>
          <button type="button" className="btn btn--sm" data-active={snapEnabled} onClick={toggleSnap} title="Snap" aria-label="Toggle snap" data-testid="toggle-snap"><PhIcon name="magnet" size={16} /></button>
        </DraggableCanvasOverlay>
        {aiFloatOpen && (
          <FloatingPanel
            title="AI"
            onClose={() => setAiFloatOpen(false)}
            storageKey="oostudio.ai-float.v1"
            testId="ai-float-panel"
            className="floating-panel floating-panel--ai"
          >
            <StudioAiPanel />
          </FloatingPanel>
        )}
        {topbarSlot && createPortal(
          <>
            {/* New/Import/Save/Export moved into StudioTopToolbar (toolbarHandlers below) —
                Template has no toolbar equivalent, so it stays here. */}
            <div className="topbar-template" data-testid="topbar-template">
              <button
                className="btn btn--sm"
                onClick={() => setTemplateMenuOpen((v) => !v)}
                data-testid="btn-start-from-template"
                type="button"
                data-active={templateMenuOpen}
                title="Start from template"
              >
                Template
              </button>
              {templateMenuOpen && (
                <div className="topbar-template__menu" role="menu" data-testid="template-menu">
                  {listFurnitureTemplates().map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="topbar-template__item"
                      role="menuitem"
                      data-testid={`template-pick-${t.id}`}
                      onClick={() => applyFurnitureTemplate(t.id)}
                    >
                      <span className="topbar-template__item-name">{t.name}</span>
                      <span className="topbar-template__item-meta">
                        {t.dimensions.width_mm}×{t.dimensions.depth_mm} mm
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              ref={importFileRef}
              type="file"
              accept={STUDIO_IMPORT_ACCEPT}
              hidden
              aria-label="Import SVG, JSON, or image file"
              data-testid="import-file-input"
              onChange={onImportFileChange}
            />
          </>,
          topbarSlot,
        )}
        <AlignBar visible={selectedIds.length >= 1} count={selectedIds.length} onAction={doAlign} />
        <div className="canvas-info" data-testid="canvas-info">
          <div className="canvas-info__group"><span>x</span><strong>{cursorMm.x}</strong>mm</div>
          <div className="canvas-info__group"><span>y</span><strong>{cursorMm.y}</strong>mm</div>
          <div className="canvas-info__group"><span>grid</span><strong>{gridSize}</strong>mm</div>
          <div className="canvas-info__group"><span>scale</span><strong>1:{Math.round(1 / SCALE_PX_PER_MM)}</strong></div>
          {selectedIds.length > 0 && <div className="canvas-info__group"><span>sel</span><strong>{selectedIds.length}</strong></div>}
        </div>
        <ViewportControls
          zoom={core.zoom}
          onZoomIn={core.zoomIn}
          onZoomOut={core.zoomOut}
          onFit={core.fitToContent}
          onZoom100={core.zoom100}
          autoFit={autoFit}
          onToggleAutoFit={() => setAutoFit((v) => !v)}
          fullscreen={fullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>

      <aside
        className="side-panel side-panel--dock"
        data-testid="studio-side-panel"
        aria-label="Studio properties and layers"
        data-collapsed={rightCollapsed}
        style={{
          width: rightCollapsed ? 0 : rightPanel.width,
          display: rightCollapsed ? "none" : undefined,
        }}
      >
        {!rightCollapsed && (
          <DockShell
            panels={STUDIO_RIGHT_PANELS}
            storageKey="studio.dock.right.v11"
            onEmpty={() => {
              rightDockApiRef.current = null;
              setRightCollapsed(true);
            }}
            onReadyApi={(api) => {
              rightDockApiRef.current = api;
              const pending = pendingRightFocusRef.current;
              if (pending) {
                ensureAndActivateDockPanel(api, STUDIO_RIGHT_PANELS, pending);
                pendingRightFocusRef.current = null;
              }
            }}
          />
        )}
        <SidePanelResizeHandle edge="start" active={rightPanel.active} {...rightPanel.handleProps} />
      </aside>

      {core.contextMenu && (
        <ContextMenu x={core.contextMenu.x} y={core.contextMenu.y} items={buildContextMenu()} onClose={() => core.setContextMenu(null)} />
      )}

      {saveOpen && (
        <div
          className="dialog-scrim"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) setSaveOpen(false); }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSaveOpen(false);
          }}
        >
          <div className="dialog" role="dialog" aria-label="Save to catalog" data-testid="save-dialog">
            <h2 className="dialog__title">Save to catalog</h2>
            <div className="dialog__sub">Give your furniture item a name and real-world dimensions.</div>
            <div className="prop-row">
              <label className="prop-row__label" htmlFor="studio-save-name">Name</label>
              <input id="studio-save-name" className="input" value={saveData.name} onChange={(e) => setSaveData({ ...saveData, name: e.target.value })} placeholder="e.g. Task Chair" data-testid="save-name" />
            </div>
            <div className="prop-row">
              <label className="prop-row__label" htmlFor="studio-save-category">Category</label>
              <select id="studio-save-category" className="select" value={saveData.category} onChange={(e) => setSaveData({ ...saveData, category: e.target.value })} data-testid="save-category" aria-label="Category">
                {["Seating", "Desks", "Tables", "Storage", "Workstations", "Accessories", "Openings", "Custom"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="prop-row">
              <label className="prop-row__label" htmlFor="studio-save-tags">Tags</label>
              <input id="studio-save-tags" className="input" value={saveData.tags} onChange={(e) => setSaveData({ ...saveData, tags: e.target.value })} placeholder="comma, separated" />
            </div>
            <div className="prop-row">
              <div className="prop-row__label" id="studio-save-dims-label">W × D × H (mm)</div>
              <div className="prop-row__inputs" role="group" aria-labelledby="studio-save-dims-label">
                <input className="input" type="number" value={saveData.width_mm} onChange={(e) => setSaveData({ ...saveData, width_mm: Number(e.target.value) || 0 })} data-testid="save-w" aria-label="Width (mm)" />
                <input className="input" type="number" value={saveData.depth_mm} onChange={(e) => setSaveData({ ...saveData, depth_mm: Number(e.target.value) || 0 })} data-testid="save-d" aria-label="Depth (mm)" />
                <input className="input" type="number" value={saveData.height_mm} onChange={(e) => setSaveData({ ...saveData, height_mm: Number(e.target.value) || 0 })} data-testid="save-h" aria-label="Height (mm)" />
              </div>
            </div>
            <div className="dialog__actions"><button className="btn btn--ghost" onClick={() => setSaveOpen(false)}>Cancel</button><button className="btn btn--primary" onClick={doSave} disabled={saving || !saveData.name} data-testid="save-confirm">{saving ? "Saving…" : "Save"}</button></div>
          </div>
        </div>
      )}
    </div>
    </div>
    </StudioContext.Provider>
  );
};

export default Studio;
