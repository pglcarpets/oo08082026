# OO Deep Audit — Master Summary

**Date:** 2026-08-12
**Repo:** `E:\oo08082026`
**Phase A complete:** 11 track reports + this summary in `agent-reports/audit/` (`.md`-only). Raw evidence (256 files: 179 PNG, 30 JSON, 26 TXT, 19 HTML, 1 XML, 1 MJS) under `results/audit/`.
**Authority:** user > live code + fresh commands > AGENTS.md. All findings evidence-backed (file:line, command output, screenshot, axe/Lighthouse JSON). No source files changed. `Failures.md` not edited — proposed rows below.

---

## Cross-track P0/P1 findings (the real blockers)

Ordered by impact. Each appears in 2+ tracks — cross-references shown.

### P1-1 · `POST /api/exports` — un-gated mutating route + raw disk write
- **Tracks:** 04-security (4.1), 09-api-safety (9.1), 05-database (P2)
- **Evidence:** `site/app/api/exports/route.ts` — no `withAuth`, no CSRF, no rate-limit; `exportsStore.ts` imports no mode selector → raw disk write that fails on prod read-only FS (K10 / AGENTS.md §5 violation).
- **Why P1:** mutates + writes disk in a prod-reachable path; edge cookie-check is the only gate.
- **Proposed Failures.md:** `AUDIT-EXPORTS-01` P1 — gate `/api/exports` with `withAuth({role:"member",requireCsrf:true,rateLimitScope:"exports"})` + route through a mode-aware wrapper.

### P1-2 · `<html lang="en">` hardcoded — locale never reflected
- **Tracks:** 08-i18n (8.1), 03-seo (3.3)
- **Evidence:** `site/app/layout.tsx` hardcodes `lang="en"`; `(site)/layout.tsx` calls `getSiteLayoutContext()` (returns `lang` via `getHtmlLang`) but drops the field. `site/lib/i18n/htmlLang.ts` `HTML_LANG_BY_LOCALE` exists but is unwired.
- **Proposed Failures.md:** `AUDIT-I18N-01` P1 — wire `lang` from `getSiteLayoutContext()` to `<html>`.

### P1-3 · `/showrooms/` hydration / DOM-mutation crash
- **Tracks:** 10-console (P1), 02-mobile / 01-desktop (rendered)
- **Evidence:** `pageerror` `removeChild` ×2 on `/showrooms/` — DOM mutated before hydration completed. Console JSON at `results/audit/console/showrooms.json`.
- **Proposed Failures.md:** `AUDIT-SHOWROOMS-01` P1 — find the effect mutating the DOM pre-hydration; gate behind `useEffect`/`suppressHydrationWarning`.

### P1-4 · `toolautosubmit` React warning site-wide
- **Tracks:** 10-console (P2), 01-desktop (D-01)
- **Evidence:** non-boolean DOM attribute warning on 6+ routes; `site/components/site/Header.tsx:61` (`HeaderSearchPanel`) + `site/components/site/MobileNavDrawer.tsx:269`. `results/ui-polish/pass-1/audit-report.json` 41/51 routes console errors.
- **Proposed Failures.md:** `AUDIT-TOOLAUTOSUBMIT-01` P1 — fix the non-boolean prop (likely `autoSubmit` on a form/input).

### P1-5 · Hero color-contrast fail (WCAG AA)
- **Tracks:** 07-accessibility (A-01), 03-seo (affects crawling trust)
- **Evidence:** axe `color-contrast serious` on `/` hero "Browse products" — `#f8fafc` on `#9D876C` = 3.28:1 (needs 4.5:1). Source `--color-bronze-400 #9D876C` at `site/focss/base/tokens/palette.css:75`. `results/audit/a11y/root.json`.
- **Proposed Failures.md:** `AUDIT-A11Y-01` P1 — darken `--color-bronze-400` or swap hero text token to a compliant one.

### P1-6 · Touch targets <44×44 on every marketing route
- **Tracks:** 02-mobile (M-01), 07-accessibility (WCAG 2.5.5 AAA target)
- **Evidence:** measured `getBoundingClientRect` — buttons/links 32×8, 35×34, 168×31 etc. across `/`, `/products`, `/oostudio`. Screenshots `results/audit/screenshots/mobile/`.
- **Proposed Failures.md:** `AUDIT-MOBILE-01` P1 — raise interactive elements to ≥44×44 (min-h-11 / min-w-11).

### P1-7 · `aria-allowed-role` on Planner/Studio tool rail (breaks `test:a11y`)
- **Tracks:** 07-accessibility (A-03), 11-VR (gate spec fails)
- **Evidence:** `<aside role="toolbar">` invalid per ARIA; `site/components/Planner/PlannerToolRail.tsx:14` + Studio mirror. `pnpm run test:a11y` = 1 failed. `results/audit/a11y/ooplanner.json`.
- **Proposed Failures.md:** `AUDIT-A11Y-02` P1 — change `role="toolbar"` → valid role or restructure.

---

## P2 findings (fix next, after P1s)

| ID | Track | Finding | Evidence |
|----|-------|---------|----------|
| P2-1 | 04 / 09 | `GET /api/git-user` leaks committer email (`pglcarpets@gmail.com`) to anonymous, no auth/rate-limit | `site/app/api/git-user/route.ts` |
| P2-2 | 09 | `audit-api-route-safety.mjs` skips `"other"` surface (exports/git-user/dev-tools/files) — masks P1-1 | `scripts/general/audit-api-route-safety.mjs` surface filter |
| P2-3 | 04 | CSP `script-src 'unsafe-inline'` (ratcheted standing debt, P2=2) | `site/proxy.ts` `buildContentSecurityPolicy` |
| P2-4 | 08 | `htmlLang.ts` mis-maps `fr→fr-IN, de→de-IN, es→es-IN` (should be `fr-FR/de-DE/es-ES`), contradicts `LOCALE_HREFLANG` | `site/lib/i18n/htmlLang.ts` |
| P2-5 | 06 | LCP 14.5–20.1s mobile (dev-mode, far >2.5s); `/oostudio/` CLS=0.30 (>0.1); no `onLCP/onINP/onCLS` reporters in `SiteAnalytics.tsx` | `results/audit/lighthouse/`, `site/components/site/SiteAnalytics.tsx` |
| P2-6 | 11 | `pnpm run test` default lane 17 fails (13 `resolvePdpPlanSvgThumb` disk-res + 2 `sitePackageRoot` + docs + dev-tools) | `results/audit/regression/test-summary.txt` |
| P2-7 | 11 | VR baselines cover only 6 marketing routes — interactive routes (`/ooplanner`, `/oostudio`, `/portal`, `/dashboard`) uncovered | `tests/e2e/site-visual-regression.spec.ts-snapshots/` |
| P2-8 | 11 | tech-docs lane JSON stale (Aug-10) — two-lane misread risk | `results/tests/vitest-tech-docs-results.json` mtime |
| P2-9 | 10 | `/ooplanner/projects/` 401s in bypass mode; `/products/seating/` 404 | `results/audit/console/*.json` |
| P2-10 | 03 | Sitemap lists 308-redirected `/planner/features/3d-view/` alongside its destination `/planner/features/export/` | `curl /sitemap.xml` |

## P3 findings (polish / tracked debt)

- 03-seo: duplicate `og:locale:alternate`; `og:image:alt` literal `&amp;` entity.
- 04-security: `GET /api/dev/auth-bypass-status` exposes bypass/nodeEnv state unauthenticated.
- 05-database: `customer_queries` has a public-insert POLICY but no anon GRANT (route uses service-role — dead policy); serviceRoleOnly pin/docs drift.
- 08-i18n: `NEXT_LOCALE` cookie lacks `Secure`; `localePrefix:"never"` → all hreflang self-referential (design tradeoff, Google can't index localized content distinctly).
- 06-lighthouse: no production chunk >250KB gzip (largest 102.8KB) — bundle is sound; perf gap is dev-mode + missing vitals instrumentation, not bundle weight.

---

## What's healthy (evidence-backed PASS)

- **Fork isolation:** `scan:boundaries` — 939 files, 624 edges, zero cross-product. ✅
- **FOCSS:** `verify:focss` 91 files/141 sheets/cycles 0; `lint:ui:strict` ok; `check:style-tokens` 281 (70 below baseline). ✅
- **CSRF:** double-submit with `timingSafeEqual`, httpOnly/secure-prod/sameSite=strict, `x-csrf-rejected` header. ✅
- **Auth:** `withAuth` enforces rate-limit→CSRF→auth; dev bypass hard-ignored in prod (`NODE_ENV!=="production"` guard). ✅
- **DB governance:** `P4_migration_no_rollback` = 42 (at baseline); both DBs connected (`oando_plans` 2 rows, `catalog_products` 157). ✅
- **Mode-aware persistence:** no raw-disk bypasses in `site/app/api` (grep 0); `site/data/storage/` 0 code refs. ✅
- **Security headers:** all 5 present (nosniff, SAMEORIGIN, Referrer-Policy, Permissions-Policy, HSTS preload). ✅
- **Test integrity:** 0 hollow, 0 gate-skips, 0 eslint-disable; api-route-safety 56 routes ok (within its surface). ✅
- **SEO core:** canonical/robots/sitemap hosts resolve to `https://oando.co.in` (never vercel.app/localhost); `sanitizeCanonicalPath` blocks open-redirect; 14 routes all have unique title/description/canonical/OG 1200×630 + exactly 1 h1; no admin/api in sitemap. ✅
- **i18n parity:** `check:site-ui` green — key parity OK for hi/de/es/fr, no hardcoded copy in 7 consumer files. ✅
- **Bundle:** no chunk >250KB gzip. ✅

---

## Phase B / C inputs

Phase B (85% strict) is unaffected by audit findings — it's the 4-file/16-number threshold change. Run after this review.

Phase C fix sequence (P1 first, one PR each, TDD red→green, `pnpm run gate` before review, `pnpm run release:gate` before merge):
1. P1-1 `/api/exports` gating + mode-aware write (security + DB + API, 3 tracks agree — highest blast radius).
2. P1-3 `/showrooms/` hydration crash (user-visible).
3. P1-4 `toolautosubmit` site-wide warning (41/51 routes).
4. P1-5 hero color-contrast + P1-6 touch targets + P1-7 `aria-allowed-role` (a11y cluster).
5. P1-2 `<html lang>` wiring + P2-4 `htmlLang` mis-map (i18n cluster).
6. P2-1..P2-10 in priority order.

## Track report index

| Track | Report | Key severity |
|-------|--------|--------------|
| 1 | `01-ui-desktop.md` | D-01 P1 (toolautosubmit) |
| 2 | `02-ui-mobile.md` | M-01 P1 (touch <44px) |
| 3 | `03-seo.md` | P2 sitemap redirect dup; P3 og issues |
| 4 | `04-security.md` | P1-1 exports; P2 git-user leak, CSP unsafe-inline |
| 5 | `05-database.md` | P2 exports disk write; P3 customer_queries grant |
| 6 | `06-lighthouse.md` | P2 LCP/CLS over budget, no vitals reporters |
| 7 | `07-accessibility.md` | P1 contrast, P1 aria-allowed-role |
| 8 | `08-i18n.md` | P1 html lang; P2 htmlLang mis-map |
| 9 | `09-api-route-safety.md` | P1-1 exports; P2 audit blind spot |
| 10 | `10-console-runtime.md` | P1 showrooms removeChild; P2 toolautosubmit, 401/404 |
| 11 | `11-visual-regression-e2e.md` | P2 test lane 17 fails, VR coverage, stale tech-docs JSON |
