# UI Audit â€” Desktop + Mobile (File 1 of 5)

**Tracks:** 1 (UI Desktop), 2 (UI Mobile)
**Agent:** A
**Report outputs:** `agent-reports/audit/01-ui-desktop.md`, `agent-reports/audit/02-ui-mobile.md`

---

## Scope

Route-by-route audit of chrome, layout, panels, and interaction across desktop (â‰¥1280px) and mobile (<768px phone, 768â€“1280px tablet).

**Routes (from `docs/architecture/routes.md`):**
- Marketing: `/`, `/about`, `/products`, `/products/*`, `/solutions`, `/showrooms`, `/contact`, `/clients`, `/planner`, `/planner/features`, `/planner/help`, `/service`, `/downloads`
- Tools: `/ooplanner`, `/ooplanner/projects`, `/ooplanner/projects/[id]`, `/oostudio`
- Member: `/portal`, `/portal/*`, `/dashboard`, `/access`, `/login`
- Admin: `/admin`, `/admin/plans`, `/admin/catalog`, `/admin/customer-queries`, `/admin/price-books`, `/admin/inventory`, `/admin/workspace-catalog`
- Edge: `/offline`

## Method

- Dev server: `http://localhost:3000` (DEV_AUTH_BYPASS=1). Never `127.0.0.1`.
- Playwright via `scripts/with_server.py` (webapp-testing skill) OR against the running dev server.
- Viewports: desktop 1440Ã—900, 1920Ã—1080; tablet 820Ã—1180 (iPad); phone 390Ã—844 (iPhone 14), 360Ã—740.
- Wait for `networkidle` + fonts (`document.fonts.ready`) before screenshots/metrics.
- Per route: full-page screenshot + viewport screenshot, DOM landmark dump, console capture.

## Desktop findings checklist (Track 1)

- SiteHeader consistency across marketing routes (logo, nav, search, mega-menu, auth link, language switcher).
- Planner/Studio top chrome + dockview panel layout; canvas stage sizing; overflow.
- Admin shell (`.shell-admin-layout` grid: topbar + sidebar + main); table density; filter/sort controls.
- Portal/dashboard layout; empty/loading/error states.
- Horizontal scroll / overflow at 1440 and 1920.
- Z-index stacking (header, mega-menu, modals, planner dockview, studio layers).
- FOCSS token usage (`--surface-*`, `--text-*`, `--border-soft`, `--radius-*`); spot any hardcoded colors/sizes.
- Typography rhythm; focus rings visible.

## Mobile findings checklist (Track 2)

- Marketing header hidden <1280; bottom tab bar presence (Home/Catalog/Planner/Studio/Account) â€” note: current state pre-Phase-1, may still be old hamburger drawer.
- MobileNavDrawer contents (search + accordion + auth + language + CTAs vs simplified).
- Planner canvas-first: full-screen canvas, bottom-sheet panels, Save/Export/BOQ thumb reach.
- Studio mobile shell existence (today: none â€” document gap).
- Safe-area insets (`env(safe-area-inset-bottom)`); home indicator clearance.
- Touch target sizes â‰¥44px; thumb reach for primary actions.
- Horizontal overflow / pinched layouts at 360px.
- Admin mobile two-row topbar + drawer.

## Evidence requirements

- Screenshot path per route per viewport (saved under `results/audit/screenshots/`).
- Console errors/warnings count per route.
- Any overflow: measured `scrollWidth > clientWidth` with values.
- File:line references for every layout gap (e.g., `site/components/Planner/Planner.tsx:120`).

## Severities

- **P0** broken/ unusable on a primary route.
- **P1** layout break or primary action unreachable on a viewport.
- **P2** polish (spacing, alignment, token misuse).
- **P3** nit.

## Out of scope

- Source edits. Visual regression baseline updates. Copywriting.

## Acceptance

- [ ] `01-ui-desktop.md` and `02-ui-mobile.md` written.
- [ ] Every P0/P1 has a screenshot or DOM measurement.
- [ ] No repo source files changed.
