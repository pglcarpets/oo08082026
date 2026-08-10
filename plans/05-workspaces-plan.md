# Workspaces — Planner / Studio

**AUDITED:** 2026-08-09 · `/ooplanner` · `/oostudio` · never cross-import (`scan:boundaries`)  
Registry: [`00-README.md`](./00-README.md) · E2E suites owned by **TST-S16–S18**

---

## DONE

WRK-S01–S08 (audit-3b #1–#8) · WRK-S12 (boundaries) · WRK-S14 (PlannerProjectMenu wired)

**WRK-S08 (2026-08-09):** save binds URL + `reloadSafe` e2e — Playwright fix #8 **passed** (22.9s).

**WRK-S14 (2026-08-10):** `PlannerProjectMenu` is wired in `Planner.tsx` (import line 29, render line 1714) and verified by `tests/e2e/audit-3c-planner-polish.spec.ts` ("3c fix #9 — PlannerProjectMenu is live, renames the project, and stays in sync with the topbar"). No longer orphaned.

**Removed dups:** WRK-S10→TST-S18 · WRK-S11→TST-S17

---

## OPEN

| ID | Pri | Seam | Red → green | Evidence |
|----|-----|------|-------------|----------|
| **WRK-S09** | P0 | full audit-3b on preview, `DEV_AUTH_BYPASS=0` | real Supabase auth path (DB-S02 client fixed) | `results/planner/audit-3b-supabase/` |
| **WRK-S13** | P1 | responsive-audit **workspaces only** | FOCSS at 390px | `results/site/responsive-audit.txt` |

---

## Paths

`site/components/Planner/Planner.tsx` · `site/components/Studio/Studio.tsx` · `tests/e2e/audit-3b-planner-fixes.spec.ts`
