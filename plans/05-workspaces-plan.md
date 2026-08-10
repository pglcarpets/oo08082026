# Workspaces — Planner / Studio

**AUDITED:** 2026-08-10 · `/ooplanner` · `/oostudio` · never cross-import (`scan:boundaries`)  
Registry: [`00-README.md`](./00-README.md) · E2E suites owned by **TST-S16–S18**

---

## DONE

WRK-S01–S08 (audit-3b #1–#8) · WRK-S12 (boundaries) · WRK-S14 (PlannerProjectMenu wired)

**WRK-S08 (2026-08-09):** save binds URL + `reloadSafe` e2e — Playwright fix #8 **passed** (22.9s).

**WRK-S14 (2026-08-10):** `PlannerProjectMenu` is wired in `Planner.tsx` and verified by `tests/e2e/audit-3c-planner-polish.spec.ts`. No longer orphaned.

**Removed dups:** WRK-S10→TST-S18 · WRK-S11→TST-S17

---

## OPEN

| ID | Pri | Seam | Red → green | Evidence |
|----|-----|------|-------------|----------|
| **WRK-S09** | P0 | full audit-3b on preview, `DEV_AUTH_BYPASS=0` | real Supabase **member** session for load/save/list; guest path intact | `results/planner/audit-3b-supabase/` |
| **WRK-S13** | P1 | responsive-audit **workspaces only** | FOCSS at 390px | `results/site/responsive-audit.txt` |

### WRK-S09 progress (not done)

**Code (2026-08-10):** Member client no longer depends on bypass to skip CSRF. `site/lib/Planner/plannerApi.ts` uses shared `browserApiFetch` (session cookies + CSRF + `trailingSlash`). API routes already resolve `auth.user` via `withAuth` → `createAuthServerClient` cookies when bypass is off. Guest-role routes + guest cookie path unchanged. Unit: `tests/unit/lib/Planner/plannerApi.test.ts`, `tests/unit/lib/auth`, `tests/unit/app/api/Planner` (session mocks, not bypass).

**Still open:** Preview/e2e proof with `DEV_AUTH_BYPASS=0` and a real signed-in member — `audit-3b-planner-fixes.spec.ts` still enters via **guest** workspace (`enterGuestPlannerWorkspace`). That suite alone does not prove the Supabase member path. Own under TST-S16 + this slice until `results/planner/audit-3b-supabase/` exists.

---

## Paths

`site/lib/Planner/plannerApi.ts` · `site/lib/api/browserApi.ts` · `site/lib/auth/*` · `site/app/api/Planner/projects/*` · `tests/e2e/audit-3b-planner-fixes.spec.ts`
