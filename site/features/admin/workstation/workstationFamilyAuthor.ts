/**
 * Admin P04 — structured workstation authoring → legacy workstation JSON + contract embed.
 */

import {
  emitWorkstationFamilyContract,
  type WorkstationFamilyContract,
} from "./workstationFamilyContract";
import {
  releaseWorkstationFamilyVersion,
  type WorkstationMigrationChoice,
} from "./workstationFamilyRelease";
import { WORKSTATION_V0_DEFAULT_HEIGHT_MM, WORKSTATION_V0_SIZE_GRID } from "@/lib/catalog/workstationSystemV0";

export type WorkstationAuthorDraft = {
  readonly familySlug: string;
  readonly versionId: string;
  readonly effectiveFrom: string;
  readonly linear2Seat: boolean;
  readonly lShape4Seat: boolean;
  readonly panelOption: boolean;
  readonly pedestalOption: boolean;
  readonly lengthOptions: readonly number[];
  readonly depthOptions: readonly number[];
  readonly heightMm: number;
  readonly migrationChoice: WorkstationMigrationChoice;
};

export type LegacyWorkstationPayload = {
  readonly shape: "straight" | "l-shape";
  readonly system: string;
  readonly wireManagement: readonly string[];
  readonly sharing: string;
  readonly seaterOptions: readonly number[];
  readonly lengthOptions: readonly number[];
  readonly depthOptions: readonly number[];
  readonly heightMm: number;
  readonly oandoWorkstationFamily?: WorkstationFamilyContract;
};

const DEFAULT_LENGTHS = WORKSTATION_V0_SIZE_GRID.map((size) => size.lengthMm);
const DEFAULT_DEPTHS = [...new Set(WORKSTATION_V0_SIZE_GRID.map((size) => size.depthMm))];

export function defaultWorkstationAuthorDraft(): WorkstationAuthorDraft {
  return {
    familySlug: "premium-linear",
    versionId: "v1",
    effectiveFrom: "2026-07-01",
    linear2Seat: true,
    lShape4Seat: true,
    panelOption: true,
    pedestalOption: true,
    lengthOptions: DEFAULT_LENGTHS,
    depthOptions: DEFAULT_DEPTHS,
    heightMm: WORKSTATION_V0_DEFAULT_HEIGHT_MM,
    migrationChoice: "append",
  };
}

export function workstationAuthorFromJson(raw: string): WorkstationAuthorDraft {
  const fallback = defaultWorkstationAuthorDraft();
  try {
    const parsed = JSON.parse(raw) as LegacyWorkstationPayload;
    const contract = parsed.oandoWorkstationFamily;
    if (contract?.type === "oando-workstation-family") {
      const version = contract.versions[0];
      const topologies = version?.topologies ?? [];
      const options = version?.options ?? [];
      return {
        familySlug: contract.familySlug,
        versionId: version?.versionId ?? fallback.versionId,
        effectiveFrom: version?.effectiveFrom ?? fallback.effectiveFrom,
        linear2Seat: topologies.some((t) => t.shape === "linear"),
        lShape4Seat: topologies.some((t) => t.shape === "l-shape"),
        panelOption: options.some((o) => o.module === "panel"),
        pedestalOption: options.some((o) => o.module === "pedestal"),
        lengthOptions: version?.sizeGrid.map((s) => s.lengthMm) ?? fallback.lengthOptions,
        depthOptions: [...new Set((version?.sizeGrid ?? []).map((s) => s.depthMm))],
        heightMm: contract.defaultHeightMm,
        migrationChoice: "append",
      };
    }
    const seaters = parsed.seaterOptions ?? [];
    return {
      ...fallback,
      linear2Seat: seaters.includes(2),
      lShape4Seat: seaters.includes(4),
      lengthOptions: parsed.lengthOptions ?? fallback.lengthOptions,
      depthOptions: parsed.depthOptions ?? fallback.depthOptions,
      heightMm: parsed.heightMm ?? fallback.heightMm,
      migrationChoice: "append",
    };
  } catch {
    return fallback;
  }
}

export function releaseWorkstationAuthorDraft(
  draft: WorkstationAuthorDraft,
  workstationJson: string,
): { ok: true; json: string } | { ok: false; error: string } {
  let contract: WorkstationFamilyContract | undefined;
  try {
    const parsed = JSON.parse(workstationJson) as LegacyWorkstationPayload;
    contract = parsed.oandoWorkstationFamily;
  } catch {
    return { ok: false, error: "Invalid workstation JSON" };
  }
  if (!contract) {
    return { ok: false, error: "Missing oandoWorkstationFamily contract" };
  }

  const topologies = [];
  if (draft.linear2Seat) {
    topologies.push({
      topologyId: "linear-2",
      shape: "linear" as const,
      seatCount: 2,
      label: "2-seat linear",
    });
  }
  if (draft.lShape4Seat) {
    topologies.push({
      topologyId: "l-4",
      shape: "l-shape" as const,
      seatCount: 4,
      label: "4-seat L-shape",
    });
  }
  const options = [];
  if (draft.panelOption) {
    options.push({ optionId: "panel", label: "Privacy panel", module: "panel" as const });
  }
  if (draft.pedestalOption) {
    options.push({ optionId: "pedestal", label: "Pedestal storage", module: "pedestal" as const });
  }
  const sizeGrid = draft.lengthOptions.flatMap((lengthMm) =>
    draft.depthOptions.map((depthMm) => ({ lengthMm, depthMm })),
  );

  const nextVersion = {
    versionId: draft.versionId.trim() || "v1",
    status: "draft" as const,
    effectiveFrom: draft.effectiveFrom,
    topologies,
    options,
    sizeGrid,
  };

  const released = releaseWorkstationFamilyVersion({
    contract,
    nextVersion,
    migration: draft.migrationChoice,
  });
  if ("error" in released) {
    return { ok: false, error: released.error };
  }

  const legacy = JSON.parse(workstationJson) as LegacyWorkstationPayload;
  const nextLegacy: LegacyWorkstationPayload = {
    ...legacy,
    oandoWorkstationFamily: released,
  };
  return { ok: true, json: JSON.stringify(nextLegacy, null, 2) };
}

export function workstationJsonFromAuthor(draft: WorkstationAuthorDraft): string {
  const seaterOptions: number[] = [];
  if (draft.linear2Seat) {seaterOptions.push(2);}
  if (draft.lShape4Seat) {seaterOptions.push(4);}
  if (seaterOptions.length === 0) {seaterOptions.push(2);}

  const topologies = [];
  if (draft.linear2Seat) {
    topologies.push({
      topologyId: "linear-2",
      shape: "linear" as const,
      seatCount: 2,
      label: "2-seat linear",
    });
  }
  if (draft.lShape4Seat) {
    topologies.push({
      topologyId: "l-4",
      shape: "l-shape" as const,
      seatCount: 4,
      label: "4-seat L-shape",
    });
  }

  const options = [];
  if (draft.panelOption) {
    options.push({ optionId: "panel", label: "Privacy panel", module: "panel" as const });
  }
  if (draft.pedestalOption) {
    options.push({ optionId: "pedestal", label: "Pedestal storage", module: "pedestal" as const });
  }

  const sizeGrid = draft.lengthOptions.flatMap((lengthMm) =>
    draft.depthOptions.map((depthMm) => ({ lengthMm, depthMm })),
  );

  const contract = emitWorkstationFamilyContract({
    familySlug: draft.familySlug.trim() || "premium-linear",
    familyId: `ws-${draft.familySlug.trim() || "premium-linear"}`,
    activeVersionId: draft.versionId.trim() || "v1",
    versions: [
      {
        versionId: draft.versionId.trim() || "v1",
        status: "draft",
        effectiveFrom: draft.effectiveFrom,
        topologies,
        options,
        sizeGrid,
      },
    ],
  });

  const legacy: LegacyWorkstationPayload = {
    shape: draft.lShape4Seat && !draft.linear2Seat ? "l-shape" : "straight",
    system: "leg",
    wireManagement: [],
    sharing: "non-sharing",
    seaterOptions,
    lengthOptions: [...draft.lengthOptions],
    depthOptions: [...draft.depthOptions],
    heightMm: draft.heightMm,
    oandoWorkstationFamily: contract,
  };

  return JSON.stringify(legacy, null, 2);
}