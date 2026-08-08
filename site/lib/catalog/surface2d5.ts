/**
 * 2.5D plan-view surfaces — depth via extruded edges and shadows, not heavy gradients.
 */
import type { Prim } from "./blocks2d";

const SURFACE_STROKE = "var(--block-surface-stroke)";
const CORNER_R = 8;
const STROKE_W = 2;

export const SURFACE_2_5D = {
  top: "var(--color-ecru-200)",
  topMid: "var(--color-ecru-200)",
  topShade: "var(--color-ecru-300)",
  edgeSouth: "var(--color-ecru-500)",
  edgeEast: "var(--color-ecru-400)",
  shadow: "var(--overlay-inverse-12)",
  highlight: "var(--glass-white-40)",
  highlightSoft: "var(--glass-white-20)",
} as const;

/** Subtle diagonal wash — max ~6% luminance shift. */
export const SUBTLE_SURFACE_GRAD = [
  0, SURFACE_2_5D.top,
  0.55, SURFACE_2_5D.topMid,
  1, SURFACE_2_5D.topShade,
] as const;

export function extrusionDepth(w: number, h: number): number {
  return Math.max(24, Math.min(56, Math.round(Math.min(w, h) * 0.042)));
}

/** Rectangular worktop / table with south-east extrusion and cast shadow. */
export function surface2_5DPrims(x: number, y: number, w: number, h: number): Prim[] {
  const d = extrusionDepth(w, h);
  const skewX = d * 0.5;
  const skewY = d * 0.52;
  const topW = w - skewX;
  const topH = h - skewY;

  return [
    {
      kind: "rect",
      x: x + d * 0.28,
      y: y + d * 0.34,
      w: topW,
      h: topH,
      fill: SURFACE_2_5D.shadow,
      radius: CORNER_R,
    },
    {
      kind: "rect",
      x: x + d * 0.14,
      y: y + topH - d * 0.08,
      w: topW,
      h: d,
      fill: SURFACE_2_5D.edgeSouth,
      radius: Math.min(4, CORNER_R),
    },
    {
      kind: "rect",
      x: x + topW - d * 0.06,
      y: y + d * 0.18,
      w: d * 0.82,
      h: topH - d * 0.12,
      fill: SURFACE_2_5D.edgeEast,
      radius: 2,
    },
    {
      kind: "rect",
      x,
      y,
      w: topW,
      h: topH,
      fillLinearGradientStartPoint: { x, y },
      fillLinearGradientEndPoint: { x: x + topW * 0.35, y: y + topH * 0.25 },
      fillLinearGradientColorStops: SUBTLE_SURFACE_GRAD,
      stroke: SURFACE_STROKE,
      strokeWidth: STROKE_W,
      radius: CORNER_R,
    },
    {
      kind: "line",
      points: [x + CORNER_R, y + 2.5, x + topW - CORNER_R - 2, y + 2.5],
      stroke: SURFACE_2_5D.highlight,
      strokeWidth: 2,
      lineCap: "round",
    },
    {
      kind: "line",
      points: [x + 2.5, y + CORNER_R, x + 2.5, y + topH - CORNER_R - 4],
      stroke: SURFACE_2_5D.highlightSoft,
      strokeWidth: 1.5,
      lineCap: "round",
    },
  ];
}

/** Round table top — ring edge + subtle fill. */
export function roundSurface2_5DPrims(cx: number, cy: number, r: number): Prim[] {
  const edge = Math.max(18, Math.round(r * 0.06));
  return [
    {
      kind: "circle",
      cx: cx + edge * 0.22,
      cy: cy + edge * 0.28,
      r,
      fill: SURFACE_2_5D.shadow,
    },
    {
      kind: "circle",
      cx,
      cy,
      r,
      fill: SURFACE_2_5D.edgeSouth,
      stroke: SURFACE_STROKE,
      strokeWidth: STROKE_W,
    },
    {
      kind: "circle",
      cx,
      cy,
      r: r - edge,
      fillLinearGradientStartPoint: { x: cx - r, y: cy - r },
      fillLinearGradientEndPoint: { x: cx + r * 0.25, y: cy + r * 0.2 },
      fillLinearGradientColorStops: SUBTLE_SURFACE_GRAD,
    },
    {
      kind: "circle",
      cx: cx - r * 0.15,
      cy: cy - r * 0.2,
      r: r * 0.55,
      fill: "none",
      stroke: SURFACE_2_5D.highlightSoft,
      strokeWidth: 1.5,
    },
  ];
}
