"use client";

import type { ReactNode } from "react";
import { PhIcon } from "@planner/components/ui/PlannerPhIcon";
import type { PhIconName } from "@planner/components/ui/plannerPhIconMap";

/**
 * Floor Planner top toolbar. Wired via the `handlers` map keyed by item id —
 * items without a `content` override render as a plain button using the
 * handler's onClick/disabled/active; items with `content` (import, save,
 * export) render that node instead, since those carry feature-flag gating
 * or a dropdown a single button can't express. Mirrors the equivalent
 * Studio fix (`StudioTopToolbar.tsx`).
 */

type ToolbarItem = {
  id: string;
  label: string;
  icon: PhIconName;
};

export type ToolbarItemHandler = {
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  /** Full render override for this item — bypasses the default icon+label button. */
  content?: ReactNode;
};

type ToolbarGroup = {
  id: string;
  label: string;
  items: ToolbarItem[];
};

const PLANNER_TOOLBAR_GROUPS: ToolbarGroup[] = [
  {
    id: "file",
    label: "Plan file",
    items: [
      { id: "new", label: "New", icon: "rect" },
      { id: "open", label: "Open", icon: "folder" },
      { id: "import", label: "Import", icon: "upload" },
      { id: "save", label: "Save", icon: "save" },
    ],
  },
  {
    id: "history",
    label: "History",
    items: [
      { id: "undo", label: "Undo", icon: "undo" },
      { id: "redo", label: "Redo", icon: "redo" },
    ],
  },
  {
    id: "draw",
    label: "Draw",
    items: [
      { id: "wall", label: "Wall", icon: "wall" },
      { id: "door", label: "Door", icon: "door" },
      { id: "window", label: "Window", icon: "window" },
      { id: "measure", label: "Measure", icon: "dimension" },
    ],
  },
  {
    id: "view",
    label: "View",
    items: [
      { id: "grid", label: "Grid", icon: "grid" },
      { id: "snap", label: "Snap", icon: "magnet" },
      { id: "fit", label: "Fit", icon: "maximize" },
    ],
  },
  {
    id: "output",
    label: "Output",
    items: [
      { id: "boq", label: "BOQ", icon: "layers" },
      { id: "export", label: "Export", icon: "download" },
    ],
  },
];

type PlannerTopToolbarProps = {
  handlers?: Record<string, ToolbarItemHandler>;
};

export function PlannerTopToolbar({ handlers = {} }: PlannerTopToolbarProps) {
  return (
    <div className="oo-toolbar" role="toolbar" aria-label="Planner toolbar" data-testid="planner-top-toolbar">
      <h1 className="sr-only">Floor planner</h1>
      {PLANNER_TOOLBAR_GROUPS.map((group, index) => (
        <div key={group.id} className="oo-toolbar__group-wrap">
          {index > 0 ? <div className="oo-toolbar__sep" aria-hidden="true" /> : null}
          <div className="oo-toolbar__group" role="group" aria-label={group.label}>
            {group.items.map((item) => {
              const h = handlers[item.id];
              if (h?.content !== undefined) {
                return (
                  <span key={item.id} className="oo-toolbar__slot" data-item={item.id}>
                    {h.content}
                  </span>
                );
              }
              return (
                <button
                  key={item.id}
                  type="button"
                  className="oo-toolbar__btn"
                  data-item={item.id}
                  data-active={h?.active}
                  aria-label={item.label}
                  data-testid={`planner-toolbar-${item.id}`}
                  onClick={h?.onClick}
                  disabled={h?.disabled}
                >
                  <PhIcon name={item.icon} size={16} />
                  <span className="oo-toolbar__label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PlannerTopToolbar;
