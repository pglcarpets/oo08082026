"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { PhIcon } from "@studio/components/ui/StudioPhIcon";

type Offset = { x: number; y: number };

type FloatingPanelProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  storageKey?: string;
  testId?: string;
  className?: string;
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

/** Draggable panel that floats over the canvas. */
export function FloatingPanel({
  title,
  children,
  onClose,
  storageKey,
  testId = "floating-panel",
  className = "floating-panel",
}: FloatingPanelProps) {
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onHeaderPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest(".floating-panel__close")) return;
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
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className="floating-panel__header"
        onPointerDown={onHeaderPointerDown}
        data-testid={`${testId}-header`}
      >
        <span className="floating-panel__title">{title}</span>
        <button
          type="button"
          className="floating-panel__close"
          onClick={onClose}
          aria-label={`Close ${title}`}
          data-testid={`${testId}-close`}
        >
          <PhIcon name="x" size={16} />
        </button>
      </div>
      <div className="floating-panel__body">{children}</div>
    </div>
  );
}

export default FloatingPanel;
