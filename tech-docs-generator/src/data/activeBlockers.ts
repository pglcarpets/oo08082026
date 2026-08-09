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
  {
    id: 'F4',
    blocker:
      'Apex oando.co.in sends X-Robots-Tag: noindex (Worker Host → vercel.app; Vercel preview noindex)',
    evidence:
      'curl -sI https://oando.co.in/ 2026-08-09 shows x-robots-tag: noindex, nofollow. Fix in workers/oando-worker-proxy.',
    ownerAction:
      'Deploy Worker (pnpm deploy in workers/oando-worker-proxy). Verify no x-robots-tag noindex on apex. Submit sitemap to GSC + Bing.',
  },
]
