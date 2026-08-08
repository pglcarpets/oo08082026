"use client";
import { OO_DRAW } from "@studio/lib/studioPalette";
import type { OoFabricObject } from "@studio/lib/studioTypes";
// Shared canvas behaviour hook: wheel pan/zoom, cursor tracking, context menu,
// keyboard nudge, viewport controls, alignment guides.
import { useEffect, useRef, useState, useCallback, type MutableRefObject } from "react";
import * as fabric from "fabric";
import type { ModifiedEvent, TPointerEventInfo } from "fabric";

type CursorMm = { x: number; y: number };

type ContextMenuState = {
  x: number;
  y: number;
  target: OoFabricObject | undefined;
} | null;

type SnapGuide =
  | { vertical: true; x: number }
  | { vertical: false; y: number };

type UseCanvasCoreParams = {
  fabricRef: MutableRefObject<fabric.Canvas | null>;
  ready: boolean;
  scale: number;
  snapEnabled: boolean;
  gridSize: number;
  tool: string;
  wrapperRef: MutableRefObject<HTMLDivElement | null>;
  onCursorMm?: (pos: CursorMm) => void;
};

export const useCanvasCore = ({
  fabricRef,
  ready,
  scale,
  snapEnabled,
  gridSize,
  tool,
  wrapperRef,
  onCursorMm,
}: UseCanvasCoreParams) => {
  const [zoom, setZoom] = useState(1);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const guidesRef = useRef<OoFabricObject[]>([]);

  // Mouse wheel: default = pan vertical, Shift = pan horizontal, Ctrl/Meta = zoom.
  useEffect(() => {
    if (!ready) return;
    const c = fabricRef.current;
    if (!c) return;
    const onWheel = (opt: TPointerEventInfo<WheelEvent>) => {
      const e = opt.e;
      if (e.ctrlKey || e.metaKey) {
        let z = c.getZoom();
        z *= 0.999 ** e.deltaY;
        z = Math.max(0.1, Math.min(8, z));
        c.zoomToPoint(new fabric.Point(e.offsetX, e.offsetY), z);
        setZoom(z);
      } else {
        // Pan
        const vpt = c.viewportTransform;
        if (e.shiftKey) {
          vpt[4] -= e.deltaY;
        } else {
          vpt[4] -= e.deltaX;
          vpt[5] -= e.deltaY;
        }
        c.setViewportTransform(vpt);
      }
      e.preventDefault();
      e.stopPropagation();
    };
    c.on("mouse:wheel", onWheel);
    return () => {
      c.off("mouse:wheel", onWheel);
    };
  }, [ready, fabricRef]);

  // Cursor tracking (mm)
  useEffect(() => {
    if (!ready) return;
    const c = fabricRef.current;
    if (!c) return;
    const onMove = (opt: TPointerEventInfo) => {
      const pt = opt.scenePoint;
      if (pt && onCursorMm) onCursorMm({ x: Math.round(pt.x / scale), y: Math.round(pt.y / scale) });
    };
    c.on("mouse:move", onMove);
    return () => {
      c.off("mouse:move", onMove);
    };
  }, [ready, fabricRef, scale, onCursorMm]);

  // Pan mode when tool==pan or middle-mouse or alt+drag
  useEffect(() => {
    if (!ready) return;
    const c = fabricRef.current;
    if (!c) return;
    let panning = false;
    let last: { x: number; y: number } | null = null;
    const onDown = (opt: TPointerEventInfo) => {
      const e = opt.e;
      if (!("clientX" in e)) return;
      if (tool === "pan" || e.button === 1 || (e.altKey && tool === "select") || e.button === 4) {
        panning = true;
        last = { x: e.clientX, y: e.clientY };
        c.setCursor("grabbing");
      }
    };
    const onMove = (opt: TPointerEventInfo) => {
      if (!panning || !last) return;
      const e = opt.e;
      if (!("clientX" in e)) return;
      const vpt = c.viewportTransform;
      vpt[4] += e.clientX - last.x;
      vpt[5] += e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      c.setViewportTransform(vpt);
    };
    const onUp = () => {
      panning = false;
      last = null;
      if (tool === "pan") c.setCursor("grab");
    };
    c.on("mouse:down", onDown);
    c.on("mouse:move", onMove);
    c.on("mouse:up", onUp);
    return () => {
      c.off("mouse:down", onDown);
      c.off("mouse:move", onMove);
      c.off("mouse:up", onUp);
    };
  }, [ready, fabricRef, tool]);

  // Context menu on right-click
  useEffect(() => {
    if (!ready) return;
    const c = fabricRef.current;
    if (!c) return;
    const upperEl = c.upperCanvasEl;
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      const target = c.findTarget(e).target as OoFabricObject | undefined;
      if (target && target !== c.getActiveObject()) {
        c.setActiveObject(target);
        c.requestRenderAll();
      }
      setContextMenu({ x: e.clientX, y: e.clientY, target });
    };
    upperEl.addEventListener("contextmenu", onContext);
    return () => upperEl.removeEventListener("contextmenu", onContext);
  }, [ready, fabricRef, wrapperRef]);

  // Alignment guides on move (snap to other objects)
  useEffect(() => {
    if (!ready) return;
    const c = fabricRef.current;
    if (!c) return;
    const clearGuides = () => {
      guidesRef.current.forEach((g) => c.remove(g));
      guidesRef.current = [];
    };
    const onMoving = (opt: ModifiedEvent) => {
      clearGuides();
      if (!snapEnabled) return;
      const t = opt.target as OoFabricObject;
      if (!t || t.data?.isGridLine) return;
      const tb = t.getBoundingRect();
      const tCx = tb.left + tb.width / 2;
      const tCy = tb.top + tb.height / 2;
      const threshold = 6; // px
      const canvasObjs = c
        .getObjects()
        .filter(
          (o) =>
            o !== t &&
            !(o as OoFabricObject).data?.isGridLine &&
            !(o as OoFabricObject).data?.isSheet &&
            !(o as OoFabricObject).data?.isGuide,
        ) as OoFabricObject[];
      const guides: SnapGuide[] = [];
      let snapDX: number | null = null;
      let snapDY: number | null = null;
      for (const o of canvasObjs) {
        const ob = o.getBoundingRect();
        const oCx = ob.left + ob.width / 2;
        const oCy = ob.top + ob.height / 2;
        // vertical alignments: left, center, right
        for (const [tv, ov] of [
          [tb.left, ob.left],
          [tCx, oCx],
          [tb.left + tb.width, ob.left + ob.width],
        ] as const) {
          if (Math.abs(tv - ov) < threshold) {
            snapDX = snapDX ?? ov - tv;
            guides.push({ vertical: true, x: ov });
          }
        }
        for (const [tv, ov] of [
          [tb.top, ob.top],
          [tCy, oCy],
          [tb.top + tb.height, ob.top + ob.height],
        ] as const) {
          if (Math.abs(tv - ov) < threshold) {
            snapDY = snapDY ?? ov - tv;
            guides.push({ vertical: false, y: ov });
          }
        }
      }
      if (snapDX !== null) t.set({ left: (t.left ?? 0) + snapDX });
      if (snapDY !== null) t.set({ top: (t.top ?? 0) + snapDY });
      const canvasW = c.getWidth() * 4;
      const canvasH = c.getHeight() * 4;
      for (const g of guides) {
        const line = new fabric.Line(
          g.vertical ? [g.x, -canvasH, g.x, canvasH] : [-canvasW, g.y, canvasW, g.y],
          {
            stroke: OO_DRAW.guide,
            strokeWidth: 1,
            selectable: false,
            evented: false,
            excludeFromExport: true,
            objectCaching: false,
          },
        ) as OoFabricObject;
        line.data = { isGuide: true };
        c.add(line);
        c.bringObjectToFront(line);
        guidesRef.current.push(line);
      }
    };
    const onDone = () => clearGuides();
    c.on("object:moving", onMoving);
    c.on("object:modified", onDone);
    c.on("mouse:up", onDone);
    return () => {
      c.off("object:moving", onMoving);
      c.off("object:modified", onDone);
      c.off("mouse:up", onDone);
      clearGuides();
    };
  }, [ready, fabricRef, snapEnabled]);

  // Viewport controls
  const zoomIn = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    const z = Math.min(8, c.getZoom() * 1.2);
    c.zoomToPoint(new fabric.Point(c.getWidth() / 2, c.getHeight() / 2), z);
    setZoom(z);
  }, [fabricRef]);
  const zoomOut = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    const z = Math.max(0.1, c.getZoom() / 1.2);
    c.zoomToPoint(new fabric.Point(c.getWidth() / 2, c.getHeight() / 2), z);
    setZoom(z);
  }, [fabricRef]);
  const zoom100 = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    // 1:1 with world origin centred in the viewport (avoids top-left bias)
    const cw = c.getWidth();
    const ch = c.getHeight();
    c.setViewportTransform([1, 0, 0, 1, cw / 2, ch / 2]);
    setZoom(1);
  }, [fabricRef]);
  const resetView = zoom100;
  const fitToContent = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    const objs = c
      .getObjects()
      .filter((o) => !(o as OoFabricObject).data?.isGridLine && !(o as OoFabricObject).data?.isGuide);
    if (objs.length === 0) {
      zoom100();
      return;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    objs.forEach((o) => {
      const b = o.getBoundingRect();
      minX = Math.min(minX, b.left);
      minY = Math.min(minY, b.top);
      maxX = Math.max(maxX, b.left + b.width);
      maxY = Math.max(maxY, b.top + b.height);
    });
    const cw = c.getWidth();
    const ch = c.getHeight();
    const pad = 80;
    const bw = Math.max(1, maxX - minX);
    const bh = Math.max(1, maxY - minY);
    const z = Math.min((cw - pad * 2) / bw, (ch - pad * 2) / bh);
    const clampZ = Math.max(0.1, Math.min(6, z));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    c.setViewportTransform([clampZ, 0, 0, clampZ, cw / 2 - cx * clampZ, ch / 2 - cy * clampZ]);
    setZoom(clampZ);
  }, [fabricRef, zoom100]);

  // Keyboard nudge (arrows) when object selected
  useEffect(() => {
    if (!ready) return;
    const c = fabricRef.current;
    if (!c) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target;
      const inField =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (inField) return;
      const active = c.getActiveObject() as OoFabricObject | undefined;
      if (!active) {
        // viewport shortcuts without selection
        if (e.key === "0") {
          e.preventDefault();
          zoom100();
          return;
        }
        if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          fitToContent();
          return;
        }
        if (e.key === "+" || e.key === "=") {
          e.preventDefault();
          zoomIn();
          return;
        }
        if (e.key === "-") {
          e.preventDefault();
          zoomOut();
          return;
        }
        return;
      }
      const gridPx = (gridSize || 100) * scale;
      const step = e.shiftKey ? gridPx : 1;
      let handled = true;
      if (e.key === "ArrowLeft") active.set({ left: (active.left ?? 0) - step });
      else if (e.key === "ArrowRight") active.set({ left: (active.left ?? 0) + step });
      else if (e.key === "ArrowUp") active.set({ top: (active.top ?? 0) - step });
      else if (e.key === "ArrowDown") active.set({ top: (active.top ?? 0) + step });
      else handled = false;
      if (handled) {
        e.preventDefault();
        active.setCoords();
        c.fire("object:modified", { target: active });
        c.requestRenderAll();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, fabricRef, gridSize, scale, zoomIn, zoomOut, zoom100, fitToContent]);

  return { zoom, setZoom, zoomIn, zoomOut, zoom100, resetView, fitToContent, contextMenu, setContextMenu };
};
