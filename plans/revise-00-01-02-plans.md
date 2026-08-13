# Revise plans 00, 01, 02 + dedup mobile shell plans

**Status:** COMPLETE · **Date:** 2026-08-12

**Work boundary:** **`C:` is out of bounds.** All work happens only inside the repository (`E:\oo08082026`). No file is created, edited, or copied from outside the repo. Plan documents live only in `plans/` (repo-local, per `AGENTS.md` §1). The authoritative copy of this plan is at `E:\oo08082026\plans\revise-00-01-02-plans.md`.

---

## Problem

### A. Missing registry (00)
Every numbered plan (01–09) references `Registry: [00-README.md](./00-README.md)` — **the file doesn't exist**. No single source maps all OPEN/DONE slice IDs across plans.

### B. Stale handover (01)
`01-handover.md` references F3 as active but `Failures.md` shows **zero active blockers** (F1–F4 all closed).

### C. Stale testing plan (02)
`02-testing-plan.md` has OPEN items TST-S15–S19 predating the 11-track deep audit (7 P1 + 10 P2 findings). No mention of the 85% strict quality program (Phase B).

### D. Three overlapping mobile-shell plans
| File | What it is | Overlaps with |
|------|-----------|---------------|
| `oo-deep-audit-v2.md` | Abstract 10-phase vision + AI prompts | Superseded by `oo-ux-shell-program.md` |
| `oo-ux-shell-program.md` | Same 10 phases, concrete targets + code | **Canonical — keep** |
| `phase1-mobile-app-shell.md` | Phase 1 only, exact 10-file diffs | Subsumed in `oo-ux-shell-program.md` §PHASE 1 |
| `Mobile app shell for oando.co.md` | Raw user prompt dump (seed) | Source for the three above |

---

## Changes (all inside the repo only)

### Step 1 — CREATE `plans/00-README.md`
Slice-ID registry — one table per prefix (HO-S, TST-S, OPS-S, DB-S, WRK-S, SITE-S, TECH-S, PX-S, CHK-S, AUDIT-): ID, status (DONE/OPEN/PARTIAL), owning plan, evidence. Summary: **76 DONE · 13 OPEN · 1 PARTIAL** + **7 P1 · 10 P2** (audit). OPEN-by-priority table linking each OPEN to its plan + audit track.

### Step 2 — EDIT `plans/01-handover.md`
- Replace stale F3 with "zero active blockers per Failures.md"; F1–F4 all DONE with close dates
- Add post-audit note: 11-track deep audit complete (2026-08-12); 7 P1 + 10 P2 → `.archive/audit/00-audit-summary.md`
- Next-session → `00-README.md` OPEN items; update AUDITED date

### Step 3 — EDIT `plans/02-testing-plan.md`
- Retire TST-S15–S19 → RETIRED, superseded-by notes
- Add TST-S22–S28 mapped from audit P1s (exports gate, i18n lang, hydration crash, toolautosubmit, hero contrast, touch targets, toolbar role)
- Add 85% strict quality gate section (Phase B: 5 config files, thresholds, hollow enforcement)
- Update AUDITED date

### Step 4 — Dedup mobile-shell plans (retire, don't delete)
Add `**Status:** RETIRED — superseded by [`oo-ux-shell-program.md`](./oo-ux-shell-program.md) (2026-08-12)` at top of:
- `plans/oo-deep-audit-v2.md` (history preserved — all 10 phases + prompts)
- `plans/phase1-mobile-app-shell.md` (keep — 10-file diffs useful reference during Phase 1)
- `plans/Mobile app shell for oando.co.md` (keep — documents original request)

### Step 5 — EDIT `plans/README.md`
Add `00-README.md` row to the table; move retired plans to a "Retired" section at the bottom.

---

## Files changed (all in `plans/`)

| File | Action |
|------|--------|
| `plans/00-README.md` | CREATE — slice ID registry |
| `plans/01-handover.md` | EDIT |
| `plans/02-testing-plan.md` | EDIT |
| `plans/oo-deep-audit-v2.md` | EDIT — RETIRED header |
| `plans/phase1-mobile-app-shell.md` | EDIT — RETIRED header |
| `plans/Mobile app shell for oando.co.md` | EDIT — RETIRED header |
| `plans/README.md` | EDIT — rows + retired section |

## No changes
`plans/03`–`09` (internally consistent) · `plans/oo-deep-audit-85-strict-quality-program.md` (active) · `agent-reports/` · **nothing outside the repo — no `C:` paths anywhere**

## Verification

```
pnpm run check:docs-all          # includes check:plans-purity — flat md, no subfolders
pnpm run check:layout
```

Manual: every `[00-README.md](./00-README.md)` link in 01–09 resolves · `01` Failures map ↔ `Failures.md` (zero) · `02` audit IDs ↔ `.archive/audit/00-audit-summary.md` · **no `C:` path strings anywhere in `plans/`** (grep `C:\\Users` returns 0).
