# Workspaces — Planner / Studio

**AUDITED:** 2026-08-10 · `/ooplanner` · `/oostudio` · never cross-import (`scan:boundaries`)  
Registry: [`00-README.md`](./00-README.md) · E2E suites owned by **TST-S16–S18**

---

## DONE

WRK-S01–S08 (audit-3b #1–#8) · WRK-S12 (boundaries) · **WRK-S13** · WRK-S14 (PlannerProjectMenu wired)

**WRK-S08 (2026-08-09):** save binds URL + `reloadSafe` e2e — Playwright fix #8 **passed** (22.9s).

**WRK-S13 (2026-08-10):** Responsive audit scoped to workspaces (`node scripts/responsive-audit.mjs --scope=workspaces`). Phone 390×844 + desktop 1920. Offenders were **10px chrome labels** (topbar project label, mobile actions, canvas-info groups, etc.). Bumped planner/studio FOCSS `font-size: 10px` → **11px** (fork-local only). Re-run: **4/4 fully OK**. Evidence: `results/site/responsive-audit-workspaces.txt`. `scan:boundaries` + typecheck green.

**WRK-S14 (2026-08-10):** `PlannerProjectMenu` wired in `Planner.tsx`; verified by `audit-3c-planner-polish.spec.ts`.

**Removed dups:** WRK-S10→TST-S18 · WRK-S11→TST-S17

---

## OPEN / PARTIAL

| ID | Pri | Seam | Status | Remaining |
|----|-----|------|--------|-----------|
| **WRK-S09** | P0 | member Planner, `DEV_AUTH_BYPASS≠1` | **PARTIAL** | Member client + units done. Need member-session e2e + `results/planner/audit-3b-supabase/`. |

### WRK-S09 progress

**Code (2026-08-10):** `plannerApi.ts` uses `browserApiFetch` (cookies + CSRF). API routes resolve user via `withAuth` when bypass off. Guest path intact. Units pass without bypass=`1`.

**Blocked on:** real signed-in member e2e (not guest entry).

---

## Paths

`site/lib/Planner/plannerApi.ts` · `site/focss/planner/*` · `site/focss/studio/*` · `scripts/responsive-audit.mjs` · `results/site/responsive-audit-workspaces.txt`
