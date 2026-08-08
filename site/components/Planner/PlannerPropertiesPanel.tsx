"use client";
import { PropertiesEmptyHint } from "@planner/components/ui/PlannerPropertiesEmptyHint";
import { OO_DRAW } from "@planner/lib/plannerPalette";
import React from "react";
import { fromMm, toMm, formatDim } from "@planner/lib/plannerUnits";
import { usePlannerUIStore } from "@planner/store/plannerUiStore";
import type { OoFabricObject } from "@planner/lib/plannerTypes";

type NumRowProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  disabled?: boolean;
  suffix?: string;
  testId?: string;
};

const NumRow = ({ label, value, onChange, step = 1, disabled, suffix, testId }: NumRowProps) => (
  <div className="prop-row">
    <div className="prop-row__label" id={testId ? `${testId}-label` : undefined}>
      {label}
    </div>
    <div className="prop-row__inputs">
      <input
        className="input"
        type="number"
        step={step}
        value={Number.isFinite(value) ? Math.round(value * 100) / 100 : ""}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        data-testid={testId}
        aria-label={label}
        aria-labelledby={testId ? `${testId}-label` : undefined}
      />
      {suffix ? <div style={{ fontSize: 11, color: "var(--text-subtle)", alignSelf: "center", minWidth: 20 }}>{suffix}</div> : null}
    </div>
  </div>
);

type PropertiesPanelProps = {
  selected: OoFabricObject | null;
  scalePxPerMm: number;
  onChange: (patch: Record<string, unknown>) => void;
};

export const PropertiesPanel = ({ selected, scalePxPerMm, onChange }: PropertiesPanelProps) => {
  const unit = usePlannerUIStore((s) => s.unit);

  if (!selected) {
    return <PropertiesEmptyHint />;
  }

  const px = selected.__props || {};
  const mmW = (px.width || 0) / scalePxPerMm;
  const mmH = (px.height || 0) / scalePxPerMm;
  const mmX = (px.left || 0) / scalePxPerMm;
  const mmY = (px.top || 0) / scalePxPerMm;
  const angle = px.angle || 0;

  return (
    <div data-testid="properties-panel">
      <div style={{ height: 6 }} />
      <NumRow
        label="Width"
        value={fromMm(mmW, unit)}
        onChange={(v) => onChange({ width: toMm(v, unit) * scalePxPerMm })}
        suffix={unit}
        step={unit === "in" ? 0.1 : 1}
        testId="prop-width"
      />
      <NumRow
        label="Height"
        value={fromMm(mmH, unit)}
        onChange={(v) => onChange({ height: toMm(v, unit) * scalePxPerMm })}
        suffix={unit}
        step={unit === "in" ? 0.1 : 1}
        testId="prop-height"
      />
      <NumRow
        label="X"
        value={fromMm(mmX, unit)}
        onChange={(v) => onChange({ left: toMm(v, unit) * scalePxPerMm })}
        suffix={unit}
        step={unit === "in" ? 0.1 : 1}
        testId="prop-x"
      />
      <NumRow
        label="Y"
        value={fromMm(mmY, unit)}
        onChange={(v) => onChange({ top: toMm(v, unit) * scalePxPerMm })}
        suffix={unit}
        step={unit === "in" ? 0.1 : 1}
        testId="prop-y"
      />
      <NumRow
        label="Rotation"
        value={angle}
        onChange={(v) => onChange({ angle: v })}
        suffix="°"
        step={1}
        testId="prop-angle"
      />
      {px.stroke !== undefined && (
        <div className="prop-row">
          <div className="prop-row__label" id="prop-stroke-label">Stroke</div>
          <input
            className="input input--sm"
            type="color"
            value={px.stroke || OO_DRAW.stroke}
            onChange={(e) => onChange({ stroke: e.target.value })}
            data-testid="prop-stroke"
            aria-label="Stroke"
            aria-labelledby="prop-stroke-label"
          />
        </div>
      )}
      {px.fill !== undefined && typeof px.fill === "string" && (
        <div className="prop-row">
          <div className="prop-row__label" id="prop-fill-label">Fill</div>
          <input
            className="input input--sm"
            type="color"
            value={px.fill || OO_DRAW.fill}
            onChange={(e) => onChange({ fill: e.target.value })}
            data-testid="prop-fill"
            aria-label="Fill"
            aria-labelledby="prop-fill-label"
          />
        </div>
      )}
      {px.strokeWidth !== undefined && (
        <NumRow label="Stroke width" value={px.strokeWidth || 1} step={0.5} onChange={(v) => onChange({ strokeWidth: v })} suffix="px" testId="prop-strokewidth" />
      )}

      <div style={{ fontSize: 11, color: "var(--text-subtle)", marginTop: 12, fontFamily: "var(--font-mono)" }}>
        Real world: {formatDim(mmW, unit)} × {formatDim(mmH, unit)}
      </div>
    </div>
  );
};

export default PropertiesPanel;
