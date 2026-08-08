# Phase 2a ledger — Studio deep interactive audit (`/oostudio`)

**Date:** 2026-08-01 · **Method:** real Playwright interaction at `http://localhost:3000`, viewports 1280×800 and 390×844.  
**Audit script:** `tests/e2e/audit-2a-studio-journey.spec.ts` — 6 cases, all pass.  
**Evidence:** `E:\results\studio\audit-2a\`  
**Status:** findings fixed in phase 2b/2c. Ledger retained for traceability.

---

## Original findings

| # | Issue | Severity | Resolution |
|---|-------|----------|------------|
| 1 | 390px viewport pushed left rail + canvas off-screen | Blocker | Fixed: narrow-viewport collapse in `site/components/Studio/Studio.tsx` / `StudioDockShell.tsx` plus `site/focss/studio/chrome.css` `@media (max-width: 639px)` rule. |
| 2 | Drawn shape not auto-selected | Major | Fixed: `site/components/Studio/Studio.tsx` `onUp`/`onDbl` now calls `c.setActiveObject(drawing)` + `setTool("select")`. |
| 3 | AI panel did not close on Esc | Major | Fixed: `site/components/Studio/ui/StudioFloatingPanel.tsx` added document `keydown` -> `Escape` -> `onClose()`. |
| 4 | `StudioTopToolbar.tsx` was an unwired placeholder | Major | Fixed: added `handlers` prop, wired all buttons in `site/components/Studio/Studio.tsx` via `toolbarHandlers`; removed duplicate topbar file-actions row. |

## 2c polish completed

- Top-bar overflow at 390px resolved.
- Tab order cleaned up (single control set, disabled buttons skipped).

## Deferred coverage

Full interacted-journey evidence was not gathered for: pan/zoom, resize, multi-select, dock float/resize, 3D viewer, AI round-trip, states, performance.

## Sign-off

Owner walkthrough deferred to end-of-work combined review (owner instruction, 2026-08-02).