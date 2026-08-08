# Testing plan — AUDITED 2026-08-08

**Status:** PARTIAL — fast checks green on 2026-08-07; default lane STALE (JSON overwritten by focused run, 180 tests vs full 2784); tech-docs GREEN (195 tests). Playwright OPEN. **P1:** Auth withAuth:mirror:throw errors + rate limit 401s from 127.0.0.1.
**Owner / when to use:** Anyone running gates, Vitest, or Playwright before merge or release.
**Related:** [`Testing-handbook.md`](../Testing-handbook.md) · [`Agents/02-testing.md`](../Agents/02-testing.md) · [05-workspaces-plan.md](./05-workspaces-plan.md) · [03-ops-deploy-plan.md](./03-ops-deploy-plan.md) · [`HANDOVER.md`](../HANDOVER.md)

---

## Goal

Green `pnpm run gate` (alias `release:gate:fast`) and both Vitest lanes (default + tech-docs), with Playwright specs using live `/ooplanner` routes and current selectors. "Done" means dated artifacts in `results/tests/` on the same commit, not a partial run or `tail` of output.

---

## Who does what

| Role | Responsibility |
|------|----------------|
| Developer | Run step-by-step commands locally; fix failures in scope of their change |
| Release owner | Re-prove both Vitest lanes + `release:gate` before ship |
| Workspace owner | Planner/Studio e2e (`audit-2a`, `audit-3b/3c`) per [05-workspaces-plan.md](./05-workspaces-plan.md) |

---

## Current state

| Area | Evidence (2026-08-07 unless noted) | Verdict |
|------|-------------------------------------|---------|
| `p0:unit` (23 files / 146 tests) | `pnpm run p0:unit` exit 0 | **GREEN — verified** |
| `session.test.ts` (10 tests) | vitest run on `tests/unit/lib/auth/session.test.ts` exit 0 | **GREEN — verified** |
| `typecheck`, `lint` (5 lanes), `verify:focss`, `scan:boundaries`, `check:governance`, `check:layout` | individual runs exit 0 | **GREEN — verified** |
| Full `pnpm run test` (default lane) | Last focused run (2026-08-08) overwrote JSON with 7 passing plans-purity tests; prior full run had 22 failed files / 24 failed tests | **STALE — needs re-run** |
| tech-docs Vitest lane | `results/tests/vitest-tech-docs-results.json` — 76 suites / 195 tests, exit 0 | **GREEN — verified 2026-08-08** |
| E2E selector helpers | `plannerCanvasHelpers.ts` uses `[data-testid="canvas-stage"]` | **FIXED** |
| E2E route truth | 2 specs mention legacy routes in comments only; all navigation uses `/ooplanner` per `route-contract.json` and `productSuite.ts` | **FIXED — document only** |
| `audit-3b` click-to-place | 0 layers on 2026-08-06; `feature_flags` grant + canvas wiring suspected | **OPEN — not re-run** |
| `audit-3b` click-to-place | 0 layers on 2026-08-06; `feature_flags` grant + canvas wiring suspected | **OPEN — not re-run** |
| Scripts hygiene phase 1–2 | `tmp-*` removed; `_audit-stale-scripts.mjs` 0 issues | **DONE** |

---

## Step-by-step instructions

Run from repo root in PowerShell. Stop on first failure; fix before continuing.

1. **Auth session unit (node env)**
   ```powershell
   pnpm exec vitest run --config tests/vitest.config.ts tests/unit/lib/auth/session.test.ts
   ```
   **Expect:** 10 passed, exit 0. **If fail:** check `environmentMatchGlobs` in `tests/vitest.config.ts` routes auth tests to `node`.

2. **P0 unit slice**
   ```powershell
   pnpm run p0:unit
   ```
   **Expect:** 23 files / 146 tests, exit 0.

3. **Both Vitest lanes** (never trust one summary line)
   ```powershell
   pnpm run test
   ```
   **Expect:** `results/tests/summary.json` with `{lane, files, tests, failed}` for default and tech-docs; exit 0. **If fail:** read full output for both lanes; do not pipe to `Select-Object -Last`.

4. **Tech-docs package gate**
   ```powershell
   pnpm --filter oando-tech-docs gate
   ```
   **Expect:** exit 0. See [07-tech-docs-plan.md](./07-tech-docs-plan.md).

5. **Static analysis bundle**
   ```powershell
   pnpm run typecheck
   pnpm run typecheck:tests
   pnpm run lint
   pnpm run verify:focss
   pnpm run scan:boundaries
   pnpm run check:governance
   pnpm run check:layout
   ```
   **Expect:** all exit 0; `scan:boundaries` reports 930 files / 0 cross-product edges; governance baseline `P4_migration_no_rollback = 42`.

6. **Fast release gate**
   ```powershell
   pnpm run gate
   ```
   **Expect:** exit 0 (runs `release:gate:fast` chain).

7. **Targeted Playwright audits** (dev server on `http://localhost:3000`)
   ```powershell
   pnpm exec playwright test -c config/build/playwright.config.ts `
     tests/e2e/audit-3b-planner-fixes.spec.ts `
     tests/e2e/audit-3c-planner-polish.spec.ts `
     tests/e2e/audit-2a-studio-journey.spec.ts `
     tests/e2e/audit-4a-marketing-journey.spec.ts
   ```
   **Expect:** `audit-3b` #4 places ≥1 layer. **If 0 layers:** see [05-workspaces-plan.md](./05-workspaces-plan.md) and [04-database-plan.md](./04-database-plan.md) (`feature_flags` grants).

8. **E2E route census** (before bulk spec edits)
   ```powershell
   Select-String -Path tests/e2e/*.spec.ts -Pattern 'page\.goto\("/planner/(guest|canvas)'
   ```
   **Expect:** decide with [05-workspaces-plan.md](./05-workspaces-plan.md) whether to update specs to `/ooplanner` or keep marketing redirects.

9. **Scripts hygiene**
   ```powershell
   node scripts/AsNeeded/_audit-stale-scripts.mjs
   pnpm run check:layout
   ```

Save artifacts: `results/tests/vitest-results.json`, `results/tests/vitest-tech-docs-results.json`, `results/tests/summary.json`.

---

## Verification checklist

- [ ] `session.test.ts` — 10/10 pass
- [ ] `pnpm run p0:unit` — 23 files / 146 tests pass
- [ ] `pnpm run test` — both lanes green; `results/tests/summary.json` present
- [ ] `pnpm run gate` — exit 0 on current commit
- [ ] `scan:boundaries` — 0 cross-product edges (Studio ↔ Planner)
- [ ] `audit-3b` #4 — click + keyboard places ≥1 furniture layer
- [ ] No stale `/planner/*` routes in e2e without documented decision
- [ ] `node scripts/general/check-plans-purity.mjs` — OK (if editing plans)

---

## Open items

1. **P0:** Re-prove full `pnpm run test` (both lanes) to green.
2. **P0:** Re-run `audit-3b/3c/2a/4a` with dated `results/` artifacts.
3. **P1:** Document redirect contract in e2e spec headers if any legacy comment references remain (`site/platform/route-contract.json`, `productSuite.ts`).
4. **P2:** Add unit smoke for `placeFurnitureAt`, `/api/Planner/catalog`, `PLANNER_LAST_PROJECT_KEY` hard-refresh.

---

## Key paths & commands

| Item | Path / command |
|------|----------------|
| Vitest config | `tests/vitest.config.ts` |
| Tech-docs Vitest | `tests/vitest.tech-docs.config.ts` |
| Playwright config | `config/build/playwright.config.ts` |
| Planner canvas helper | `tests/e2e/plannerCanvasHelpers.ts` |
| Route contract | `site/platform/route-contract.json` |
| Fast gate | `pnpm run gate` |
| Full gate | `pnpm run release:gate` |
| Planner catalog e2e lane | `pnpm run test:planner-catalog` |
| Stale script audit | `node scripts/AsNeeded/_audit-stale-scripts.mjs` |

*Blockers: [`Failures.md`](../Failures.md) only. Mark COMPLETE only with dated `results/` on `main`.*
