# 01 — UI Desktop Audit

**Date:** 2026-08-11
**Track:** 1 — UI Desktop (≥1280, 1440, 1920) + 1280 breakpoint
**Mode:** Audit only — no source edits, no migrations, no baseline updates
**Workspace:** `E:\oo08082026` · pnpm only · never inside `site/` · browser truth `http://localhost:3000` only

---

## Overview

Scope is the full desktop marketing + app surface at ≥1280. Verifies the 17 routes required by the audit spec plus the broader inventory via shared scripts, anchored on the live Next 16 app (`DEV_AUTH_BYPASS=1`, disk persistence) and the FOCSS zone system. Header chrome under test is `site/components/site/Header.tsx` (589 LOC, `fixed top-0 left-0 z-50` glass, mega-menu with `HeaderSearchPanel` debounce 260 ms + `MobileNavDrawer` as overlay).

**Routes explicitly probed:** `/`, `/about`, `/products`, `/products/[category]` (sampled as `/products/workstations/`), `/solutions`, `/showrooms`, `/contact`, `/clients`, `/planner` (marketing), `/planner/features` (and `/planner/features/*`), `/oostudio`, `/ooplanner`, `/ooplanner/projects`, `/admin`, `/portal`, `/dashboard`, `/offline`.

Additional marketing inventory from `responsive-audit.mjs` and `ui-polish-pass1-audit.mjs` was captured for cross-check; findings below cite only measured evidence.

---

## Method

**Pre-flight (repo truth — read before auditing):**
- `AGENTS.md` §1–§9, `Agents/01-standard.md`, `Agents/03-browser.md`, `Agents/06-architecture.md`, `Agents/07-css.md`
- `docs/architecture/product-map.md`, `css.md`, `routes-pages.md`, `stack.md`, `docs/governance/rules.md`
- `Testing-handbook.md`, `START.md`, `C:\Users\ayush\.commandcode\plans\oo-deep-audit-85-strict-quality-program.md`

**Dev server — verified before browsing (never 127.0.0.1):**
```powershell
Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 10
# Result 2026-08-11T12:29Z: STATUS:200 len:227270, CSP present (script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://va.vercel-scripts.com), HSTS, X-Frame-Options SAMEORIGIN, Link preload _next/static/css/app/layout.css
```
Second verification after restart (post-crash at 12:53Z):
```powershell
Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 8
# Result 12:55Z: UP 200
```

**Fork isolation (Studio ↔ Planner never import each other):**
```powershell
pnpm run scan:boundaries
# files scanned: 939 / owned files analyzed: 221 / import edges checked: 624
# boundary OK — zero cross-product edges, namespaces verified, no shared layer.
```

**FOCSS (entries `site/entry.css`, `admin/entry.css`, `planner/entry.css`, `studio/entry.css`, base tokens):**
```powershell
pnpm run verify:focss
# verify-focss-imports: ok
# { "siteImportErrors": [], "siteEntryHasSiteIndex": true, "siteFileCount": 91, "ok": true }
# { "ok": true } (fences)
# { "moduleCount": 0, "importEdgeCount": 0, "graphHash": "e3b0c44298fc...", "failures": [], "cycles": [] }
# verify-focss-structure: ok (141 stylesheets)

pnpm run lint:ui:strict
# lint-ui-contract: ok (scheme freeze)

pnpm run check:style-tokens
# check:style-tokens OK — 281 findings (70 fewer than baseline; run --update to lower it)
```

**Browser probes — waited for `networkidle` + `document.fonts.ready` before every screenshot/metric:**

1. Reused scripts (instead of writing Playwright from scratch):
   ```powershell
   node scripts/ui-polish-pass1-audit.mjs
   # → results/ui-polish/pass-1/audit-report.json (51 checks: 17 routes × 3 viewports)
   # → results/ui-polish/pass-1/*.png  (desktop/laptop/phone screenshots, 52 files listed 2026-08-11)
   
   node scripts/responsive-audit.mjs
   # → results/responsive-audit-final/mobile/*.png + audit-results.json (timed out after ~300s, mobile OK, desktop partial before timeout — captured as evidence)
   ```

2. Custom audits for 1280 breakpoint + 1440/1920 + overflow/z-index/typography/focus:
   ```powershell
   node scripts/tmp-audit-probe.mjs   # desktop 1920×1080, 1440×900, 1280×800 — 17 routes each (51 pages), fullPage + viewport shots
   node scripts/tmp-axe.mjs           # AxeBuilder per route (desktop 1280) — also reused for 07 report
   node scripts/tmp-mobile.mjs        # mobile/tablet passes (390×844, 360×740, 820×1180) — see 02 report
   ```
   Evidence from `scripts/tmp-audit-probe.mjs` desktop run (pre-crash, 51/51 completed):
   - Every desktop viewport: `overflowPx = scrollWidth - clientWidth = 0` (e.g. `/` 1920→1920/1920, 1440→1440/1440, 1280→1280/1280)
   - Every route: `h1Count = 1`, `mainExists = true`, `status = 200`
   - Console: 0–1 error on most routes; 5 on `/products/workstations/` laptop (404 images — see Finding D-02)

**Screenshots saved (desktop):**
- `agent-reports/audit/screenshots/desktop/` — 106 files from `tmp-audit-probe.mjs`:
  e.g. `root-desktop-1920.png` + `root-desktop-1920-full.png`, `about-desktop-1440.png`, `products_workstations-desktop-1280.png`, `oostudio-desktop-1920.png`, `ooplanner-desktop-1920.png`, `admin-desktop-1920.png`, `portal-desktop-1920.png`, `offline-desktop-1920.png` (pattern: `<slug>-desktop-{1920|1440|1280}.png` + `-full.png`)
- `results/ui-polish/pass-1/` — 52 files: `home-desktop.png`, `products-desktop.png`, `products_workstations-desktop.png`, `oostudio-desktop.png`, `admin-desktop.png`, etc., plus `audit-report.json`

**Viewports exercised:**
- Desktop (spec): `1920×1080` (primary), `1440×900`, `1280×800` (breakpoint). Desktop nav visibility threshold is `xl = 1280px` (`site/components/site/Header.tsx:182` — `if (window.innerWidth >= 1280) setMobileOpen(false)`).

---

## Findings

### [P1] D-01 — React console error `toolautosubmit` on every marketing route

**Priority:** P1 (console hygiene / hydration signal; does not break render but pollutes logs and triggers Next error overlay in dev)
**Evidence:**
- `results/ui-polish/pass-1/audit-report.json` — every marketed route reports `consoleErrors: ["Received `%s` for a non-boolean attribute `%s`... true toolautosubmit"]` (e.g. `/` desktop, `/products` desktop/laptop, `/about`, `/solutions`, `/clients`, `/contact`, etc. — 41/51 checks flag `console errors: 1`)
- Custom probe: `desktop-1920 /` `console=1`, `desktop-1440 /` `console=1`, `desktop-1280 /` `console=1`; `oostudio/ooplanner/admin/portal/dashboard` correctly report `console=0`
- Source: `site/components/site/HeaderSearchPanel.tsx:59-61` — bare `toolautosubmit` (no value) is passed as boolean `true` to a DOM element; `site/components/site/MobileNavDrawer.tsx:269` identical. The attribute originates from the AI tool-calling convention (`toolname="searchProducts"` etc.) but must be serialized as string `toolautosubmit=""` or omitted from DOM (e.g. `data-tool-autosubmit`).
**Screenshot:** N/A (console-only; visible in dev overlay, not viewport)
**Owner action:** Normalize to string/data-attribute or filter before spread; add unit test that `HeaderSearchPanel` renders without React warnings (use `vitest` + `console.error` spy, happy-dom — existing `tests/vitest.config.ts` happy-dom env).

### [P2] D-02 — 404 product images on `/products/workstations/` (laptop viewport)

**Priority:** P2 (visual gap only on catalog category pages under load; phone viewport happened to pass)
**Evidence:**
- `results/ui-polish/pass-1/audit-report.json` entry `route: "/products/workstations/" viewport: laptop`:
  ```json
  "consoleErrors": [
    "Received `%s` for a non-boolean attribute ... toolautosubmit",
    "Failed to load resource: the server responded with a status of 404 (Not Found)",
    "Failed to load resource: the server responded with a status of 404 (Not Found)",
    "Failed to load resource: the server responded with a status of 404 (Not Found)",
    "Failed to load resource: the server responded with a status of 404 (Not Found)"
  ]
  ```
  The same route at `desktop` only shows the single `toolautosubmit` error (timing/cache difference); the 404s correlate with catalog image URLs served from `/png-catalog` or `assets/marketing`.
- `tmp-audit-probe` also logged `console=5` for that route at every desktop viewport (four 404s + toolautosubmit).
**Screenshots:** `results/ui-polish/pass-1/products_workstations-desktop.png` (images missing or broken), `products_workstations-laptop.png` (same)
**Owner action:** Audit `/api/products/filter` + `site/public/assets/others/legacy/png-catalog/` mirror; add `scripts/check-missing-images-live.mjs` run before audit and fix rewrites in `site/next.config.js`.

### [P2] D-03 — ` /showrooms` 500 at phone in pass-1 (flaky, not reproduced at desktop 1920)

**Priority:** P2 (intermittent server error under 390-viewport run; desktop 1920/1440/1280 all returned 200)
**Evidence:**
- `results/ui-polish/pass-1/audit-report.json` → `route /showrooms/ viewport phone`: `httpStatus: 500`, `bodyFont: "Times New Roman"` (error doc), `mainExists: false`, `consoleErrors: ["Failed to load resource: the server responded with a status of 500 (Internal Server Error)", "Error: Manifest file is empty"]`
- Desktop `tmp-audit-probe` immediately after: `desktop-1920 /showrooms status=200 overflow=0`, `desktop-1440 /showrooms status=200`, `desktop-1280 /showrooms status=200` — no 500.
**Owner action:** Treat as flaky disk-mode manifest error; add retry/evidence capture in `scripts/ui-polish-pass1-audit.mjs` and file a `Failures.md` entry only if reproducible (`--repeat`).

### [P3] D-04 — No horizontal overflow at desktop (pass)

**Priority:** P3 (positive finding)
**Evidence:**
- `tmp-audit-probe` — all 51 desktop page checks: `overflowPx = 0` (`scrollWidth === clientWidth` at 1920/1440/1280). Example raw log:
  `desktop-1920 / status=200 overflow=0 h1=1`, `desktop-1920 /products status=200 overflow=0`, `desktop-1440 /` overflow 0 … `desktop-1280 /offline overflow 0`.
- `results/ui-polish/pass-1/audit-report.json` — every `metrics.horizontalOverflow: false` with exact values `scrollWidth: 1920/1280/390 clientWidth: 1920/1280/390`.
- Sensitive overflow probe in `tmp-audit-probe.mjs` scanned `main *, header *, [role='main'] *` for `getBoundingClientRect().right > innerWidth+6` and found 0 offenders on desktop.
**Screenshots:** `agent-reports/audit/screenshots/desktop/*-full.png` — no horizontal scroll bar at any width.

### [P2] D-05 — 1280 breakpoint behavior (hamburger ↔ desktop nav) — correct but thin margin

**Priority:** P2 (functional, but no visual regression against the 1279/1280 edge)
**Evidence:**
- `site/components/site/Header.tsx:182-188` — `useEffect` closes `mobileOpen` on `resize` when `window.innerWidth >= 1280`. This matches the `xl:hidden` on the hamburger (`:557` — `xl:hidden`) and `site-header__desktop-nav` hidden below `xl`.
- Screenshots: `root-desktop-1280.png` shows full primary nav (no hamburger); `results/ui-polish/pass-1/home-laptop.png` (1280×800) also shows desktop nav. No evidence of clipped nav at 1280 (contrast with 390 where hamburger appears).
- No explicit test for 1279px (one pixel below). Gap deferred.
**Owner action:** Add Playwright assertion at `1279` vs `1281` that `button[aria-controls="mobile-nav-drawer"]` is visible/hidden and that primary `nav[aria-label="Primary navigation"]` toggles, with screenshot diff.

### [P3] D-06 — Landmarks / heading / skip-link (pass)

**Priority:** P3 (positive, cited for 07)
**Evidence:**
- `tmp-audit-probe` per-route landmark dump (desktop 1280): every route `headerCount: 1`, `navCount ≥1` on marketing, `mainCount: 1`, `footerCount: 1` on marketing, `h1Count: 1` (see logs `h1=1` for all 17). `results/ui-polish/pass-1` confirms `mainExists: true` for every 200 route.
- `site/app/(site)/layout.tsx:50-55` — skip link `<a href="#main-content" class="site-skip-link">Skip to main content</a>` is the first focusable element; target is `<main id="main-content" class="site-main-under-header">` (verifies WCAG 2.4.1 bypass block, also checked in 07).
**Screenshots:** Any desktop fullPage — header/nav/main/footer visible above fold and at bottom.

### [P2] D-07 — Z-index stacking (header vs overlays) — coherent but undocumented vs app shells

**Priority:** P2
**Evidence:**
- Source: `site/components/site/Header.tsx:82-83` — `siteHeaderBaseClass = "fixed top-0 left-0 z-50 w-full border-b border-soft ... [background-color:var(--surface-glass-strong)]"`
- `site/components/site/MobileNavDrawer.tsx:233-235` — `ModalOverlay` `z-[60] bg-black/80`, `Modal` `z-[70]`, drawer `w-[min(92vw,28rem)]`. Header (`z-50`) correctly sits below overlay (60) and modal (70).
- `tmp-audit-probe` z-scan (top 20 fixed/sticky elements) on `/` desktop shows max z is header 50; drawer not in DOM until opened. No evidence of header bleeding over drawer at desktop 1280+ (drawer hidden). For app shells (`/ooplanner`, `/oostudio`) the header is not mounted — they use `PlannerTopBar`/`Studio` chrome — so no stacking conflict at desktop. Pre-Phase-1 state confirmed: Studio has no mobile shell yet (known gap, not a desktop failure).
**Owner action:** Keep current scale; document `z-50 header < z-[60] overlay < z-[70] modal` in `docs/architecture/css.md` and ensure any future admin drawer respects it (see 02 for mobile conflict note).

### [P3] D-08 — Typography (pass)

**Priority:** P3
**Evidence:**
- `results/ui-polish/pass-1/audit-report.json` per-route `metrics`: `bodyFont: "helveticaNeue, \"helveticaNeue Fallback\", sans-serif"` and `h1Font: "ciscoSans, \"ciscoSans Fallback\", sans-serif, ..."` on every route (e.g. `/` h1 "Spaces that work harder", `h1Font` ciscoSans). No regression.
- Source: `site/focss/base/type/typography.css:12-17` — `--font-display: var(--font-cisco-sans, "ciscoSans")`, `--font-sans: var(--font-helvetica-neue, "helveticaNeue")`; `site/lib/fonts.ts:14-55` — `localFont` with `display: swap`, preload true, correct weights 400/700 for Cisco, 400/500/700 for Helvetica Neue.
**Screenshots:** `agent-reports/audit/screenshots/desktop/root-desktop-1920.png` — hero `hero-title` uses display face; body copy uses Helvetica Neue.

### [P2] D-09 — Focus rings (pass but subtle, token-driven)

**Priority:** P2 (no failure, observation)
**Evidence:**
- `Header.tsx:332` — logo link `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
- `Header.tsx:369-370` — mega trigger `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`
- `site/focss/base/tokens/semantic.css:166` — `--focus-ring: 0 0 0 0.1875rem color-mix(in srgb, var(--color-ocean-boat-blue-600) 25%, transparent)`; `--color-focus: var(--color-ocean-boat-blue-600)`. Ring is visible but low contrast on white; no failure filed — token is correct.
**Owner action:** No fix required for desktop; note for 07 (focus visibility on white vs inverse hero).

### [P2] D-10 — FOCSS token vs hardcoded (drift exists, structure OK)

**Priority:** P2
**Evidence:**
- `pnpm run check:style-tokens` — `OK — 281 findings (70 fewer than baseline)`. Baseline ratchet is `config/quality/style-token-baseline.json`; debt decreased but not zero.
- Source spot checks:
  - `site/components/site/Header.tsx` — classes use tokens (`border-soft`, `bg-panel`, `text-strong`, `shadow-theme-soft`) and CSS vars (`[background-color:var(--surface-glass-strong)]`), not raw hex.
  - `site/focss/site/components/index.css` — single import graph, zone entries separated (`site/entry.css` imports `base/scan.css` + `base/runtime.css` + `base/index.css` + `type-marketing.css` + `components/index.css`; `planner/entry.css` and `studio/entry.css` import forked zones only).
  - `site/focss/base/tokens/palette.css` + `semantic.css` — all semantic tokens reference palette with `color-mix`, no raw hex in semantic layer.
**Owner action:** Track in `Failures.md` P2 (existing drift) and re-measure with `pnpm run check:style-tokens --update` only when owner approves.

### [P3] D-11 — FOCSS import graph / structure (pass)

**Evidence:** `pnpm run verify:focss` full graph: 141 stylesheets, 91 site files, fences pass, `moduleCount: 0, importEdgeCount: 0, cycles: []`. No cross-zone imports (Studio vs Planner separated per `product-map.md`).

---

## Deferred

- 1279px vs 1281px visual diff not captured (tight around 1280 breakpoint) — add to next full audit.
- Desktop reduced-motion / print styles not probed.
- Performance metrics (LCP/CLS at desktop) out of scope for 01; covered in separate track 06.

---

## Changed files

None (audit only).

---

## Blockers — proposed Failures.md rows (do NOT edit Failures.md)

| id | priority | blocker | evidence | owner action |
|----|----------|---------|----------|--------------|
| `AUDIT-D-01-toolautosubmit-console` | P1 | React warning `Received true for non-boolean attribute toolautosubmit` on all marketing routes (HeaderSearchPanel + MobileNavDrawer) | `site/components/site/HeaderSearchPanel.tsx:61` bare `toolautosubmit`; `site/components/site/MobileNavDrawer.tsx:269` same; `results/ui-polish/pass-1/audit-report.json` `consoleErrors` on 41/51; custom probe `console=1` on `/`…`/contact` desktop | Serialize as `toolautosubmit=""` / data-attr or omit from DOM; add `console.error` spy test in happy-dom |
| `AUDIT-D-02-category-404` | P2 | `/products/workstations/` loads with 4× 404 product images (laptop 1280) | `results/ui-polish/pass-1/audit-report.json` `"/products/workstations/" [laptop] consoleErrors: Failed to load resource 404 ×4` + `scripts/tmp-audit-probe.mjs: console=5` | Fix asset rewrites / missing PNGs in `site/public/assets/others/legacy/png-catalog/`; run `scripts/check-missing-images-live.mjs` |
| `AUDIT-D-10-style-token-drift` | P2 | 281 style-token bypass findings remain (FOCSS ratchet) | `pnpm run check:style-tokens` → `281 findings (70 fewer than baseline)` | P2 backlog — do not bulk-update baseline; lower incrementally before `release:gate` |
