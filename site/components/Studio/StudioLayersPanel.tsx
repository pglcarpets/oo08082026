"use client";
import React from "react";
import { PanelEmptyState } from "@studio/components/ui/StudioPanelEmptyState";
import { PhIcon } from "@studio/components/ui/StudioPhIcon";
import type { LayerRow } from "@studio/lib/studioTypes";

type LayersPanelProps = {
  objects: LayerRow[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, delta: number) => void;
};

export const LayersPanel = ({
  objects,
  selectedId,
  onSelect,
  onToggleVisible,
  onToggleLock,
  onDelete,
  onReorder,
}: LayersPanelProps) => {
  if (!objects || objects.length === 0) {
    return (
      <PanelEmptyState
        icon="layers"
        title="No objects yet"
        body="Draw shapes and furniture with the tools on the left."
        testId="layers-empty-state"
      />
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }} data-testid="layers-panel">
      {objects.map((o) => (
        <div
          key={o.id}
          className="layer-item"
          role="button"
          tabIndex={0}
          data-selected={o.id === selectedId}
          onClick={() => onSelect(o.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(o.id);
            }
          }}
          data-testid={`layer-${o.id}`}
        >
          <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.label}</span>
          <button type="button" className="layer-item__icon-btn" onClick={(e) => { e.stopPropagation(); onReorder(o.id, -1); }} title="Bring forward" aria-label={`Bring ${o.label} forward`}>
            <PhIcon name="arrowUp" size={16} />
          </button>
          <button type="button" className="layer-item__icon-btn" onClick={(e) => { e.stopPropagation(); onReorder(o.id, 1); }} title="Send backward" aria-label={`Send ${o.label} backward`}>
            <PhIcon name="arrowDown" size={16} />
          </button>
          <button type="button" className="layer-item__icon-btn" onClick={(e) => { e.stopPropagation(); onToggleVisible(o.id); }} title="Toggle visibility" aria-label={`${o.visible ? "Hide" : "Show"} ${o.label}`}>
            <PhIcon name={o.visible ? "eye" : "eyeOff"} size={16} />
          </button>
          <button type="button" className="layer-item__icon-btn" onClick={(e) => { e.stopPropagation(); onToggleLock(o.id); }} title="Toggle lock" aria-label={`${o.locked ? "Unlock" : "Lock"} ${o.label}`}>
            <PhIcon name={o.locked ? "lock" : "unlock"} size={16} />
          </button>
          <button type="button" className="layer-item__icon-btn" onClick={(e) => { e.stopPropagation(); onDelete(o.id); }} title="Delete" aria-label={`Delete ${o.label}`}>
            <PhIcon name="trash" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default LayersPanel;
