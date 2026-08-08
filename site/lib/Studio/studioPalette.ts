/**
 * Furniture Studio design tokens for canvas / Fabric / AI prompts.
 *
 * Hex pairs: keep in sync with `site/focss/studio/base/palette.css`
 * (run `pnpm run scan:tokens`). UI chrome uses semantic CSS vars
 * (`site/focss/studio/base/semantic.css`) — not duplicated here.
 *
 * This is the Studio's own copy. The Planner has `plannerPalette.ts`; the two
 * are intentionally independent and a change here does not propagate there.
 */

import {
  resolveLoadedSansFamily,
  resolveLoadedSansFamilyShort,
} from "@/lib/fonts";

export const OO = {
  white50: "#FFFFFF",
  white100: "#FAFBFC",
  white150: "#F5F7FA",
  white200: "#EEF2F6",
  white250: "#E6ECF3",
  white300: "#DDE5ED",
  white350: "#D2DCE7",
  white400: "#C6D3E0",

  ecru50: "#FAFAF8",
  ecru100: "#F3F2EF",
  ecru200: "#EAE7E1",
  ecru300: "#DED2B6",

  bronze300: "#BEAF9A",
  bronze400: "#9D876C",
  bronze500: "#7F6A52",
  bronze600: "#66533F",

  obb300: "#9BBBDA",
  obb400: "#77A2C9",
  obb500: "#5488B6",
  obb550: "#4A7CA8",
  obb600: "#406F99",

  midnight300: "#4B719F",
  midnight400: "#335479",
  midnight500: "#1F3653",
  midnight600: "#182A40",
  midnight700: "#111E2D",
  midnight800: "#0B141D",
  midnight900: "#070D12",

  ink25: "#F8FAFC",
  ink50: "#F1F5F9",
  ink100: "#E2E8F0",
  ink200: "#CBD5E1",
  ink300: "#94A3B8",
  ink400: "#64748B",
  ink500: "#56697E",
  ink600: "#3F5168",
  ink700: "#3B4756",
  ink800: "#1B2940",
  ink900: "#0B1324",

  sustain400: "#5E8E74",
  sustain300: "#7FAF96",
  bronzeWarm: "#C7A882",
  error: "#972B1A",

  /** Canvas / scene semantics (also --canvas-* in CSS) — aliases of palette where identical */
  canvasBg: "#FFFFFF", // == white50 / --color-white-50
  canvasGridMinor: "#EDF1F7",
  canvasGridMajor: "#DAE2EC",
  canvasSelection: "#406F99", // == obb600
  canvasWindowFill: "#EDF4FA",
  canvasDoorFill: "rgba(158, 178, 212, 0.16)",
  sceneBgDraft: "#F7F9FC",
  sceneBgHigh: "#F2F4F8",

  transparentCheckerLight: "#FFFFFF", // == white50
  transparentCheckerDark: "#EEEEEE",
  colorPickerFallback: "#000000",
} as const;

/** Default stroke / fill for new fabric objects. */
export const OO_DRAW = {
  stroke: OO.ink900,
  fill: OO.ecru100,
  fillAlt: OO.ecru200,
  accent: OO.obb600,
  guide: OO.bronze400,
} as const;

/** Colour palette swatches offered in the Studio colour rail. */
export const OO_SWATCHES: readonly string[] = [
  OO.white50,
  OO.ecru100,
  OO.ecru200,
  OO.ecru300,
  OO.bronze300,
  OO.bronze400,
  OO.bronze500,
  OO.ink900,
  OO.midnight500,
  OO.midnight400,
  OO.obb600,
  OO.obb500,
  OO.obb400,
  OO.obb300,
  OO.sustain400,
  OO.sustain300,
  OO.bronzeWarm,
  OO.error,
  "transparent",
];

/** Furniture drawing canvas scale: 0.2 px per mm. */
export const SCALE_PX_PER_MM = 0.2;

/** Canvas/Fabric body face — Helvetica Neue (never Inter). */
export function ooFontSans(): string {
  return resolveLoadedSansFamily();
}

export function ooFontSansShort(): string {
  return resolveLoadedSansFamilyShort();
}

export function transparentChecker(sizePx: number): string {
  return `repeating-conic-gradient(${OO.transparentCheckerDark} 0 25%, ${OO.transparentCheckerLight} 0 50%) 50% / ${sizePx}px ${sizePx}px`;
}
