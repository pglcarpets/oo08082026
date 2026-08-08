/**
 * Admin P04 — version release + explicit migration when replacing an active family version.
 */

import type {
  WorkstationFamilyContract,
  WorkstationFamilyVersion,
} from "./workstationFamilyContract";

export type WorkstationMigrationChoice = "append" | "replace";

export type ReleaseWorkstationInput = {
  readonly contract: WorkstationFamilyContract;
  readonly nextVersion: WorkstationFamilyVersion;
  readonly migration: WorkstationMigrationChoice;
};

export function requiresMigrationChoice(
  contract: WorkstationFamilyContract,
  nextVersionId: string,
): boolean {
  if (!contract.activeVersionId) {return false;}
  if (contract.activeVersionId === nextVersionId) {return false;}
  const active = contract.versions.find((v) => v.versionId === contract.activeVersionId);
  return active?.status === "released";
}

export function releaseWorkstationFamilyVersion(
  input: ReleaseWorkstationInput,
): WorkstationFamilyContract | { ok: false; error: string } {
  const { contract, nextVersion, migration } = input;

  if (
    requiresMigrationChoice(contract, nextVersion.versionId) &&
    migration !== "append" &&
    migration !== "replace"
  ) {
    return { ok: false, error: "Migration choice required when replacing a released version" };
  }

  const releasedVersion: WorkstationFamilyVersion = {
    ...nextVersion,
    status: "released",
  };

  if (migration === "replace" && contract.activeVersionId) {
    const retained = contract.versions.filter((v) => v.versionId !== nextVersion.versionId);
    return {
      ...contract,
      activeVersionId: nextVersion.versionId,
      versions: [...retained, releasedVersion],
    };
  }

  const withoutDup = contract.versions.filter((v) => v.versionId !== nextVersion.versionId);
  return {
    ...contract,
    activeVersionId: nextVersion.versionId,
    versions: [...withoutDup, releasedVersion],
  };
}