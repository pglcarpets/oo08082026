# Workspaces plan — Planner + Studio vertical slices

**AUDITED:** 2026-08-08 · **Routes:** `/ooplanner` · `/oostudio` · **Fork rule:** never cross-import (`pnpm run scan:boundaries`).  
**Related:** [`05-workspaces-plan.md`](./05-workspaces-plan.md) · `agent-reports/planner-ledger.md` · [`02-testing-plan.md`](./02-testing-plan.md).

**Browser:** `http://localhost:3000` only.

---

## DONE slices

### WRK-S12 — Boundaries on workspace edit

| Field | Value |
|-------|-------|
| **Slice ID** | WRK-S12 |
| **Seam** | `pnpm run scan:boundaries` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | _(completed)_ |
| **Green** | _(completed)_ |
| **Evidence** | 0 cross-product edges (2026-08-08) |
| **Depends on** | — |
| **Status** | DONE |

---

## OPEN slices — audit-3b (`tests/e2e/audit-3b-planner-fixes.spec.ts`)

Each case = one vertical slice. Run **one failing test** → fix → re-run.

### WRK-S01 — Undo keeps grid (P0)

| Field | Value |
|-------|-------|
| **Slice ID** | WRK-S01 |
| **Seam** | Playwright test `fix #1 — undo removes exactly the last wall and keeps the grid` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | `pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/audit-3b-planner-fixes.spec.ts -g "fix #1"` — grid flags lost after undo |
| **Green** | Fix `usePlannerHistory` / grid restore in `site/components/Planner/Planner.tsx` (single concern) |
| **Evidence** | `results/planner/audit-3b/` screenshot + test pass |
| **Depends on** | CHK-S05 |
| **Status** | OPEN — planner-ledger #1 |

### WRK-S02 — BOQ dock on Review (P0)

| Field | Value |
|-------|-------|
| **Slice ID** | WRK-S02 |
| **Seam** | Playwright test `fix #2 — clicking the BOQ tab mounts the dock shell and BOQ panel` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | `-g "fix #2"` — BOQ panel not mounted on Review step |
| **Green** | Fix `rightPanelsForStep` / `plannerBoqPanel` flag wiring |
| **Evidence** | audit-3b case #2 pass + DOM dump in `results/planner/audit-3b/` |
| **Depends on** | WRK-S01 |
| **Status** | OPEN — planner-ledger #2 |

### WRK-S03 — 390px Place step (P0)

| Field | Value |
|-------|-------|
| **Slice ID** | WRK-S03 |
| **Seam** | Playwright test `fix #3 — 390px Place furniture step keeps the canvas usable` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | `-g "fix #3"` at viewport 390×844 — canvas width 0 or Auto-arrange unreachable |
| **Green** | Fix `matchMedia` panel collapse in `Planner.tsx` |
| **Evidence** | `results/planner/audit-3b/03-narrow-place.png` + pass |
| **Depends on** | — |
| **Status** | OPEN — planner-ledger #6 |

### WRK-S04 — Click/keyboard place (P0)

| Field | Value |
|-------|-------|
| **Slice ID** | WRK-S04 |
| **Seam** | Playwright test `fix #4 — clicking and Enter/Space on a catalog item place it on the canvas` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | `-g "fix #4"` — `layerCount` 0 after click; `$env:DEV_AUTH_BYPASS="1"` |
| **Green** | Fix `placeFurnitureAt` / `CatalogRail onItemClick` at wiring seam |
| **Evidence** | `results/planner/audit-3b/click-log.txt` shows placement; test pass |
| **Depends on** | DB-S02 |
| **Status** | OPEN — **0 layers** on 2026-08-06 run |

### WRK-S05 — Top toolbar wired

| Field | Value |
|-------|-------|
| **Slice ID** | WRK-S05 |
| **Seam** | Playwright test `fix #5 — PlannerTopToolbar buttons are wired` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | `-g "fix #5"` — handler no-op |
| **Green** | Wire single toolbar handler in `toolbarHandlers` map |
| **Evidence** | audit-3b #5 pass |
| **Depends on** | WRK-S04 |
| **Status** | OPEN — code wired; live re-run needed |

### WRK-S06 — Ctrl+K palette

| Field | Value |
|-------|-------|
| **Slice ID** | WRK-S06 |
| **Seam** | Playwright test `fix #6 — Ctrl+K opens the command palette` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | `-g "fix #6"` — palette not visible |
| **Green** | Fix `commandOpen` independent of `aiOpen` |
| **Evidence** | audit-3b #6 pass |
| **Depends on** | — |
| **Status** | OPEN |

### WRK-S07 — Escape closes AI

| Field | Value |
|-------|-------|
| **Slice ID** | WRK-S07 |
| **Seam** | Playwright test `fix #7 — Escape closes the AI panel` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | `-g "fix #7"` |
| **Green** | Fix `PlannerAiPanel` keydown handler |
| **Evidence** | audit-3b #7 pass |
| **Depends on** | — |
| **Status** | OPEN |

### WRK-S08 — Hard refresh project name

| Field | Value |
|-------|-------|
| **Slice ID** | WRK-S08 |
| **Seam** | Playwright test `fix #8 — a hard refresh after Save keeps the project name bound` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | `-g "fix #8"` |
| **Green** | Fix `PLANNER_LAST_PROJECT_KEY` restore |
| **Evidence** | audit-3b #8 pass |
| **Depends on** | — |
| **Status** | OPEN |

### WRK-S09 — Supabase mode audit-3b (P0)

| Field | Value |
|-------|-------|
| **Slice ID** | WRK-S09 |
| **Seam** | Full `audit-3b-planner-fixes.spec.ts` on **preview** with `DEV_AUTH_BYPASS=0` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Preview URL + no bypass; fix #4 fails (feature_flags or auth) |
| **Green** | DB grants + auth fix at API seam |
| **Evidence** | `results/planner/audit-3b-supabase/` dated run |
| **Depends on** | DB-S02, WRK-S04 |
| **Status** | OPEN |

### WRK-S10 — Studio audit-2a (P2)

| Field | Value |
|-------|-------|
| **Slice ID** | WRK-S10 |
| **Seam** | `SEAM-E2E-STUDIO-2A` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | `pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/audit-2a-studio-journey.spec.ts` |
| **Green** | Fix failing Studio journey step |
| **Evidence** | `results/studio/audit-2a/` |
| **Depends on** | CHK-S05 |
| **Status** | OPEN |

### WRK-S11 — audit-3c polish (P2)

| Field | Value |
|-------|-------|
| **Slice ID** | WRK-S11 |
| **Seam** | `tests/e2e/audit-3c-planner-polish.spec.ts` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | First failing polish spec |
| **Green** | One polish fix |
| **Evidence** | `results/planner/audit-3c/` |
| **Depends on** | WRK-S04 |
| **Status** | OPEN |

### WRK-S13 — Responsive audit workspaces (P1)

| Field | Value |
|-------|-------|
| **Slice ID** | WRK-S13 |
| **Seam** | `node scripts/responsive-audit.mjs` for `/ooplanner` and `/oostudio` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Overflow or touch target fail at 390px |
| **Green** | FOCSS fix at reported route |
| **Evidence** | `results/site/responsive-audit.txt` |
| **Depends on** | — |
| **Status** | OPEN |

### WRK-S14 — PlannerProjectMenu orphan (P2)

| Field | Value |
|-------|-------|
| **Slice ID** | WRK-S14 |
| **Seam** | Owner decision — wire `PlannerProjectMenu` or delete file |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Dead code grep or unused import audit fails |
| **Green** | Wire in overlay OR delete component + update ledger |
| **Evidence** | PR note + `scan:boundaries` pass |
| **Depends on** | — |
| **Status** | OPEN — planner-ledger #9 |

---

## Key paths

| Item | Path |
|------|------|
| Planner shell | `site/components/Planner/Planner.tsx` |
| Studio shell | `site/components/Studio/Studio.tsx` |
| E2E 3b | `tests/e2e/audit-3b-planner-fixes.spec.ts` |
| Guest setup | `tests/e2e/guestProjectSetup.ts` |
| Boundaries | `pnpm run scan:boundaries` |

*Fork rule: Studio ↔ Planner never import each other.*
