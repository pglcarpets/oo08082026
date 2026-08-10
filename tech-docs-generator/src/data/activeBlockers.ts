/**
 * Mirror of repo-root Failures.md active table.
 * Update here when Failures.md changes (tech-docs has no live file read at runtime).
 */
export type ActiveBlocker = {
  id: string
  blocker: string
  evidence: string
  ownerAction: string
}

/** Empty when Failures.md has no active rows. */
export const activeBlockers: ActiveBlocker[] = []
