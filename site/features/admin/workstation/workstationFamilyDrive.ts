/**
 * Admin P04 — one released family version drives 2D footprint, 3D mesh, and BOQ pricing.
 */

import {
  createWorkstationConfigV0,
  workstationFootprintMm,
  type WorkstationConfigV0,
  type WorkstationFootprintMm,
  type WorkstationModuleKindV0,
} from "@/lib/catalog/workstationSystemV0";
import { workstationV0UnitPriceInr } from "@/lib/catalog/workstationBoqV0";
import {
  generateWorkstationV0MeshPlan,
  type WorkstationV0MeshPlan,
} from "@/lib/catalog/workstationMeshV0";

import type {
  WorkstationFamilyContract,
  WorkstationFamilyVersion,
} from "./workstationFamilyContract";

export type WorkstationFamilySelection = {
  readonly topologyId: string;
  readonly lengthMm: number;
  readonly depthMm: number;
  readonly optionIds: readonly string[];
};

export type WorkstationFamilyDrive = {
  readonly versionId: string;
  readonly config: WorkstationConfigV0;
  readonly footprint2d: WorkstationFootprintMm;
  readonly meshPlan: WorkstationV0MeshPlan;
  readonly boqUnitPriceInr: number;
  readonly boqModuleSkus: readonly string[];
};

export function activeReleasedVersion(
  contract: WorkstationFamilyContract,
): WorkstationFamilyVersion | null {
  const activeId = contract.activeVersionId;
  if (!activeId) {return null;}
  const version = contract.versions.find((entry) => entry.versionId === activeId);
  if (!version || version.status !== "released") {return null;}
  return version;
}

function modulesFromOptions(
  version: WorkstationFamilyVersion,
  optionIds: readonly string[],
): WorkstationModuleKindV0[] {
  const modules: WorkstationModuleKindV0[] = ["desk"];
  for (const optionId of optionIds) {
    const option = version.options.find((entry) => entry.optionId === optionId);
    if (!option) {continue;}
    if (option.module === "panel" || option.module === "pedestal" || option.module === "overhead") {
      modules.push(option.module);
    }
  }
  return modules;
}

export function configFromFamilyVersion(
  contract: WorkstationFamilyContract,
  version: WorkstationFamilyVersion,
  selection: WorkstationFamilySelection,
): WorkstationConfigV0 | { error: string } {
  const topology = version.topologies.find((entry) => entry.topologyId === selection.topologyId);
  if (!topology) {
    return { error: `Topology "${selection.topologyId}" not in version ${version.versionId}` };
  }
  const sizeAllowed = version.sizeGrid.some(
    (size) => size.lengthMm === selection.lengthMm && size.depthMm === selection.depthMm,
  );
  if (!sizeAllowed) {
    return {
      error: `Size ${selection.lengthMm}×${selection.depthMm} mm not in version ${version.versionId} grid`,
    };
  }

  return createWorkstationConfigV0({
    shape: topology.shape,
    size: { lengthMm: selection.lengthMm, depthMm: selection.depthMm },
    modules: modulesFromOptions(version, selection.optionIds),
    heightMm: contract.defaultHeightMm,
  });
}

export function driveWorkstationFamily(
  contract: WorkstationFamilyContract,
  selection: WorkstationFamilySelection,
): WorkstationFamilyDrive | { error: string } {
  const version = activeReleasedVersion(contract);
  if (!version) {
    return { error: "No released active version on workstation family" };
  }

  const configResult = configFromFamilyVersion(contract, version, selection);
  if ("error" in configResult) {return configResult;}
  const config = configResult;

  const footprint2d = workstationFootprintMm(config);
  const meshPlan = generateWorkstationV0MeshPlan(config);
  const boqUnitPriceInr = workstationV0UnitPriceInr(config);
  const boqModuleSkus = selection.optionIds.map((optionId) => {
    const option = version.options.find((entry) => entry.optionId === optionId);
    return option ? `ws-${contract.familySlug}-${version.versionId}-${option.module}` : optionId;
  });

  if (
    meshPlan.footprint.widthMm !== footprint2d.widthMm ||
    meshPlan.footprint.depthMm !== footprint2d.depthMm
  ) {
    return { error: "2D footprint diverged from 3D mesh plan footprint" };
  }

  return {
    versionId: version.versionId,
    config,
    footprint2d,
    meshPlan,
    boqUnitPriceInr,
    boqModuleSkus,
  };
}