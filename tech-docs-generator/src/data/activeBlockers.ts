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

export const activeBlockers: ActiveBlocker[] = [
  {
    id: 'F3',
    blocker: 'docs.oando.co.in has no public DNS (NXDOMAIN)',
    evidence: 'nslookup docs.oando.co.in 2026-08-08 — no A record (SOA only). Separate from apex Worker.',
    ownerAction:
      'Add Cloudflare DNS for docs → tech-docs host. See docs/architecture/tech-docs-link.md.',
  },
]
