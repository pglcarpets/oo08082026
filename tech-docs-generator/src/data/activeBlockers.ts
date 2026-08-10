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
    blocker:
      'docs.oando.co.in DNS resolves but HTTPS returns 525 (Cloudflare origin SSL handshake failed)',
    evidence:
      '2026-08-10: getent hosts docs.oando.co.in → CF anycast; curl -I https://docs.oando.co.in/ → 525. Not NXDOMAIN.',
    ownerAction:
      'Point docs origin at a live tech-docs deploy with a valid cert (CF Full strict). Confirm curl -I https://docs.oando.co.in/ → 200. See docs/architecture/tech-docs-link.md.',
  },
]
