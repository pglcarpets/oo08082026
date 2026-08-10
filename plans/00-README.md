# Programme plans — master index

**AUDITED:** 2026-08-10 · Flat `plans/` only.

**Authority:** user > live code > [`AGENTS.md`](../AGENTS.md) > this tree > [`01-handover.md`](./01-handover.md).

Nav: [`README.md`](./README.md) · Blockers: [`Failures.md`](../Failures.md) · Close: [`01-handover.md`](./01-handover.md).

---

## TDD loop

1. Confirm seam with owner before any test.
2. Red → green: one seam, one failing test, one minimal impl.
3. Refactor only after review.

---

## Gates (repo root)

| When | Command |
|------|---------|
| Fast ship | `pnpm run gate` |
| Full ship | `pnpm run release:gate` |
| Fork isolation | `pnpm run scan:boundaries` |
| Plans purity | `node scripts/general/check-plans-purity.mjs` |
| Types | `pnpm run typecheck` |

Browser/Playwright: `http://localhost:3000` only.

---

## Open slices only

DONE slices omitted. Full history in git + programme plans.

| Slice | Plan | Focus | Pri | Status |
|-------|------|-------|-----|--------|
| OPS-S05 | 03 | Vercel token rotation | P1 | OPEN |
| DB-S04 | 04 | `SEAM-DB-TYPES-ADMIN` | P1 | OPEN |
| DB-S05 | 04 | `SEAM-DB-TYPES-PRODUCTS` | P1 | OPEN |
| DB-S06 | 04 | Contact DB smokes | P1 | PARTIAL |
| DB-S07 | 04 | Retire Products `furniture_catalog` | P1 | OPEN |
| DB-S08 | 04 | Planner Supabase persistence proof | P1 | OPEN |
| DB-S10 | 04 | `db:test` connection smoke | — | OPEN |
| TST-S15 | 02 | Coverage strict 90% inventory | P1 | OPEN |
| TST-S16 | 02 | `SEAM-E2E-PLANNER-3B` | P2 | OPEN |
| TST-S17 | 02 | `audit-3c-planner-polish` | P2 | OPEN |
| TST-S18 | 02 | `SEAM-E2E-STUDIO-2A` | P2 | OPEN |
| TST-S19 | 02 | `SEAM-E2E-MARKETING-4A` | P2 | OPEN |
| SITE-S16 | 06 | Enquiry notification | P1 | OPEN |
| CHK-S01–S10 | 08 | Session start checklist | — | OPEN |

**No P0 partial slices open.**  
**No active Failures.md rows.**

**Closed today:** OPS-S01 · OPS-S04 · TECH-S01 · TECH-S05 · F3 · SITE-S08/S09/S10/S12/S15/S17/S18 · **WRK-S09** · **WRK-S13** · WRK-S14 · PX-*

---

## Programme files

| Plan | Focus |
|------|--------|
| [02-testing](./02-testing-plan.md) | Gates, Vitest, Playwright |
| [03-ops](./03-ops-deploy-plan.md) | Vercel, Worker, DNS |
| [04-database](./04-database-plan.md) | Migrations, types |
| [05-workspaces](./05-workspaces-plan.md) | Planner / Studio |
| [06-site](./06-site-plan.md) | Marketing, member suite |
| [07-tech-docs](./07-tech-docs-plan.md) | tech-docs |
| [08-oo-start](./08-oo-start-checklist.md) | Session start |
| [09-proxy-auth](./09-proxy-auth-hardening-plan.md) | Proxy/auth (DONE) |

Status in a programme plan must match this registry.

---

## Purity

```powershell
node scripts/general/check-plans-purity.mjs
```
