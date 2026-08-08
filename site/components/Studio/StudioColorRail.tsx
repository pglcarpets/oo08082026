"use client";

import { ColorPalette } from "@studio/components/StudioColorPalette";

type ColorRailProps = {
  fill: string;
  stroke: string;
  onFillChange: (color: string) => void;
  onStrokeChange: (color: string) => void;
};

/** Vertical color picker docked beside the tool rail. */
export function ColorRail({ fill, stroke, onFillChange, onStrokeChange }: ColorRailProps) {
  return (
    <aside className="color-rail" data-testid="color-rail" aria-label="Color palette">
      <div className="color-rail__title">Color</div>
      <ColorPalette fill={fill} stroke={stroke} onFillChange={onFillChange} onStrokeChange={onStrokeChange} />
    </aside>
  );
}

export default ColorRail;
