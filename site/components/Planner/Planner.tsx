"use client";
import {
  OO,
  SCALE_PX_PER_MM,
  DEFAULT_WALL_THICKNESS_MM,
  DEFAULT_SHEET_MM,
  ooFontSans,
  ooFontSansShort,
} from "@planner/lib/plannerPalette";
import { collectUserLayerRows, isDragDrawTool, isTooSmallDrawnShape } from "@planner/lib/plannerCanvasLayers";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import * as fabric from "fabric";
import type { ModifiedEvent, TPointerEvent, TPointerEventInfo } from "fabric";
import { useRouter, useParams } from "next/navigation";
import type { DockviewApiLike, FurnitureItem, LayerRow, OoFabricObject, OoObjectData, PlannerSheet, ToolRailEntry } from "@planner/lib/plannerTypes";
import { useFabric } from "@planner/hooks/usePlannerFabric";
import { useHistory } from "@planner/hooks/usePlannerHistory";
import { useKeyboardShortcuts } from "@planner/hooks/usePlannerKeyboardShortcuts";
import { useCanvasCore } from "@planner/hooks/usePlannerCanvasCore";
import { usePlannerUIStore } from "@planner/store/plannerUiStore";
import { useCatalogStore } from "@planner/store/plannerCatalogStore";
import { ToolRail } from "@planner/components/PlannerToolRail";
import { PhIcon } from "@planner/components/ui/PlannerPhIcon";
import { ContextMenu } from "@planner/components/PlannerContextMenu";
import { ViewportControls } from "@planner/components/PlannerViewportControls";
import { Rulers } from "@planner/components/PlannerRulers";
import AutoArrangeDialog from "@planner/components/PlannerAutoArrangeDialog";
import { ProjectMenu } from "@planner/components/PlannerProjectMenu";
import { autoArrange } from "@planner/lib/plannerAutoArrange";
import { DockShell } from "@planner/components/PlannerDockShell";
import { SidePanelResizeHandle } from "@planner/components/ui/PlannerSidePanelResizeHandle";
import { usePanelResize } from "@planner/components/ui/usePlannerPanelResize";
import { DraggableCanvasOverlay } from "@planner/components/ui/PlannerDraggableCanvasOverlay";
import { ExportMenu } from "@planner/components/ui/PlannerExportMenu";
import { DockPanelButtons } from "@planner/components/ui/PlannerDockPanelButtons";
import { PlannerTopToolbar, type ToolbarItemHandler } from "@planner/components/PlannerTopToolbar";
import { PlannerWorkflowBar } from "@planner/components/PlannerWorkflowBar";
import { PlannerUnitPill } from "@planner/components/PlannerUnitPill";
import { PlannerAiPanel } from "@planner/components/PlannerAiPanel";
import { PlannerContext } from "@planner/hooks/usePlannerDockBridge";
import { PlannerCatalogPanel, PlannerSheetPanel, PlannerPropsPanel, PlannerLayersPanel, PlannerColorPanel, PlannerBoqPanel, PlannerValidationPanel } from "@planner/components/dock/PlannerDockPanels";
import { PlannerAlignBar } from "@planner/components/PlannerAlignBar";
import type { PlannerStep } from "@planner/lib/plannerStep";
import { snap as snapVal } from "@planner/lib/plannerSnap";
import { snapPoint as snapPointMm } from "@planner/lib/plannerSnapManager";
import { collectSceneGeometry, mmToPx, pxToMm } from "@planner/lib/fabricGeometryBridge";
import {
  placeOpeningOnNearestWall,
  DEFAULT_DOOR_WIDTH_MM,
  DEFAULT_WINDOW_WIDTH_MM,
} from "@planner/lib/geometry/openingPlacement";
import {
  applyAlignAction,
  type AlignAction,
  type PositionedEntity,
} from "@planner/lib/geometry/alignDistribute";
import {
  WALL_GRIP_KIND,
  WALL_GRIP_RADIUS_PX,
  wallEndpointGripPoints,
  wallEndpointsAfterGripMove,
  resolveWallForEndpointGrips,
  isWallGripData,
} from "@planner/lib/wallEndpointGrips";
import {
  buildSnapStatusLabel,
  isSnapStatusActive,
} from "@planner/lib/plannerSnapStatusLabel";
import { exportPNG, exportPDF, downloadDataUrl, exportSVG } from "@planner/lib/plannerExporters";
import { downloadDxf } from "@planner/lib/plannerDxfExport";
import { createProject, updateProject, getProject, fileUrl } from "@planner/lib/plannerApi";
import { serializeFabricCanvas } from "@planner/lib/plannerFabricSerialize";
import { useRuntimeFeatureFlags } from "@/lib/hooks/useRuntimeFeatureFlags";
import { PlannerCommandPalette } from "@planner/components/PlannerCommandPalette";
import { buildPaletteCommands } from "@planner/lib/commands/registry";
import type { PlacementOp } from "@planner/lib/ai/applySuggestedLayout";
import type { SketchRoomMm, SketchWallMm } from "@planner/lib/ai/sketchToPlanShared";

const DEFAULT_SHEET: PlannerSheet = {
  width_mm: DEFAULT_SHEET_MM.width_mm,
  height_mm: DEFAULT_SHEET_MM.height_mm,
  unit: "mm",
  scale_px_per_mm: SCALE_PX_PER_MM,
};

type PlannerTool = "select" | "pan" | "wall" | "door" | "window" | "rect" | "line" | "dimension" | "text";
type Point2D = { x: number; y: number };
type AutoArrangeParams = {
  items: Array<FurnitureItem & { count?: number }>;
  gap_mm: number;
  margin_mm: number;
};
type FabricCanvasJson = {
  objects: Array<{ data?: OoObjectData }>;
  [key: string]: unknown;
};

const asOo = (obj: fabric.FabricObject): OoFabricObject => obj as OoFabricObject;
const errMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));

const PLANNER_TOOLS: ToolRailEntry[] = [
  { id: "select", label: "Select", icon: "cursor", shortcut: "V" },
  { id: "pan", label: "Pan", icon: "hand", shortcut: "H" },
  { divider: true, id: "divider-1", label: "", icon: "" },
  { id: "wall", label: "Wall", icon: "wall", shortcut: "W" },
  { id: "door", label: "Door", icon: "door" },
  { id: "window", label: "Window", icon: "window" },
  { divider: true, id: "divider-2", label: "", icon: "" },
  { id: "line", label: "Line", icon: "line", shortcut: "L" },
  { id: "dimension", label: "Measure", icon: "dimension", shortcut: "D" },
  { id: "text", label: "Text", icon: "text", shortcut: "T" },
];

const PLANNER_LEFT_CATALOG_PANELS = [
  { id: "catalog", title: "Catalog", render: PlannerCatalogPanel },
];

const PLANNER_DRAW_SHEET_PANEL = { id: "sheet", title: "Sheet", render: PlannerSheetPanel };
const PLANNER_DRAW_COLOR_PANEL = {
  id: "color",
  title: "Color",
  render: PlannerColorPanel,
  position: { direction: "below" as const },
};

/** Place step — inspect selection and properties. */
const PLANNER_RIGHT_PLACE_PANELS = [
  { id: "props", title: "Properties", render: PlannerPropsPanel },
];

/** Review step base docks — BOQ/validation gated by feature flags at runtime. */
const PLANNER_RIGHT_REVIEW_BASE = [
  { id: "sheet", title: "Sheet", render: PlannerSheetPanel, position: { direction: "below" as const } },
  { id: "layers", title: "Layers", render: PlannerLayersPanel, position: { direction: "below" as const } },
  { id: "color", title: "Color", render: PlannerColorPanel, position: { direction: "below" as const } },
  { id: "props", title: "Properties", render: PlannerPropsPanel, position: { direction: "below" as const } },
];

const nextObjId = (() => { let n = 0; return () => `o${Date.now().toString(36)}_${(++n).toString(36)}`; })();
const tag = (obj: fabric.FabricObject, label?: string, kind?: string): OoFabricObject => {
  const oo = asOo(obj);
  oo.data = oo.data || {};
  if (!oo.data.id) oo.data.id = nextObjId();
  if (label) oo.data.label = label;
  if (kind) oo.data.kind = kind;
  return oo;
};
// Fallback binding for "which project was I just editing" that survives a
// hard refresh even when the browser's address bar doesn't happen to carry
// the project id (e.g. router.replace() not sticking before a reload) —
// see the "Load project by URL id" effect below.
const PLANNER_LAST_PROJECT_KEY = "ooplanner.last-project-id";

const Planner = () => {
  const params = useParams();
  const routeId = typeof params.id === "string" ? params.id : params.id?.[0];
  const router = useRouter();
  const { wrapperRef, canvasElRef, fabricRef, ready } = useFabric({ background: OO.canvasBg });
  const showToast = usePlannerUIStore((s) => s.showToast);
  const snapEnabled = usePlannerUIStore((s) => s.snapEnabled);
  const toggleSnap = usePlannerUIStore((s) => s.toggleSnap);
  const showGrid = usePlannerUIStore((s) => s.showGrid);
  const toggleGrid = usePlannerUIStore((s) => s.toggleGrid);
  const snapStatusLabel = useMemo(
    () => buildSnapStatusLabel(snapEnabled, showGrid),
    [snapEnabled, showGrid],
  );
  const snapStatusActive = isSnapStatusActive(snapStatusLabel);
  const gridSize = usePlannerUIStore((s) => s.gridSize);

  const [tool, setTool] = useState<PlannerTool>("wall");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [propObj, setPropObj] = useState<OoFabricObject | null>(null);
  const [layers, setLayers] = useState<LayerRow[]>([]);
  const [cursorMm, setCursorMm] = useState({ x: 0, y: 0 });
  const [projectName, setProjectName] = useState("Untitled Plan");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sheet, setSheet] = useState<PlannerSheet>(DEFAULT_SHEET);
  const [plannerStep, setPlannerStep] = useState<PlannerStep>("draw");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(true);
  useEffect(() => {
    // Fixed-width side panels (60px tool rail + 320px catalog) squeeze the
    // canvas to 0 width below the design system's own sm breakpoint
    // (--breakpoint-sm: 640px) — worst at the "Place furniture" step, whose
    // catalog aside is full-bleed. Collapse both panels so the canvas stays
    // usable; the overlay dock-tab buttons reopen them on demand, same
    // mechanism Studio's equivalent 2b fix uses.
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
  const [activeLeftDock, setActiveLeftDock] = useState("catalog");
  const [activeRightDock, setActiveRightDock] = useState("props");
  const [drawSheetOpen, setDrawSheetOpen] = useState(true);
  const [drawColorOpen, setDrawColorOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const leftDockApiRef = useRef<DockviewApiLike | null>(null);
  const rightDockApiRef = useRef<DockviewApiLike | null>(null);
  const pendingLeftFocusRef = useRef<string | null>(null);
  const pendingRightFocusRef = useRef<string | null>(null);
  const leftPanel = usePanelResize({
    storageKey: "planner.panel.left.w",
    defaultWidth: 300,
    edge: "start",
  });
  const rightPanel = usePanelResize({
    storageKey: "planner.panel.right.w",
    defaultWidth: 360,
    edge: "end",
  });
  const [autoFit, setAutoFit] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [sceneVersion, setSceneVersion] = useState(0);
  const clipRef = useRef<OoFabricObject | null>(null);
  const [topbarSlot, setTopbarSlot] = useState<HTMLElement | null>(null);
  const { enabled: flag } = useRuntimeFeatureFlags();

  const leftPanelsForStep = useCallback((step: PlannerStep) => {
    if (step === "draw") return [];
    if (!flag("catalogSidebar")) return [];
    return PLANNER_LEFT_CATALOG_PANELS;
  }, [flag]);

  const rightPanelsForStep = useCallback((step: PlannerStep) => {
    if (step === "draw") return [];
    if (step === "place") {
      return PLANNER_RIGHT_PLACE_PANELS;
    }
    // review
    const panels: typeof PLANNER_RIGHT_REVIEW_BASE = [];
    if (flag("plannerBoqPanel")) {
      panels.push({ id: "boq", title: "BOQ", render: PlannerBoqPanel } as never);
    }
    if (flag("plannerValidationPanel")) {
      panels.push({
        id: "validation",
        title: "Validation",
        render: PlannerValidationPanel,
        position: { direction: "below" as const },
      } as never);
    }
    for (const p of PLANNER_RIGHT_REVIEW_BASE) {
      if (p.id === "layers" && !flag("layersPanel")) continue;
      panels.push(p);
    }
    return panels;
  }, [flag]);

  useEffect(() => {
    setTopbarSlot(document.getElementById("topbar-actions-slot"));
  }, []);

  // Dockview and canvas overlays need a layout pass when side panels resize.
  useEffect(() => {
    const t = window.setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 0);
    return () => window.clearTimeout(t);
  }, [leftPanel.width, rightPanel.width, leftCollapsed, rightCollapsed]);

  const onHistoryRestoreRef = useRef<() => void>(() => {});
  const history = useHistory(fabricRef, ready, undefined, useCallback(() => {
    onHistoryRestoreRef.current();
  }, []));
  const core = useCanvasCore({ fabricRef, ready, scale: SCALE_PX_PER_MM, snapEnabled, gridSize, tool, wrapperRef, onCursorMm: setCursorMm });

  const toggleDrawPanel = useCallback((id: "sheet" | "color") => {
    const nextSheet = id === "sheet" ? !drawSheetOpen : drawSheetOpen;
    const nextColor = id === "color" ? !drawColorOpen : drawColorOpen;
    setDrawSheetOpen(nextSheet);
    setDrawColorOpen(nextColor);
    setLeftCollapsed(!nextSheet && !nextColor);
  }, [drawSheetOpen, drawColorOpen]);

  const drawLeftPanels = useMemo(() => {
    const panels = [];
    if (drawSheetOpen) panels.push(PLANNER_DRAW_SHEET_PANEL);
    if (drawColorOpen) {
      panels.push(
        drawSheetOpen
          ? PLANNER_DRAW_COLOR_PANEL
          : { id: "color", title: "Color", render: PlannerColorPanel },
      );
    }
    return panels;
  }, [drawSheetOpen, drawColorOpen]);

  const focusDockPanel = useCallback((side: "left" | "right", panelId: string) => {
    // Dock tab clicks always ensure the target panel is open and focused —
    // they never collapse it. Previously, clicking a tab that was already
    // the active panel (e.g. BOQ, auto-opened on landing on the Review
    // step) toggled the panel *closed* instead, leaving no discoverable way
    // to get back to it short of re-clicking a second time. That made the
    // Review step's BOQ tab — the only discovered entry point into the
    // handoff dialog — appear to "never mount" on a single click.
    if (side === "left") {
      const wasCollapsed = leftCollapsed;
      setLeftCollapsed(false);
      setActiveLeftDock(panelId);
      if (wasCollapsed) {
        pendingLeftFocusRef.current = panelId;
        return;
      }
      leftDockApiRef.current?.getPanel(panelId)?.api?.setActive?.();
      return;
    }
    const wasCollapsed = rightCollapsed;
    setRightCollapsed(false);
    setActiveRightDock(panelId);
    if (wasCollapsed) {
      pendingRightFocusRef.current = panelId;
      return;
    }
    rightDockApiRef.current?.getPanel(panelId)?.api?.setActive?.();
  }, [leftCollapsed, rightCollapsed]);

  const applyPlannerStep = useCallback((step: PlannerStep) => {
    setPlannerStep(step);
    // Below the sm breakpoint the side panels are collapsed by the
    // narrow-viewport effect above (fixed-width panels leave 0px for the
    // canvas) — step navigation must not fight that by force-opening a
    // panel again; the overlay dock-tab buttons remain available to open
    // one on demand.
    const narrow = typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;
    if (step === "draw") {
      setDrawSheetOpen(true);
      setDrawColorOpen(false);
      setLeftCollapsed(narrow);
      setRightCollapsed(true);
      setTool("wall");
      return;
    }
    if (step === "place") {
      setLeftCollapsed(narrow);
      setRightCollapsed(true);
      setActiveLeftDock("catalog");
      setTool("select");
      queueMicrotask(() => {
        leftDockApiRef.current?.getPanel("catalog")?.api?.setActive?.();
      });
      return;
    }
    setLeftCollapsed(true);
    setRightCollapsed(narrow);
    setActiveRightDock("boq");
    setTool("select");
    queueMicrotask(() => {
      rightDockApiRef.current?.getPanel("boq")?.api?.setActive?.();
    });
  }, []);

  const planMetrics = useMemo(() => {
    void sceneVersion;
    const objects = fabricRef.current?.getObjects() ?? [];
    let walls = 0;
    let furniture = 0;
    for (const obj of objects) {
      const kind = asOo(obj).data?.kind;
      if (kind === "wall") walls += 1;
      if (kind === "furniture") furniture += 1;
    }
    return { walls, furniture, boqReady: furniture > 0 };
  }, [fabricRef, sceneVersion]);

  useEffect(() => {
    if (!autoFit || !ready) return;
    const runFit = () => {
      core.fitToContent();
    };
    const t = window.setTimeout(runFit, 0);
    const onResize = () => {
      runFit();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [autoFit, ready, core.fitToContent, sheet.width_mm, sheet.height_mm]);

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
      const root = document.querySelector(".ooplanner-root .app-root") || document.documentElement;
      if (root instanceof HTMLElement) await root.requestFullscreen();
    } catch {
      showToast("Fullscreen not available", "error");
    }
  }, [showToast]);

  // Draw grid + sheet
  const drawGridAndSheet = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    c.getObjects().filter((o) => asOo(o).data?.isGridLine || asOo(o).data?.isSheet).forEach((o) => c.remove(o));
    // Sheet outline
    const sheetPx = { w: sheet.width_mm * SCALE_PX_PER_MM, h: sheet.height_mm * SCALE_PX_PER_MM };
    const sheetRect = new fabric.Rect({
      left: 0, top: 0, width: sheetPx.w, height: sheetPx.h,
      fill: "transparent", stroke: OO.white400, strokeWidth: 1.5, strokeUniform: true, selectable: false, evented: false, excludeFromExport: true, objectCaching: false,
    });
    asOo(sheetRect).data = { isSheet: true };
    c.add(sheetRect); c.sendObjectToBack(sheetRect);
    if (!showGrid) { c.requestRenderAll(); return; }
    const gridPx = gridSize * SCALE_PX_PER_MM;
    const majorEvery = 10;
    const w = Math.max(sheetPx.w * 1.5, c.getWidth() * 3);
    const h = Math.max(sheetPx.h * 1.5, c.getHeight() * 3);
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
    // Re-put sheet in front of grid
    c.bringObjectToFront(sheetRect);
    c.sendObjectToBack(sheetRect);
    // The order of sendToBack calls is: sheet last -> so grid is deepest. Bring sheet up 1.
    c.requestRenderAll();
  }, [fabricRef, showGrid, gridSize, sheet]);

  useEffect(() => { if (ready) drawGridAndSheet(); }, [ready, drawGridAndSheet]);

  const refreshLayers = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    setLayers(collectUserLayerRows(c.getObjects()).reverse());
  }, [fabricRef]);

  // Undo/redo replace the entire Fabric object list from a serialized
  // snapshot that deliberately excludes canvas-managed decorations (grid,
  // sheet outline) — restore those and re-derive layers/scene state so the
  // canvas doesn't look corrupted after a history jump.
  useEffect(() => {
    onHistoryRestoreRef.current = () => {
      drawGridAndSheet();
      refreshLayers();
      setSelectedIds([]);
      setPropObj(null);
      setSceneVersion((v) => v + 1);
    };
  }, [drawGridAndSheet, refreshLayers]);

  useEffect(() => {
    if (!ready) return;
    const c = fabricRef.current;
    if (!c) return;
    const clearWallGrips = () => {
      c.getObjects()
        .filter((o) => asOo(o).data?.kind === WALL_GRIP_KIND)
        .forEach((o) => c.remove(o));
    };

    const syncWallGrips = (active: OoFabricObject | undefined) => {
      clearWallGrips();
      if (!active || active.data?.kind !== "wall") return;
      const line = active as OoFabricObject & {
        x1?: number;
        y1?: number;
        x2?: number;
        y2?: number;
      };
      if (typeof line.x1 !== "number" || typeof line.y1 !== "number") return;
      const wallId = typeof active.data.id === "string" ? active.data.id : null;
      const walls = [{
        id: wallId || "wall",
        start: { x: line.x1, y: line.y1 },
        end: { x: Number(line.x2), y: Number(line.y2) },
      }];
      const wall = resolveWallForEndpointGrips(walls, wallId || "wall");
      if (!wall) return;
      const points = wallEndpointGripPoints(wall);
      for (const endpoint of ["start", "end"] as const) {
        const pt = points[endpoint];
        const grip = new fabric.Circle({
          left: pt.x,
          top: pt.y,
          radius: WALL_GRIP_RADIUS_PX,
          originX: "center",
          originY: "center",
          fill: OO.obb500,
          stroke: OO.ink900,
          strokeWidth: 1,
          selectable: true,
          evented: true,
          hasControls: false,
          hasBorders: false,
        });
        const tagged = tag(grip, `Wall ${endpoint}`, WALL_GRIP_KIND);
        tagged.data!.wallId = wall.id;
        tagged.data!.endpoint = endpoint;
        tagged.excludeFromExport = true;
        c.add(grip);
      }
      c.requestRenderAll();
    };

    const onSel = () => {
      const active = c.getActiveObject() as OoFabricObject | undefined;
      if (!active) {
        setPropObj(null);
        setSelectedIds([]);
        clearWallGrips();
        return;
      }
      const multi = c.getActiveObjects();
      const ids = multi
        .map((o) => asOo(o).data?.id)
        .filter((id): id is string => typeof id === "string" && Boolean(id));
      setSelectedIds(ids.length ? ids : [active.data?.id].filter((id): id is string => Boolean(id)));
      active.__props = {
        left: active.left, top: active.top,
        width: active.getScaledWidth(), height: active.getScaledHeight(),
        angle: active.angle || 0,
        fill: active.fill === null || active.fill === undefined ? undefined : String(active.fill),
        stroke: active.stroke === null || active.stroke === undefined ? undefined : String(active.stroke),
        strokeWidth: active.strokeWidth,
      };
      setPropObj(active);
      if (flag("plannerWallGrips") && multi.length === 1 && active.data?.kind === "wall") {
        syncWallGrips(active);
      } else {
        clearWallGrips();
      }
    };
    const clear = () => {
      setSelectedIds([]);
      setPropObj(null);
      clearWallGrips();
    };
    const modified = (opt?: { target?: fabric.FabricObject }) => {
      const target = opt?.target ? asOo(opt.target) : undefined;
      if (target && isWallGripData(target.data)) {
        const wallId = target.data.wallId;
        const endpoint = target.data.endpoint;
        const wallObj = c.getObjects().find(
          (o) => asOo(o).data?.kind === "wall" && asOo(o).data?.id === wallId,
        ) as fabric.Line | undefined;
        if (wallObj && typeof wallObj.x1 === "number") {
          const wall = {
            id: wallId,
            start: { x: wallObj.x1, y: wallObj.y1 as number },
            end: { x: wallObj.x2 as number, y: wallObj.y2 as number },
          };
          const next = wallEndpointsAfterGripMove(
            wall,
            endpoint,
            { x: target.left || 0, y: target.top || 0 },
          );
          wallObj.set({
            x1: next.start.x,
            y1: next.start.y,
            x2: next.end.x,
            y2: next.end.y,
          });
          wallObj.setCoords();
          syncWallGrips(asOo(wallObj));
        }
      }
      onSel();
      refreshLayers();
      setSceneVersion((v) => v + 1);
    };
    const onAdd = () => { refreshLayers(); setSceneVersion((v) => v + 1); };
    const onRemove = () => { refreshLayers(); setSceneVersion((v) => v + 1); };
    c.on("selection:created", onSel);
    c.on("selection:updated", onSel);
    c.on("selection:cleared", clear);
    c.on("object:modified", modified);
    c.on("object:added", onAdd);
    c.on("object:removed", onRemove);
    return () => {
      c.off("selection:created", onSel);
      c.off("selection:updated", onSel);
      c.off("selection:cleared", clear);
      c.off("object:modified", modified);
      c.off("object:added", onAdd);
      c.off("object:removed", onRemove);
    };
  }, [ready, fabricRef, refreshLayers, flag]);

  // Snap on moving
  useEffect(() => {
    if (!ready) return;
    const c = fabricRef.current;
    if (!c) return;
    const gridPx = gridSize * SCALE_PX_PER_MM;
    const onMoving = (opt: ModifiedEvent<TPointerEvent>) => {
      if (!snapEnabled) return;
      const t = opt.target as OoFabricObject | undefined;
      if (!t || t.data?.isGridLine || t.data?.isSheet) return;
      t.set({ left: snapVal(t.left ?? 0, gridPx), top: snapVal(t.top ?? 0, gridPx) });
    };
    c.on("object:moving", onMoving);
    return () => c.off("object:moving", onMoving);
  }, [ready, fabricRef, snapEnabled, gridSize, flag]);

  // Tool interactions
  useEffect(() => {
    if (!ready) return;
    const c = fabricRef.current;
    if (!c) return;
    c.isDrawingMode = false;
    c.selection = tool === "select";
    c.defaultCursor = tool === "pan" ? "grab" : (tool === "select" ? "default" : "crosshair");
    c.getObjects().forEach((o) => {
      if (asOo(o).data?.isGridLine || asOo(o).data?.isSheet || asOo(o).data?.isGuide) return;
      o.selectable = tool === "select";
      o.evented = tool === "select";
    });

    let drawing: OoFabricObject | null = null;
    let start: Point2D | null = null;
    let dimStart: Point2D | null = null;

    const snapPoint = (p: Point2D): Point2D => {
      if (!snapEnabled) return p;
      const gp = gridSize * SCALE_PX_PER_MM;
      if (!flag("snapToGrid") && !flag("plannerAdvancedSnap")) return p;
      if (flag("plannerAdvancedSnap")) {
        const scene = collectSceneGeometry(c, SCALE_PX_PER_MM);
        const thresholdMm = Math.max(gridSize * 0.45, 25);
        const snapped = snapPointMm({
          xMm: pxToMm(p.x, SCALE_PX_PER_MM),
          yMm: pxToMm(p.y, SCALE_PX_PER_MM),
          walls: flag("snapToWall") ? scene.walls : [],
          furniture: scene.furniture,
          gridMm: flag("snapToGrid") ? gridSize : 0,
          thresholdMm,
        });
        if (snapped.active) {
          return {
            x: mmToPx(snapped.xMm, SCALE_PX_PER_MM),
            y: mmToPx(snapped.yMm, SCALE_PX_PER_MM),
          };
        }
      }
      if (!flag("snapToGrid")) return p;
      return { x: snapVal(p.x, gp), y: snapVal(p.y, gp) };
    };

    const onDown = (opt: TPointerEventInfo<TPointerEvent>) => {
      const raw = opt.scenePoint;
      if (!raw) return;
      const mouse = opt.e as MouseEvent;
      if (mouse.button && mouse.button !== 0) return;
      if (isDragDrawTool(tool) && drawing) return;
      const p = snapPoint(raw);

      if (tool === "wall") {
        const thPx = DEFAULT_WALL_THICKNESS_MM * SCALE_PX_PER_MM;
        // Suspend history commits for the duration of the drag: the
        // in-progress line added here and the finalized "modified" fire on
        // mouse-up are one logical user action, not two. Without this,
        // undo needs two presses to remove a single drawn wall (the second
        // press restoring a still-present, merely tinier, wall).
        history.suspend();
        drawing = new fabric.Line([p.x, p.y, p.x, p.y], { stroke: OO.ink900, strokeWidth: thPx, strokeLineCap: "square", selectable: false, evented: false });
        tag(drawing, "Wall", "wall");
        c.add(drawing); start = p;
      } else if (tool === "rect") {
        history.suspend();
        drawing = new fabric.Rect({ left: p.x, top: p.y, width: 1, height: 1, fill: "transparent", stroke: OO.ink900, strokeWidth: 1.2, strokeUniform: true });
        tag(drawing, "Rectangle"); c.add(drawing); start = p;
      } else if (tool === "line") {
        history.suspend();
        drawing = new fabric.Line([p.x, p.y, p.x, p.y], { stroke: OO.ink900, strokeWidth: 1.5, strokeUniform: true });
        tag(drawing, "Line"); c.add(drawing); start = p;
      } else if (tool === "dimension") {
        if (!dimStart) {
          dimStart = p;
          drawing = new fabric.Line([p.x, p.y, p.x, p.y], { stroke: OO.obb600, strokeWidth: 1, strokeDashArray: [4, 3], selectable: false, evented: false });
          asOo(drawing).data = { isDimPreview: true };
          drawing.excludeFromExport = true;
          c.add(drawing);
        } else {
          const dx = p.x - dimStart.x;
          const dy = p.y - dimStart.y;
          const distMm = Math.round(Math.sqrt(dx * dx + dy * dy) / SCALE_PX_PER_MM);
          const mid = { x: (p.x + dimStart.x) / 2, y: (p.y + dimStart.y) / 2 };
          const line = new fabric.Line([dimStart.x, dimStart.y, p.x, p.y], { stroke: OO.obb600, strokeWidth: 1, strokeUniform: true, selectable: false, evented: false });
          const label = new fabric.Text(`${distMm} mm`, { left: mid.x, top: mid.y - 12, fontSize: 11, fontFamily: ooFontSansShort(), fill: OO.obb600, originX: "center", originY: "center", selectable: false, evented: false });
          const g = new fabric.Group([line, label], {});
          tag(g, `↔ ${distMm}mm`, "dimension");
          if (drawing) c.remove(drawing);
          drawing = null;
          c.add(g);
          dimStart = null;
        }
      } else if (tool === "door" || tool === "window") {
        const openingWidthMm = tool === "door" ? DEFAULT_DOOR_WIDTH_MM : DEFAULT_WINDOW_WIDTH_MM;
        const scene = collectSceneGeometry(c, SCALE_PX_PER_MM);
        const placed = flag("plannerOpeningPlacement")
          ? placeOpeningOnNearestWall({
              pointMm: { x: pxToMm(p.x, SCALE_PX_PER_MM), y: pxToMm(p.y, SCALE_PX_PER_MM) },
              walls: scene.walls,
              openingWidthMm,
            })
          : ({ rejected: true as const, reason: "off-wall" as const });
        const originPx = "rejected" in placed
          ? p
          : { x: mmToPx(placed.xMm, SCALE_PX_PER_MM), y: mmToPx(placed.yMm, SCALE_PX_PER_MM) };
        const angleDeg = "rejected" in placed ? 0 : (placed.angleRadians * 180) / Math.PI;
        const wPx = openingWidthMm * SCALE_PX_PER_MM;
        if (tool === "door") {
          const arcPath = `M 0 0 L ${wPx} 0 A ${wPx} ${wPx} 0 0 0 0 ${wPx} Z`;
          const door = new fabric.Path(arcPath, {
            left: originPx.x,
            top: originPx.y,
            fill: OO.canvasDoorFill,
            stroke: OO.ink900,
            strokeWidth: 1.2,
            strokeUniform: true,
            angle: angleDeg,
            originX: "center",
            originY: "center",
          });
          const tagged = tag(door, "Door", "door");
          if (!("rejected" in placed)) {
            tagged.data!.wallId = placed.wallId;
            tagged.data!.position = placed.position;
          }
          c.add(door);
        } else {
          const thPx = DEFAULT_WALL_THICKNESS_MM * SCALE_PX_PER_MM;
          const win = new fabric.Rect({
            left: originPx.x,
            top: originPx.y,
            width: wPx,
            height: thPx,
            fill: OO.canvasWindowFill,
            stroke: OO.ink900,
            strokeWidth: 1.2,
            strokeUniform: true,
            angle: angleDeg,
            originX: "center",
            originY: "center",
          });
          const tagged = tag(win, "Window", "window");
          if (!("rejected" in placed)) {
            tagged.data!.wallId = placed.wallId;
            tagged.data!.position = placed.position;
          }
          c.add(win);
        }
      } else if (tool === "text") {
        const t = new fabric.IText("Text", { left: p.x, top: p.y, fontSize: 14, fill: OO.ink900, fontFamily: ooFontSans() });
        tag(t, "Text"); c.add(t); c.setActiveObject(t); setTool("select");
      }
    };
    const onMove = (opt: TPointerEventInfo<TPointerEvent>) => {
      if (!drawing || (!start && !dimStart)) return;
      const raw = opt.scenePoint;
      if (!raw) return;
      const p = snapPoint(raw);
      if (tool === "wall" && start && drawing instanceof fabric.Line) {
        const dx = Math.abs(p.x - start.x);
        const dy = Math.abs(p.y - start.y);
        if (dy < dx * 0.15) drawing.set({ x2: p.x, y2: start.y });
        else if (dx < dy * 0.15) drawing.set({ x2: start.x, y2: p.y });
        else drawing.set({ x2: p.x, y2: p.y });
      } else if (tool === "rect" && start && drawing instanceof fabric.Rect) {
        drawing.set({ width: Math.abs(p.x - start.x), height: Math.abs(p.y - start.y), left: Math.min(p.x, start.x), top: Math.min(p.y, start.y) });
      } else if (tool === "line" && start && drawing instanceof fabric.Line) {
        drawing.set({ x2: p.x, y2: p.y });
      } else if (tool === "dimension" && dimStart && drawing instanceof fabric.Line) {
        drawing.set({ x2: p.x, y2: p.y });
      }
      c.requestRenderAll();
    };
    const onUp = () => {
      if (drawing && start && tool !== "dimension") {
        // Resume before the final event so exactly one history entry is
        // committed for this whole drag gesture (see history.suspend() in
        // onDown above).
        history.resume();
        if (isTooSmallDrawnShape(drawing, tool)) {
          c.remove(drawing);
        } else {
          drawing.setCoords();
          c.fire("object:modified", { target: drawing });
        }
        drawing = null;
        start = null;
        c.requestRenderAll();
      }
    };

    c.on("mouse:down", onDown);
    c.on("mouse:move", onMove);
    c.on("mouse:up", onUp);
    return () => {
      c.off("mouse:down", onDown); c.off("mouse:move", onMove); c.off("mouse:up", onUp);
      if (drawing && drawing.data?.isDimPreview) c.remove(drawing);
      // If a drag-draw gesture was interrupted (tool switched, component
      // re-ran this effect) before mouse-up could resume history, don't
      // leave commits permanently suspended.
      history.resume();
    };
  }, [ready, tool, fabricRef, snapEnabled, gridSize, history.suspend, history.resume]);

  // Redraw grid on zoom change
  useEffect(() => { if (ready) drawGridAndSheet(); }, [core.zoom, ready, drawGridAndSheet]);

  // Place a furniture item at an absolute canvas (scene) point — shared by
  // both the HTML5 drag-and-drop drop handler and click/keyboard placement
  // from the catalog rail (native drag-and-drop is not keyboard-operable,
  // so a click/Enter path needs the exact same placement logic).
  const placeFurnitureAt = useCallback(async (item: FurnitureItem, abs: { x: number; y: number }) => {
    const c = fabricRef.current;
    if (!c) return;
    const dims = item.dimensions ?? { width_mm: 600, depth_mm: 600, height_mm: 800 };
    const wPx = dims.width_mm * SCALE_PX_PER_MM;
    const dPx = dims.depth_mm * SCALE_PX_PER_MM;
    const thumbUrl = typeof item.thumbnail_url === "string" ? item.thumbnail_url : item.top_png_url || item.top_svg_url;
    const url = fileUrl(thumbUrl);
    try {
      if (url) {
        const img = await fabric.FabricImage.fromURL(url, { crossOrigin: "anonymous" });
        img.set({ left: abs.x - wPx / 2, top: abs.y - dPx / 2, scaleX: wPx / (img.width || 1), scaleY: dPx / (img.height || 1), strokeUniform: true });
        const tagged = tag(img, item.name, "furniture");
        tagged.data!.furniture_id = item.id;
        tagged.data!.dimensions = dims;
        c.add(img); c.setActiveObject(img); c.requestRenderAll();
        return;
      }
    } catch {
      // Image load failed — fall through to placeholder rect.
    }
    const rect2 = new fabric.Rect({ left: abs.x - wPx / 2, top: abs.y - dPx / 2, width: wPx, height: dPx, fill: OO.ecru100, stroke: OO.ink900, strokeWidth: 1.2, strokeUniform: true });
    const label = new fabric.Text(item.name, { left: abs.x, top: abs.y, fontSize: 10, fontFamily: ooFontSansShort(), fill: OO.ink900, originX: "center", originY: "center", selectable: false });
    const g = new fabric.Group([rect2, label], {});
    const tagged = tag(g, item.name, "furniture");
    tagged.data!.furniture_id = item.id;
    tagged.data!.dimensions = dims;
    c.add(g); c.setActiveObject(g); c.requestRenderAll();
  }, [fabricRef]);

  /** Click/keyboard placement entry point: drop the item at the center of
   * the current viewport (the same target a user would naturally drag to
   * first before nudging it into place). */
  const placeFurnitureItem = useCallback((item: FurnitureItem) => {
    const c = fabricRef.current;
    if (!c) return;
    const vpt = c.viewportTransform;
    const centerPx = { x: c.getWidth() / 2, y: c.getHeight() / 2 };
    const abs = vpt
      ? fabric.util.transformPoint(new fabric.Point(centerPx.x, centerPx.y), fabric.util.invertTransform(vpt))
      : centerPx;
    void placeFurnitureAt(item, abs);
  }, [fabricRef, placeFurnitureAt]);

  // Drop furniture from catalog (via HTML5 drag)
  useEffect(() => {
    if (!ready) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const c = fabricRef.current;
    if (!c) return;
    const onDragOver = (e: DragEvent) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"; };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      if (!e.dataTransfer) return;
      const id = e.dataTransfer.getData("application/furniture-id");
      const items = useCatalogStore.getState().items;
      const item = items.find((i) => i.id === id);
      if (!item) return;
      const rect = wrapper.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const vpt = c.viewportTransform;
      if (!vpt) return;
      const inv = fabric.util.invertTransform(vpt);
      const abs = fabric.util.transformPoint(new fabric.Point(px, py), inv);
      void placeFurnitureAt(item, abs);
    };
    wrapper.addEventListener("dragover", onDragOver);
    wrapper.addEventListener("drop", onDrop);
    return () => {
      wrapper.removeEventListener("dragover", onDragOver);
      wrapper.removeEventListener("drop", onDrop);
    };
  }, [ready, fabricRef, wrapperRef, placeFurnitureAt]);

  // Actions
  const deleteSelected = () => { const c = fabricRef.current; if (!c) return; c.getActiveObjects().forEach((o) => c.remove(o)); c.discardActiveObject(); c.requestRenderAll(); };
  const duplicateSelected = async () => {
    const c = fabricRef.current; if (!c) return;
    const a = c.getActiveObject(); if (!a) return;
    const cl = await a.clone(["data"]);
    cl.set({ left: (a.left || 0) + 20, top: (a.top || 0) + 20 });
    tag(cl, asOo(a).data?.label as string | undefined, asOo(a).data?.kind as string | undefined);
    c.add(cl); c.setActiveObject(cl); c.requestRenderAll();
  };
  const rotate90 = () => { const c = fabricRef.current; if (!c) return; const a = c.getActiveObject(); if (!a) return; a.set({ angle: (a.angle || 0) + 90 }); a.setCoords(); c.fire("object:modified", { target: a }); c.requestRenderAll(); };

  const applyAlign = useCallback((action: AlignAction) => {
    const c = fabricRef.current;
    if (!c) return;
    const activeObjects = c.getActiveObjects().filter(
      (o) => {
        const d = asOo(o).data;
        return d?.kind !== WALL_GRIP_KIND && !d?.isGridLine && !d?.isSheet && !d?.isGuide;
      },
    );
    if (activeObjects.length < 2) return;
    const entities: PositionedEntity[] = activeObjects.map((o, index) => {
      const oo = asOo(o);
      const id = typeof oo.data?.id === "string" ? oo.data.id : `sel_${index}`;
      return {
        id,
        xMm: pxToMm(o.left || 0, SCALE_PX_PER_MM),
        yMm: pxToMm(o.top || 0, SCALE_PX_PER_MM),
        widthMm: pxToMm(o.getScaledWidth(), SCALE_PX_PER_MM),
        depthMm: pxToMm(o.getScaledHeight(), SCALE_PX_PER_MM),
      };
    });
    const updates = applyAlignAction(entities, action);
    const byId = new Map(updates.map((u) => [u.id, u]));
    activeObjects.forEach((o, index) => {
      const oo = asOo(o);
      const id = typeof oo.data?.id === "string" ? oo.data.id : `sel_${index}`;
      const u = byId.get(id);
      if (!u) return;
      o.set({
        left: mmToPx(u.xMm, SCALE_PX_PER_MM),
        top: mmToPx(u.yMm, SCALE_PX_PER_MM),
      });
      o.setCoords();
    });
    c.requestRenderAll();
    setSceneVersion((v) => v + 1);
    showToast(`Aligned ${activeObjects.length} objects`);
  }, [fabricRef, showToast]);
  const selectAll = () => {
    const c = fabricRef.current;
    if (!c) return;
    const objs = c.getObjects().filter((o) => !asOo(o).data?.isGridLine && !asOo(o).data?.isSheet && !asOo(o).data?.isGuide);
    if (!objs.length) return;
    const sel = new fabric.ActiveSelection(objs, { canvas: c });
    c.setActiveObject(sel); c.requestRenderAll();
  };
  const copySel = async () => { const c = fabricRef.current; if (!c) return; const a = c.getActiveObject(); if (!a) return; clipRef.current = await a.clone(["data"]) as OoFabricObject; showToast("Copied"); };
  const pasteSel = async () => {
    if (!clipRef.current) return;
    const c = fabricRef.current; if (!c) return;
    const cl = await clipRef.current.clone(["data"]);
    cl.set({ left: (cl.left || 0) + 20, top: (cl.top || 0) + 20 });
    tag(cl, cl.data?.label as string | undefined, cl.data?.kind as string | undefined);
    c.add(cl); c.setActiveObject(cl); c.requestRenderAll();
  };
  const applyFill = (color: string) => { const c = fabricRef.current; if (!c) return; const list = c.getActiveObjects(); list.forEach((o) => o.set({ fill: color })); c.requestRenderAll(); if (list.length) c.fire("object:modified", { target: list[0] }); };
  const applyStroke = (color: string) => { const c = fabricRef.current; if (!c) return; const list = c.getActiveObjects(); list.forEach((o) => o.set({ stroke: color })); c.requestRenderAll(); if (list.length) c.fire("object:modified", { target: list[0] }); };
  const setObjectProp = (patch: Record<string, unknown>) => {
    const c = fabricRef.current; if (!c) return;
    const active = c.getActiveObject(); if (!active) return;
    const p = { ...patch };
    if (p.width !== undefined && typeof p.width === "number") { const s = active.getScaledWidth(); active.scaleX *= p.width / s; delete p.width; }
    if (p.height !== undefined && typeof p.height === "number") { const s = active.getScaledHeight(); active.scaleY *= p.height / s; delete p.height; }
    active.set(p); active.setCoords();
    c.fire("object:modified", { target: active }); c.requestRenderAll();
  };
  const findById = (id: string): OoFabricObject | undefined => fabricRef.current?.getObjects().find((o) => asOo(o).data?.id === id) as OoFabricObject | undefined;
  const layerToggleVisible = (id: string) => { const c = fabricRef.current; if (!c) return; const o = findById(id); if (!o) return; o.visible = !o.visible; c.requestRenderAll(); refreshLayers(); };
  const layerToggleLock = (id: string) => { const c = fabricRef.current; if (!c) return; const o = findById(id); if (!o) return; const l = !o.lockMovementX; o.set({ lockMovementX: l, lockMovementY: l, lockScalingX: l, lockScalingY: l, lockRotation: l, selectable: !l }); c.requestRenderAll(); refreshLayers(); };
  const layerDelete = (id: string) => { const c = fabricRef.current; if (!c) return; const o = findById(id); if (!o) return; c.remove(o); c.requestRenderAll(); };
  const layerReorder = (id: string, dir: number) => { const c = fabricRef.current; if (!c) return; const o = findById(id); if (!o) return; if (dir < 0) c.bringObjectForward(o); else c.sendObjectBackwards(o); c.requestRenderAll(); refreshLayers(); };
  const layerSelect = (id: string) => { const c = fabricRef.current; if (!c) return; const o = findById(id); if (!o) return; c.setActiveObject(o); c.requestRenderAll(); };

  // Auto-arrange — lay out selected furniture inside the sheet non-overlapping.
  // Also respects existing furniture, walls, doors, and windows already on the canvas.
  const doAutoArrange = async ({ items, gap_mm, margin_mm }: AutoArrangeParams) => {
    const c = fabricRef.current;
    if (!c) return;
    const room = { width_mm: sheet.width_mm, height_mm: sheet.height_mm };

    // Collect existing objects on canvas as obstacles.
    const obstacles: Array<{ x_mm: number; y_mm: number; width_mm: number; depth_mm: number; kind: string }> = [];
    const scale = SCALE_PX_PER_MM;
    for (const o of c.getObjects()) {
      const oo = asOo(o);
      if (!o || oo.data?.isGridLine || oo.data?.isSheet || oo.data?.isGuide) continue;
      const kind = oo.data?.kind;
      try {
        const b = o.getBoundingRect();
        const rect = {
          x_mm: b.left / scale,
          y_mm: b.top / scale,
          width_mm: b.width / scale,
          depth_mm: b.height / scale,
          kind: (kind as string) || "misc",
        };
        // Doors get extra swing clearance (approx door width) so we don't block them.
        if (kind === "door") {
          const extra = 300; // extra mm clearance for door swing
          rect.x_mm -= extra;
          rect.y_mm -= extra;
          rect.width_mm += extra * 2;
          rect.depth_mm += extra * 2;
        }
        obstacles.push(rect);
      } catch { /* skip un-measurable objects */ }
    }

    const result = autoArrange(items, room, { gap_mm, margin_mm, sort: "depth", obstacles });
    for (const p of result.placements) {
      const wPx = p.width_mm * SCALE_PX_PER_MM;
      const dPx = p.depth_mm * SCALE_PX_PER_MM;
      const xPx = p.x_mm * SCALE_PX_PER_MM;
      const yPx = p.y_mm * SCALE_PX_PER_MM;
      const thumbUrl = typeof p.item.thumbnail_url === "string" ? p.item.thumbnail_url : p.item.top_png_url || p.item.top_svg_url;
      const url = fileUrl(thumbUrl);
      try {
        if (url) {
          const img = await fabric.FabricImage.fromURL(url, { crossOrigin: "anonymous" });
          const origW = p.rotation_deg === 90 ? p.item.dimensions.depth_mm * SCALE_PX_PER_MM : wPx;
          const origD = p.rotation_deg === 90 ? p.item.dimensions.width_mm * SCALE_PX_PER_MM : dPx;
          img.set({ left: xPx, top: yPx, scaleX: origW / (img.width || 1), scaleY: origD / (img.height || 1), angle: p.rotation_deg || 0, strokeUniform: true });
          const tagged = tag(img, p.item.name, "furniture");
          tagged.data!.furniture_id = p.item.id;
          tagged.data!.dimensions = p.item.dimensions;
          tagged.data!.autoArranged = true;
          c.add(img);
          continue;
        }
      } catch { /* fallthrough */ }
      const rect = new fabric.Rect({ left: xPx, top: yPx, width: wPx, height: dPx, fill: OO.ecru100, stroke: OO.ink900, strokeWidth: 1.2, strokeUniform: true });
      const label = new fabric.Text(p.item.name, { left: xPx + wPx / 2, top: yPx + dPx / 2, fontSize: 10, fontFamily: ooFontSansShort(), fill: OO.ink900, originX: "center", originY: "center", selectable: false });
      const g = new fabric.Group([rect, label], {});
      const tagged = tag(g, p.item.name, "furniture");
      tagged.data!.furniture_id = p.item.id;
      tagged.data!.dimensions = p.item.dimensions;
      tagged.data!.autoArranged = true;
      c.add(g);
    }
    c.requestRenderAll();
    if (result.overflow.length) {
      const tooLarge = result.overflow.filter((o) => o.reason === "too_large").length;
      const noSpace = result.overflow.filter((o) => o.reason !== "too_large").length;
      const parts = [];
      if (noSpace) parts.push(`${noSpace} didn't fit (try smaller gap)`);
      if (tooLarge) parts.push(`${tooLarge} too big for room`);
      showToast(`Placed ${result.placements.length}. ${parts.join(", ")}`, "error");
    } else {
      showToast(`Auto-arranged ${result.placements.length} items (\u2248${Math.round(result.usage * 100)}% coverage)`);
    }
  };

  const doExportPNG = () => {
    const c = fabricRef.current;
    if (!c) return;
    const hidden = c.getObjects().filter((o) => asOo(o).data?.isGridLine);
    hidden.forEach((g) => (g.visible = false)); c.requestRenderAll();
    const url = exportPNG(c, { dpiMultiplier: 2 });
    hidden.forEach((g) => (g.visible = true)); c.requestRenderAll();
    downloadDataUrl(url, `${projectName || "floor-plan"}.png`); showToast("Exported PNG");
  };
  const doExportPDF = () => {
    const c = fabricRef.current;
    if (!c) return;
    const hidden = c.getObjects().filter((o) => asOo(o).data?.isGridLine);
    hidden.forEach((g) => (g.visible = false)); c.requestRenderAll();
    exportPDF(c, `${projectName || "floor-plan"}.pdf`);
    hidden.forEach((g) => (g.visible = true)); c.requestRenderAll();
    showToast("Exported PDF");
  };
  const doExportSVG = () => {
    const c = fabricRef.current;
    if (!c) return;
    const hidden = c.getObjects().filter((o) => asOo(o).data?.isGridLine);
    hidden.forEach((g) => (g.visible = false)); c.requestRenderAll();
    const { dataUrl } = exportSVG(c);
    hidden.forEach((g) => (g.visible = true)); c.requestRenderAll();
    downloadDataUrl(dataUrl, `${projectName || "floor-plan"}.svg`); showToast("Exported SVG");
  };
  const doExportDXF = () => {
    try {
      const c = fabricRef.current;
      if (!c) { showToast("Canvas not ready", "error"); return; }
      const drawn = c.getObjects().filter((o) => !asOo(o).data?.isGridLine && !asOo(o).data?.isSheet);
      if (drawn.length === 0) { showToast("Plan is empty", "error"); return; }
      downloadDxf(c, projectName || "floor-plan", { pxPerMm: SCALE_PX_PER_MM });
      showToast("Exported DXF (mm, layered)");
    } catch (e) {
      showToast(`DXF failed: ${errMessage(e)}`, "error");
    }
  };

  const importFileRef = useRef<HTMLInputElement | null>(null);
  const doImportSvg = () => {
    importFileRef.current?.click();
  };
  const importSvgToCanvas = async (svgString: string) => {
    const c = fabricRef.current;
    if (!c) throw new Error("Canvas not ready");
    const res = await fabric.loadSVGFromString(svgString);
    const cleaned = (res?.objects || []).filter((o): o is fabric.FabricObject => o !== null && o !== undefined);
    if (cleaned.length === 0) throw new Error("SVG produced no drawable objects");
    let g: fabric.FabricObject;
    try {
      g = fabric.util.groupSVGElements(cleaned, res?.options || {});
    } catch {
      g = new fabric.Group(cleaned, {});
    }
    if (!g || !(g instanceof fabric.FabricObject)) {
      g = new fabric.Group(cleaned, {});
    }
    const cw = c.getWidth() || 800;
    const ch = c.getHeight() || 600;
    const vpt = c.viewportTransform || [1, 0, 0, 1, 0, 0];
    const zx = vpt[0] || 1;
    const zy = vpt[3] || 1;
    const centerX = (cw / 2 - vpt[4]) / zx;
    const centerY = (ch / 2 - vpt[5]) / zy;
    const bw = Math.max(1, g.width || 1);
    const bh = Math.max(1, g.height || 1);
    g.set({ left: centerX - bw / 2, top: centerY - bh / 2 });
    tag(g, "Imported SVG");
    c.add(g);
    c.setActiveObject(g);
    c.requestRenderAll();
    setSceneVersion((v) => v + 1);
  };
  const onImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      await importSvgToCanvas(text);
      showToast(`Imported ${file.name}`);
    } catch (e) {
      showToast(`Import failed: ${errMessage(e)}`, "error");
    }
  };

  const saveProject = useCallback(async () => {
    const c = fabricRef.current;
    if (!c) return;
    setSaving(true);
    try {
      const grid = c.getObjects().filter((o) => asOo(o).data?.isGridLine || asOo(o).data?.isSheet);
      grid.forEach((g) => (g.excludeFromExport = true));
      const canvasJson = serializeFabricCanvas(c, ["data"]) as FabricCanvasJson;
      canvasJson.objects = (canvasJson.objects || []).filter(
        (o) => !o.data?.isGridLine && !o.data?.isSheet,
      );
      // Thumbnail
      const hiddenG = c.getObjects().filter((o) => asOo(o).data?.isGridLine);
      hiddenG.forEach((g) => (g.visible = false)); c.requestRenderAll();
      const thumb = c.toDataURL({ format: "png", multiplier: 0.6 });
      hiddenG.forEach((g) => (g.visible = true)); c.requestRenderAll();
      const payload = { name: projectName || "Untitled Plan", canvas_json: canvasJson, sheet, layers: [], thumbnail_png: thumb };
      if (projectId) {
        const updated = await updateProject(projectId, payload);
        setProjectName(updated.name || payload.name);
        try { localStorage.setItem(PLANNER_LAST_PROJECT_KEY, projectId); } catch { /* noop */ }
        // Keep URL bound to the project so hard refresh reloads by routeId.
        if (!routeId || routeId !== projectId) {
          router.replace(`/ooplanner/projects/${projectId}`);
          await new Promise((r) => requestAnimationFrame(() => r(undefined)));
        }
        showToast(`Saved "${updated.name}"`);
      } else {
        const created = await createProject(payload);
        setProjectId(created.id);
        setProjectName(created.name || payload.name);
        try { localStorage.setItem(PLANNER_LAST_PROJECT_KEY, created.id); } catch { /* noop */ }
        router.replace(`/ooplanner/projects/${created.id}`);
        // Yield so the browser processes the history update before we tell
        // the caller (and tests) that saving is fully done.
        await new Promise((r) => requestAnimationFrame(() => r(undefined)));
        showToast(`Saved "${created.name}"`);
      }
    } catch (e) {
      showToast(`Save failed: ${errMessage(e)}`, "error");
    } finally { setSaving(false); }
  }, [fabricRef, projectId, projectName, sheet, routeId, router, showToast]);

  // Load project by URL id, falling back to the last-saved project id from
  // localStorage. The URL is the primary binding (shareable, matches the
  // route Save navigates to), but a refresh landing back on the bare
  // `/ooplanner` route — e.g. because a client-side router.replace() didn't
  // stick before the reload — would otherwise silently show "Untitled Plan"
  // even though the project was genuinely saved and is recoverable from the
  // projects list. The fallback makes a plain refresh keep the binding too.
  useEffect(() => {
    if (!ready) return;
    let effectiveId = routeId;
    if (!effectiveId) {
      try { effectiveId = localStorage.getItem(PLANNER_LAST_PROJECT_KEY) || undefined; } catch { /* noop */ }
    }
    if (!effectiveId) return;
    const c = fabricRef.current;
    if (!c) return;
    (async () => {
      try {
        const proj = await getProject(effectiveId!);
        setProjectId(proj.id);
        setProjectName(proj.name);
        try { localStorage.setItem(PLANNER_LAST_PROJECT_KEY, proj.id); } catch { /* noop */ }
        if (proj.sheet && proj.sheet.width_mm) setSheet({ ...DEFAULT_SHEET, ...proj.sheet });
        c.loadFromJSON(proj.canvas_json ?? {}, () => {
          drawGridAndSheet();
          c.requestRenderAll();
          refreshLayers();
          showToast(`Loaded "${proj.name}"`);
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[Planner] load project failed:", msg, { effectiveId, routeId });
        // Only clear localStorage if the project is actually gone (404).
        // Transient errors (network hiccups, disk races) should not wipe the
        // fallback key — the user can reload again and it may succeed.
        if (msg.includes("404") || msg.includes("not found") || msg.includes("Not Found")) {
          try { localStorage.removeItem(PLANNER_LAST_PROJECT_KEY); } catch { /* noop */ }
        }
        showToast(`Failed to load project${msg ? `: ${msg}` : ""}`, "error");
      }
    })();
  }, [ready, routeId]);

  const newProject = () => {
    const c = fabricRef.current; if (!c) return;
    if (!window.confirm("Discard current plan and start new?")) return;
    c.getObjects().filter((o) => !asOo(o).data?.isGridLine && !asOo(o).data?.isSheet).forEach((o) => c.remove(o));
    c.discardActiveObject(); c.requestRenderAll();
    setProjectId(null); setProjectName("Untitled Plan");
    try { localStorage.removeItem(PLANNER_LAST_PROJECT_KEY); } catch { /* noop */ }
    router.replace("/ooplanner");
    drawGridAndSheet();
  };

  type PlannerShortcuts = {
    undo?: () => void;
    redo?: () => void;
    delete?: () => void;
    duplicate?: () => void | Promise<void>;
    save?: () => void | Promise<void>;
    selectAll?: () => void;
    copy?: () => void | Promise<void>;
    paste?: () => void | Promise<void>;
    escape?: () => void;
    tool?: (t: string) => void;
  };

  useKeyboardShortcuts({
    undo: history.undo, redo: history.redo,
    delete: deleteSelected, duplicate: duplicateSelected,
    save: saveProject, selectAll, copy: copySel, paste: pasteSel,
    escape: () => {
      setCommandOpen(false);
      setTool("select");
    },
    tool: (t: string) => setTool(t as PlannerTool),
  } as PlannerShortcuts);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const paletteCommands = useMemo(
    () =>
      buildPaletteCommands({
        setTool: (t) => setTool(t as PlannerTool),
        undo: history.undo,
        redo: history.redo,
        toggleSnap,
        goReview: () => setPlannerStep("review"),
        exportPng: doExportPNG,
      }),
    [history.undo, history.redo, toggleSnap, doExportPNG],
  );

  const applyAiPlacements = useCallback(
    (ops: PlacementOp[], room: { widthMm: number; depthMm: number }) => {
      const c = fabricRef.current;
      if (!c) return;
      setSheet((s) => ({ ...s, width_mm: room.widthMm, height_mm: room.depthMm }));
      for (const op of ops) {
        const wPx = op.widthMm * SCALE_PX_PER_MM;
        const dPx = op.depthMm * SCALE_PX_PER_MM;
        const left = op.xMm * SCALE_PX_PER_MM - wPx / 2;
        const top = op.yMm * SCALE_PX_PER_MM - dPx / 2;
        const rect = new fabric.Rect({
          left,
          top,
          width: wPx,
          height: dPx,
          fill: OO.ecru100,
          stroke: OO.ink900,
          strokeWidth: 1.2,
          angle: op.rotationDeg,
        });
        const tagged = tag(rect, op.name, "furniture");
        tagged.data!.furniture_id = op.catalogId;
        tagged.data!.dimensions = {
          width_mm: op.widthMm,
          depth_mm: op.depthMm,
          height_mm: 750,
        };
        c.add(rect);
      }
      c.requestRenderAll();
      setSceneVersion((v) => v + 1);
    },
    [fabricRef],
  );

  /** Apply sketch-to-plan walls/rooms (mm → canvas px). */
  const applySketchGeometry = useCallback(
    (payload: { walls: SketchWallMm[]; rooms: SketchRoomMm[] }) => {
      const c = fabricRef.current;
      if (!c) return;
      const thPx = DEFAULT_WALL_THICKNESS_MM * SCALE_PX_PER_MM;
      // History commits via canvas object:added listeners (useHistory).
      for (const wall of payload.walls) {
        const line = new fabric.Line(
          [
            mmToPx(wall.x1Mm, SCALE_PX_PER_MM),
            mmToPx(wall.y1Mm, SCALE_PX_PER_MM),
            mmToPx(wall.x2Mm, SCALE_PX_PER_MM),
            mmToPx(wall.y2Mm, SCALE_PX_PER_MM),
          ],
          {
            stroke: OO.ink900,
            strokeWidth: thPx,
            strokeLineCap: "square",
            selectable: true,
            evented: true,
            hasControls: false,
            hasBorders: false,
          },
        );
        tag(line, "Wall", "wall");
        c.add(line);
      }
      for (const room of payload.rooms) {
        const rect = new fabric.Rect({
          left: mmToPx(room.leftMm, SCALE_PX_PER_MM),
          top: mmToPx(room.topMm, SCALE_PX_PER_MM),
          width: mmToPx(room.widthMm, SCALE_PX_PER_MM),
          height: mmToPx(room.depthMm, SCALE_PX_PER_MM),
          fill: "rgba(180, 200, 160, 0.12)",
          stroke: OO.ink900,
          strokeWidth: 1.2,
          strokeUniform: true,
          selectable: true,
          evented: true,
        });
        tag(rect, room.label, "room");
        c.add(rect);
      }
      c.requestRenderAll();
      setSceneVersion((v) => v + 1);
    },
    [fabricRef],
  );

  // Context menu
  const buildContextMenu = () => {
    const c = fabricRef.current;
    const active = c?.getActiveObject() as OoFabricObject | undefined;
    const hasActive = !!active;
    return [
      { id: "copy", label: "Copy", icon: "copy", shortcut: "⌘C", onClick: copySel, disabled: !hasActive },
      { id: "paste", label: "Paste", icon: "copy", shortcut: "⌘V", onClick: pasteSel, disabled: !clipRef.current },
      { id: "duplicate", label: "Duplicate", icon: "copy", shortcut: "⌘D", onClick: duplicateSelected, disabled: !hasActive },
      { separator: true },
      { id: "rotate90", label: "Rotate 90°", icon: "redo", onClick: rotate90, disabled: !hasActive },
      { separator: true },
      { id: "forward", label: "Bring forward", icon: "arrowUp", onClick: () => { if (active && c) { c.bringObjectForward(active); c.requestRenderAll(); refreshLayers(); } }, disabled: !hasActive },
      { id: "backward", label: "Send backward", icon: "arrowDown", onClick: () => { if (active && c) { c.sendObjectBackwards(active); c.requestRenderAll(); refreshLayers(); } }, disabled: !hasActive },
      { separator: true },
      { id: "delete", label: "Delete", icon: "trash", shortcut: "Del", onClick: deleteSelected, disabled: !hasActive },
    ];
  };

  // Wires PlannerTopToolbar's 14 buttons to the handlers/state that already
  // exist on this component — the toolbar previously rendered every button
  // with `data-unwired="true"` and no onClick at all. New/Open/Import/Save/
  // Export are removed from the topbar portal below and now live only here,
  // one row instead of two duplicate ones, mirroring the Studio 2b fix.
  const selectDrawTool = useCallback(
    (nextTool: PlannerTool) => {
      if (plannerStep !== "draw") {
        applyPlannerStep("draw");
      }
      setTool(nextTool);
    },
    [plannerStep, applyPlannerStep],
  );

  const openBoqPanel = useCallback(() => {
    if (plannerStep !== "review") {
      applyPlannerStep("review");
      return;
    }
    focusDockPanel("right", "boq");
  }, [plannerStep, applyPlannerStep, focusDockPanel]);

  const toggleMobilePanel = useCallback(
    (side: "left" | "right", panelId: string, step: PlannerStep) => {
      const isLeft = side === "left";
      const isOpen = isLeft
        ? !leftCollapsed && activeLeftDock === panelId
        : !rightCollapsed && activeRightDock === panelId;
      if (plannerStep !== step) {
        applyPlannerStep(step);
        if (isLeft) {
          setActiveLeftDock(panelId);
          setLeftCollapsed(false);
        } else {
          setActiveRightDock(panelId);
          setRightCollapsed(false);
        }
        queueMicrotask(() => focusDockPanel(side, panelId));
        return;
      }
      if (isOpen) {
        if (isLeft) setLeftCollapsed(true);
        else setRightCollapsed(true);
        return;
      }
      focusDockPanel(side, panelId);
    },
    [
      activeLeftDock,
      activeRightDock,
      applyPlannerStep,
      focusDockPanel,
      leftCollapsed,
      plannerStep,
      rightCollapsed,
    ],
  );

  const toolbarHandlers: Record<string, ToolbarItemHandler> = {
    new: { onClick: newProject },
    open: { onClick: () => router.push("/ooplanner/projects") },
    import: {
      content: (
        <button className="oo-toolbar__btn" onClick={doImportSvg} data-testid="btn-import-svg" type="button">
          <PhIcon name="upload" size={16} />
          <span className="oo-toolbar__label">Import</span>
        </button>
      ),
    },
    save: {
      content: (
        <button
          className="oo-toolbar__btn oo-toolbar__btn--primary"
          onClick={saveProject}
          disabled={saving}
          data-testid="btn-save"
          type="button"
        >
          <PhIcon name="save" size={16} />
          <span className="oo-toolbar__label">{saving ? "Saving…" : "Save"}</span>
        </button>
      ),
    },
    undo: { onClick: history.undo, disabled: !history.canUndo },
    redo: { onClick: history.redo, disabled: !history.canRedo },
    wall: {
      onClick: () => selectDrawTool("wall"),
      active: plannerStep === "draw" && tool === "wall",
    },
    door: {
      onClick: () => selectDrawTool("door"),
      active: plannerStep === "draw" && tool === "door",
    },
    window: {
      onClick: () => selectDrawTool("window"),
      active: plannerStep === "draw" && tool === "window",
    },
    measure: {
      onClick: () => selectDrawTool("dimension"),
      active: plannerStep === "draw" && tool === "dimension",
    },
    grid: { onClick: toggleGrid, active: showGrid },
    snap: { onClick: toggleSnap, active: snapEnabled },
    fit: { onClick: core.fitToContent },
    boq: { onClick: openBoqPanel },
    export: {
      content: (
        <ExportMenu
          triggerClassName="oo-toolbar__btn"
          sections={[
            {
              id: "plan",
              heading: "Plan",
              items: [
                flag("plannerExportSvg") ? { id: "svg", label: "SVG", onSelect: doExportSVG, testId: "btn-export-svg" } : null,
                flag("plannerExportDxf") ? { id: "dxf", label: "DXF", onSelect: doExportDXF, testId: "btn-export-dxf" } : null,
                flag("plannerExportPdf") ? { id: "pdf", label: "PDF", onSelect: doExportPDF, testId: "btn-export-pdf" } : null,
                flag("plannerExportPng") ? { id: "png", label: "PNG", onSelect: doExportPNG, testId: "btn-export-png" } : null,
              ].filter((item): item is NonNullable<typeof item> => item !== null),
            },
          ].filter((section) => section.items.length > 0)}
        />
      ),
    },
  };

  const plannerCtx = {
    fabricRef,
    scalePxPerMm: SCALE_PX_PER_MM,
    sheet, setSheet: (s: PlannerSheet) => setSheet(s),
    propObj, setObjectProp,
    applyFill, applyStroke,
    layers, selectedIds,
    sceneVersion,
    layerSelect, layerToggleVisible, layerToggleLock, layerDelete, layerReorder,
    placeFurnitureItem,
  };

  return (
    <PlannerContext.Provider value={plannerCtx}>
    <div className="planner-stack" data-planner-step={plannerStep}>
      <PlannerTopToolbar handlers={toolbarHandlers} />
      <PlannerWorkflowBar
        currentStep={plannerStep}
        onStepChange={applyPlannerStep}
        planMetrics={planMetrics}
      />
    <div className="workspace" data-testid="planner-workspace">
      <div className="planner-mobile-shell" data-testid="planner-mobile-shell">
        <div className="planner-mobile-canvas" data-testid="planner-mobile-canvas" aria-hidden="true" />
        <div className="planner-mobile-bottom-chrome" data-testid="planner-mobile-bottom-chrome" data-mobile-chrome="bottom">
          <button
            type="button"
            className="planner-mobile-action"
            data-testid="canvas-tool-select"
            data-active={tool === "select" ? "true" : "false"}
            aria-label="Select tool"
            aria-pressed={tool === "select"}
            onClick={() => selectDrawTool("select")}
          >
            <PhIcon name="cursor" size={18} /><span>Select</span>
          </button>
          <button
            type="button"
            className="planner-mobile-action"
            data-testid="canvas-tool-wall"
            data-active={plannerStep === "draw" && tool === "wall" ? "true" : "false"}
            aria-label="Wall tool"
            aria-pressed={plannerStep === "draw" && tool === "wall"}
            onClick={() => selectDrawTool("wall")}
          >
            <PhIcon name="wall" size={18} /><span>Wall</span>
          </button>
          <button
            type="button"
            className="planner-mobile-action"
            data-testid="canvas-tool-furniture"
            data-active={plannerStep === "place" ? "true" : "false"}
            aria-label="Furniture tool"
            aria-pressed={plannerStep === "place"}
            onClick={() => applyPlannerStep("place")}
          >
            <PhIcon name="rect" size={18} /><span>Furniture</span>
          </button>
          <button
            type="button"
            className="planner-mobile-action"
            data-testid="planner-toggle-inventory"
            data-active={plannerStep === "place" && !leftCollapsed ? "true" : "false"}
            aria-label="Toggle inventory panel"
            aria-pressed={plannerStep === "place" && !leftCollapsed}
            onClick={() => toggleMobilePanel("left", "catalog", "place")}
          >
            <PhIcon name="layers" size={18} /><span>Inventory</span>
          </button>
          <button
            type="button"
            className="planner-mobile-action"
            data-testid="planner-toggle-properties"
            data-active={(plannerStep === "place" || plannerStep === "review") && !rightCollapsed && activeRightDock === "props" ? "true" : "false"}
            aria-label="Toggle properties panel"
            aria-pressed={(plannerStep === "place" || plannerStep === "review") && !rightCollapsed && activeRightDock === "props"}
            onClick={() => toggleMobilePanel("right", "props", plannerStep === "review" ? "review" : "place")}
          >
            <PhIcon name="properties" size={18} /><span>Properties</span>
          </button>
          <ExportMenu
            label="More"
            triggerIcon="gear"
            triggerClassName="planner-mobile-more-trigger"
            testId="planner-more-actions"
            panelTestId="planner-more-menu"
            sections={[
              {
                id: "view",
                heading: "View",
                items: [
                  { id: "grid", label: showGrid ? "Disable grid" : "Enable grid", onSelect: toggleGrid, testId: "planner-more-grid" },
                  { id: "snap", label: snapEnabled ? "Disable snap" : "Enable snap", onSelect: toggleSnap, testId: "planner-more-snap" },
                  { id: "fit", label: "Fit plan", onSelect: core.fitToContent, testId: "planner-more-fit" },
                  { id: "autofit", label: autoFit ? "Disable auto-fit" : "Enable auto-fit", onSelect: () => setAutoFit((value) => !value), testId: "planner-more-autofit" },
                  { id: "fullscreen", label: fullscreen ? "Exit fullscreen" : "Enter fullscreen", onSelect: toggleFullscreen, testId: "planner-more-fullscreen" },
                ],
              },
              {
                id: "plan",
                heading: "Plan",
                items: [
                  { id: "save", label: saving ? "Saving…" : "Save plan", onSelect: () => { void saveProject(); }, testId: "planner-more-save" },
                  { id: "import", label: "Import SVG", onSelect: doImportSvg, testId: "planner-more-import" },
                  ...(flag("plannerExportPng") ? [{ id: "png", label: "Export PNG", onSelect: doExportPNG, testId: "planner-more-export-png" }] : []),
                  ...(flag("plannerExportPdf") ? [{ id: "pdf", label: "Export PDF", onSelect: doExportPDF, testId: "planner-more-export-pdf" }] : []),
                  ...(flag("plannerExportSvg") ? [{ id: "svg", label: "Export SVG", onSelect: doExportSVG, testId: "planner-more-export-svg" }] : []),
                  ...(flag("plannerExportDxf") ? [{ id: "dxf", label: "Export DXF", onSelect: doExportDXF, testId: "planner-more-export-dxf" }] : []),
                ],
              },
              {
                id: "review",
                heading: "Review",
                items: [
                  { id: "boq", label: "Open BOQ", onSelect: openBoqPanel, testId: "planner-more-boq" },
                  { id: "commands", label: "Command palette", onSelect: () => setCommandOpen(true), testId: "planner-more-commands" },
                ],
              },
            ]}
          />
        </div>
      </div>
      <aside
        className="side-panel side-panel--left side-panel--dock"
        data-testid="catalog-rail"
        aria-label="Catalog and tools"
        data-collapsed={leftCollapsed}
        style={{ width: leftCollapsed ? undefined : leftPanel.width }}
      >
        {!leftCollapsed && plannerStep === "draw" && drawLeftPanels.length > 0 ? (
          <DockShell
            panels={drawLeftPanels}
            storageKey="planner.dock.left.draw.v12"
            onReadyApi={(api) => {
              leftDockApiRef.current = api;
            }}
          />
        ) : null}
        {!leftCollapsed && plannerStep !== "draw" && leftPanelsForStep(plannerStep).length > 0 ? (
          <DockShell
            panels={leftPanelsForStep(plannerStep)}
            storageKey={`planner.dock.left.${plannerStep}.v12`}
            onReadyApi={(api) => {
              leftDockApiRef.current = api;
              const pending = pendingLeftFocusRef.current ?? activeLeftDock;
              pendingLeftFocusRef.current = null;
              queueMicrotask(() => {
                api.getPanel(pending)?.api?.setActive?.();
              });
            }}
          />
        ) : null}
        <SidePanelResizeHandle edge="end" active={leftPanel.active} {...leftPanel.handleProps} />
      </aside>
      <ToolRail tools={PLANNER_TOOLS} activeTool={tool} onSelect={(t) => setTool(t as PlannerTool)}
        extras={<>
          <button type="button" className="icon-btn" onClick={history.undo} title="Undo" aria-label="Undo" data-testid="btn-undo"><PhIcon name="undo" size={20} /></button>
          <button type="button" className="icon-btn" onClick={history.redo} title="Redo" aria-label="Redo" data-testid="btn-redo"><PhIcon name="redo" size={20} /></button>
        </>}
      />
      <div className="canvas-stage" data-testid="canvas-stage" data-rulers="true">
        <div ref={wrapperRef} className="canvas-stage__inner">
          <canvas ref={canvasElRef} data-testid="planner-canvas" />
        </div>
        <Rulers fabricRef={fabricRef} scale={SCALE_PX_PER_MM} zoom={core.zoom} cursorMm={cursorMm} offset={{ x: 0, y: 0 }} />
        <PlannerAlignBar
          visible={flag("plannerAlignDistribute") && selectedIds.length >= 2}
          count={selectedIds.length}
          onAction={applyAlign}
        />
        <DraggableCanvasOverlay
          storageKey="ooplanner.canvas-overlay.v2"
          className="canvas-overlay canvas-overlay--planner"
        >
          <ProjectMenu
            projectName={projectName}
            onProjectNameChange={setProjectName}
            onAutoArrange={() => setAutoOpen(true)}
          />
          <div className="overlay-sep" />
          {plannerStep === "draw" ? (
            <>
              <div className="overlay-toggle-group" role="group" aria-label="Draw panels">
                <button
                  type="button"
                  className="overlay-toggle-group__btn"
                  data-active={drawSheetOpen ? "true" : "false"}
                  data-testid="dock-tab-sheet"
                  aria-pressed={drawSheetOpen}
                  onClick={() => toggleDrawPanel("sheet")}
                >
                  Sheet
                </button>
                <button
                  type="button"
                  className="overlay-toggle-group__btn"
                  data-active={drawColorOpen ? "true" : "false"}
                  data-testid="dock-tab-color"
                  aria-pressed={drawColorOpen}
                  onClick={() => toggleDrawPanel("color")}
                >
                  Color
                </button>
              </div>
              <div className="overlay-sep" />
            </>
          ) : null}
          {plannerStep === "place" ? (
            <>
              <DockPanelButtons
                items={[
                  { id: "catalog", label: "Catalog", testId: "dock-tab-catalog" },
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
              <button className="btn btn--sm" type="button" onClick={() => setAutoOpen(true)} data-testid="btn-auto-arrange">
                Auto-arrange
              </button>
              <div className="overlay-sep" />
            </>
          ) : null}
          {plannerStep === "review" ? (
            <>
              <DockPanelButtons
                items={[
                  { id: "boq", label: "BOQ", testId: "dock-tab-boq" },
                  { id: "sheet", label: "Sheet", testId: "dock-tab-sheet" },
                  { id: "layers", label: "Layers", testId: "dock-tab-layers" },
                  { id: "color", label: "Color", testId: "dock-tab-color" },
                  { id: "props", label: "Properties", testId: "dock-tab-props" },
                ]}
                activeId={rightCollapsed ? null : activeRightDock}
                onSelect={(id) => focusDockPanel("right", id)}
              />
              <div className="overlay-sep" />
            </>
          ) : null}
          <div className="overlay-sep" />
          <button
            type="button"
            className="btn btn--sm"
            data-active={aiOpen ? "true" : "false"}
            onClick={() => setAiOpen((v) => !v)}
            title="AI assist"
            aria-label="AI assist"
            data-testid="toggle-ai-float"
          >
            AI
          </button>
          <div className="overlay-sep" />
          <PlannerUnitPill />
          <div className="overlay-sep" />
          <div className="overlay-toggle-group" role="group" aria-label="Canvas aids">
            <button
              type="button"
              className="overlay-toggle-group__btn"
              data-active={showGrid ? "true" : "false"}
              onClick={toggleGrid}
              title="Toggle grid"
              aria-label="Toggle grid"
              data-testid="toggle-grid"
            >
              <PhIcon name="grid" size={16} />
            </button>
            <button
              type="button"
              className="overlay-toggle-group__btn"
              data-active={snapEnabled ? "true" : "false"}
              onClick={toggleSnap}
              title="Toggle snap"
              aria-label="Toggle snap"
              data-testid="toggle-snap"
            >
              <PhIcon name="magnet" size={16} />
            </button>
            <span
              className="overlay-toggle-group__status"
              data-testid="snap-status-label"
              data-active={snapStatusActive ? "true" : "false"}
              aria-live="polite"
              title="Snap status"
            >
              {snapStatusLabel}
            </span>
          </div>
        </DraggableCanvasOverlay>
        {aiOpen ? (
          <div className="planner-ai-anchor" data-testid="planner-ai-anchor">
            <PlannerAiPanel
              onClose={() => setAiOpen(false)}
              onApplyPlacements={applyAiPlacements}
              onApplySketchGeometry={applySketchGeometry}
            />
          </div>
        ) : null}
        {/* Mounted independently of the AI panel — the global Ctrl/Cmd+K
            listener toggles `commandOpen` unconditionally, so gating this on
            `aiOpen` let the two desync: the first Ctrl+K on a fresh session
            (AI panel closed) flipped commandOpen to true with nothing
            rendered to show it, and the palette could never appear. */}
        <PlannerCommandPalette
          open={commandOpen}
          commands={paletteCommands}
          onClose={() => setCommandOpen(false)}
        />
        {topbarSlot && createPortal(
          <>
            <label className="topbar__project">
              <span className="topbar__project-label">Plan</span>
              <input
                className="input input--sm topbar__project-input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                data-testid="project-name"
                placeholder="Untitled plan"
                aria-label="Plan name"
              />
            </label>
            {/* New/Open/Import/Save/Export moved into PlannerTopToolbar
                (toolbarHandlers above) \u2014 this hidden file input is still
                needed here since doImportSvg triggers it programmatically. */}
            <input
              ref={importFileRef}
              type="file"
              accept=".svg,image/svg+xml"
              hidden
              aria-label="Import SVG floor plan"
              data-testid="import-svg-input"
              onChange={onImportFileChange}
            />
          </>,
          topbarSlot,
        )}
        <div className="canvas-info" data-testid="canvas-info">
          <div className="canvas-info__group"><span>x</span><strong>{cursorMm.x}</strong>mm</div>
          <div className="canvas-info__group"><span>y</span><strong>{cursorMm.y}</strong>mm</div>
          <div className="canvas-info__group"><span>grid</span><strong>{gridSize}</strong>mm</div>
          <div className="canvas-info__group"><span>sheet</span><strong>{Math.round(sheet.width_mm/1000*10)/10}×{Math.round(sheet.height_mm/1000*10)/10}</strong>m</div>
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
        data-testid="planner-side-panel"
        aria-label="Properties and layers"
        data-collapsed={rightCollapsed}
        style={{ width: rightCollapsed ? undefined : rightPanel.width }}
      >
        {!rightCollapsed && rightPanelsForStep(plannerStep).length > 0 && (
          <DockShell
            panels={rightPanelsForStep(plannerStep)}
            storageKey={`planner.dock.right.${plannerStep}.v12`}
            onReadyApi={(api) => {
              rightDockApiRef.current = api;
              const pending = pendingRightFocusRef.current ?? activeRightDock;
              pendingRightFocusRef.current = null;
              queueMicrotask(() => {
                api.getPanel(pending)?.api?.setActive?.();
              });
            }}
          />
        )}
        <SidePanelResizeHandle edge="start" active={rightPanel.active} {...rightPanel.handleProps} />
      </aside>

      {core.contextMenu && (
        <ContextMenu x={core.contextMenu.x} y={core.contextMenu.y} items={buildContextMenu()} onClose={() => core.setContextMenu(null)} />
      )}

      <AutoArrangeDialog open={autoOpen} onClose={() => setAutoOpen(false)} sheet={sheet} onArrange={doAutoArrange} />
    </div>
    </div>
    </PlannerContext.Provider>
  );
};

export default Planner;
