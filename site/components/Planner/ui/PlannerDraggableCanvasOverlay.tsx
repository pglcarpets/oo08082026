"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

type Offset = { x: number; y: number };

type DraggableCanvasOverlayProps = {
  children: ReactNode;
  storageKey?: string;
  className?: string;
  testId?: string;
};

function readOffset(key: string | undefined): Offset {
  if (!key) return { x: 0, y: 0 };
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { x: 0, y: 0 };
    const parsed = JSON.parse(raw) as Partial<Offset>;
    const x = typeof parsed.x === "number" && Number.isFinite(parsed.x) ? parsed.x : 0;
    const y = typeof parsed.y === "number" && Number.isFinite(parsed.y) ? parsed.y : 0;
    return { x, y };
  } catch {
    return { x: 0, y: 0 };
  }
}

/** Canvas chrome toolbar that can be dragged within the stage. */
export function DraggableCanvasOverlay({
  children,
  storageKey,
  className = "canvas-overlay",
  testId = "canvas-overlay",
}: DraggableCanvasOverlayProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const offsetRef = useRef<Offset>({ x: 0, y: 0 });
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const initial = readOffset(storageKey);
    offsetRef.current = initial;
    setOffset(initial);
  }, [storageKey]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest(".canvas-overlay__grip")) return;
    const root = rootRef.current;
    if (!root) return;
    event.preventDefault();
    root.setPointerCapture(event.pointerId);
    const current = offsetRef.current;
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: current.x,
      originY: current.y,
    };
    setDragging(true);
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const next = {
      x: drag.originX + (event.clientX - drag.startX),
      y: drag.originY + (event.clientY - drag.startY),
    };
    offsetRef.current = next;
    setOffset(next);
  }, []);

  const endDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* noop */
    }
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(offsetRef.current));
      } catch {
        /* noop */
      }
    }
  }, [storageKey]);

  return (
    <div
      ref={rootRef}
      className={className}
      data-testid={testId}
      data-dragging={dragging ? "true" : "false"}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <span
        className="canvas-overlay__grip"
        role="img"
        title="Drag toolbar"
        data-testid="canvas-overlay-grip"
        aria-label="Drag toolbar"
      />
      {children}
    </div>
  );
}

export default DraggableCanvasOverlay;
