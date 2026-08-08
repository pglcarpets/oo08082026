# Active blockers

Plan direction: [`plans/`](./plans/) — handover: [`plans/01-handover.md`](./plans/01-handover.md).  
Browser for any claim: **`http://localhost:3000` only**.

Remove rows only after verified fix with evidence; add a row when a real ship blocker appears.

Also mirrored in tech-docs: **Tech Stack — Active blockers** (`tech-docs-generator/src/data/activeBlockers.ts`).

---

| ID | Priority | Blocker | Evidence | Owner action |
|----|----------|---------|----------|--------------|
| **F3** | P0 | `docs.oando.co.in` has **no public DNS** (NXDOMAIN). | `nslookup docs.oando.co.in` 2026-08-08 — no A record (SOA only). Separate from apex Worker. | Add CF DNS for `docs` → tech-docs host; ship docs separately per `docs/architecture/tech-docs-link.md`. |

**Resolved 2026-08-08** (code + verification; rows removed):

| ID | Resolution |
|----|------------|
| **P0-1** | Product-page `srcSet` hydration mismatch — `normalizeAssetPath` defaulted to server FS probes during SSR of client components. **Fix:** `probeDisk` opt-in only; client/FilterGrid paths stay deterministic. **Verify:** `pnpm exec vitest run tests/unit/lib/assetPaths.test.ts`; re-run console audit on `http://localhost:3000/products/workstations/` and `/products/seating/`. |
| **P1-2** | Theme fetch stderr — `/api/theme/active/` serves preset tokens (`getActiveThemeId`); `ThemeProvider` warns and falls back by design when fetch fails. Not a missing `block_themes` seed for the public theme API. |
| **P1-3** | `[withAuth:mirror:throw]` in test stderr was the **intentional** `rateLimitScope` in `withAuth.test.ts` (handler error serialization test), not production auth mirroring. Rate-limit key split — **fix:** `normalizeClientIp` maps `127.0.0.1`/`::1` → `localhost` in `withAuth`, `getPublicApiIp`, `resolveClientIp`. **Verify:** `pnpm exec vitest run tests/unit/lib/clientIp.test.ts tests/unit/features/shared/api/withAuth.test.ts`. |
| **P1-4** | Lockfile mismatch — **not reproduced:** `pnpm@11.20.0` + `pnpm install --frozen-lockfile` exit 0 (2026-08-08). `lockfileVersion: '9.0'` is valid for pnpm 11. |

**Not blockers for the reported 404s:** Page Rules / WAF inventing path 404s (unverified via API — token lacks zone DNS/rules read — but Worker is a transparent proxy and `CF-Cache-Status: DYNAMIC`; 404s carry `x-matched-path: /404` + `x-vercel-cache: HIT` from origin). Local Next routes for portal/dashboard/ooplanner **exist** under `site/app/`.

---

*Last updated: 2026-08-08*
