"use client";
import React, { ReactNode } from "react";
import { IconButton } from "@studio/components/StudioIconButton";
import type { ToolRailEntry } from "@studio/lib/studioTypes";

type ToolRailProps = {
  tools: ToolRailEntry[];
  activeTool: string;
  onSelect: (id: string) => void;
  extras?: ReactNode;
};

export const ToolRail = ({ tools, activeTool, onSelect, extras }: ToolRailProps) => (
  <div className="tool-rail" data-testid="tool-rail" role="toolbar" aria-label="Canvas tools">
    {tools.map((t, i) =>
      t.divider ? (
        <div key={`d${i}`} className="tool-rail__divider" />
      ) : (
        <IconButton
          key={t.id}
          icon={t.icon}
          label={t.label + (t.shortcut ? ` (${t.shortcut})` : "")}
          active={activeTool === t.id}
          onClick={() => onSelect(t.id)}
          testId={`tool-${t.id}`}
        />
      ),
    )}
    <div style={{ flex: 1 }} />
    {extras}
  </div>
);

export default ToolRail;
