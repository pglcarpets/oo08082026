/**
 * Admin P04 — workstation-family JSON contract (Buyer P01 consumes this shape).
 */

import {
  WORKSTATION_V0_DEFAULT_HEIGHT_MM,
  WORKSTATION_V0_SIZE_GRID,
  type WorkstationConfigV0,
  type WorkstationModuleKindV0,
  type WorkstationShapeV0,
  workstationFootprintMm,
} from "@/lib/catalog/workstationSystemV0";

export type WorkstationFamilyOption = {
  readonly optionId: string;
  readonly label: string;
  readonly module: WorkstationModuleKindV0;
};

export type WorkstationFamilyTopology = {
  readonly topologyId: string;
  readonly shape: WorkstationShapeV0;
  readonly seatCount: number;
  readonly label: string;
};

export type WorkstationFamilyVersion = {
  readonly versionId: string;
  readonly status: "draft" | "released";
  readonly effectiveFrom: string;
  readonly topologies: readonly WorkstationFamilyTopology[];
  readonly options: readonly WorkstationFamilyOption[];
  readonly sizeGrid: readonly { lengthMm: number; depthMm: number }[];
};

export type WorkstationFamilyContract = {
  readonly type: "oando-workstation-family";
  readonly schemaVersion: 1;
  readonly familySlug: string;
  readonly familyId: string;
  readonly activeVersionId: string | null;
  readonly defaultHeightMm: number;
  readonly versions: readonly WorkstationFamilyVersion[];
};

export function emitWorkstationFamilyContract(input: {
  readonly familySlug: string;
  readonly familyId: string;
  readonly activeVersionId: string | null;
  readonly versions: readonly WorkstationFamilyVersion[];
}): WorkstationFamilyContract {
  return {
    type: "oando-workstation-family",
    schemaVersion: 1,
    familySlug: input.familySlug,
    familyId: input.familyId,
    activeVersionId: input.activeVersionId,
    defaultHeightMm: WORKSTATION_V0_DEFAULT_HEIGHT_MM,
    versions: input.versions,
  };
}

export function footprintForConfig(config: WorkstationConfigV0): {
  readonly widthMm: number;
  readonly depthMm: number;
} {
  return workstationFootprintMm(config);
}

export const WORKSTATION_FAMILY_V0_FIXTURE = emitWorkstationFamilyContract({
  familySlug: "premium-linear",
  familyId: "ws-premium-v0",
  activeVersionId: "v1",
  versions: [
    {
      versionId: "v1",
      status: "released",
      effectiveFrom: "2026-07-01",
      topologies: [
        { topologyId: "linear-2", shape: "linear", seatCount: 2, label: "2-seat linear" },
        { topologyId: "l-4", shape: "l-shape", seatCount: 4, label: "4-seat L-shape" },
      ],
      options: [
        { optionId: "panel", label: "Privacy panel", module: "panel" },
        { optionId: "pedestal", label: "Pedestal storage", module: "pedestal" },
        { optionId: "overhead", label: "Overhead storage", module: "overhead" },
      ],
      sizeGrid: [...WORKSTATION_V0_SIZE_GRID],
    },
  ],
});