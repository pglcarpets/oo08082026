# Testing plan

**AUDITED:** 2026-08-12 · Registry: [`00-README.md`](./00-README.md) · Handbook: [`Testing-handbook.md`](../Testing-handbook.md)

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

## OPEN — audit P1 findings (fix first, one slice each)

Evidence: [`agent-reports/audit/00-audit-summary.md`](../agent-reports/audit/00-audit-summary.md) · raw in `results/audit/`.

| ID | Seam | Red → green | Evidence |
|----|------|-------------|----------|
| **TST-S22** | `POST /api/exports` un-gated + raw disk write | `withAuth`+CSRF+rate-limit + mode-aware write → unit + API-safety test | `site/app/api/exports/route.ts` |
| **TST-S23** | `<html lang>` hardcoded `en` | wire `getSiteLayoutContext()` lang → render test | `site/app/layout.tsx` |
| **TST-S24** | `/showrooms/` hydration `removeChild` crash | fix pre-hydration DOM mutation → e2e no `pageerror` | `results/audit/console/showrooms.json` |
| **TST-S25** | `toolautosubmit` warning (41/51 routes) | fix non-boolean prop → console-clean e2e | `site/components/site/Header.tsx:61` |
| **TST-S26** | hero contrast 3.28:1 (needs 4.5:1) | token fix → axe gate green | `results/audit/a11y/root.json` |
| **TST-S27** | touch targets <44×44 site-wide | min-h-11/min-w-11 → measured e2e | `results/audit/screenshots/mobile/` |
| **TST-S28** | `role="toolbar"` invalid ARIA | valid role/restructure → `test:a11y` green | `site/components/Planner/PlannerToolRail.tsx:14` |

```powershell
pnpm run test:a11y
pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/audit-3b-planner-fixes.spec.ts
```

---

## OPEN — audit P2 backlog (fix after P1s)

`AUDIT-P2-1` … `AUDIT-P2-10` — see registry [`00-README.md`](./00-README.md) § AUDIT. Key testing-relevant ones:

- **P2-6:** default lane 17 fails (13 `resolvePdpPlanSvgThumb` disk-res + 2 `sitePackageRoot` + docs + dev-tools) → `pnpm run test` default lane must be green.
- **P2-8:** tech-docs lane JSON stale — always read **both** `results/tests/vitest-results.json` and `vitest-tech-docs-results.json` fresh.
- **P2-7:** VR baselines only cover 6 marketing routes — add `/ooplanner`, `/oostudio`, `/portal`, `/dashboard`.

---

## 85% strict quality program — Phase B (coverage thresholds)

From [`oo-deep-audit-85-strict-quality-program.md`](./oo-deep-audit-85-strict-quality-program.md) § B. Proper tests enforced: `test:audit:hollow` 0 · `audit-gate-skips` 0 · `audit-eslint-disable` 0 · no `any`.

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
