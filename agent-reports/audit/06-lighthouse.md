# 06 — Lighthouse + Performance Audit

## Overview
- **Track:** Core Web Vitals, bundle, fonts, images, Web-Vitals reporters.
- **Scope:** Lighthouse mobile on `/`, `/products/`, `/ooplanner/`, `/oostudio/`, `/contact/`, `/showrooms/` + desktop `/`; production bundle chunk analysis; `SiteAnalytics.tsx`, `next/font`, `next/image` config.
- **Date:** 2026-08-12.
- **Budgets** (`docs/governance/benchmarks.md` §1): LCP ≤ 2.5 s · INP ≤ 200 ms · CLS ≤ 0.1. Declared but **NOT gated today** (audit-program: “Audit Lighthouse in Phase A, fix P0s, gate in Phase C”). `benchmarks.md` §7: no claim of *field* CWV — real-user p75 needs telemetry this programme does not install.

## Method
1. Dev server verified: `Invoke-WebRequest http://localhost:3000` → `STATUS=200` (PID 13772, `DEV_AUTH_BYPASS=1` disk mode).
2. Lighthouse 13.4.1 (`npx --yes lighthouse`) with `--chrome-flags=--headless=new --no-sandbox --disable-gpu --form-factor=mobile --throttling-method=devtools --only-categories=performance,accessibility,best-practices,seo` per route. JSONs → `results/audit/lighthouse/<route>-mobile.json`; summary → `results/audit/lighthouse/summary.json`; metrics extract → `results/audit/lighthouse/extracted-metrics.txt`.
3. Build bundle: `pnpm run build:site` was attempted but **killed** — the production `next build` writes to `site/.next`, the same dir the running dev server uses; mid-build `Invoke-WebRequest http://localhost:3000` timed out. A production build was already on disk (`site/.next/BUILD_ID = taYgRZQo59Y8fxfahLATH`, `site/.next/standalone/` present), so its compiled chunks under `site/.next/static/chunks/` were inspected instead. Raw sizes → `results/audit/lighthouse/top-chunks-raw.txt`; gzip sizes (node `zlib.gzipSync`) → `results/audit/lighthouse/top-chunks-gzip.txt`. Full note → `results/audit/lighthouse/build.txt`.
4. Grep `site/` for `onLCP|onINP|onCLS|reportWebVitals|web-vitals` (reporters) — 3 hits, all false positives (`onInput` substring). Read `site/components/site/SiteAnalytics.tsx`, `site/lib/fonts.ts`, `config/build/next.config.js`. Grep `site/components` for raw `<img `.

Files inspected: `SiteAnalytics.tsx`, `lib/fonts.ts:1-45`, `config/build/next.config.js` (`images`, `experimental.optimizePackageImports`, `serverExternalPackages`), `components/site/MarketingImage.tsx`, `components/site/EditorialHeroMedia.tsx:5`, `components/Planner/PlannerCatalogRail.tsx:139`, `components/Planner/PlannerAutoArrangeDialog.tsx:158`, `components/Planner/PlannerProjectsList.tsx:81`.

## Findings

### 1. [P1] LCP far exceeds the 2.5 s target on every measured route (dev-mode numbers)
Mobile Lighthouse LCP (`results/audit/lighthouse/summary.json`): `/` = **20.1 s**, `/oostudio/` = **18.6 s**, `/showrooms/` = **15.0 s**, `/contact/` = **14.5 s** — all ~6–8× the 2.5 s budget. FCP similarly 12.8–18.2 s; TBT 147 ms (oostudio) to 2866 ms (`/`). Perf scores 0.26–0.38. **Context:** these are *dev-server* numbers — `main-app.js` is served unminified at **3.09 MB** (`extracted-metrics.txt` top transfers) plus per-route dev chunks (`oostudio/page.js` 1.88 MB, `showrooms/page.js` 1.05 MB, `not-found.js` 944 KB). The audit-program explicitly expects this (“Lighthouse gate will initially fail — LCP/fabric”); `benchmarks.md` requires instruments run with `DEV_AUTH_BYPASS` unset (production path). A production build is required for real CWV — see Finding 3. Not a false alarm, but not a production measurement either.

### 2. [P2] `/oostudio/` CLS = 0.30 — exceeds the 0.1 target
`summary.json` oostudio-mobile `cls=0.300488553790677` — 3× the 0.1 CLS budget. Other measured routes are within budget: `/` CLS=0, `/contact/` CLS=0.0003, `/showrooms/` CLS=0. Likely cause is late-layout canvas/images in the Studio shell (raw `<img>` without dimensions — Finding 7). Dev-mode LCP/CLS together; the CLS is the more trustworthy signal (layout shift is less affected by dev minification than LCP).

### 3. [PASS] No production JS chunk exceeds 250 KB gzip on the primary route
Production build chunks (`results/audit/lighthouse/top-chunks-gzip.txt`): largest single chunk = **102.8 KB gzip** (`f7d19238-*.js`, 322.5 KB raw); next: 88.1 KB, 71.1 KB, 64.8 KB, 61.8 KB, 58.8 KB (framework), 58.3 KB, 44.5 KB, 43.9 KB, 41.3 KB (main), 38.7 KB (polyfills), 28.7 KB (`app/oostudio/page`). **No single chunk > 250 KB gzip.** Aggregate route First-Load JS is the sum of several of these (framework + main + shared + page), but the >250 KB-gzip *single-chunk* finding is negative. Fresh `build:site` stdout (route First-Load table) deferred — see `build.txt`.

### 4. [P1] No Web-Vitals reporters (onLCP/onINP/onCLS) — CWV cannot be gated or observed
`SiteAnalytics.tsx` mounts only `@vercel/analytics` `<Analytics>` + `@vercel/speed-insights` `<SpeedInsights>`, both consent-gated via `hasAnalyticsConsent` (`beforeSend` returns `null` without consent). There is **no `web-vitals` import, no `reportWebVitals`, no `onLCP`/`onINP`/`onCLS`** anywhere in `site/` (grep returned 3 hits, all the `onInput` substring in `customerQuerySchema.ts:82`, `workstationFamilyRelease.ts`, `workspaceConfigurationRepository.server.ts` — false positives). Vercel Speed-Insights does collect field CWV server-side, but there is no in-app RUM reporter and no lab INP. Lighthouse lab INP returned `n/a` on all routes (no interaction performed). Consequence: the LCP/INP/CLS budgets in `benchmarks.md` are declared but **neither measured in-app nor gated** — matching the audit-program note that the perf gate is audit-first, gate-later.

### 5. [PASS] `next/font` uses `display:"swap"` + preload
`lib/fonts.ts`: `ciscoSans` (`:18`, two woff2 weights) and `helveticaNeue` (`:33`, three weights) are `localFont` with `display: "swap"`, `preload: true`, `fallback: ["sans-serif"]`. Mounted in `app/layout.tsx`. The Lighthouse `font-display` audit returned `undefined` (dev mode, audit did not fire), but the source is correct.

### 6. [PASS] `next/image` config is sound; raw `<img>` confined to Planner islands (by design)
`config/build/next.config.js`: `images.formats=["avif","webp"]`, `qualities=[75,85]`, `dangerouslyAllowSVG:false`, `remotePatterns` = `*.supabase.co/storage/v1/object/public/**` + first-party asset host + CDN. `unoptimized` is `false` in production (`VERCEL_ENV==="production"`). `MarketingImage.tsx` wraps `next/image`; `EditorialHeroMedia.tsx:5` imports `MarketingImage`. Raw `<img>` appears only in Planner islands — `PlannerCatalogRail.tsx:139` (`loading="lazy"`, no width/height), `PlannerAutoArrangeDialog.tsx:158` (no lazy, no dimensions), `PlannerProjectsList.tsx:81` (no dimensions) — matching the audit brief.

### 7. [P2] Raw `<img>` without width/height in Planner islands → CLS risk
`PlannerAutoArrangeDialog.tsx:158` and `PlannerProjectsList.tsx:81` render `<img>` with **no explicit width/height** (PlannerCatalogRail:139 at least sets `loading="lazy"`). Per CWV, dimensionless `<img>` causes layout shift (the oostudio CLS=0.30 in Finding 2 is consistent with this). These are catalog thumbnails in the canvas/dock islands; acceptable as raw `<img>` (not next/image) per the brief, but they should carry fixed dimensions to suppress CLS.

### 8. [P2] `/products/` and `/ooplanner/` Lighthouse runs timed out — no metrics
`summary.json`: `products-mobile` and `ooplanner-mobile` returned `perf=null` (all categories null). The page never reached a stable loadable state within `--max-wait-for-load=60000` in dev mode — consistent with Agent A's console capture where `/products/` and `/showrooms/` hit `networkidle` timeouts (HMR polling + client-side data fetch keep the network busy). These two routes are effectively unmeasured by Lighthouse today.

### 9. [P3] Desktop Lighthouse run on `/` produced no JSON
`summary.json` `root-desktop`: `error:"no-json"` — the 7th run (desktop preset) did not write a result file, likely a Chrome/Lighthouse resource exhaustion after 6 mobile runs. Mobile `/` data (perf=0.26, LCP=20.1s) stands as the homepage measurement.

### 10. [PASS] Lighthouse `errors-in-console` audit cross-validates the `toolautosubmit` console warning
`extracted-metrics.txt`: the `errors-in-console` audit flagged `Received 'true' for a non-boolean attribute 'toolautosubmit' …` on `/contact/` and `/showrooms/` mobile. This is the same warning Track 10 captured via `page.on('console')`, sourced at `site/components/site/HeaderSearchPanel.tsx:61` and `MobileNavDrawer.tsx:269`. (Lighthouse best-practices score still 0.96–1.0; it is a console-error audit, not a hard fail.)

## Deferred
- A clean fresh `pnpm run build:site` stdout (route First-Load JS table) — must be captured when the dev server can be stopped (it shares `site/.next`). The existing `BUILD_ID` build was inspected instead; chunk artifacts are valid. See `results/audit/lighthouse/build.txt`.
- Field CWV (real-user p75) — `benchmarks.md §7` explicitly does not claim it; no RUM installed.
- Production-mode Lighthouse (against `pnpm build && pnpm start`) for true CWV — not run (browser truth is the dev server per task).

## Changed files
None (audit only).

## Blockers (proposed `Failures.md` rows — not applied)

| id | priority | blocker | evidence | owner action |
|----|----------|---------|----------|--------------|
| LH-1 | P1 | No Web-Vitals reporters (`onLCP`/`onINP`/`onCLS`, no `web-vitals` import); CWV budgets declared but neither measured in-app nor gated | `site/components/site/SiteAnalytics.tsx` (only @vercel/analytics + speed-insights); grep 0 real hits | Add a `reportWebVitals`/`onLCP/onINP/onCLS` reporter (or gate on Speed-Insights field data) before a perf gate |
| LH-2 | P1 | LCP exceeds 2.5 s on all measured routes (dev 14.5–20.1 s); perf 0.26–0.38 | `results/audit/lighthouse/summary.json`; `extracted-metrics.txt` | Re-measure against a production build; the dev server is not a production CWV source |
| LH-3 | P2 | `/oostudio/` CLS = 0.30 (> 0.1 budget); raw `<img>` without width/height in planner islands | `summary.json` oostudio-mobile `cls`; `PlannerAutoArrangeDialog.tsx:158`, `PlannerProjectsList.tsx:81` | Add explicit dimensions to planner-island `<img>`; fix late-layout shift in Studio shell |
| LH-4 | P2 | `/products/` + `/ooplanner/` Lighthouse timed out (no metrics); pages do not stabilize in dev within 60 s | `summary.json` products/ooplanner `perf=null` | Investigate client-side fetch + HMR keeping network busy; re-measure in prod |
