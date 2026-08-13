# Workspaces — Planner / Studio

**AUDITED:** 2026-08-12 · `/ooplanner` · `/oostudio` · never cross-import (`scan:boundaries`)  
Registry: [`00-README.md`](./00-README.md) · Audit: [`.archive/audit/00-audit-summary.md`](../.archive/audit/00-audit-summary.md) · E2E suites owned by **TST-S16–S18**

---

## DONE

WRK-S01–S08 (audit-3b #1–#8) · **WRK-S09** · WRK-S12 (boundaries) · **WRK-S13** · WRK-S14 (PlannerProjectMenu wired)

**WRK-S08 (2026-08-09):** save binds URL + `reloadSafe` e2e — Playwright fix #8 **passed** (22.9s).

**WRK-S09 (2026-08-10):** Member Planner path with `DEV_AUTH_BYPASS=0` (not guest). Playwright `tests/e2e/audit-3b-supabase-member.spec.ts` — real Supabase user (`E2E_SUPABASE_USER_*`), `/access` sign-in, list → create → save → hard reload → list card → open. Persistence via `oando_plans` + `browserApiFetch` (cookies + CSRF). **Passed** (fresh live rerun: 1 passed). Evidence: `results/planner/audit-3b-supabase/` (`00-env.txt`, `journey.txt`, screenshots 01–06). `typecheck` + `scan:boundaries` green.

**WRK-S13 (2026-08-10):** Responsive audit scoped to workspaces (`node scripts/responsive-audit.mjs --scope=workspaces`). Phone 390×844 + desktop 1920. Offenders were **10px chrome labels** (topbar project label, mobile actions, canvas-info groups, etc.). Bumped planner/studio FOCSS `font-size: 10px` → **11px** (fork-local only). Fresh re-run: **4/4 fully OK** at both viewports. Evidence: `results/site/responsive-audit-workspaces.txt`. `scan:boundaries` + typecheck green.

**WRK-S14 (2026-08-10):** `PlannerProjectMenu` wired in `Planner.tsx`; verified by `audit-3c-planner-polish.spec.ts`.

**Removed dups:** WRK-S10→TST-S18 · WRK-S11→TST-S17

---

## OPEN / PARTIAL

| ID | Pri | Seam | Red → green |
|----|-----|------|-------------|
| **WRK-S15** | P2 | P2-5: `/oostudio/` CLS=0.30 (>0.1); no `onLCP/onINP/onCLS` reporters | add vitals reporters to `SiteAnalytics.tsx`; assert budgets; fix Studio layout shift |
| **WRK-S16** | P2 | P2-7: VR coverage missing `/ooplanner`, `/oostudio` | add both to VR baseline suite |
| **WRK-S17** | P2 | P2-9: `/ooplanner/projects/` 401 in bypass (client fetch) | align with OPS-S10; fix bypass identity propagation |

---

## Paths

`site/lib/Planner/plannerApi.ts` · `tests/e2e/audit-3b-supabase-member.spec.ts` · `results/planner/audit-3b-supabase/` · `site/focss/planner/*` · `site/focss/studio/*` · `scripts/responsive-audit.mjs` · `results/site/responsive-audit-workspaces.txt`
