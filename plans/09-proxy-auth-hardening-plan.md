# 09 — Proxy / auth / maintenance

**AUDITED:** 2026-08-09 · **Status:** DONE · Registry: [`00-README.md`](./00-README.md) **PX-S00–S06**

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

*Blockers: [`Failures.md`](../Failures.md) only.*
