# Phase 3a ledger — Planner deep interactive audit (`/ooplanner`)

**Date:** 2026-08-02 · **Method:** real Playwright interaction at `http://localhost:3000`, viewports 1280×800 and 390×844.  
**Audit scripts:** `tests/e2e/audit-3a-planner-journey.spec.ts` + `tests/e2e/audit-3a-planner-journey-2.spec.ts` — 13 cases, all pass.  
**Evidence:** `E:\results\planner\audit-3a\`  
**Status:** several 3b fixes verified; open blockers remain. Ledger updated 2026-08-10 (WRK-S09 member path).

---

## Test-infra note

Pre-existing shared helpers (`tests/e2e/guestProjectSetup.ts`, `tests/e2e/plannerCanvasHelpers.ts`) targeted non-existent DOM contracts (`planner-fabric-stage`, `.pw-topbar`, dead `/planner/*` routes). Corrected to match the live `Planner.tsx` tree (`canvas-stage`, `topbar`, `/ooplanner`). Roughly 30 other e2e specs may still lean on unverified selectors; not remediated in this phase.

## Findings

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Undo/Redo strips sheet/grid instead of reverting user walls | Blocker | Open |
| 2 | BOQ dock panel never renders on Review & quote step | Blocker | Open |
| 3 | Catalog items cannot be placed by click/keyboard (drag-and-drop only) | Major | ✅ Fixed: `PlannerDockPanels.tsx` wires `CatalogRail onItemClick={placeFurnitureItem}`. |
| 4 | `PlannerTopToolbar.tsx` was an unwired duplicate toolbar | Major | ✅ Fixed: `toolbarHandlers` map in `Planner.tsx` wires all 15 toolbar items. |
| 5 | Ctrl+K command palette desynced with `aiOpen` state | Major | ✅ Fixed: `PlannerCommandPalette` mounted independently of AI panel. |
| 6 | 390px Place-furniture step: 0-width canvas, garbled chrome, unreachable Auto-arrange | Blocker | Open |
| 7 | AI panel does not close on Escape | Major | ✅ Fixed: `PlannerAiPanel.tsx` added document `keydown` -> Escape -> `onClose()`. |
| 8 | Refresh loses active project binding | Major | ✅ Fixed: `Planner.tsx` uses `PLANNER_LAST_PROJECT_KEY` localStorage fallback. |
| 9 | `PlannerProjectMenu.tsx` is orphaned dead code | Minor | Open |

## Verified healthy

- Catalog search/filter work (16 guest items; "chair" narrows to 3).
- Zoom controls precise: 94% -> 136% -> 79% -> 100%.
- Pan tool gives correct `grab` cursor feedback.
- Wall drawing creates exactly one new layer at dragged coordinates.
- Snap toggle flips `data-active` and status label.
- Selection + rotation via Properties panel work.
- Right-click context menu appears with a selection present.
- Multi-item drag-and-drop placement works (0 -> 2 layers).
- Project delete: real confirm, toast, card gone within 1.5s and after reload.
- Save -> appears correctly in `/ooplanner/projects`.
- Sketch-to-plan upload affordance discoverable; `accept` scoped to png/jpeg/webp.
- Workflow-bar forward-skip warning is honest and walks steps in order.
- No icon-only button missing both `aria-label` and `title` in checked set.
- No hardcoded hex colors in `site/components/Planner/` or `site/focss/planner/`.
- `scan:boundaries` OK, zero cross-product edges.

## Deferred coverage

Not exercised with interacted-journey evidence: true unauthenticated guest behavior, multi-room plans, wall post-draw editing, multi-select, offline sync, custom furniture upload round-trip, sketch-to-plan processing round-trip, 100+ item performance, route bundle weight, `PlannerScene3D` dock tab.

## WRK-S09 (2026-08-10) — partial

Member client load/save no longer relies on `DEV_AUTH_BYPASS` to skip CSRF
(`plannerApi` → `browserApiFetch`). Guest cookie path unchanged. Slice stays
**OPEN** until preview e2e with real member session + `DEV_AUTH_BYPASS=0`
writes `results/planner/audit-3b-supabase/` (audit-3b suite is still guest-entry).

## Handover -> 3b (proposed priority)

1. Blocker #1 — Undo/Redo history.
2. Blocker #2 — BOQ dock panel mount.
3. Blocker #6 — 390px Place-furniture narrow viewport.
4. Major #9 — owner decision on `PlannerProjectMenu.tsx` (see WRK-S14 — wired).
5. Deferred list above as time allows.

## Sign-off

Not owner-signed. Deferred to end-of-work combined review.