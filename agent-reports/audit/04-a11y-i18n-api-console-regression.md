# A11y, i18n, API safety, Console, VR/E2E Audit (File 4 of 5)

**Tracks:** 7 (Accessibility), 8 (i18n), 9 (API route safety), 10 (Console/runtime), 11 (Visual regression + E2E)
**Agents:** A (7), B (8, 9), C (10, 11)
**Report outputs:** `agent-reports/audit/07-accessibility.md`, `08-i18n.md`, `09-api-route-safety.md`, `10-console-runtime.md`, `11-visual-regression-e2e.md`

---

## Track 7 — Accessibility (Agent A)

### Method
- `@axe-core/playwright` is a devDependency — run axe against primary routes (per `oo-deep-audit-v2` Phase 6): `/`, `/products`, `/ooplanner`, `/oostudio`, `/portal`, `/dashboard`, `/contact`, `/showrooms`, `/admin`.
- Existing gate: `pnpm run test:a11y` → `tests/e2e/accessibility.spec.ts`.
- Per route: landmarks (header/nav/main/footer), heading hierarchy (single h1), focus order + traps, keyboard nav, visible focus rings, color contrast (tokens), ARIA roles/labels, `aria-current` on active nav, skip-link target.

### Findings checklist
- Landmark duplication or missing `<main>`.
- Multiple h1 or skipped heading levels.
- Focus trap in a modal (MobileNavDrawer, admin drawer) or no Esc.
- Interactive element <44px touch target.
- Form input without label / `aria-labelledby`.
- Color contrast < 4.5:1 body / 3:1 UI.
- Missing skip-link.

## Track 8 — i18n (Agent B)

### Method
- next-intl v4. Inspect `site/i18n/`, `LanguageSwitcher`, message files (`en.json` + mirrors).
- `scripts/check-i18n-key-parity.mjs` (part of `check:site-ui`).
- Locale exposure: which locales surface in header vs mobile drawer vs account.
- next-intl routing + hreflang in `generateMetadata`.

### Findings checklist
- Missing key in a locale (parity failure).
- Hardcoded copy in TSX bypassing i18n (`scripts/check-marketing-copy-source.mjs`, `check-marketing-inline-style.mjs`).
- Language switcher unreachable on mobile.
- Locale not in hreflang alternates.

## Track 9 — API route safety (Agent B)

### Method
- Inventory from `docs/architecture/routes.md`.
- `scripts/general/audit-api-route-safety.mjs` (`pnpm run test:audit:api-routes`).
- `scripts/general/audit-eslint-disable.mjs`, `audit-hollow-tests.mjs`, `audit-gate-skips.mjs`.
- Server actions: `next-safe-action` v8; grep `metadataAction`, `withAuth`, `safeActionClient`.
- Mode-aware writes: route handlers/server actions must call wrappers (`writeFurnitureItem`, `plannerPersistenceMode`, `furnitureCatalogMode`), not raw `fs`/disk helpers.

### Findings checklist
- Route handler mutating without auth/CSRF.
- Server action without `withAuth` or zod validation.
- Raw disk write in a prod-reachable path.
- `eslint-disable` hiding a real rule.
- Hollow test (asserts nothing).

## Track 10 — Console + runtime (Agent C)

### Method
- Playwright against `http://localhost:3000` primary routes; capture `page.on('console')` + `page.on('pageerror')` + `page.on('requestfailed')`.
- Wait `networkidle` + `document.fonts.ready` first.
- Per route: count errors/warnings; classify (hydration mismatch, React key, unhandled promise, 404 asset, CSP violation).

### Findings checklist
- Hydration mismatch (text/content mismatch).
- React `key` warnings.
- Unhandled promise rejection.
- 404 on an asset/route (worker, docs, image).
- CSP violation.

## Track 11 — Visual regression + E2E (Agent C)

### Method
- Run existing UI audit scripts (not gated, per `Agents/03-browser.md`):
  - `node scripts/ui-polish-pass1-audit.mjs` → `results/ui-polish/pass-1/` (17 routes × 3 viewports)
  - `node scripts/responsive-audit.mjs` → `results/responsive-audit/`
- Playwright config: `config/build/playwright.config.ts`. E2E under `tests/e2e/`.
- `pnpm run test:audit` (`--preset=release`) or `test:audit:fast`.
- Inventory snapshot baselines under `tests/e2e/site-visual-regression.spec.ts-snapshots/*`.
- Gate coverage: `pnpm run gate` (release:gate:fast) and `pnpm run test` (both lanes — default + tech-docs).

### Findings checklist
- Snapshot baselines stale or missing for a primary route.
- E2e gate skipped (`audit-gate-skips.mjs`).
- Visual diff across viewports on a primary route.
- Two-lane test misread (only one summary green).

## Evidence requirements
- axe JSON per route.
- console error log per route.
- script output paths (`results/ui-polish/pass-1/`, `results/responsive-audit/`).
- file:line per finding.

## Out of scope
- Applying fixes (propose only).
- Updating visual baselines.
- Source edits.

## Acceptance
- [ ] 5 reports written.
- [ ] Each P0/P1 has axe JSON / console log / script output / file:line.
- [ ] No source changes, no baseline updates.
