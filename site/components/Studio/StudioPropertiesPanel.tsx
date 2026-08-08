"use client";
import { PropertiesEmptyHint } from "@studio/components/ui/StudioPropertiesEmptyHint";
import { OO_DRAW } from "@studio/lib/studioPalette";
import { DEFAULT_FURNITURE_DIMS_MM } from "@studio/lib/studioTokens";
import React from "react";
import { fromMm, toMm, formatDim } from "@studio/lib/studioUnits";
import { useStudioUIStore } from "@studio/store/studioUiStore";
import {
  lineLengthPx,
  propertySizeFields,
} from "@studio/lib/studioPropertySizeFields";
import type { OoFabricObject } from "@studio/lib/studioTypes";

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

type PropertiesSelection = {
  __props?: {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    angle?: number;
    fill?: string | null;
    stroke?: string | null;
    strokeWidth?: number;
  };
  __obj?: OoFabricObject;
} | null;

type PropertiesPanelProps = {
  selected: PropertiesSelection;
  scalePxPerMm: number;
  onChange: (patch: Record<string, unknown>) => void;
};

export const PropertiesPanel = ({ selected, scalePxPerMm, onChange }: PropertiesPanelProps) => {
  const unit = useStudioUIStore((s) => s.unit);

  if (!selected) {
    return <PropertiesEmptyHint />;
  }

  const px = selected.__props || {};
  const obj = selected.__obj;
  const size = propertySizeFields(obj?.type);
  const mmW = (px.width || 0) / scalePxPerMm;
  const mmH = (px.height || 0) / scalePxPerMm;
  const mmX = (px.left || 0) / scalePxPerMm;
  const mmY = (px.top || 0) / scalePxPerMm;
  const angle = px.angle || 0;
  const heightMm =
    typeof obj?.data?.dimensions === "object" &&
    obj.data.dimensions &&
    typeof (obj.data.dimensions as { height_mm?: unknown }).height_mm === "number"
      ? (obj.data.dimensions as { height_mm: number }).height_mm
      : DEFAULT_FURNITURE_DIMS_MM.height_mm;
  const step = unit === "in" ? 0.1 : 1;
  const lineMm =
    size.kind === "length" && obj ? lineLengthPx(obj) / scalePxPerMm : 0;

  return (
    <div data-testid="properties-panel">
      <div style={{ height: 6 }} />
      {size.kind === "length" ? (
        <NumRow
          label={size.labels.primary}
          value={fromMm(lineMm, unit)}
          onChange={(v) => onChange({ length: toMm(v, unit) * scalePxPerMm })}
          suffix={unit}
          step={step}
          testId="prop-length"
        />
      ) : (
        <>
          <NumRow
            label={size.labels.x}
            value={fromMm(mmW, unit)}
            onChange={(v) => onChange({ width: toMm(v, unit) * scalePxPerMm })}
            suffix={unit}
            step={step}
            testId="prop-length"
          />
          <NumRow
            label={size.labels.y}
            value={fromMm(mmH, unit)}
            onChange={(v) => onChange({ height: toMm(v, unit) * scalePxPerMm })}
            suffix={unit}
            step={step}
            testId="prop-depth"
          />
          <NumRow
            label={size.labels.z}
            value={fromMm(heightMm, unit)}
            onChange={(v) => onChange({ height_mm: toMm(v, unit) })}
            suffix={unit}
            step={step}
            testId="prop-height-mm"
          />
        </>
      )}
      <NumRow
        label="X"
        value={fromMm(mmX, unit)}
        onChange={(v) => onChange({ left: toMm(v, unit) * scalePxPerMm })}
        suffix={unit}
        step={step}
        testId="prop-x"
      />
      <NumRow
        label="Y"
        value={fromMm(mmY, unit)}
        onChange={(v) => onChange({ top: toMm(v, unit) * scalePxPerMm })}
        suffix={unit}
        step={step}
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
      {px.fill !== undefined && typeof px.fill === "string" && size.kind === "box" && (
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
        {size.kind === "length"
          ? `Real world: ${formatDim(lineMm, unit)}`
          : `Real world: ${formatDim(mmW, unit)} × ${formatDim(mmH, unit)} × ${formatDim(heightMm, unit)}`}
      </div>
    </div>
  );
};

export default PropertiesPanel;
