# Testing plan

**AUDITED:** 2026-08-13 · Registry: [`00-README.md`](./00-README.md) · Handbook: [`Testing-handbook.md`](../Testing-handbook.md)

Audit Phase A is complete — do not re-run tracks. Reports archived in [`.archive/audit/`](../.archive/audit/00-audit-summary.md).

**Rule:** one slice · confirm seam · red → green. Browser: `http://localhost:3000` only.

---

## DONE (TST-S01–S14, S20–S21)

| IDs | Focus |
|-----|--------|
| S01–S02 | typecheck / typecheck:tests |
| S03 | `p0:unit` → vitest-p0-results |
| S04–S05 | hollow / gate-skips audits |
| S06–S07 | Vitest default + tech-docs lanes |
| S08–S09 | coverage gate + fast release gate |
| S10–S14 | boundaries, asset smoke, R2 fail-closed, playwright report path, p0 results isolation |
| S20–S21 | client IP rate-limit key; withAuth test scope |

---

## RETIRED (superseded by 11-track audit, 2026-08-12)

| ID | Was | Superseded by |
|----|-----|---------------|
| TST-S15 | `COVERAGE_GATE_STRICT` 90% inventory | Phase B 85% program |
| TST-S16 | `SEAM-E2E-PLANNER-3B` full audit-3b | Deep audit track 11 + P2-7 |
| TST-S17 | audit-3c polish | SITE-S14 / WRK-S14 (closed) |
| TST-S18 | `SEAM-E2E-STUDIO-2A` | Deep audit track 11 + P2-7 |
| TST-S19 | `SEAM-E2E-MARKETING-4A` | SITE-S12 / SITE-S15 (closed) |

---

## DONE — audit P1 findings (TST-S22–S28)

Evidence: [`.archive/audit/00-audit-summary.md`](../.archive/audit/00-audit-summary.md) · raw in `results/audit/`.

| ID | Seam | Red → green | Evidence |
|----|------|-------------|----------|
| ~~**TST-S22**~~ | ~~`POST /api/exports` un-gated + raw disk write~~ | ~~`withAuth`+CSRF+rate-limit + mode-aware write → unit + API-safety test~~ | **DONE** 2026-08-12 — `tests/unit/app/api/exports/route.test.ts` 5/5; member+CSRF+rate-limit, 503 in prod |
| ~~**TST-S23**~~ | ~~`<html lang>` hardcoded `en`~~ | ~~wire `getSiteLayoutContext()` lang → render test~~ | **DONE** 2026-08-12 — `tests/unit/app/layout.test.tsx` 3/3; root layout resolves locale → `hi-IN`/`fr-IN`, falls back `en-IN` |
| ~~**TST-S24**~~ | ~~`/showrooms/` hydration `removeChild` crash~~ | ~~fix pre-hydration DOM mutation → e2e no `pageerror`~~ | **DONE** 2026-08-12 — GSAP scroll-reveal gated on `motionReady` + `clearProps`; `tests/e2e/showrooms-console-clean.spec.ts` pass |
| ~~**TST-S25**~~ | ~~`toolautosubmit` warning (41/51 routes)~~ | ~~fix non-boolean prop → console-clean e2e~~ | **DONE** 2026-08-12 — `toolautosubmit=""` in `HeaderSearchPanel.tsx` + `MobileNavDrawer.tsx`; console clean |
| ~~**TST-S26**~~ | ~~hero contrast 3.28:1 (needs 4.5:1)~~ | ~~token fix → axe gate green~~ | **DONE** 2026-08-12 — `btn-accent` fill → `--color-accent-strong` (#7F6A52, 4.91:1); homepage axe WCAG2AA green |
| ~~**TST-S27**~~ | ~~touch targets <44×44 site-wide~~ | ~~min-h-11/min-w-11 → measured e2e~~ | **DONE** 2026-08-12 — footer social/text 44px, carousel dots 44px hit, filter pills/chips/breadcrumb min-height 2.75rem; `tests/e2e/touch-targets.spec.ts` 2/2 |
| ~~**TST-S28**~~ | ~~`role="toolbar"` invalid ARIA~~ | ~~valid role/restructure → `test:a11y` green~~ | **DONE** 2026-08-12 — `aside role=toolbar` → `div role=toolbar` in `PlannerToolRail.tsx` + `StudioToolRail.tsx`; `test:a11y` 3/3 green |

```powershell
pnpm run test:a11y
pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/audit-3b-planner-fixes.spec.ts
```

---

## OPEN — audit P2/P3 backlog (tracked slices)

Evidence: [`.archive/audit/00-audit-summary.md`](../.archive/audit/00-audit-summary.md) · raw in `results/audit/`.

| ID | Pri | Seam | Red → green | Evidence |
|----|-----|------|-------------|----------|
| **TST-S29** | P2 | P2-6: default test lane 17 fails | fix 13 `resolvePdpPlanSvgThumb` disk-res + 2 `sitePackageRoot` + docs + dev-tools tests → `pnpm run test` default lane green | `results/audit/regression/test-summary.txt` |
| **TST-S30** | P2 | P2-8: tech-docs lane JSON stale | make `vitest-tech-docs-results.json` fresh; two-lane gate reads both | `results/tests/vitest-tech-docs-results.json` mtime |
| ~~**TST-S31**~~ | ~~P2~~ | ~~P2-2: `audit-api-route-safety.mjs` skips `"other"` surface~~ | ~~extend enforcement or documented allowlist; add unit test~~ | **DONE** 2026-08-12 — `other` mutators must be rate-limited; `other` GETs must be auth-gated or allowlisted (`OTHER_PUBLIC_GET_ALLOWLIST`); `toApiPath` root fix; audit ok |
| ~~**TST-S32**~~ | ~~P2~~ | ~~P2-1: `GET /api/git-user` leaks identity~~ | ~~admin-gate or dev-only; add test~~ | **DONE** 2026-08-12 — admin-gated; `tests/unit/app/api/git-user/route.test.ts` 4/4 |
| ~~**TST-S33**~~ | ~~P3~~ | ~~`GET /api/dev/auth-bypass-status` exposed~~ | ~~admin-gate or 404 in prod~~ | **DONE** 2026-08-12 — 404 in prod + test |
| **TST-S34** | P2 | P2-7: VR baselines cover only 6 marketing routes | add `/ooplanner`, `/oostudio`, `/portal`, `/dashboard` baselines | `tests/e2e/site-visual-regression.spec.ts-snapshots/` |
| **TST-S35** | P2 | P2-4: `htmlLang.ts` maps fr/de/es → `*-IN` | change to fr-FR / de-DE / es-ES (keep en-IN / hi-IN); unit test vs `LOCALE_HREFLANG` | `site/lib/i18n/htmlLang.ts`; `.archive/audit/08-i18n.md` |

---

## 85% strict quality program — Phase B (coverage thresholds)

Not started. Not a new TST id. From retired [`oo-deep-audit-85-strict-quality-program.md`](./oo-deep-audit-85-strict-quality-program.md) § B. Proper tests enforced: `test:audit:hollow` 0 · `audit-gate-skips` 0 · `audit-eslint-disable` 0 · no `any`.

| File | Constant | Change |
|------|----------|--------|
| `tests/vitest.shared.ts` | `VITEST_PLANNER_GATE_THRESHOLDS` | 95→85 ×4 |
| `tests/vitest.site.config.ts` | `thresholds` | 95→85 ×4 |
| `tests/vitest.admin.coverage.config.ts` | `thresholds` | 95→85 ×4 |
| `scripts/coverage-policy.mjs` | `COVERAGE_GATE_PLANNER/ADMIN/SITE/INVENTORY_ASPIRATION` | 85 ×4 |
| `tests/vitest.coverage.inventory.config.ts` | `thresholds` | add 85 ×4 (today none) |

Verify: `pnpm run test` **both lanes** + `pnpm run test:coverage && pnpm run test:coverage:site`.

---

## Persistence note

Furniture / assets: mode-aware wrappers only — see [`04-database-plan.md`](./04-database-plan.md). No hard-coded asset bucket names in `site/lib/**`.
