# Workspaces — Planner / Studio

**AUDITED:** 2026-08-10 · `/ooplanner` · `/oostudio` · never cross-import (`scan:boundaries`)  
Registry: [`00-README.md`](./00-README.md) · E2E suites owned by **TST-S16–S18**

---

## DONE

WRK-S01–S08 (audit-3b #1–#8) · WRK-S12 (boundaries) · WRK-S14 (PlannerProjectMenu wired)

**WRK-S08 (2026-08-09):** save binds URL + `reloadSafe` e2e — Playwright fix #8 **passed** (22.9s).

**WRK-S14 (2026-08-10):** `PlannerProjectMenu` wired in `Planner.tsx`; verified by `audit-3c-planner-polish.spec.ts`.

**Removed dups:** WRK-S10→TST-S18 · WRK-S11→TST-S17

---

## OPEN / PARTIAL

| ID | Pri | Seam | Status | Remaining |
|----|-----|------|--------|-----------|
| **WRK-S09** | P0 | member Planner, `DEV_AUTH_BYPASS≠1` | **PARTIAL** | Member client + units done. Need member-session e2e + `results/planner/audit-3b-supabase/`. |
| **WRK-S13** | P1 | responsive-audit workspaces only | OPEN | FOCSS at 390px |

### WRK-S09 progress

**Code (2026-08-10):** `plannerApi.ts` uses `browserApiFetch` (cookies + CSRF). API routes resolve user via `withAuth` when bypass off. Guest path intact. Units pass without bypass=`1`.

**Blocked on:** real signed-in member e2e (not guest entry).

---

## Paths

`site/lib/Planner/plannerApi.ts` · `site/lib/api/browserApi.ts` · `site/lib/auth/*` · `site/app/api/Planner/projects/*` · `tests/e2e/audit-3b-planner-fixes.spec.ts`
