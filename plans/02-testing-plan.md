# Testing plan

**AUDITED:** 2026-08-09 · Registry: [`00-README.md`](./00-README.md) · Handbook: [`Testing-handbook.md`](../Testing-handbook.md)

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

## OPEN

| ID | Seam | Red → green | Evidence | Deps |
|----|------|-------------|----------|------|
| **TST-S15** | `COVERAGE_GATE_STRICT` 90% inventory | expand include without tests → add unit tests at exports | `results/coverage/coverage-summary.json` | S08 |
| **TST-S16** | `SEAM-E2E-PLANNER-3B` full audit-3b | fail case → fix Planner one at a time | `results/planner/audit-3b/` | WRK-S04, DB-S02 |
| **TST-S17** | audit-3c polish (**sole owner**) | first fail → one polish fix | `results/planner/audit-3c/` | S16 |
| **TST-S18** | `SEAM-E2E-STUDIO-2A` (**sole owner**) | journey fail → Studio step fix | `results/studio/audit-2a/` | — |
| **TST-S19** | `SEAM-E2E-MARKETING-4A` (**sole owner**) | fail CTA/responsive → site fix | `results/marketing/audit-4a/` | SITE-S08–S10 |

```powershell
pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/audit-3b-planner-fixes.spec.ts
pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/audit-2a-studio-journey.spec.ts
pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/audit-4a-marketing-journey.spec.ts
```

---

## Persistence note

Furniture / assets: mode-aware wrappers only — see [`04-database-plan.md`](./04-database-plan.md). No hard-coded asset bucket names in `site/lib/**`.
