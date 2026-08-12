# 09 — Proxy / auth / maintenance

**AUDITED:** 2026-08-12 · **Status:** PX-S00–S06 DONE · Registry: [`00-README.md`](./00-README.md) · Audit: [`agent-reports/audit/00-audit-summary.md`](../agent-reports/audit/00-audit-summary.md) · **PX-S00–S06**

**Code:** `site/proxy.ts` · dashboard layout · `tests/unit/proxy*.ts` · `check-admin-api-auth.test.ts`

---

## Locked decisions

| ID | Choice |
|----|--------|
| D1 | **A** — maintenance offline `/admin` only; member hubs browse-only |
| D2 | Legacy admin studio → `/oostudio/` **before** auth (308) |
| D3 | Session cookie gate = Supabase `sb-*-auth-token` only (no Appwrite) |

---

## Delivered (PX-S00–S06)

| Slice | What |
|-------|------|
| S00 | Fail-closed API writes; member-write prefixes+segments; locale matcher gone; guest surfaces; CSP polish |
| S01 | 308 short-circuits: svg-catalog, admin studio, `/crm`→`/admin/crm/`, `/ops`→`/admin/` |
| S02 | Maintenance policy A + label copy |
| S03 | `dashboard/layout` `requireAuthUser` |
| S04 | Drop `a_session_*` |
| S05 | Admin API auth inventory test (all routes gated) |
| S06 | COOP/CORP headers; docs |

**Verify:** `pnpm exec vitest run --config tests/vitest.config.ts tests/unit/proxy.test.ts tests/unit/proxy.live-smoke.test.ts tests/unit/scripts/check-admin-api-auth.test.ts`

---

## Auth layering (reference)

```text
proxy (cookie / maintenance / guest write / CSP)
  → layout requireAuthUser / getOptionalUser
  → API withAuth + CSRF + rate limit
```

**Deferred:** CSP nonces, edge-only auth, rate limit in proxy.

---

## OPEN — audit-derived (security / api-safety)

| ID | Pri | Seam | Red → green |
|----|-----|------|-------------|
| ~~**PX-S07**~~ | ~~P2~~ | ~~SEC-2: `GET /api/git-user` leaks git identity unauthenticated~~ | **DONE** 2026-08-12 — admin-gated `withAuth({role:"admin"})`; `tests/unit/app/api/git-user/route.test.ts` 4/4 |
| ~~**PX-S08**~~ | ~~P3~~ | ~~SEC-3: `GET /api/dev/auth-bypass-status` exposes bypass/nodeEnv state~~ | **DONE** 2026-08-12 — 404 in prod verified + test |
| **PX-S09** | P2 | SEC-4: prod CSP `script-src 'unsafe-inline'` (ratcheted P2=2) | move inline scripts to nonce/hash to lower ratchet |
| ~~**PX-S10**~~ | ~~P2~~ | ~~API-2 (9.2): `audit-api-route-safety.mjs` skips `"other"` surface~~ | **DONE** 2026-08-12 — `other` mutators rate-limited + GET auth allowlist; audit ok |
| **PX-S11** | P2 | P2-9: `/ooplanner/projects/` 401 in bypass mode (client fetch) | verify bypass identity reaches client fetch; align OPS-S10/WRK-S17 |

*Blockers: [`Failures.md`](../Failures.md) only.*
