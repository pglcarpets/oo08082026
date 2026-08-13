# 11 — Visual Regression & E2E Audit

## Overview
- **Track:** Visual-regression baselines, UI polish/responsive audits, Playwright gate specs, test-integrity audits, two-lane vitest.
- **Scope:** `tests/e2e/site-visual-regression.spec.ts` + baselines; `config/build/playwright.config.ts` + `playwright-gate-specs.json`; `scripts/ui-polish-pass1-audit.mjs`, `scripts/responsive-audit.mjs`; `test:audit:fast/hollow/gate-skips`; `pnpm run test` (both lanes).
- **Date:** 2026-08-12.
- **Authority:** `Agents/03-browser.md` (UI audit scripts NOT gated), `Agents/02-testing.md` + `Testing-handbook.md` (two-lane), audit-program track 11. Audit only.

## Method
1. Read `config/build/playwright.config.ts`, `config/build/playwright-gate-specs.json`; glob `tests/e2e/site-visual-regression.spec.ts-snapshots/**`; read `tests/e2e/site-visual-regression.spec.ts`.
2. `node scripts/ui-polish-pass1-audit.mjs` → `results/ui-polish/pass-1/audit-report.json` + 51 PNGs. Exit 0.
3. `node scripts/responsive-audit.mjs` (scope=all) → `results/responsive-audit-final/{mobile,desktop}/*.png` (+ `audit-results.json`/`summary.txt` on exit). Partial capture noted (`results/audit/regression/responsive-audit-partial.txt`).
4. `pnpm run test:audit:fast` → `results/audit/regression/test-audit-fast.txt` (exit 0).
5. `pnpm run test:audit:hollow` → `results/audit/regression/hollow.txt` (exit 0).
6. `pnpm run test:audit:gate-skips` → `results/audit/regression/gate-skips.txt` (exit 0).
7. `pnpm run test` (both lanes) → `results/tests/vitest-results.json` (default) + `results/tests/vitest-tech-docs-results.json` (tech-docs). Summary → `results/audit/regression/test-summary.txt`. Exit 1.

## Findings

### 1. [PASS] Test-integrity audits are clean: 0 hollow, 0 gate-skips, 0 eslint-disable, api-route-safety ok
- `test:audit:hollow` → `audit-hollow-tests: ok` (exit 0) — `results/audit/regression/hollow.txt`.
- `test:audit:gate-skips` → `audit-gate-skips: ok` (exit 0) — `results/audit/regression/gate-skips.txt`.
- `test:audit:fast` → `audit-hollow-tests: ok`, `audit-eslint-disable: ok`, `audit-api-route-safety: scanned 56 route file(s), 33 mutator route(s) … ok` (exit 0) — `results/audit/regression/test-audit-fast.txt`.
DB8 (0 hollow / 0 gate-skips / 0 unjustified eslint-disable) holds.

### 2. [P2] Visual-regression baselines cover only 6 marketing routes — interactive routes have no VR coverage
`tests/e2e/site-visual-regression.spec.ts-snapshots/` holds 6 PNGs: `wave1-homepage`, `wave1-about`, `wave1-contact`, `wave2-products`, `wave2-solutions`, `wave2-quote-cart` (+ `.gitkeep`). The spec (`site-visual-regression.spec.ts`) snapshots exactly these 6 (`toHaveScreenshot("waveN-…")`) at 1280×800 with `maxDiffPixelRatio 0.02` (from `playwright.config.ts`). Baselines are complete for the routes the spec covers, but **primary interactive routes have zero VR baselines**: `/ooplanner`, `/oostudio`, `/showrooms`, `/dashboard`, `/portal`, `/admin`, `/planner`. So a visual regression on any interactive surface would not be caught. (Note: the gate spec set below does include planner-catalog / planner-chrome / planner-guest-workspace e2e, but those are functional e2e, not pixel VR.)

### 3. [PASS] Playwright config + the 10 gate specs are wired correctly
`config/build/playwright.config.ts`: `testDir "../../tests"`, `testMatch **/*.spec.ts`, single project `chromium` (`devices["Desktop Chrome"]`), `expect.toHaveScreenshot { maxDiffPixelRatio: 0.02, animations: "disabled" }`, `snapshotPathTemplate "{testDir}/{testFilePath}-snapshots/{arg}{ext}"`, `webServer` reuses the running dev server when `DEV_AUTH_BYPASS=1` (`command "pnpm run dev"`, `reuseExistingServer: !isCI`). `config/build/playwright-gate-specs.json` lists the 10 gate specs (version 2): `accessibility`, `admin-smoke`, `planner-catalog`, `planner-guest-workspace`, `planner-custom-tools`, `planner-chrome`, `sketch-to-plan-pipeline`, `planner-offline-sync`, `audit-3b-planner-fixes`, `audit-3c-planner-polish` (`excluded: []`). All 10 spec files exist under `tests/e2e/`.

### 4. [PASS] ui-polish pass-1 audit: 51 checks, 0 hard failures (25 with the toolautosubmit console issue)
`results/ui-polish/pass-1/audit-report.json`: `totalChecks=51` (17 routes × 3 viewports: desktop 1920×1080, laptop 1280×800, phone 390×844), `failed=0`, `withIssues=25`, `ok=26`. All 17 routes returned HTTP 200; `horizontalOverflow=false` on every check; fonts resolved (`bodyFont` helveticaNeue, `h1Font` ciscoSans). The 25 "with issues" are uniformly `console errors: 1` — the `toolautosubmit` warning (Track 10 Finding 1), not a layout defect. 51 screenshots generated. `routesWithIssues` = 13 of 17 (the issue is the header/mobile-nav warning, site-wide). No viewport-specific layout break was found across desktop/laptop/phone.

### 5. [P3] responsive-audit captured partial screenshots (mobile complete, desktop partial)
`node scripts/responsive-audit.mjs` (scope=all) was still running at report time. Captured: `results/responsive-audit-final/mobile/` = **142 PNGs** (mobile 390×844 pass effectively complete across the route set), `results/responsive-audit-final/desktop/` = **26 PNGs** (desktop 1920×1080 pass underway). `audit-results.json` / `summary.txt` are written only on script exit and were absent (script still running) — see `results/audit/regression/responsive-audit-partial.txt`. The mobile screenshots are intact and reviewable; the desktop set + structured JSON are deferred. Per `Agents/03-browser.md` these audit scripts are **not gated**, so the partial capture is evidence, not a gate failure.

### 6. [P2] `pnpm run test` default lane: 17 failures; tech-docs lane JSON STALE — two-lane misread risk is live
`results/audit/regression/test-summary.txt`:
- **Default lane** (`results/tests/vitest-results.json`, fresh 2026-08-12 13:52): 1403 suites, 2563 tests, **17 failed**, 0 skipped (≈99.3 % pass). Failures cluster: **13/17** in `resolvePdpPlanSvgThumb.server` (disk plan-symbol PNG/SVG resolution — `diskPlanSvgExists`, `findLooseDiskPlanPngSlug`, etc.); 2 in `sitePackageRoot.server` (path resolver re-export/resolution); 1 `check-root-markdown-links`; 2 in `app/api/dev-tools/lighthouse/route.ts` (tmp-dir/invalid-name). Pattern points at disk-catalog/path-resolution + dev-tools tmp assumptions, not broad logic regressions — but they are real red tests.
- **Tech-docs lane** (`results/tests/vitest-tech-docs-results.json`, mtime **2026-08-10 21:27 — STALE**): `suites=1, tests=0, pass=0, fail=0, skip=0`. The `pnpm run test` process exited 1 after the default lane and **did not overwrite** the tech-docs JSON (still the Aug-10 placeholder). Therefore the tech-docs lane state for THIS run is **UNKNOWN** — exactly the misread `Testing-handbook.md` / `Agents/02-testing.md` warn about. Do **not** claim the suite is green.

### 7. [P3] Gate specs are not all run by `test:audit:fast` (by design) — the 10 e2e gate specs need a live browser
`test:audit:fast` covers the static integrity audits (hollow / eslint-disable / api-route-safety), exit 0. The 10 Playwright gate specs in `playwright-gate-specs.json` are e2e (need the dev server + Chromium) and were not run in this audit pass (heavy; they belong to `release:gate` / `pnpm run test:planner-catalog` / `test:a11y`). `accessibility.spec.ts` is the axe gate (`benchmarks.md` G3). Their presence + wiring is verified (Finding 3); their pass/fail is deferred.

## Deferred
- A full `pnpm run test:planner-catalog` / `test:a11y` run (the 10 e2e gate specs) — not executed (heavy browser suite; out of audit scope). Baseline their current pass/fail before a release.
- `responsive-audit.mjs` to completion (desktop set + `audit-results.json`/`summary.txt`) — script was still running; mobile set is captured.
- Re-running `pnpm run test` to also capture a fresh tech-docs lane JSON (the default-lane exit-1 short-circuited it).

## Changed files
None (audit only). (The `responsive-audit-partial.txt`, `test-summary.txt`, etc. are evidence under `results/audit/regression/`, not source.)

## Blockers (proposed `Failures.md` rows — not applied)

| id | priority | blocker | evidence | owner action |
|----|----------|---------|----------|--------------|
| VR-1 | P2 | Visual-regression baselines cover only 6 marketing routes; interactive routes (`/ooplanner`, `/oostudio`, `/showrooms`, `/dashboard`, `/portal`, `/admin`) have no pixel VR | `tests/e2e/site-visual-regression.spec.ts` (6 tests); `tests/e2e/site-visual-regression.spec.ts-snapshots/` (6 PNGs) | Add wave-3 baselines for interactive surfaces (or accept the documented exclusion) before gating VR |
| VR-2 | P2 | `pnpm run test` default lane has 17 red tests (13 `resolvePdpPlanSvgThumb.server` disk-res, 2 `sitePackageRoot.server`, 1 docs links, 2 dev-tools/lighthouse) | `results/tests/vitest-results.json`; `results/audit/regression/test-summary.txt` | Triage the disk-catalog/path-resolution cluster; regenerate types/paths as needed |
| VR-3 | P2 | Tech-docs vitest lane JSON is STALE (2026-08-10, suites=1/tests=0); `pnpm run test` did not overwrite it — two-lane misread risk | `results/tests/vitest-tech-docs-results.json` mtime; `results/audit/regression/test-summary.txt` | Re-run the tech-docs lane cleanly; never read one lane summary as the suite |
