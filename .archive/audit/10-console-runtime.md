# 10 — Console & Runtime Audit

## Overview
- **Track:** Browser console errors, page errors, failed requests across primary routes.
- **Scope:** Playwright `page.on('console')` + `page.on('pageerror')` + `page.on('requestfailed')` against `http://localhost:3000`.
- **Date:** 2026-08-12.
- **Authority:** `Agents/03-browser.md`, `Testing-handbook.md`, audit-program track 10. Audit only.

## Method
The dev server was already running (`DEV_AUTH_BYPASS=1`, disk mode; `Invoke-WebRequest http://localhost:3000` → `STATUS=200`, PID 13772). **No second server was started.**

1. **Agent A's prior evidence (incorporated, not redone):** `results/audit/console-audit-results.json` (9 routes: `/`, `/products/`, `/ooplanner/`, `/oostudio/`, `/portal/`, `/dashboard/`, `/contact/`, `/showrooms/`, `/admin/`) + per-route `.json`/`.error.json` + `console-*.png` screenshots in `results/audit/`. Agent A waited `networkidle`; several routes timed out at 30 s.
2. **This audit's supplement** for the 3 routes Agent A did not cover: `/products/seating/`, `/ooplanner/projects/`, `/planner/features/measure/`. Script: `results/audit/console/console-capture.mjs` (Playwright `chromium.launch`, `waitUntil:"load"` → best-effort `networkidle` 8 s → `document.fonts.ready` → 1.5 s settle). Per-route JSON → `results/audit/console/<route>.json`; supplement summary → `results/audit/console/supplement-summary.json`.

Classification buckets: hydration mismatch · React key warning · unhandled rejection · 404 on asset/route · CSP violation · deprecated API.

## Findings

### 1. [P2] `toolautosubmit` non-boolean DOM-attribute warning on 6 routes (site-wide)
React warns `Received 'true' for a non-boolean attribute 'toolautosubmit' … pass a string instead` on `/`, `/products/`, `/contact/`, `/showrooms/` (Agent A) and `/products/seating/`, `/planner/features/measure/` (this audit). Source: `site/components/site/HeaderSearchPanel.tsx:61` and `site/components/site/MobileNavDrawer.tsx:269` render `toolautosubmit` (a boolean) onto a DOM element; type declared at `site/types/webmcp.d.ts:14` (`toolautosubmit?: boolean | ""`). Because the header renders across every marketing route, this fires on most pages. Lighthouse's `errors-in-console` audit independently flagged it on `/contact/` and `/showrooms/` (`results/audit/lighthouse/extracted-metrics.txt`). It is a console error (not a warning), so it counts against any console-error gate and the ui-polish audit (25/51 checks “with issues”, all `console errors: 1`). Evidence: `results/audit/console/products-seating.json` (msg index 2), `results/audit/console/planner-features-measure.json` (index 2), `results/audit/console-audit-results.json` (`/`, `/products/`, `/contact/`, `/showrooms/`).

### 2. [P1] `/showrooms/` page error: `Cannot read properties of null (reading 'removeChild')` ×2 — hydration / DOM-mutation mismatch
Agent A's capture (`results/audit/console-audit-results.json` showrooms block): two `TypeError: Cannot read properties of null (reading 'removeChild')` page errors, then a `networkidle` 30 s timeout (route marked `nav-failed`). This is the classic React-removed-a-node-that-something-else-also-removed signature — a hydration mismatch or a GSAP/animation library mutating the DOM out from under React (this repo's dominant animation layer is GSAP, 31 files — `docs/architecture/stack.md` §4). It is a real runtime defect on a primary marketing route, not a dev artifact.

### 3. [P2] `/ooplanner/projects/` returns two HTTP 401 (Unauthorized) in DEV_AUTH_BYPASS mode
`results/audit/console/ooplanner-projects.json`: two `Failed to load resource: the server responded with a status of 401 (Unauthorized)` console errors, HTTP 200 for the page itself. `/api/Planner/projects` is a `member`-gated route (`docs/architecture/routes.md`). With `DEV_AUTH_BYPASS=1`, `withAuth` is supposed to short-circuit — but the client-side fetch to the projects list is still getting 401. This suggests the bypass is not applied to the client fetch path (cookie not set / fetch not sending the bypass identity), or the projects-list call hits a path the bypass does not cover. The route loads (200) but the project list is empty/unauthorized. Evidence: `results/audit/console/ooplanner-projects.json` (msg indices 4–5).

### 4. [P2] `/products/seating/` 404 on a resource
`results/audit/console/products-seating.json`: `Failed to load resource: the server responded with a status of 404 (Not Found)` (msg index 3), page HTTP 200. The console message does not name the URL (the capture records `console` text, not the failed response's URL). Likely a missing image/asset or an API 404 on the seating category page. Needs the specific URL — a `page.on('response')` capture would resolve it; flagged for follow-up.

### 5. [P3] `/contact/` failed request: `/api/nav-categories/` → `net::ERR_ABORTED`
Agent A (`results/audit/console-audit-results.json` contact block, `requestFailed`): `GET http://localhost:3000/api/nav-categories/` failed `net::ERR_ABORTED`. `/api/nav-categories` is a real GET route (`routes.md`). `ERR_ABORTED` (not 4xx/5xx) typically means the request was cancelled by navigation/React unmount — common when a component unmounts before the fetch resolves. Low severity but worth confirming the nav-search/categories fetch isn't silently dropping.

### 6. [P3] `/oostudio/` failed request: `?_rsc=…` → `net::ERR_ABORTED` (RSC prefetch, benign dev)
Agent A (oostudio block, `requestFailed`): `GET http://localhost:3000/oostudio/?_rsc=O7EaQBA_Kt9ZBNSq` → `net::ERR_ABORTED`. This is a React Server Component prefetch aborted during dev HMR — benign in dev, not a production signal.

### 7. [P3] `/products/` + `/showrooms/` `networkidle` navigation timeouts (Agent A)
Agent A marked both `nav-failed` (`page.goto: Timeout 30000ms exceeded … waiting until "networkidle"`). The dev server's HMR polling + client-side data fetching keep the network busy so `networkidle` never settles. This audit's supplement script used `waitUntil:"load"` + a bounded 8 s `networkidle` wait, which is why `/products/seating/` captured cleanly (200, 8 console msgs, 0 page errors). The timeouts are a dev-mode artifact, not a runtime defect — but they mean Agent A's `/products/` and `/showrooms/` console sets are partial (captured before the timeout).

### 8. [P3] `[Fast Refresh] done in 1786450170494ms` on `/showrooms/` — dev-only numeric overflow
`results/audit/console-audit-results.json` showrooms console msg: a Fast Refresh duration reported as ~1.78 trillion ms. A Next dev HMR timing overflow artifact; harmless, dev-only.

### 9. [PASS] No hydration-mismatch "Hydration failed" text, no React-key warnings, no CSP violations, no unhandled rejections on the captured routes
Across both Agent A's 9 routes and this audit's 3 routes: zero `Hydration failed` / `did not match` text, zero `Each child in a list should have unique key` warnings, zero CSP violation reports, zero unhandled promise rejections. The one DOM-related page error is the showrooms `removeChild` (Finding 2) which is a mutation/timing error rather than a server/client render mismatch. The benign `React DevTools` info banner and `[HMR] connected`/`[Fast Refresh]` logs are dev-only noise.

## Deferred
- The specific 404 URL on `/products/seating/` (Finding 4) — a `page.on('response')` capture (status ≥ 400) is needed to name the asset/route. Not re-run here to avoid re-capturing Agent A's set.
- `/planner/features/measure/` and `/ooplanner/projects/` network response bodies — only console text + pageerror + requestfailed were captured per the method.
- A production build console pass (`pnpm build && pnpm start`) — dev console has HMR/React-DevTools noise a prod build would not; the `toolautosubmit` warning and showrooms `removeChild` would still appear.

## Changed files
None (audit only). (A Playwright script was written under `results/audit/console/` — evidence, not source.)

## Blockers (proposed `Failures.md` rows — not applied)

| id | priority | blocker | evidence | owner action |
|----|----------|---------|----------|--------------|
| CR-1 | P1 | `/showrooms/` throws `TypeError: Cannot read properties of null (reading 'removeChild')` ×2 (hydration/DOM-mutation mismatch) | `results/audit/console-audit-results.json` showrooms `pageErrors` | Find the component whose DOM node is removed out-of-band (likely GSAP/animation vs React); stabilize render or gate the mutation |
| CR-2 | P2 | `toolautosubmit` boolean passed to a non-boolean DOM attribute — console error on every marketing route (6+ confirmed) | `site/components/site/HeaderSearchPanel.tsx:61`, `site/components/site/MobileNavDrawer.tsx:269`; Lighthouse `errors-in-console` audit (`results/audit/lighthouse/extracted-metrics.txt`) | Pass `toolautosubmit=""`/`undefined` or use a `data-` attribute; drop the boolean-to-DOM render |
| CR-3 | P2 | `/ooplanner/projects/` client fetch gets 401 even with `DEV_AUTH_BYPASS=1` | `results/audit/console/ooplanner-projects.json` (two 401s) | Verify the bypass identity reaches the `/api/Planner/projects` client fetch (cookie/CSRF); confirm the projects list loads in bypass mode |
| CR-4 | P3 | `/contact/` `GET /api/nav-categories/` aborted (`net::ERR_ABORTED`) | `results/audit/console-audit-results.json` contact `requestFailed` | Confirm the nav-categories fetch isn't cancelled by unmount; ensure the categories menu resolves |
