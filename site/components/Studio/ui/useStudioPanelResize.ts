"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PanelResizeEdge = "start" | "end";

type UsePanelResizeOptions = {
  storageKey: string;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  /** `start` = left panel (grows when dragging right). `end` = right panel (grows when dragging left). */
  edge: PanelResizeEdge;
};

function readStoredWidth(key: string, fallback: number, min: number, max: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, Math.round(n)));
  } catch {
    return fallback;
  }
}

export function usePanelResize({
  storageKey,
  defaultWidth,
  minWidth = 220,
  maxWidth = 560,
  edge,
}: UsePanelResizeOptions) {
  // Always start with defaultWidth so SSR HTML matches the client's first paint.
  const [width, setWidth] = useState(defaultWidth);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);

  useEffect(() => {
    setWidth(readStoredWidth(storageKey, defaultWidth, minWidth, maxWidth));
    setReady(true);
  }, [storageKey, defaultWidth, minWidth, maxWidth]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, String(width));
    } catch {
      /* noop */
    }
  }, [storageKey, width, ready]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);
      dragRef.current = { startX: event.clientX, startW: width };
      setActive(true);

      const onMove = (ev: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        const delta = edge === "start" ? ev.clientX - drag.startX : drag.startX - ev.clientX;
        const next = Math.min(maxWidth, Math.max(minWidth, Math.round(drag.startW + delta)));
        setWidth(next);
      };

      const onUp = (ev: PointerEvent) => {
        dragRef.current = null;
        setActive(false);
        try {
          target.releasePointerCapture(ev.pointerId);
        } catch {
          /* noop */
        }
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [edge, maxWidth, minWidth, width],
  );

  return {
    width,
    setWidth,
    active,
    handleProps: {
      role: "separator" as const,
      "aria-orientation": "vertical" as const,
      "aria-valuenow": width,
      "aria-valuemin": minWidth,
      "aria-valuemax": maxWidth,
      "data-testid": "side-panel-resize",
      onPointerDown,
    },
  };
}
