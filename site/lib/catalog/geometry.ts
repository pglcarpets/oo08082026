// ---------------------------------------------------------------------------
// Catalog geometry (Plan D / D1 validation)
// ---------------------------------------------------------------------------
// Pure functions that turn the parametric catalog model (types.ts) into numeric
// footprints and derived parts. This is the first real exercise of the D1 schema
// and the foundation the canvas (D4) and BOQ (D8) build on. No Supabase, no I/O.

import type { Dim, DerivedRules, Product, WorkstationSpec } from "./types";

/** Default derived-part offsets (mm). Admin can override per-product via `derivedRules`. */
export const DEFAULT_DERIVED_RULES: DerivedRules = {
  screenOffsetIntermediate: 75,
  screenOffsetMain: 150,
};

/** Height of every worksurface (mm). Constant per owner spec. */
export const WORKSURFACE_HEIGHT_MM = 750 as const;

/** A concrete configuration of a parametric workstation, chosen by the user/wizard. */
export interface WorkstationSelection {
  /** NS: people (= bays). SH: bays along the run; people = bays × 2. */
  seaters: number;
  length: number; // worktop length per seat (mm) — L1 for L-shape
  depth: number; // worktop depth (mm)
  armLength?: number; // L-shape only: return-arm length L2 (mm)
}

/** SH doubles occupancy vs NS at the same run length (e.g. 4800 mm: 4 NS → 8 SH). */
export function sharingPeopleCount(bays: number): number {
  return Math.max(2, Math.floor(bays) * 2);
}

/** Which screen we are sizing, relative to a worktop run. */
export type ScreenKind = "intermediate" | "main";

function firstOption(options: number[] | undefined, fallback: number): number {
  return options && options.length > 0 ? options[0] : fallback;
}

/**
 * Compute the floor footprint of a workstation cluster from its parametric spec
 * plus a concrete selection.
 *
 * - straight: width = bays × length along the run (catalog seatCount = bays for NS and SH).
 * - NS depth 600 mm, chairs = bays; SH depth 1200 mm, chairs = bays × 2 (face-to-face).
 * - l-shape: each seat occupies an L (main run L1 × return arm L2). The return arm
 *   makes the floor depth large, so the bounding box is (seaters × L1) × L2.
 */
export function computeWorkstationFootprint(
  spec: WorkstationSpec,
  selection: WorkstationSelection,
): Dim {
  const seaters = Math.max(1, Math.floor(selection.seaters || 1));
  const length = selection.length;
  const depth = selection.depth;

  if (spec.shape === "l-shape") {
    const arm = selection.armLength ?? firstOption(spec.armOptions, length);
    return { L: seaters * length, D: arm, H: spec.heightMm };
  }

  // straight (Linear / Linear-Partition) — length always seaters × module length
  return { L: seaters * length, D: depth, H: spec.heightMm };
}

/**
 * Derived screen length for a worktop run, as DATA not hardcoded:
 * screen = topLength − offset (intermediate −75, main −150 by default).
 * Offsets come from the product's `derivedRules`, falling back to the defaults.
 */
export function deriveScreenLength(
  topLength: number,
  kind: ScreenKind,
  rules: DerivedRules = DEFAULT_DERIVED_RULES,
): number {
  const offset =
    kind === "main" ? rules.screenOffsetMain : rules.screenOffsetIntermediate;
  return Math.max(0, topLength - offset);
}

/** Modesty panel length follows the worktop length 1:1 (per owner spec). */
export function deriveModestyLength(topLength: number): number {
  return topLength;
}

/**
 * Resolve a product's placeable 2D footprint regardless of sizing type, so the
 * canvas can always draw something to scale.
 *
 * - parametric: needs a `selection`; falls back to the first option of each axis.
 * - discrete: returns the chosen `sizeOption` (by sku) or the first one.
 * - fixed: returns `defaultFootprint`.
 *
 * Returns `null` only when the product carries no geometry at all (legacy rows
 * still mid-migration) — callers should treat that as "not yet placeable".
 */
export function resolveFootprint(
  product: Product,
  opts?: { selection?: Partial<WorkstationSelection>; sizeSku?: string },
): Dim | null {
  switch (product.sizingType) {
    case "parametric": {
      const spec = product.workstation;
      if (!spec) {return null;}
      const selection: WorkstationSelection = {
        seaters: opts?.selection?.seaters ?? firstOption(spec.seaterOptions, 1),
        length: opts?.selection?.length ?? firstOption(spec.lengthOptions, 1200),
        depth: opts?.selection?.depth ?? firstOption(spec.depthOptions, 600),
        armLength: opts?.selection?.armLength,
      };
      return computeWorkstationFootprint(spec, selection);
    }
    case "discrete": {
      const options = product.sizeOptions ?? [];
      if (options.length === 0) {return null;}
      const chosen =
        (opts?.sizeSku && options.find((o) => o.sku === opts.sizeSku)) || options[0];
      return chosen.dim;
    }
    case "fixed":
      return product.defaultFootprint ?? null;
    default:
      // Legacy row with no structured geometry yet.
      return product.defaultFootprint ?? null;
  }
}
