/**
 * Minimal workstation systems-v0 contract used by admin family authoring.
 * Residual after legacy `@/features/planner/catalog/workstationSystemV0`.
 */

export type WorkstationShapeV0 = "linear" | "l-shape";

export type WorkstationModuleKindV0 = "desk" | "panel" | "pedestal" | "overhead";

export type WorkstationSizeV0 = {
  lengthMm: number;
  depthMm: number;
};

export type WorkstationConfigV0 = {
  shape: WorkstationShapeV0;
  size: WorkstationSizeV0;
  modules: readonly WorkstationModuleKindV0[];
  heightMm: number;
};

export type WorkstationFootprintMm = {
  widthMm: number;
  depthMm: number;
};

export const WORKSTATION_V0_DEFAULT_HEIGHT_MM = 750;

export const WORKSTATION_V0_SIZE_GRID: readonly WorkstationSizeV0[] = [
  { lengthMm: 1200, depthMm: 600 },
  { lengthMm: 1350, depthMm: 600 },
  { lengthMm: 1500, depthMm: 600 },
  { lengthMm: 1200, depthMm: 750 },
  { lengthMm: 1350, depthMm: 750 },
  { lengthMm: 1500, depthMm: 750 },
] as const;

export function createWorkstationConfigV0(input: {
  shape: WorkstationShapeV0;
  size: WorkstationSizeV0;
  modules?: readonly WorkstationModuleKindV0[];
  heightMm?: number;
}): WorkstationConfigV0 {
  return {
    shape: input.shape,
    size: input.size,
    modules: input.modules?.length ? [...input.modules] : ["desk"],
    heightMm: input.heightMm ?? WORKSTATION_V0_DEFAULT_HEIGHT_MM,
  };
}

export function workstationFootprintMm(config: WorkstationConfigV0): WorkstationFootprintMm {
  const { lengthMm, depthMm } = config.size;
  if (config.shape === "l-shape") {
    // Rough L envelope: length on both arms, depth as return thickness.
    return {
      widthMm: lengthMm + depthMm,
      depthMm: lengthMm,
    };
  }
  return { widthMm: lengthMm, depthMm };
}
