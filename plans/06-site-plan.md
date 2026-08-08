# Site plan — marketing & hydration vertical slices

**AUDITED:** 2026-08-08 · **Owner:** `(site)` routes, i18n, member suite, FOCSS.  
**Related:** [`06-site-plan.md`](./06-site-plan.md) · `agent-reports/marketing-ledger.md` · [`Failures.md`](../Failures.md) P0-1.

**Browser:** `http://localhost:3000` only.

---

## DONE slices

### SITE-S14 — FOCSS verify on site CSS

| Field | Value |
|-------|-------|
| **Slice ID** | SITE-S14 |
| **Seam** | `pnpm run verify:focss` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | _(completed)_ |
| **Green** | _(completed)_ |
| **Evidence** | 141+ stylesheets OK (2026-08-08 gate) |
| **Depends on** | — |
| **Status** | DONE |

---

## OPEN slices — console / hydration (`results/console-audit/errors.json`)

### SITE-S01 — `/products/workstations/` hydration (P0-1)

| Field | Value |
|-------|-------|
| **Slice ID** | SITE-S01 |
| **Seam** | `SEAM-CONSOLE-ROUTE` — `http://localhost:3000/products/workstations/` — no React hydration mismatch in console |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Add Playwright test `tests/e2e/audit-4a-marketing-pages.spec.ts` or new spec: goto route; `page.on('console')` must not receive `hydration-mismatch` / `srcSet` attribute mismatch |
| **Green** | `normalizeAssetPath(..., { probeDisk: false })` default — SSR matches client (`site/lib/assetPaths.ts`); optional `SEAM-CONSOLE-ROUTE` Playwright test |
| **Evidence** | `pnpm exec vitest run tests/unit/lib/assetPaths.test.ts` pass (2026-08-08); **console audit on route still OPEN** |
| **Depends on** | CHK-S05 |
| **Status** | PARTIAL — code fix landed; `SEAM-CONSOLE-ROUTE` evidence pending |

### SITE-S02 — `/products/seating/` hydration (P0-1)

| Field | Value |
|-------|-------|
| **Slice ID** | SITE-S02 |
| **Seam** | `SEAM-CONSOLE-ROUTE` — `/products/seating/` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Same console listener test for seating route |
| **Green** | Same `probeDisk` hydration fix as SITE-S01 |
| **Evidence** | `assetPaths.test.ts` pass; console audit on route still OPEN |
| **Depends on** | SITE-S01 |
| **Status** | PARTIAL |

### SITE-S03 — `/contact/` hydration (ledger #5)

| Field | Value |
|-------|-------|
| **Slice ID** | SITE-S03 |
| **Seam** | `SEAM-CONSOLE-ROUTE` — `/contact/` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Console hydration error on contact page |
| **Green** | Fix contact page client/server branch at public component seam |
| **Evidence** | `results/console-audit/errors.json` + marketing ledger #5 closed |
| **Depends on** | — |
| **Status** | OPEN |

### SITE-S04 — `/dashboard/` console clean

| Field | Value |
|-------|-------|
| **Slice ID** | SITE-S04 |
| **Seam** | `SEAM-CONSOLE-ROUTE` — `/dashboard/` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | 404 or console errors in `errors.json` for route |
| **Green** | Fix asset or auth redirect at route/layout seam |
| **Evidence** | Console audit route entry removed or empty |
| **Depends on** | — |
| **Status** | OPEN |

### SITE-S05 — `/portal/` console clean

| Field | Value |
|-------|-------|
| **Slice ID** | SITE-S05 |
| **Seam** | `SEAM-CONSOLE-ROUTE` — `/portal/` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Console 404s on portal route |
| **Green** | Fix portal layout asset or link |
| **Evidence** | Console audit clean |
| **Depends on** | — |
| **Status** | OPEN |

### SITE-S06 — `/planning/` console clean

| Field | Value |
|-------|-------|
| **Slice ID** | SITE-S06 |
| **Seam** | `SEAM-CONSOLE-ROUTE` — `/planning/` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Errors in console audit for `/planning/` |
| **Green** | Fix at planning route seam |
| **Evidence** | Console audit clean |
| **Depends on** | — |
| **Status** | OPEN |

### SITE-S07 — `/` homepage console clean

| Field | Value |
|-------|-------|
| **Slice ID** | SITE-S07 |
| **Seam** | `SEAM-CONSOLE-ROUTE` — `/` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Console errors on marketing home |
| **Green** | Fix reported component |
| **Evidence** | Console audit clean for `/` |
| **Depends on** | — |
| **Status** | OPEN |

### SITE-S08 — Assistant off-canvas @390px (ledger #1)

| Field | Value |
|-------|-------|
| **Slice ID** | SITE-S08 |
| **Seam** | Playwright `audit-4a` test `5. responsive matrix` — assistant launcher visible @390px |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Launcher not in viewport or not clickable at 390×844 |
| **Green** | Fix `UnifiedAssistant` / launcher CSS in `site/focss/site/` |
| **Evidence** | `results/marketing/audit-4a/` screenshot + test pass |
| **Depends on** | SITE-S12 |
| **Status** | OPEN |

### SITE-S09 — Assistant header overflow @390px (ledger #2)

| Field | Value |
|-------|-------|
| **Slice ID** | SITE-S09 |
| **Seam** | Same responsive test — header text within bounds |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Horizontal overflow on assistant header |
| **Green** | CSS fix at assistant header seam |
| **Evidence** | audit-4a responsive pass |
| **Depends on** | SITE-S08 |
| **Status** | OPEN |

### SITE-S10 — `/trusted-by` abort (ledger #3)

| Field | Value |
|-------|-------|
| **Slice ID** | SITE-S10 |
| **Seam** | `GET http://localhost:3000/trusted-by` — no `ERR_ABORTED` in Playwright navigation |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | `audit-4a` CTA test or dedicated goto aborts |
| **Green** | Fix route handler or redirect for `/trusted-by` |
| **Evidence** | Navigation 200 + audit pass |
| **Depends on** | — |
| **Status** | OPEN |

### SITE-S11 — Theme API presets (P1-2)

| Field | Value |
|-------|-------|
| **Slice ID** | SITE-S11 |
| **Seam** | `GET /api/theme/active/` — `site/app/api/theme/active/route.ts` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | Misread as missing `block_themes` seed |
| **Green** | Public theme API serves preset tokens via `getActiveThemeId()`; `ThemeProvider` warn+fallback is intentional |
| **Evidence** | `route.ts` uses presets; `Failures.md` P1-2 resolved 2026-08-08 |
| **Depends on** | — |
| **Status** | DONE |

### SITE-S12 — Responsive audit site (P1)

| Field | Value |
|-------|-------|
| **Slice ID** | SITE-S12 |
| **Seam** | `node scripts/responsive-audit.mjs` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Fail at 1920 / 1280 / 390 / 320 |
| **Green** | Per-route FOCSS fix |
| **Evidence** | `results/site/responsive-audit.txt` all pass |
| **Depends on** | CHK-S05 |
| **Status** | OPEN |

### SITE-S13 — Marketing audit-4a journey (P2)

| Field | Value |
|-------|-------|
| **Slice ID** | SITE-S13 |
| **Seam** | `SEAM-E2E-MARKETING-4A` — full `audit-4a-marketing-journey.spec.ts` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Any of 6 tests fail |
| **Green** | One test at a time |
| **Evidence** | `results/marketing/audit-4a/` |
| **Depends on** | SITE-S08–SITE-S10 |
| **Status** | OPEN |

### SITE-S15 — i18n locale switch e2e (P1)

| Field | Value |
|-------|-------|
| **Slice ID** | SITE-S15 |
| **Seam** | E2E: switch locale on `/` — `next-intl` message change visible |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Add failing e2e in `tests/e2e/` — locale cookie/header does not change `home.*` string |
| **Green** | Wire locale switcher at public UI seam |
| **Evidence** | New e2e pass + `results/site/i18n-locale.txt` |
| **Depends on** | — |
| **Status** | OPEN |

### SITE-S16 — Enquiry notification (ledger #10)

| Field | Value |
|-------|-------|
| **Slice ID** | SITE-S16 |
| **Seam** | `POST /api/customer-queries` → staff notification path |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Test: submit enquiry — no notification event |
| **Green** | Wire notification at API/service seam |
| **Evidence** | Integration test or manual proof in `results/site/enquiry-notify.txt` |
| **Depends on** | DB-S06 |
| **Status** | OPEN |

### SITE-S17 — Empty homepage headings (ledger #6)

| Field | Value |
|-------|-------|
| **Slice ID** | SITE-S17 |
| **Seam** | Playwright `audit-4a` test `4. marketing sections walk` — no empty `h2`/`h3` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Section headings empty in DOM dump |
| **Green** | Fix CMS/i18n keys for those sections |
| **Evidence** | audit-4a section dump pass |
| **Depends on** | — |
| **Status** | OPEN — P2 |

### SITE-S18 — Image lazy-load scroll (ledger #7)

| Field | Value |
|-------|-------|
| **Slice ID** | SITE-S18 |
| **Seam** | audit-4a test `4` — images load after full scroll |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | 23/48 images never load |
| **Green** | Fix lazy-load or src at image component seam |
| **Evidence** | audit-4a image counts in dump |
| **Depends on** | SITE-S01 |
| **Status** | OPEN — P2 |

---

## Key paths

| Item | Path |
|------|------|
| Marketing app | `site/app/(site)/` |
| FOCSS site | `site/focss/site/` |
| Console audit | `results/console-audit/errors.json` |
| Marketing ledger | `agent-reports/marketing-ledger.md` |
| Dev server | `pnpm dev` → `http://localhost:3000` |

*Blockers: [`Failures.md`](../Failures.md) only.*
