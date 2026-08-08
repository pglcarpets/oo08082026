"use client";
import React, { useEffect, useRef, useState } from "react";
import { PhIcon } from "@studio/components/ui/StudioPhIcon";
import type { ContextMenuItem } from "@studio/lib/studioTypes";

type ContextMenuProps = {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose?: () => void;
};

export const ContextMenu = ({ x, y, items, onClose }: ContextMenuProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose?.();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const [pos, setPos] = useState({ x, y });
  useEffect(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let nx = x;
    let ny = y;
    if (x + r.width > vw - 8) nx = vw - r.width - 8;
    if (y + r.height > vh - 8) ny = vh - r.height - 8;
    setPos({ x: nx, y: ny });
  }, [x, y, items]);

  return (
    <div ref={ref} className="context-menu" style={{ left: pos.x, top: pos.y }} data-testid="context-menu" role="menu">
      {items.map((it, i) => {
        if (it.separator) return <div key={`s${i}`} className="context-menu__sep" />;
        return (
          <button
            key={it.id || i}
            className="context-menu__item"
            onClick={() => {
              it.onClick?.();
              onClose?.();
            }}
            disabled={it.disabled}
            data-testid={`ctx-${it.id}`}
            role="menuitem"
          >
            {it.icon && <PhIcon name={it.icon} size={16} />}
            <span className="context-menu__label">{it.label}</span>
            {it.shortcut && <span className="context-menu__shortcut">{it.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;
