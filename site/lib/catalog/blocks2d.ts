// ---------------------------------------------------------------------------
// Procedural 2D blocks — production-quality plan-view symbols
// ---------------------------------------------------------------------------
// Turns a catalog product + its numeric footprint into a styled top-down
// symbol. Output is a renderer-agnostic primitive list in millimetre space.

import { createBlockColorResolver, type BlockColorResolver } from "./resolveBlockColors";
import { roundSurface2_5DPrims, surface2_5DPrims, SUBTLE_SURFACE_GRAD } from "./surface2d5";
import { resolveFootprint, sharingPeopleCount, type WorkstationSelection } from "./geometry";
import type { Dim, Product } from "./types";

// --- Design tokens (Premium Aesthetics) -------------------------------------

export const BLOCK_STYLE = {
  // Worktops / table surfaces
  surface: "var(--block-surface)",
  surfaceGradStops: SUBTLE_SURFACE_GRAD,
  surfaceStroke: "var(--block-surface-stroke)",
  surfaceStrokeWidth: 2,

  // Storage / pedestals
  storage: "var(--block-storage)",
  storageStroke: "var(--block-storage-stroke)",
  storageGradStops: [0, "var(--block-storage-grad-start)", 1, "var(--block-storage)"],

  // Chair seat
  seat: "var(--block-seat)",
  seatStroke: "var(--block-seat-stroke)",
  seatContour: "var(--block-seat-contour)",
  seatBackrest: "var(--block-seat-backrest)", 
  seatBackrestStroke: "var(--block-seat-backrest-stroke)",
  armrest: "var(--block-armrest)",
  armrestSoft: "var(--block-armrest-soft)",
  casterBase: "var(--block-caster-base)",
  casterSpoke: "var(--block-caster-spoke)",
  casterWheel: "var(--block-caster-wheel)",

  // Soft Seating (Sofas/Lounge)
  sofa: "var(--block-sofa)",
  sofaStroke: "var(--block-sofa-stroke)",
  sofaArm: "var(--block-sofa-arm)",
  sofaSeam: "var(--block-sofa-seam)",

  // Glyphs (monitor, keyboard, drawer lines)
  glyph: "var(--block-glyph)",
  glyphDark: "var(--block-glyph-dark)",
  screenGradStops: [0, "var(--block-screen-grad-start)", 1, "var(--block-screen-grad-end)"],

  // Panel / partition
  panel: "var(--block-panel)",
  panelGradStops: [0, "var(--block-panel-grad-start)", 1, "var(--block-panel)"],
  panelWidth: 16,

  // Plants
  plantBase: "var(--block-plant-base)",
  plantDark: "var(--block-plant-dark)",
  plantOutline: "var(--block-plant-outline)",
  potBase: "var(--block-pot-base)",

  // Equipment (Printer, Vending, Whiteboard)
  equipWhite: "var(--block-equip-white)",
  equipGray: "var(--block-equip-gray)",
  equipDark: "var(--block-equip-dark)",

  // Shadows
  shadowColor: "var(--block-shadow-color)",
  shadowBlurBase: 6,
  shadowOpacityBase: 0.10,
  shadowBlurElevated: 12,
  shadowOpacityElevated: 0.12,
  
  // Geometry
  cornerRadius: 8,
  drawerRadius: 4,
} as const;

// --- Primitive vocabulary (mm space, origin = block top-left) ---------------

export interface BasePrim {
  shadowColor?: string;
  shadowBlur?: number;
  shadowOpacity?: number;
  shadowOffsetY?: number;
  fillLinearGradientStartPoint?: { x: number; y: number };
  fillLinearGradientEndPoint?: { x: number; y: number };
  fillLinearGradientColorStops?: readonly (number | string)[];
  rotation?: number; // degrees
  offsetX?: number;
  offsetY?: number;
}

export interface RectPrim extends BasePrim {
  kind: "rect";
  x: number; y: number; w: number; h: number;
  fill?: string; stroke?: string; strokeWidth?: number; radius?: number;
}
export interface LinePrim extends BasePrim {
  kind: "line";
  points: readonly number[];
  stroke: string; strokeWidth: number; dash?: readonly number[];
  lineCap?: "butt" | "round" | "square";
}
export interface CirclePrim extends BasePrim {
  kind: "circle";
  cx: number; cy: number; r: number;
  fill?: string; stroke?: string; strokeWidth?: number;
  dash?: number[];
}
export interface ArcPrim extends BasePrim {
  kind: "arc";
  cx: number; cy: number; r: number;
  startAngle: number; endAngle: number;
  stroke: string; strokeWidth: number; fill?: string;
  lineCap?: "butt" | "round" | "square";
}
export interface PathPrim extends BasePrim {
  kind: "path";
  data: string; // SVG path string
  fill?: string; stroke?: string; strokeWidth?: number;
  lineCap?: "butt" | "round" | "square";
}

export type Prim = RectPrim | LinePrim | CirclePrim | ArcPrim | PathPrim;

export interface Block2D {
  footprint: Dim;
  prims: Prim[];
  label: string;
}

// --- Chair glyphs -----------------------------------------------------------

const CHAIR_W = 440;
const CHAIR_D = 400;

const MEETING_CHAIR_W = 380;
const MEETING_CHAIR_D = 360;

/**
 * Conference / meeting chair — compact shell, 4-leg base, readable at plan scale.
 * Used on meeting tables and room blocks (not task workstations).
 */
function planMeetingChair(cx: number, cy: number, facingUp = false): Prim[] {
  const seatY = cy - MEETING_CHAIR_D / 2;
  const backY = facingUp ? seatY - 32 : seatY + MEETING_CHAIR_D - 44;
  const shadowY = cy + MEETING_CHAIR_D / 2 + (facingUp ? -6 : 10);
  const legInset = 72;

  return [
    {
      kind: "rect",
      x: cx - MEETING_CHAIR_W * 0.38,
      y: shadowY,
      w: MEETING_CHAIR_W * 0.76,
      h: 24,
      fill: "var(--overlay-inverse-12)",
      radius: 12,
    },
    {
      kind: "circle",
      cx: cx - legInset,
      cy: cy + (facingUp ? -MEETING_CHAIR_D * 0.18 : MEETING_CHAIR_D * 0.22),
      r: 14,
      fill: BLOCK_STYLE.casterWheel,
      stroke: BLOCK_STYLE.seatStroke,
      strokeWidth: 1,
    },
    {
      kind: "circle",
      cx: cx + legInset,
      cy: cy + (facingUp ? -MEETING_CHAIR_D * 0.18 : MEETING_CHAIR_D * 0.22),
      r: 14,
      fill: BLOCK_STYLE.casterWheel,
      stroke: BLOCK_STYLE.seatStroke,
      strokeWidth: 1,
    },
    {
      kind: "rect",
      x: cx - MEETING_CHAIR_W / 2,
      y: seatY,
      w: MEETING_CHAIR_W,
      h: MEETING_CHAIR_D,
      fill: BLOCK_STYLE.seat,
      stroke: BLOCK_STYLE.seatStroke,
      strokeWidth: 1.5,
      radius: 64,
    },
    {
      kind: "path",
      data: facingUp
        ? `M ${cx - MEETING_CHAIR_W * 0.28} ${seatY + 48} Q ${cx} ${seatY + 72} ${cx + MEETING_CHAIR_W * 0.28} ${seatY + 48}`
        : `M ${cx - MEETING_CHAIR_W * 0.28} ${seatY + MEETING_CHAIR_D - 48} Q ${cx} ${seatY + MEETING_CHAIR_D - 72} ${cx + MEETING_CHAIR_W * 0.28} ${seatY + MEETING_CHAIR_D - 48}`,
      fill: "none",
      stroke: BLOCK_STYLE.seatContour,
      strokeWidth: 1.5,
      lineCap: "round",
    },
    {
      kind: "rect",
      x: cx - MEETING_CHAIR_W * 0.3,
      y: backY,
      w: MEETING_CHAIR_W * 0.6,
      h: 40,
      fill: BLOCK_STYLE.seatBackrest,
      stroke: BLOCK_STYLE.seatBackrestStroke,
      strokeWidth: 1,
      radius: 14,
    },
    {
      kind: "line",
      points: facingUp
        ? [cx - MEETING_CHAIR_W * 0.22, backY + 6, cx + MEETING_CHAIR_W * 0.22, backY + 6]
        : [cx - MEETING_CHAIR_W * 0.22, backY + 34, cx + MEETING_CHAIR_W * 0.22, backY + 34],
      stroke: "var(--border-inverse)",
      strokeWidth: 2,
      lineCap: "round",
    },
  ];
}

/** 2.5D plan chair — cast shadow, cushion inset, backrest lip (task / workstation). */
function planChair(cx: number, cy: number, facingUp = false): Prim[] {
  const seatY = cy - CHAIR_D / 2;
  const backY = facingUp ? seatY - 40 : seatY + CHAIR_D - 56;
  const backLipY = facingUp ? backY - 6 : backY + 48;
  const shadowY = cy + CHAIR_D / 2 + (facingUp ? -8 : 14);

  return [
    {
      kind: "rect",
      x: cx - CHAIR_W * 0.4,
      y: shadowY,
      w: CHAIR_W * 0.8,
      h: 32,
      fill: "var(--overlay-inverse-06)",
      radius: 16,
    },
    {
      kind: "circle",
      cx: cx - 110,
      cy: cy + (facingUp ? -CHAIR_D * 0.22 : CHAIR_D * 0.28),
      r: 20,
      fill: BLOCK_STYLE.casterBase,
      stroke: BLOCK_STYLE.casterSpoke,
      strokeWidth: 1,
    },
    {
      kind: "circle",
      cx: cx + 110,
      cy: cy + (facingUp ? -CHAIR_D * 0.22 : CHAIR_D * 0.28),
      r: 20,
      fill: BLOCK_STYLE.casterBase,
      stroke: BLOCK_STYLE.casterSpoke,
      strokeWidth: 1,
    },
    {
      kind: "rect",
      x: cx - CHAIR_W / 2,
      y: seatY,
      w: CHAIR_W,
      h: CHAIR_D,
      fill: BLOCK_STYLE.seat,
      stroke: BLOCK_STYLE.seatStroke,
      strokeWidth: 1.5,
      radius: 72,
    },
    {
      kind: "rect",
      x: cx - CHAIR_W * 0.32,
      y: seatY + 36,
      w: CHAIR_W * 0.64,
      h: CHAIR_D - 72,
      fill: "none",
      stroke: BLOCK_STYLE.seatContour,
      strokeWidth: 1,
      radius: 48,
    },
    {
      kind: "rect",
      x: cx - CHAIR_W * 0.34,
      y: backY,
      w: CHAIR_W * 0.68,
      h: 48,
      fill: BLOCK_STYLE.seatBackrest,
      stroke: BLOCK_STYLE.seatBackrestStroke,
      strokeWidth: 1,
      radius: 10,
    },
    {
      kind: "rect",
      x: cx - CHAIR_W * 0.3,
      y: backLipY,
      w: CHAIR_W * 0.6,
      h: 8,
      fill: BLOCK_STYLE.seatBackrestStroke,
      radius: 4,
    },
  ];
}

/** Minimal desk accessories for plan symbols (monitor + keyboard). */
function planDeskAccessory(cx: number, deskStartY: number, deskEndY: number, side: "south" | "north"): Prim[] {
  const near = side === "south" ? deskStartY : deskEndY;
  const far = side === "south" ? deskEndY : deskStartY;
  const depth = far - near;
  const monitorY = near + depth * 0.1;
  const keyboardY = near + depth * 0.55;
  return [
    {
      kind: "rect",
      x: cx - 220,
      y: monitorY,
      w: 440,
      h: 40,
      fill: BLOCK_STYLE.glyphDark,
      stroke: BLOCK_STYLE.glyph,
      strokeWidth: 1,
      radius: 4,
    },
    {
      kind: "rect",
      x: cx - 28,
      y: monitorY + 44,
      w: 56,
      h: 18,
      fill: BLOCK_STYLE.glyph,
      radius: 3,
    },
    {
      kind: "rect",
      x: cx - 150,
      y: keyboardY,
      w: 300,
      h: 80,
      fill: "var(--color-white-50)",
      stroke: "var(--text-inverse-body)",
      strokeWidth: 1,
      radius: 6,
    },
  ];
}

function chairGlyph(cx: number, cy: number, facingUp = false, _colorVariant = 0): Prim[] {
  const dir = facingUp ? -1 : 1;
  const prims: Prim[] = [];

  // Remove pinks; use unified slate colors for all variants
  const seatFill = BLOCK_STYLE.seat;
  const seatStroke = BLOCK_STYLE.seatStroke;
  const seatContour = BLOCK_STYLE.seatContour;

  // 1. Caster base
  prims.push({
    kind: "circle",
    cx, cy: cy + 30 * dir, r: 260,
    fill: "none", stroke: BLOCK_STYLE.casterBase, strokeWidth: 1, dash: [4, 8]
  });

  const casterY = cy + 30 * dir;
  const armLen = 220;
  const angles = [90, 162, 234, 306, 18];
  
  // Spoke lines
  for (const deg of angles) {
    const rad = (deg * Math.PI) / 180;
    const ax = cx + Math.cos(rad) * armLen;
    const ay = casterY + Math.sin(rad) * armLen;
    prims.push({
      kind: "line",
      points: [cx, casterY, ax, ay],
      stroke: BLOCK_STYLE.casterSpoke, strokeWidth: 12, lineCap: "round"
    });
  }

  // Caster wheels
  for (const deg of angles) {
    const rad = (deg * Math.PI) / 180;
    const ax = cx + Math.cos(rad) * armLen;
    const ay = casterY + Math.sin(rad) * armLen;
    prims.push({ kind: "circle", cx: ax, cy: ay, r: 16, fill: BLOCK_STYLE.casterWheel });
    prims.push({ kind: "circle", cx: ax, cy: ay, r: 8, fill: BLOCK_STYLE.casterSpoke });
  }

  // 2. Seat Cushion (with drop shadow)
  const seatY = cy - (CHAIR_D / 2) * dir;
  prims.push({
    kind: "rect",
    x: cx - CHAIR_W / 2, y: facingUp ? seatY : cy - CHAIR_D / 2,
    w: CHAIR_W, h: CHAIR_D,
    fill: seatFill, stroke: seatStroke, strokeWidth: 2, radius: 100,
    shadowColor: BLOCK_STYLE.shadowColor, shadowBlur: BLOCK_STYLE.shadowBlurElevated, shadowOpacity: BLOCK_STYLE.shadowOpacityElevated, shadowOffsetY: 10
  });

  // Seat contour highlight
  const contY = facingUp ? seatY + 100 : cy - CHAIR_D / 2 + 100;
  prims.push({
    kind: "path",
    data: `M ${cx - 150} ${contY} Q ${cx} ${contY + 50 * dir} ${cx + 150} ${contY}`,
    fill: "none", stroke: seatContour, strokeWidth: 2, lineCap: "round"
  });

  // 3. Armrests
  const armY = facingUp ? cy + 50 : cy - 100;
  prims.push({
    kind: "rect", x: cx - 250, y: armY, w: 60, h: 220, fill: BLOCK_STYLE.armrest, radius: 30,
    shadowColor: BLOCK_STYLE.shadowColor, shadowBlur: BLOCK_STYLE.shadowBlurBase, shadowOpacity: BLOCK_STYLE.shadowOpacityBase, shadowOffsetY: 8
  });
  prims.push({
    kind: "rect", x: cx + 190, y: armY, w: 60, h: 220, fill: BLOCK_STYLE.armrest, radius: 30,
    shadowColor: BLOCK_STYLE.shadowColor, shadowBlur: BLOCK_STYLE.shadowBlurBase, shadowOpacity: BLOCK_STYLE.shadowOpacityBase, shadowOffsetY: 8
  });
  prims.push({ kind: "rect", x: cx - 240, y: armY + 20, w: 40, h: 180, fill: BLOCK_STYLE.armrestSoft, radius: 20 });
  prims.push({ kind: "rect", x: cx + 200, y: armY + 20, w: 40, h: 180, fill: BLOCK_STYLE.armrestSoft, radius: 20 });

  // 4. Backrest
  const backY = facingUp ? cy - 200 : cy + 180;
  prims.push({
    kind: "path",
    data: `M ${cx - 200} ${backY} C ${cx - 220} ${backY + 100 * dir}, ${cx + 220} ${backY + 100 * dir}, ${cx + 200} ${backY}`,
    fill: "none", stroke: seatStroke, strokeWidth: 40, lineCap: "round",
    shadowColor: BLOCK_STYLE.shadowColor, shadowBlur: BLOCK_STYLE.shadowBlurElevated, shadowOpacity: BLOCK_STYLE.shadowOpacityElevated, shadowOffsetY: 10
  });
  prims.push({
    kind: "path",
    data: `M ${cx - 160} ${backY + 20 * dir} C ${cx - 180} ${backY + 70 * dir}, ${cx + 180} ${backY + 70 * dir}, ${cx + 160} ${backY + 20 * dir}`,
    fill: "none", stroke: seatFill, strokeWidth: 20, lineCap: "round"
  });

  return prims;
}

function tableChair(cx: number, cy: number, rot: number = 0): Prim[] {
  const facingUp = rot === 180 || rot === -180;
  const base = planChair(cx, cy, facingUp);
  if (rot === 90 || rot === -90) {
    return base.map((prim) => ({
      ...prim,
      rotation: (prim.rotation ?? 0) + rot,
      offsetX: prim.offsetX ?? cx,
      offsetY: prim.offsetY ?? cy,
    }));
  }
  return base;
}

// --- Desk top-surface glyphs (Premium) --------------------------------------

function deskGlyphs(
  cx: number,
  deskStartY: number,
  deskEndY: number,
  useDualMonitor = false,
  useLaptop = false,
  side: "south" | "north" = "south",
): Prim[] {
  const deskBackY = side === "south" ? deskStartY : deskEndY;
  const deskFrontY = side === "south" ? deskEndY : deskStartY;
  const prims: Prim[] = [];
  
  if (useDualMonitor) {
    // Dual Monitors
    prims.push({ kind: "rect", x: cx - 50, y: deskBackY + 105, w: 100, h: 30, fill: BLOCK_STYLE.glyph, radius: 6 });
    prims.push({ kind: "rect", x: cx - 15, y: deskBackY + 90, w: 30, h: 20, fill: BLOCK_STYLE.glyphDark });
    
    // Left monitor
    prims.push({
      kind: "rect", x: cx - 340, y: deskBackY + 40, w: 340, h: 50, stroke: BLOCK_STYLE.glyphDark, strokeWidth: 2, radius: 6,
      fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 0, y: 50 }, fillLinearGradientColorStops: BLOCK_STYLE.screenGradStops,
      shadowColor: BLOCK_STYLE.shadowColor, shadowBlur: BLOCK_STYLE.shadowBlurBase, shadowOpacity: BLOCK_STYLE.shadowOpacityBase, shadowOffsetY: 5,
      rotation: -5, offsetX: cx - 340, offsetY: deskBackY + 40
    });
    // Right monitor
    prims.push({
      kind: "rect", x: cx + 20, y: deskBackY + 40, w: 340, h: 50, stroke: BLOCK_STYLE.glyphDark, strokeWidth: 2, radius: 6,
      fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 0, y: 50 }, fillLinearGradientColorStops: BLOCK_STYLE.screenGradStops,
      shadowColor: BLOCK_STYLE.shadowColor, shadowBlur: BLOCK_STYLE.shadowBlurBase, shadowOpacity: BLOCK_STYLE.shadowOpacityBase, shadowOffsetY: 5,
      rotation: 5, offsetX: cx + 360, offsetY: deskBackY + 40
    });
  } else {
    // Single Monitor
    prims.push({ kind: "rect", x: cx - 50, y: deskBackY + 105, w: 100, h: 30, fill: BLOCK_STYLE.glyph, radius: 6 });
    prims.push({ kind: "rect", x: cx - 15, y: deskBackY + 90, w: 30, h: 20, fill: BLOCK_STYLE.glyphDark });
    prims.push({
      kind: "rect", x: cx - 240, y: deskBackY + 40, w: 480, h: 50, stroke: BLOCK_STYLE.glyphDark, strokeWidth: 2, radius: 6,
      fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 0, y: 50 }, fillLinearGradientColorStops: BLOCK_STYLE.screenGradStops,
      shadowColor: BLOCK_STYLE.shadowColor, shadowBlur: BLOCK_STYLE.shadowBlurBase, shadowOpacity: BLOCK_STYLE.shadowOpacityBase, shadowOffsetY: 5
    });
    prims.push({ kind: "line", points: [cx - 220, deskBackY + 80, cx + 220, deskBackY + 80], stroke: BLOCK_STYLE.glyph, strokeWidth: 2 });
  }

  if (useLaptop) {
    // Laptop
    prims.push({
      kind: "rect", x: cx - 180, y: deskFrontY - 250, w: 360, h: 240, fill: BLOCK_STYLE.casterBase, stroke: BLOCK_STYLE.glyph, strokeWidth: 2, radius: 12,
      shadowColor: BLOCK_STYLE.shadowColor, shadowBlur: BLOCK_STYLE.shadowBlurBase, shadowOpacity: BLOCK_STYLE.shadowOpacityBase, shadowOffsetY: 5
    });
    prims.push({ kind: "rect", x: cx - 160, y: deskFrontY - 230, w: 320, h: 120, fill: BLOCK_STYLE.armrest, radius: 4 }); // keyboard area
    prims.push({ kind: "rect", x: cx - 50, y: deskFrontY - 90, w: 100, h: 60, fill: BLOCK_STYLE.glyph, radius: 4 }); // trackpad
    
    // Coffee cup!
    prims.push({
      kind: "circle", cx: cx + 350, cy: deskFrontY - 150, r: 35, fill: "var(--color-white-50)", stroke: BLOCK_STYLE.surfaceStroke, strokeWidth: 3,
      shadowColor: BLOCK_STYLE.shadowColor, shadowBlur: BLOCK_STYLE.shadowBlurBase, shadowOpacity: BLOCK_STYLE.shadowOpacityBase, shadowOffsetY: 5
    });
    prims.push({ kind: "circle", cx: cx + 350, cy: deskFrontY - 150, r: 25, fill: "#78350f" }); // coffee
    
    // Notebook
    prims.push({
      kind: "rect", x: cx - 400, y: deskFrontY - 220, w: 180, h: 240, fill: "var(--color-white-50)", stroke: "var(--text-inverse-body)", strokeWidth: 2, radius: 4,
      shadowColor: BLOCK_STYLE.shadowColor, shadowBlur: BLOCK_STYLE.shadowBlurBase, shadowOpacity: BLOCK_STYLE.shadowOpacityBase, shadowOffsetY: 5,
      rotation: -10, offsetX: cx - 400, offsetY: deskFrontY - 220
    });
    prims.push({
      kind: "rect", x: cx - 410, y: deskFrontY - 220, w: 20, h: 240, fill: "#3b82f6", radius: 2,
      rotation: -10, offsetX: cx - 400, offsetY: deskFrontY - 220
    });
  } else {
    // Keyboard & Mouse
    prims.push({
      kind: "rect", x: cx - 180, y: deskFrontY - 220, w: 360, h: 120, fill: "var(--color-white-50)", stroke: "var(--text-inverse-body)", strokeWidth: 2, radius: 8,
      shadowColor: BLOCK_STYLE.shadowColor, shadowBlur: BLOCK_STYLE.shadowBlurBase, shadowOpacity: BLOCK_STYLE.shadowOpacityBase, shadowOffsetY: 5
    });
    prims.push({ kind: "rect", x: cx - 160, y: deskFrontY - 200, w: 230, h: 80, fill: "var(--text-strong)", radius: 4 });
    prims.push({ kind: "rect", x: cx + 80, y: deskFrontY - 200, w: 80, h: 80, fill: "var(--text-strong)", radius: 4 });
    
    prims.push({
      kind: "rect", x: cx + 220, y: deskFrontY - 200, w: 50, h: 80, fill: "var(--color-white-50)", stroke: "var(--text-inverse-body)", strokeWidth: 2, radius: 25,
      shadowColor: BLOCK_STYLE.shadowColor, shadowBlur: BLOCK_STYLE.shadowBlurBase, shadowOpacity: BLOCK_STYLE.shadowOpacityBase, shadowOffsetY: 5
    });
    prims.push({ kind: "line", points: [cx + 245, deskFrontY - 200, cx + 245, deskFrontY - 170], stroke: "var(--text-inverse-body)", strokeWidth: 2 });
    prims.push({ kind: "circle", cx: cx + 245, cy: deskFrontY - 185, r: 4, fill: BLOCK_STYLE.surfaceStroke });
  }

  return prims;
}

// --- Workstation builders ---------------------------------------------------

function buildStraightWorkstation(footprint: Dim, seaters: number, hasPanel: boolean): Block2D {
  const seatW = footprint.L / seaters;
  const deskD = footprint.D;
  const chairCY = deskD + CHAIR_D / 2 + 30;

  const prims: Prim[] = [...surface2_5DPrims(0, 0, footprint.L, deskD)];

  if (hasPanel) {
    prims.push(...panel2_5DPrims(0, -BLOCK_STYLE.panelWidth, footprint.L, BLOCK_STYLE.panelWidth));
  }

  for (let i = 0; i < seaters; i++) {
    const cx = i * seatW + seatW / 2;
    if (i > 0) {
      prims.push({ kind: "line", points: [i * seatW, 0, i * seatW, deskD], stroke: "var(--text-inverse-body)", strokeWidth: 2, dash: [8, 8] });
    }
    prims.push(...planDeskAccessory(cx, 0, deskD, "south"));
    prims.push(...planChair(cx, chairCY, false));
  }

  return { footprint, prims, label: `${seaters}-seat workstation` };
}

/**
 * Sharing (SH) bench — catalog `bays` modules along the run; people = bays × 2.
 * e.g. 4800 mm @ 1200 mm/bay = 4 bays NS (4 chairs) → SH same length = 8 people.
 */
function buildSharingStraightWorkstation(footprint: Dim, bays: number, hasPanel: boolean): Block2D {
  const moduleCount = Math.max(1, Math.floor(bays));
  const people = sharingPeopleCount(moduleCount);
  const bayW = footprint.L / moduleCount;
  const deskD = footprint.D;
  const southCY = deskD + CHAIR_D / 2 + 30;
  const northCY = -CHAIR_D / 2 - 30;
  const spineY = deskD / 2;

  const prims: Prim[] = [
    ...surface2_5DPrims(0, 0, footprint.L, deskD),
    {
      kind: "line",
      points: [0, spineY, footprint.L, spineY],
      stroke: "var(--text-inverse-body)",
      strokeWidth: 2,
      dash: [10, 8],
    },
  ];

  if (hasPanel) {
    prims.push(
      ...panel2_5DPrims(0, spineY - BLOCK_STYLE.panelWidth / 2, footprint.L, BLOCK_STYLE.panelWidth),
    );
  }

  for (let i = 1; i < moduleCount; i++) {
    prims.push({ kind: "line", points: [i * bayW, 0, i * bayW, deskD], stroke: "var(--text-inverse-body)", strokeWidth: 2, dash: [8, 8] });
  }

  for (let i = 0; i < moduleCount; i++) {
    const cx = i * bayW + bayW / 2;
    prims.push(...planDeskAccessory(cx, 0, deskD, "south"));
    prims.push(...planDeskAccessory(cx, 0, deskD, "north"));
    prims.push(...planChair(cx, southCY, false));
    prims.push(...planChair(cx, northCY, true));
  }

  return { footprint, prims, label: `${people}-seat sharing workstation` };
}

function buildLShapeWorkstation(footprint: Dim, seaters: number, hasPanel: boolean): Block2D {
  const armD = Math.min(650, Math.round(footprint.D * 0.45));
  const prims: Prim[] = [
    ...surface2_5DPrims(0, 0, footprint.L, armD),
    ...surface2_5DPrims(0, 0, armD, footprint.D),
  ];

  if (hasPanel) {
    prims.push(
      ...panel2_5DPrims(0, -BLOCK_STYLE.panelWidth, footprint.L, BLOCK_STYLE.panelWidth),
      ...panel2_5DPrims(-BLOCK_STYLE.panelWidth, 0, BLOCK_STYLE.panelWidth, footprint.D),
    );
  }

  const seatW = footprint.L / seaters;
  for (let i = 0; i < seaters; i++) {
    const cx = i * seatW + seatW / 2;
    if (i > 0) {
      prims.push({ kind: "line", points: [i * seatW, 0, i * seatW, armD], stroke: "var(--text-inverse-body)", strokeWidth: 2, dash: [8, 8] });
    }
    prims.push(...deskGlyphs(cx, 0, armD, false, i % 2 === 0));
    prims.push(...chairGlyph(cx, armD + CHAIR_D / 2 + 30, false, i));
  }
  return { footprint, prims, label: `${seaters}-seat L-workstation` };
}

// --- Storage builders -------------------------------------------------------

function buildStorageUnit(footprint: Dim, label: string): Block2D {
  const inset = 16;
  const shelfCount = 3;
  const midX = footprint.L / 2;
  const prims: Prim[] = [
    {
      kind: "rect", x: 0, y: 0, w: footprint.L, h: footprint.D,
      fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 0, y: footprint.D }, fillLinearGradientColorStops: BLOCK_STYLE.storageGradStops,
      stroke: BLOCK_STYLE.storageStroke, strokeWidth: 4, radius: BLOCK_STYLE.cornerRadius,
      shadowColor: BLOCK_STYLE.shadowColor, shadowBlur: BLOCK_STYLE.shadowBlurElevated, shadowOpacity: BLOCK_STYLE.shadowOpacityElevated, shadowOffsetY: 10
    },
    { kind: "line", points: [midX, inset, midX, footprint.D - inset], stroke: BLOCK_STYLE.storageStroke, strokeWidth: 2 },
  ];
  for (let i = 1; i < shelfCount; i++) {
    const y = (footprint.D / shelfCount) * i;
    prims.push({ kind: "line", points: [inset, y, footprint.L - inset, y], stroke: BLOCK_STYLE.storageStroke, strokeWidth: 2, dash: [10, 6] });
  }
  const handleH = 14, handleW = 50, handleY = footprint.D / 2 - handleH / 2;
  prims.push({ kind: "rect", x: midX - 30 - handleW, y: handleY, w: handleW, h: handleH, fill: BLOCK_STYLE.storageStroke, radius: 4 });
  prims.push({ kind: "rect", x: midX + 30, y: handleY, w: handleW, h: handleH, fill: BLOCK_STYLE.storageStroke, radius: 4 });
  return { footprint, prims, label };
}

// --- 2.5D panel / partition -------------------------------------------------

function panel2_5DPrims(x: number, y: number, w: number, h: number): Prim[] {
  return [
    {
      kind: "rect",
      x: x + 4,
      y: y + h - 6,
      w,
      h: 8,
      fill: "var(--overlay-inverse-06)",
      radius: 2,
    },
    {
      kind: "rect",
      x,
      y,
      w,
      h,
      fill: BLOCK_STYLE.panel,
      stroke: "var(--text-inverse-subtle)",
      strokeWidth: 1.5,
      radius: 4,
    },
    {
      kind: "line",
      points: [x + 6, y + 3, x + w - 6, y + 3],
      stroke: "var(--glass-white-40)",
      strokeWidth: 1.5,
      lineCap: "round",
    },
  ];
}

// --- Table builders ---------------------------------------------------------

/**
 * Flip-top power/data modules on meeting tables.
 * 1800–2400 mm length → 2 boxes; each additional 1200 mm beyond 2400 → +1 box.
 */
export function meetingFlipTopBoxCount(tableLengthMm: number): number {
  if (tableLengthMm < 1800) {return 0;}
  if (tableLengthMm <= 2400) {return 2;}
  return 2 + Math.ceil((tableLengthMm - 2400) / 1200);
}

/** Single flip-top module — hinged lid shown slightly open in plan. */
function flipTopBoxPrim(cx: number, cy: number, boxW: number, boxD: number): Prim[] {
  const x = cx - boxW / 2;
  const y = cy - boxD / 2;
  const lidOverhang = boxD * 0.12;
  return [
    {
      kind: "rect",
      x,
      y,
      w: boxW,
      h: boxD,
      fill: "var(--color-bronze-200)",
      stroke: BLOCK_STYLE.glyphDark,
      strokeWidth: 1.5,
      radius: 6,
    },
    {
      kind: "rect",
      x: x + 4,
      y: y + 4,
      w: boxW - 8,
      h: boxD - 8,
      fill: "var(--text-strong)",
      stroke: "var(--text-inverse-muted)",
      strokeWidth: 1,
      radius: 4,
    },
    {
      kind: "line",
      points: [x + boxW * 0.12, y + boxD * 0.22, x + boxW * 0.88, y + boxD * 0.22],
      stroke: BLOCK_STYLE.glyphDark,
      strokeWidth: 2,
      lineCap: "round",
    },
    {
      kind: "rect",
      x: x + boxW * 0.08,
      y: y - lidOverhang,
      w: boxW * 0.84,
      h: boxD * 0.55,
      fill: "var(--text-inverse-body)",
      stroke: "var(--text-inverse-subtle)",
      strokeWidth: 1.5,
      radius: 4,
    },
    {
      kind: "line",
      points: [x + boxW * 0.5, y + boxD * 0.22, x + boxW * 0.72, y - lidOverhang * 0.4],
      stroke: "var(--text-subtle)",
      strokeWidth: 1,
      dash: [4, 3],
      lineCap: "round",
    },
    {
      kind: "circle",
      cx: x + boxW * 0.5,
      cy: y + boxD * 0.62,
      r: 7,
      fill: BLOCK_STYLE.glyphDark,
    },
  ];
}

function meetingFlipTopBoxPrims(tableX: number, tableY: number, tableL: number, tableD: number): Prim[] {
  const count = meetingFlipTopBoxCount(tableL);
  if (count === 0) {return [];}

  const boxW = Math.min(400, Math.max(280, tableL * 0.11));
  const boxD = Math.min(300, Math.max(200, tableD * 0.34));
  const cy = tableY + tableD / 2;
  const margin = Math.max(280, tableL * 0.1);
  const span = tableL - margin * 2;
  const prims: Prim[] = [];

  for (let i = 0; i < count; i++) {
    const cx = count === 1
      ? tableX + tableL / 2
      : tableX + margin + (span * i) / (count - 1);
    prims.push(...flipTopBoxPrim(cx, cy, boxW, boxD));
  }

  return prims;
}

/** Cabin / generic table surface — 2.5D top + optional centre grommet. */
function tableSurfacePrims(x: number, y: number, w: number, h: number): Prim[] {
  const prims: Prim[] = [...surface2_5DPrims(x, y, w, h)];

  if (w >= 1200) {
    const grommetX = x + w / 2;
    const grommetY = y + h * 0.38;
    prims.push(
      {
        kind: "circle",
        cx: grommetX,
        cy: grommetY,
        r: 22,
        fill: "var(--text-inverse)",
        stroke: BLOCK_STYLE.glyph,
        strokeWidth: 1.5,
      },
      {
        kind: "circle",
        cx: grommetX,
        cy: grommetY,
        r: 9,
        fill: BLOCK_STYLE.glyphDark,
      },
    );
  }

  return prims;
}

/** Meeting / conference table — 2.5D top + flip-top modules (no centre grommet). */
function meetingTableSurfacePrims(x: number, y: number, w: number, h: number): Prim[] {
  return [
    ...surface2_5DPrims(x, y, w, h),
    ...meetingFlipTopBoxPrims(x, y, w, h),
  ];
}

function parseTablePax(label: string, footprint: Dim): number {
  const fromLabel =
    label.match(/(\d+)\s*pax/i)?.[1]
    ?? label.match(/(\d+)[\s-]*seat/i)?.[1]
    ?? label.match(/\((\d+)\s*p\)/i)?.[1];
  if (fromLabel) {return Math.max(1, parseInt(fromLabel, 10));}

  const perSide = Math.max(1, Math.round(footprint.L / 750));
  return Math.max(2, Math.min(perSide * 2, 20));
}

/** Conference chairs around a table rectangle (plan mm space). */
function layoutConferenceChairs(
  tableX: number,
  tableY: number,
  tableL: number,
  tableD: number,
  pax: number,
  chairGap = 56,
): Prim[] {
  const people = Math.max(1, Math.floor(pax));
  const prims: Prim[] = [];

  const chairD = MEETING_CHAIR_D;
  const chairGapUse = chairGap;

  if (people === 1) {
    prims.push(...planMeetingChair(tableX + tableL / 2, tableY + tableD + chairD / 2 + chairGapUse, false));
    return prims;
  }

  const northCount = Math.ceil(people / 2);
  const southCount = people - northCount;
  const northStep = tableL / northCount;
  const southStep = tableL / Math.max(1, southCount);

  for (let i = 0; i < northCount; i++) {
    const cx = tableX + i * northStep + northStep / 2;
    prims.push(...planMeetingChair(cx, tableY - chairD / 2 - chairGapUse, true));
  }
  for (let i = 0; i < southCount; i++) {
    const cx = tableX + i * southStep + southStep / 2;
    prims.push(...planMeetingChair(cx, tableY + tableD + chairD / 2 + chairGapUse, false));
  }

  if (people >= 10 && tableL >= 3000 && tableD >= 1100) {
    const midY = tableY + tableD / 2;
    prims.push(...planMeetingChair(tableX - MEETING_CHAIR_W / 2 - chairGapUse, midY, false));
    prims.push(...planMeetingChair(tableX + tableL + MEETING_CHAIR_W / 2 + chairGapUse, midY, false));
  }

  return prims;
}

/** Standalone meeting / conference table with perimeter seating. */
function buildConferenceTable(footprint: Dim, pax: number, label: string): Block2D {
  const people = Math.max(1, pax);
  const prims: Prim[] = [
    ...meetingTableSurfacePrims(0, 0, footprint.L, footprint.D),
    ...layoutConferenceChairs(0, 0, footprint.L, footprint.D, people),
  ];
  return { footprint, prims, label };
}

/** Executive cabin table — single primary seat, desk accessories, no bench layout. */
function buildCabinTable(footprint: Dim, label: string): Block2D {
  const prims: Prim[] = [
    ...tableSurfacePrims(0, 0, footprint.L, footprint.D),
    ...planDeskAccessory(footprint.L * 0.38, 0, footprint.D * 0.62, "south"),
  ];

  if (footprint.L >= 1500) {
    prims.push({
      kind: "rect",
      x: footprint.L * 0.62,
      y: footprint.D * 0.18,
      w: footprint.L * 0.28,
      h: footprint.D * 0.22,
      fill: "var(--color-white-50)",
      stroke: "var(--text-inverse-body)",
      strokeWidth: 1.5,
      radius: 6,
    });
  }

  prims.push(...planChair(footprint.L / 2, footprint.D + CHAIR_D / 2 + 40, false));

  if (footprint.L >= 2000) {
    prims.push(...planChair(footprint.L * 0.22, footprint.D * 0.42, false));
  }

  return { footprint, prims, label };
}

/** Plan-view meeting room shell with centred table and chairs for `pax` people. */
export function buildMeetingRoomBlock(footprint: Dim, pax: number, label: string): Block2D {
  const people = Math.max(1, Math.floor(pax));
  const isSolo = people === 1;
  const wallT = 72;
  const margin = isSolo
    ? Math.min(200, Math.round(Math.min(footprint.L, footprint.D) * 0.12))
    : Math.min(480, Math.round(Math.min(footprint.L, footprint.D) * 0.14));
  const doorW = Math.min(900, Math.round(footprint.L * 0.2));
  const doorX = Math.round(footprint.L / 2 - doorW / 2);
  const chairGap = isSolo ? 40 : 56;

  const tableL = isSolo
    ? Math.min(footprint.L - margin * 2, 720)
    : Math.min(footprint.L - margin * 2, Math.max(1400, people * 280));
  const tableD = isSolo
    ? Math.min(footprint.D - margin * 2, 520)
    : Math.min(
      footprint.D - margin * 2,
      Math.max(800, Math.round(tableL * (people <= 6 ? 0.5 : 0.45))),
    );
  const tableX = Math.round((footprint.L - tableL) / 2);
  const tableY = Math.round((footprint.D - tableD) / 2);

  const prims: Prim[] = [
    {
      kind: "rect",
      x: 0,
      y: 0,
      w: footprint.L,
      h: footprint.D,
      fill: "var(--color-white-200)",
      stroke: BLOCK_STYLE.surfaceStroke,
      strokeWidth: 2.5,
      radius: 2,
    },
    {
      kind: "rect",
      x: wallT,
      y: wallT,
      w: footprint.L - wallT * 2,
      h: footprint.D - wallT * 2,
      fill: "var(--text-inverse)",
      stroke: BLOCK_STYLE.panel,
      strokeWidth: 1.5,
      radius: 2,
    },
    { kind: "line", points: [0, 0, doorX, 0], stroke: BLOCK_STYLE.surfaceStroke, strokeWidth: 2.5 },
    { kind: "line", points: [doorX + doorW, 0, footprint.L, 0], stroke: BLOCK_STYLE.surfaceStroke, strokeWidth: 2.5 },
    {
      kind: "arc",
      cx: doorX,
      cy: 0,
      r: doorW * 0.92,
      startAngle: 0,
      endAngle: Math.PI / 2,
      stroke: BLOCK_STYLE.panel,
      strokeWidth: 1.5,
      fill: "none",
    },
    ...(isSolo
      ? tableSurfacePrims(tableX, tableY, tableL, tableD)
      : meetingTableSurfacePrims(tableX, tableY, tableL, tableD)),
    ...layoutConferenceChairs(tableX, tableY, tableL, tableD, people, chairGap),
  ];

  if (isSolo) {
    prims.push(...planDeskAccessory(tableX + tableL * 0.35, tableY, tableY + tableD * 0.65, "south"));
  }

  return { footprint, prims, label: label || `${people}p meeting room` };
}

function buildRoundTable(diameter: Dim, pax: number, label: string): Block2D {
  const r = diameter.L / 2;
  const cx = r, cy = r;
  const chairGap = 40;
  const chairR = r + chairGap + CHAIR_D / 2;

  const prims: Prim[] = [...roundSurface2_5DPrims(cx, cy, r)];

  for (let i = 0; i < pax; i++) {
    const angle = (i / pax) * 2 * Math.PI - Math.PI / 2;
    const chairCx = cx + Math.cos(angle) * chairR;
    const chairCy = cy + Math.sin(angle) * chairR;
    const facingUp = Math.sin(angle) < -0.2;
    prims.push(...planMeetingChair(chairCx, chairCy, facingUp));
  }
  return { footprint: diameter, prims, label };
}

// --- New Premium Builders ---------------------------------------------------

function buildSofa(footprint: Dim): Block2D {
  const prims: Prim[] = [
    {
      kind: "rect", x: 0, y: 0, w: footprint.L, h: footprint.D,
      fill: BLOCK_STYLE.sofa, stroke: BLOCK_STYLE.sofaStroke, strokeWidth: 4, radius: 40,
      shadowColor: BLOCK_STYLE.shadowColor, shadowBlur: BLOCK_STYLE.shadowBlurElevated, shadowOpacity: BLOCK_STYLE.shadowOpacityElevated, shadowOffsetY: 10
    },
    // Backrest
    { kind: "rect", x: 10, y: 10, w: footprint.L - 20, h: footprint.D * 0.35, fill: BLOCK_STYLE.sofaArm, radius: 30 },
    // Armrests
    { kind: "rect", x: 10, y: 10, w: Math.min(150, footprint.L * 0.15), h: footprint.D - 20, fill: BLOCK_STYLE.sofaArm, radius: 30 },
    { kind: "rect", x: footprint.L - Math.min(150, footprint.L * 0.15) - 10, y: 10, w: Math.min(150, footprint.L * 0.15), h: footprint.D - 20, fill: BLOCK_STYLE.sofaArm, radius: 30 },
  ];
  
  // Cushion seams
  const seats = Math.max(1, Math.round(footprint.L / 800));
  const seatW = footprint.L / seats;
  for(let i = 1; i < seats; i++) {
    prims.push({
      kind: "line", points: [i * seatW, footprint.D * 0.35 + 10, i * seatW, footprint.D - 10],
      stroke: BLOCK_STYLE.sofaSeam, strokeWidth: 4, lineCap: "round"
    });
  }

  return { footprint, prims, label: "Sofa" };
}

function buildPlanter(footprint: Dim): Block2D {
  const cx = footprint.L / 2;
  const cy = footprint.D / 2;
  const r = Math.min(footprint.L, footprint.D) / 2;
  
  return {
    footprint,
    label: "Planter",
    prims: [
      // Pot base
      {
        kind: "rect", x: 0, y: 0, w: footprint.L, h: footprint.D, fill: BLOCK_STYLE.potBase, stroke: BLOCK_STYLE.surfaceStroke, strokeWidth: 4, radius: 24,
        shadowColor: BLOCK_STYLE.shadowColor, shadowBlur: BLOCK_STYLE.shadowBlurElevated, shadowOpacity: BLOCK_STYLE.shadowOpacityElevated, shadowOffsetY: 10
      },
      // Foliage canopy
      { kind: "circle", cx: cx - r*0.2, cy: cy - r*0.2, r: r*0.8, fill: BLOCK_STYLE.plantDark, stroke: BLOCK_STYLE.plantOutline, strokeWidth: 3 },
      { kind: "circle", cx: cx + r*0.3, cy: cy - r*0.1, r: r*0.7, fill: BLOCK_STYLE.plantBase, stroke: BLOCK_STYLE.plantOutline, strokeWidth: 3 },
      { kind: "circle", cx, cy: cy + r*0.2, r: r*0.85, fill: BLOCK_STYLE.plantBase, stroke: BLOCK_STYLE.plantOutline, strokeWidth: 3 },
    ]
  };
}

function buildEquipment(footprint: Dim, type: "printer" | "whiteboard" | "vending"): Block2D {
  const prims: Prim[] = [
    {
      kind: "rect", x: 0, y: 0, w: footprint.L, h: footprint.D,
      fill: BLOCK_STYLE.equipWhite, stroke: BLOCK_STYLE.equipDark, strokeWidth: 4, radius: 8,
      shadowColor: BLOCK_STYLE.shadowColor, shadowBlur: BLOCK_STYLE.shadowBlurElevated, shadowOpacity: BLOCK_STYLE.shadowOpacityElevated, shadowOffsetY: 10
    }
  ];

  if (type === "printer") {
    prims.push({ kind: "rect", x: footprint.L*0.1, y: footprint.D*0.2, w: footprint.L*0.8, h: footprint.D*0.4, fill: BLOCK_STYLE.equipGray, stroke: BLOCK_STYLE.equipDark, strokeWidth: 2, radius: 4 });
    prims.push({ kind: "rect", x: footprint.L*0.2, y: footprint.D*0.3, w: footprint.L*0.6, h: footprint.D*0.1, fill: BLOCK_STYLE.glyphDark, radius: 2 });
    prims.push({ kind: "circle", cx: footprint.L*0.8, cy: footprint.D*0.8, r: 15, fill: "#3b82f6" });
  } else if (type === "whiteboard") {
    prims.push({ kind: "rect", x: 10, y: 10, w: footprint.L - 20, h: footprint.D - 20, fill: "var(--text-inverse)", stroke: "var(--text-inverse-body)", strokeWidth: 2, radius: 4 });
    prims.push({ kind: "rect", x: footprint.L*0.2, y: footprint.D - 15, w: footprint.L*0.6, h: 10, fill: BLOCK_STYLE.equipGray, radius: 2 });
  } else if (type === "vending") {
    prims.push({ kind: "rect", x: footprint.L*0.1, y: 20, w: footprint.L*0.6, h: footprint.D - 40, fill: "var(--color-dark-midnight-blue-750)", radius: 8 }); // glass
    prims.push({ kind: "rect", x: footprint.L*0.75, y: 20, w: footprint.L*0.15, h: footprint.D*0.4, fill: "var(--text-body)", radius: 8 }); // panel
  }

  return { footprint, prims, label: type };
}

// --- SVG serialization (Updated for Premium) --------------------------------

function svgAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function pushLinearGradient(
  defs: string[],
  gradId: string,
  prim: Prim,
  resolve: BlockColorResolver,
): void {
  if (!prim.fillLinearGradientColorStops?.length) {return;}
  const stops = prim.fillLinearGradientColorStops
    .map((stop, stopIndex) => {
      if (typeof stop !== "number") {return "";}
      const color = prim.fillLinearGradientColorStops?.[stopIndex + 1];
      const resolved = resolve(typeof color === "string" ? color : undefined);
      return `<stop offset="${stop * 100}%" stop-color="${svgAttr(resolved)}"/>`;
    })
    .filter(Boolean)
    .join("");
  defs.push(
    `<linearGradient id="${gradId}" x1="${prim.fillLinearGradientStartPoint?.x ?? 0}" y1="${prim.fillLinearGradientStartPoint?.y ?? 0}" x2="${prim.fillLinearGradientEndPoint?.x ?? 0}" y2="${prim.fillLinearGradientEndPoint?.y ?? 0}" gradientUnits="userSpaceOnUse">${stops}</linearGradient>`,
  );
}

function primToSvg(p: Prim, index: number, resolve: BlockColorResolver, defs: string[]): string {
  const shadowColor = p.shadowColor ? resolve(p.shadowColor) : undefined;
  const shadow = shadowColor
    ? ` filter="drop-shadow(0 ${p.shadowOffsetY || 0}px ${p.shadowBlur || 0}px ${svgAttr(shadowColor)})"`
    : "";
  const transform = p.rotation ? ` transform="rotate(${p.rotation} ${p.offsetX || 0} ${p.offsetY || 0})"` : "";
  const baseAttr = `${shadow}${transform}`;
  const gradId = p.fillLinearGradientColorStops?.length ? `blk-grad-${index}` : undefined;
  if (gradId) {pushLinearGradient(defs, gradId, p, resolve);}

  if (p.kind === "rect") {
    const fill = gradId ? `url(#${gradId})` : resolve(p.fill);
    const stroke = p.stroke ? ` stroke="${svgAttr(resolve(p.stroke))}" stroke-width="${p.strokeWidth ?? 0}"` : "";
    const rx = p.radius ? ` rx="${p.radius}" ry="${p.radius}"` : "";
    return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${svgAttr(fill)}"${stroke}${rx}${baseAttr}/>`;
  }
  if (p.kind === "circle") {
    const fill = gradId ? `url(#${gradId})` : resolve(p.fill);
    const stroke = p.stroke ? ` stroke="${svgAttr(resolve(p.stroke))}" stroke-width="${p.strokeWidth ?? 0}"` : "";
    return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${svgAttr(fill)}"${stroke}${baseAttr}/>`;
  }
  if (p.kind === "line") {
    const pts = [];
    for (let i = 0; i < p.points.length; i += 2) {pts.push(`${p.points[i]},${p.points[i + 1]}`);}
    const dash = p.dash ? ` stroke-dasharray="${p.dash.join(" ")}"` : "";
    return `<polyline points="${pts.join(" ")}" fill="none" stroke="${svgAttr(resolve(p.stroke))}" stroke-width="${p.strokeWidth}"${dash} stroke-linecap="${p.lineCap || "round"}"${baseAttr}/>`;
  }
  if (p.kind === "path") {
    const fill = resolve(p.fill);
    const stroke = p.stroke ? ` stroke="${svgAttr(resolve(p.stroke))}" stroke-width="${p.strokeWidth ?? 0}"` : "";
    return `<path d="${p.data}" fill="${svgAttr(fill)}"${stroke} stroke-linecap="${p.lineCap || "round"}"${baseAttr}/>`;
  }
  if (p.kind === "arc") {
    const fill = resolve(p.fill);
    const stroke = p.stroke ? ` stroke="${svgAttr(resolve(p.stroke))}" stroke-width="${p.strokeWidth ?? 0}"` : "";
    const sx = p.cx + p.r * Math.cos(p.startAngle);
    const sy = p.cy + p.r * Math.sin(p.startAngle);
    const ex = p.cx + p.r * Math.cos(p.endAngle);
    const ey = p.cy + p.r * Math.sin(p.endAngle);
    const large = p.endAngle - p.startAngle > Math.PI ? 1 : 0;
    return `<path d="M ${sx} ${sy} A ${p.r} ${p.r} 0 ${large} 1 ${ex} ${ey}" fill="${svgAttr(fill)}"${stroke} stroke-linecap="${p.lineCap || "round"}"${baseAttr}/>`;
  }
  return "";
}

const PAD = CHAIR_D + 80;
export function blockToSvg(block: Block2D, pad = PAD, css?: string): string {
  const w = block.footprint.L + pad * 2;
  const h = block.footprint.D + pad * 2;
  const resolve = createBlockColorResolver(css);
  const defs: string[] = [];
  const body = block.prims.map((prim, index) => primToSvg(prim, index, resolve, defs)).join("\n    ");
  const defsBlock = defs.length ? `  <defs>\n    ${defs.join("\n    ")}\n  </defs>\n` : "";
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${w} ${h}" width="${w / 4}" height="${h / 4}" shape-rendering="geometricPrecision">`,
    defsBlock,
    `  <g stroke-linejoin="round" stroke-linecap="round">`,
    `    ${body}`,
    `  </g>`,
    `</svg>`,
  ].join("\n");
}

// --- Public entry point -----------------------------------------------------

function categoryKey(product: Product): string {
  return (product.category_id || product.metadata?.category || "").toLowerCase();
}

/**
 * Builds blocks for decorative or generic legacy elements that are not part
 * of the sellable catalog (e.g., plants, printers, whiteboards).
 */
export function buildGenericBlock2D(type: string, w: number, h: number): Block2D | null {
  const footprint = { L: w, D: h, H: 1000 };
  let prims: Prim[] = [];

  if (type === 'plant') {prims = buildPlanter(footprint).prims;}
  else if (type === 'sofa') {prims = buildSofa(footprint).prims;}
  else if (type === 'printer') {prims = buildEquipment(footprint, "printer").prims;}
  else if (type === 'whiteboard') {prims = buildEquipment(footprint, "whiteboard").prims;}
  else if (type === 'vending-machine') {prims = buildEquipment(footprint, "vending").prims;}
  else {
    // Fallback block
    prims.push({
      kind: 'rect', x: 0, y: 0, w, h,
      fill: BLOCK_STYLE.surface, stroke: BLOCK_STYLE.surfaceStroke, strokeWidth: BLOCK_STYLE.surfaceStrokeWidth, radius: BLOCK_STYLE.cornerRadius
    });
  }

  return { footprint, prims, label: type };
}

export function buildBlock2D(product: Product, opts?: { selection?: Partial<WorkstationSelection>; sizeSku?: string }): Block2D | null {
  const footprint = resolveFootprint(product, opts);
  if (!footprint) {return null;}

  const cat = categoryKey(product);
  const label = product.brandName || product.name;

  if (product.sizingType === "parametric" && product.workstation) {
    const seaters = opts?.selection?.seaters ?? product.workstation.seaterOptions[0] ?? 1;
    const hasPanel = product.workstation.system === "partition";
    if (product.workstation.shape === "l-shape") {
      return buildLShapeWorkstation(footprint, seaters, hasPanel);
    }
    if (product.workstation.sharing === "sharing") {
      return buildSharingStraightWorkstation(footprint, seaters, hasPanel);
    }
    return buildStraightWorkstation(footprint, seaters, hasPanel);
  }

  if (cat.includes("storage") || cat.includes("cabinet")) {
    if (footprint.L <= 500) {return buildStorageUnit(footprint, "Pedestal");} // Can expand ped builder later
    return buildStorageUnit(footprint, label);
  }

  if (cat.includes("table")) {
    const slug = (product.slug || "").toLowerCase();
    const nameLower = label.toLowerCase();
    if (nameLower.includes("cabin") || slug.includes("cabin")) {
      return buildCabinTable(footprint, label);
    }
    if (Math.abs(footprint.L - footprint.D) < 10 && footprint.L <= 1400) {
      const roundPax = footprint.L <= 900 ? 3 : footprint.L <= 1100 ? 3 : 4;
      return buildRoundTable(footprint, roundPax, label);
    }
    const pax = parseTablePax(label, footprint);
    return buildConferenceTable(footprint, pax, label);
  }

  if (cat.includes("sofa") || cat.includes("lounge")) {return buildSofa(footprint);}
  if (cat.includes("plant")) {return buildPlanter(footprint);}
  if (cat.includes("printer")) {return buildEquipment(footprint, "printer");}
  if (cat.includes("whiteboard")) {return buildEquipment(footprint, "whiteboard");}
  if (cat.includes("vending")) {return buildEquipment(footprint, "vending");}

  if (cat.includes("seating") || cat.includes("soft") || cat.includes("chair")) {
    return {
      footprint, label,
      prims: tableChair(footprint.L / 2, footprint.D / 2, 0)
    };
  }

  return {
    footprint, label,
    prims: [{ kind: "rect", x: 0, y: 0, w: footprint.L, h: footprint.D, fill: BLOCK_STYLE.surface, stroke: BLOCK_STYLE.surfaceStroke, strokeWidth: BLOCK_STYLE.surfaceStrokeWidth, radius: BLOCK_STYLE.cornerRadius }]
  };
}
