"use client";
import React, { useState } from "react";
import { HueSlider } from "@planner/components/ui/PlannerHueSlider";
import { OO, OO_SWATCHES, transparentChecker } from "@planner/lib/plannerPalette";

type ColorPaletteProps = {
  fill?: string;
  stroke?: string;
  onFillChange?: (c: string) => void;
  onStrokeChange?: (c: string) => void;
};

export const ColorPalette = ({ fill, stroke, onFillChange, onStrokeChange }: ColorPaletteProps) => {
  const [mode, setMode] = useState<"fill" | "stroke">("fill");
  const current = mode === "fill" ? fill : stroke;
  const onPick = (c: string) => {
    if (mode === "fill") onFillChange?.(c);
    else onStrokeChange?.(c);
  };
  return (
    <div className="color-palette" data-testid="color-palette">
      <div className="segmented" style={{ width: "100%", justifyContent: "stretch" }}>
        <button style={{ flex: 1 }} data-active={mode === "fill"} onClick={() => setMode("fill")} data-testid="cp-fill">Fill</button>
        <button style={{ flex: 1 }} data-active={mode === "stroke"} onClick={() => setMode("stroke")} data-testid="cp-stroke">Stroke</button>
      </div>
      <div className="color-palette__current">
        <div
          className="color-palette__preview"
          style={{ background: current === "transparent" ? transparentChecker(8) : current }}
        />
        <input
          type="color"
          value={current && current !== "transparent" ? current : OO.colorPickerFallback}
          onChange={(e) => onPick(e.target.value)}
          className="color-palette__picker"
          data-testid="cp-picker"
          aria-label={`${mode === "fill" ? "Fill" : "Stroke"} color picker`}
        />
        <input
          className="input input--sm"
          value={current || ""}
          onChange={(e) => onPick(e.target.value)}
          spellCheck={false}
          data-testid="cp-hex"
          aria-label={`${mode === "fill" ? "Fill" : "Stroke"} color hex`}
        />
      </div>
      <HueSlider
        value={current}
        fallback={OO.colorPickerFallback}
        onChange={onPick}
        disabled={current === "transparent"}
      />
      <div className="color-palette__swatches">
        {OO_SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            className="color-palette__swatch"
            style={{ background: c === "transparent" ? transparentChecker(6) : c }}
            data-active={current === c}
            onClick={() => onPick(c)}
            data-testid={`cp-swatch-${c}`}
            title={c}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPalette;
