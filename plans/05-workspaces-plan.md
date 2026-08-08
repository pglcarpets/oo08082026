# Workspaces plan — Planner + Studio — AUDITED 2026-08-08

**Status:** PARTIAL — code fixes verified by read; Studio findings fixed in 2b/2c; Planner click-to-place wiring exists but live Supabase proof OPEN; undo/BOQ/390px canvas blockers missing from open list.
**Owner / when to use:** Anyone changing `/ooplanner` or `/oostudio` — **forks never import each other** (`pnpm run scan:boundaries`).
**Related:** [02-testing-plan.md](./02-02-testing-plan.md) · [04-database-plan.md](./04-04-database-plan.md) · [06-site-plan.md](./06-06-site-plan.md) (track C2) · [`Failures.md`](../Failures.md) · `agent-reports/{planner,studio}-ledger.md`

**Routes:** `/ooplanner` (Planner) · `/oostudio` (Studio)

---

## Goal

Both workspaces are fully interactive at 1280×800 and 390×844: draw/edit, place furniture (Planner), BOQ on Review, undo/redo, toolbars, persistence across hard refresh, and Studio save→catalog draft — proven by Playwright audits with dated `results/planner/` and `results/studio/` artifacts.

---

## Who does what

| Role | Responsibility |
|------|----------------|
| Planner owner | `audit-3b/3c`, `placeFurnitureAt`, route truth |
| Studio owner | `audit-2a`, responsive audit, catalog draft API proof |
| DBA | `feature_flags` grants on Admin ([04-database-plan.md](./04-04-database-plan.md)) |
| UI owner | Workspace chrome polish ([06-site-plan.md](./06-06-site-plan.md) C2) |

---

## Current state — Floor Planner (`/ooplanner`)

| # | Area | Code evidence | Verdict |
|---|------|---------------|---------|
| 1 | Undo keeps sheet/grid | `Planner.tsx` grid flags + `usePlannerHistory` restore | **FIX VERIFIED — needs live re-run (planner-ledger #1)** |
| 2 | BOQ dock on Review | `rightPanelsForStep` + `plannerBoqPanel` flag | **FIX VERIFIED — needs live re-run (planner-ledger #2)** |
| 3 | Catalog click/keyboard place | `placeFurnitureAt` wiring exists | **WIRING OK — live FAILED 2026-08-06 (0 layers)** |
| 4 | Top toolbar (15 handlers) | `toolbarHandlers` in `Planner.tsx` | **WIRING OK — blocked by #3** |
| 5 | Ctrl+K palette | `commandOpen` independent of `aiOpen` | **FIX VERIFIED** |
| 6 | 390px canvas width | `matchMedia` collapses side panels | **FIX VERIFIED — needs audit-3b (planner-ledger #6)** |
| 7 | AI panel Escape | `useKeyboardShortcuts` + AiPanel | **PARTIAL — AiPanel not re-read** |
| 8 | Hard refresh project | `PLANNER_LAST_PROJECT_KEY` in localStorage | **FIX VERIFIED** |
| 9 | Project menu | `PlannerProjectMenu` wired in overlay | **FIX VERIFIED** |

**Live blocker:** `audit-3b` #4 — 0 layers after click on 2026-08-06; logs showed `permission denied for table feature_flags`. Admin grants migration applied 2026-08-07; disk-mode Playwright may pass; Supabase-mode proof still required.

**Route truth FIXED:** `route-contract.json` and `productSuite.ts` correctly redirect `/planner/guest|canvas` → `/ooplanner`. E2E specs navigate to `/ooplanner`; only 2 specs mention legacy routes in comments (not navigation).

---

## Current state — Furniture Studio (`/oostudio`)

| Area | Evidence | Verdict |
|------|----------|---------|
| 390px canvas | `Studio.tsx` panel collapse mirrors Planner | **WIRING OK — needs responsive audit** |
| Draw → auto-select | `onUp` sets select tool + active object | **WIRING OK** |
| AI Escape | shortcuts + `FloatingPanel onClose` | **WIRING OK** |
| Toolbar handlers | `toolbarHandlers` gated by `studio*` flags | **WIRING OK** |
| Import/save → catalog | `doSave` → `studioApi.createFurniture` + `publishFurniture goLive:false` | **WIRING OK — needs live proof** |
| `audit-2a` Playwright | Not green in last session | **OPEN** |

---

## Step-by-step instructions

### Planner

1. **Apply Admin grants** (if not already)
   ```powershell
   pnpm run ops db:apply:admin -- --dry
   pnpm run ops db:apply:admin
   ```

2. **Start dev server** — `http://localhost:3000` only
   ```powershell
   pnpm dev
   ```

3. **Disk-mode Playwright** (instrumented traces)
   ```powershell
   $env:DEV_AUTH_BYPASS = "1"
   pnpm exec playwright test -c config/build/playwright.config.ts `
     tests/e2e/audit-3b-planner-fixes.spec.ts `
     tests/e2e/audit-3c-planner-polish.spec.ts --reporter=html
   ```
   **Expect:** #4 places ≥1 layer; console shows `[planner/place]` traces. **If 0 layers:** check `fabricRef` null, `catalogSidebar` flag, viewport centre off-canvas.

4. **Supabase mode** — preview deploy without bypass; re-run `audit-3b`.

5. **Boundary + responsive gates**
   ```powershell
   pnpm run scan:boundaries
   node scripts/responsive-audit.mjs
   pnpm run p0:unit
   ```

6. **Planner catalog lane** (includes audit specs)
   ```powershell
   pnpm run test:planner-catalog
   ```

### Studio

7. **Studio journey audit**
   ```powershell
   pnpm exec playwright test -c config/build/playwright.config.ts `
     tests/e2e/audit-2a-studio-journey.spec.ts --reporter=html
   ```

8. **FOCSS + boundaries**
   ```powershell
   pnpm run verify:focss
   pnpm run scan:boundaries
   ```

9. **Catalog draft contract** — prove `POST /api/Studio/furniture` + publish `goLive:false` creates `block_descriptors` draft (integration test or manual with `DEV_AUTH_BYPASS=1`).

Save artifacts: `results/planner/audit-3b-*/`, `results/studio/audit-2a/`.

---

## Verification checklist

- [ ] `scan:boundaries` — 0 Studio ↔ Planner cross-imports
- [ ] `audit-3b` #4 — ≥1 furniture layer on click + keyboard
- [ ] `audit-3b/3c` — full spec green (disk mode)
- [ ] `audit-3b` — green on Supabase preview (no bypass)
- [ ] `audit-2a` — Studio journey green
- [ ] `responsive-audit.mjs` — 1920 / 1280 / 390 / 320
- [ ] Route decision documented: `/planner/*` vs `/ooplanner` for e2e
- [ ] `test:planner-catalog` lane includes audit-3b/3c (9 specs in `package.json`)

---

## Open items

1. **P0:** Re-run `audit-3b` with instrumentation; close click-to-place blocker.
2. **P0:** Planner undo/redo strips sheet/grid — fix verified by read; live re-run to prove (planner-ledger #1).
3. **P0:** BOQ dock panel never renders on Review step — fix verified by read; live re-run to prove (planner-ledger #2).
4. **P0:** 390px Place-furniture step: narrow viewport canvas/chrome issues — fix verified by read; live audit-3b to prove (planner-ledger #6).
5. **P0:** Re-run `audit-3c`, `audit-2a` with dated results.
6. **P1:** Document route-truth contract in e2e spec headers if any legacy comment references remain ([02-testing-plan.md](./02-02-testing-plan.md)).
7. **P2:** Deferred: guest flow, multi-room, wall post-edit, offline sync, sketch-to-plan, 100+ item perf, 3D preview tab.
8. **P2:** Workspace chrome UI ([06-site-plan.md](./06-06-site-plan.md) C2).
9. **P2:** Decide fate of `PlannerProjectMenu.tsx` — orphaned dead code per planner-ledger #9; either wire or delete.

---

## Key paths & commands

| Item | Path / command |
|------|----------------|
| Planner shell | `site/components/Planner/Planner.tsx` |
| Studio shell | `site/components/Studio/Studio.tsx` |
| Feature flags | `site/lib/featureFlags.ts` |
| Planner history | `site/hooks/Planner/usePlannerHistory.ts` |
| Route contract | `site/platform/route-contract.json` |
| Product suite routes | `site/features/site/data/productSuite.ts` |
| Boundary scan | `pnpm run scan:boundaries` |
| Planner e2e lane | `pnpm run test:planner-catalog` |
| Responsive audit | `node scripts/responsive-audit.mjs` |

*Fork rule: Studio and Planner never import each other. Blockers: [`Failures.md`](../Failures.md) only.*
