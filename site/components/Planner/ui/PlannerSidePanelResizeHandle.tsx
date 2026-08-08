"use client";

import type { HTMLAttributes } from "react";
import type { PanelResizeEdge } from "@planner/components/ui/usePlannerPanelResize";

type SidePanelResizeHandleProps = HTMLAttributes<HTMLDivElement> & {
  edge: PanelResizeEdge;
  active?: boolean;
};

/** Horizontal drag handle for OO side panels (col-resize). */
export function SidePanelResizeHandle({
  edge,
  active = false,
  className,
  ...rest
}: SidePanelResizeHandleProps) {
  return (
    <div
      className={["side-panel__resize", className].filter(Boolean).join(" ")}
      title="Drag to resize"
      {...rest}
      data-edge={edge}
      data-active={active ? "true" : "false"}
    />
  );
}
