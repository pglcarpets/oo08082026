import type { StudioUnit } from "@studio/store/studioUiStore";

/** Unit conversion and canvas scaling helpers. Canonical world unit: mm. */
export const MM_PER_INCH = 25.4;

export const toMm = (value: number, unit: StudioUnit | string): number => {
  if (unit === "in") return value * MM_PER_INCH;
  if (unit === "cm") return value * 10;
  if (unit === "m") return value * 1000;
  return value;
};

export const fromMm = (mm: number, unit: StudioUnit | string): number => {
  if (unit === "in") return mm / MM_PER_INCH;
  if (unit === "cm") return mm / 10;
  if (unit === "m") return mm / 1000;
  return mm;
};

export const formatDim = (mm: number, unit: StudioUnit | string): string => {
  const val = fromMm(mm, unit);
  if (unit === "in") return `${val.toFixed(2)}"`;
  if (unit === "m") return `${val.toFixed(2)} m`;
  if (unit === "cm") return `${val.toFixed(1)} cm`;
  return `${Math.round(val)} mm`;
};

export const pxToMm = (px: number, scale: number): number => px / scale;
export const mmToPx = (mm: number, scale: number): number => mm * scale;
