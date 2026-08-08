# OO Start Checklist — slice map

**AUDITED:** 2026-08-08 · **Location:** `e:\oo08082026` (repo root only).  
**Master registry:** [`00-README.md`](./00-README.md#slice-registry-all-programmes).

Each checkbox maps to a **vertical slice** — confirm seam before red when executing work slices.

---

## CHK-S01 — Environment

- [ ] **CHK-S01** — Working directory is `e:\oo08082026`
- [ ] `.env.local` at repo root with Admin + Products Supabase URLs/keys
- [ ] `node --version` v24+
- [ ] `pnpm --version` 11.20.0+

**Slice seam:** shell cwd + env files · **Evidence:** `Get-Location` + `Test-Path .env.local`

---

## CHK-S02 — Install

```powershell
pnpm install
```

- [ ] **CHK-S02** — Install from **repo root only** (never `site/` or `tech-docs-generator/`)
- [ ] No nested `node_modules` under `site/`

**Depends on:** CHK-S01 · **Evidence:** `pnpm run check:layout` layout section pass

---

## CHK-S03 — Fast gate quartet

```powershell
pnpm run check:layout
pnpm run verify:focss
pnpm run typecheck
pnpm run p0:unit
```

| Check | Slice ID | Expect |
|-------|----------|--------|
| Layout | TST-S09 (subset) | exit 0 |
| FOCSS | SITE-S14 | 141+ stylesheets |
| Typecheck | TST-S01 | exit 0 |
| P0 unit | TST-S03 | 23 files / 146 tests |

- [ ] **CHK-S03** — All four commands green

**Evidence:** `results/tests/vitest-p0-results.json` · **Depends on:** CHK-S02

---

## CHK-S04 — Blockers & handover

- [x] **CHK-S04** — Read [`Failures.md`](../Failures.md) (**1 active row:** F3; P0-1–P1-4 in resolved table)
- [ ] Read [`01-handover.md`](./01-handover.md)
- [ ] Pick one OPEN slice from [`00-README.md`](./00-README.md) registry

**Depends on:** —

---

## CHK-S05 — Dev server (UI work)

```powershell
pnpm dev
```

- [ ] **CHK-S05** — Server at `http://localhost:3000` (**never** `127.0.0.1`)
- [ ] `/` loads
- [ ] `/ooplanner` loads (`DEV_AUTH_BYPASS=1` for guest)
- [ ] `/oostudio` loads

**Seam:** `SEAM-CONSOLE-ROUTE` / E2E base URL · **Depends on:** CHK-S02

---

## CHK-S06 — Fork isolation

```powershell
pnpm run scan:boundaries
```

- [ ] **CHK-S06** — **0** Studio ↔ Planner cross-imports (slice **TST-S10** / **WRK-S12**)

---

## CHK-S07 — Database awareness

- [ ] **CHK-S07** — Two projects: Admin `rxzpznmxbaoxpikowmfc` · Products `erpweaiypimorcunaimz`
- [ ] Every migration has `-- rollback` section
- [ ] Mode-aware wrappers — no raw `fs` in production API paths

**Related slices:** DB-S01, DB-S10 · **Depends on:** CHK-S01

---

## CHK-S08 — Testing awareness

- [ ] **CHK-S08** — `pnpm run test` runs **two** Vitest lanes (TST-S06, TST-S07)
- [ ] Playwright uses `http://localhost:3000` only (TST-S16–TST-S19)

---

## CHK-S09 — Before committing plan/doc edits

```powershell
node scripts/general/check-plans-purity.mjs
pnpm run check:docs-all
```

- [ ] **CHK-S09** — Both exit 0 (slices **HO-S04** + governance)

---

## CHK-S10 — Pick work slice

- [ ] **CHK-S10** — One OPEN slice selected; **seam confirmation** checkbox ticked in programme plan before red

**P0 starters (if unsure):**

| Slice | Focus |
|-------|--------|
| OPS-S01 | F3 docs DNS |
| SITE-S01 | Workstations hydration (**PARTIAL** — run `SEAM-CONSOLE-ROUTE`) |
| WRK-S04 | Planner click-to-place |
| DB-S02 | feature_flags grants |

---

## Common mistakes → slice

| Mistake | Slice / rule |
|---------|----------------|
| `127.0.0.1` for browser | CHK-S05 — rate-limit IP fixed (**TST-S20 DONE**) |
| `pnpm install` in `site/` | CHK-S02 |
| Raw `fs` in API routes | CHK-S07, DB plan |
| No migration rollback | CHK-S07 |
| Studio ↔ Planner import | CHK-S06 |
| One Vitest summary only | CHK-S08 |
| `plans/` subfolders | CHK-S09 |

---

*Generated: 2026-08-08*
