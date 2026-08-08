# Testing plan — vertical slices

**AUDITED:** 2026-08-08 · **Owner:** gates, Vitest, Playwright before merge/release.  
**Related:** [`Testing-handbook.md`](../Testing-handbook.md) · [`Agents/02-testing.md`](../Agents/02-testing.md) · [`00-README.md`](./00-README.md).

**Rule:** One slice at a time. Confirm seam → red → green. No horizontal “write all E2E first”.

---

## DONE slices (gate evidence on `main`)

### TST-S01 — Typecheck

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S01 |
| **Seam** | `SEAM-GATE-TYPECHECK` — `pnpm run typecheck` |
| **Seam confirmation** | - [x] Owner confirms seam (gate seam) |
| **Red** | _(completed)_ |
| **Green** | _(completed)_ |
| **Evidence** | `pnpm run typecheck` exit 0 (2026-08-08 gate) |
| **Depends on** | — |
| **Status** | DONE |

### TST-S02 — Typecheck tests

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S02 |
| **Seam** | `pnpm run typecheck:tests` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | _(completed)_ |
| **Green** | _(completed)_ |
| **Evidence** | Included in `pnpm run gate` chain |
| **Depends on** | TST-S01 |
| **Status** | DONE |

### TST-S03 — P0 unit slice

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S03 |
| **Seam** | `SEAM-GATE-P0UNIT` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | `pnpm run p0:unit` with one of 23 files failing |
| **Green** | Fix minimal file; 23/23 pass |
| **Evidence** | `pnpm run p0:unit` → **23 passed, 146 tests** → `results/tests/vitest-p0-results.json` (2026-08-08) |
| **Depends on** | TST-S01 |
| **Status** | DONE |

### TST-S04 — Hollow tests audit

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S04 |
| **Seam** | `node scripts/general/audit-hollow-tests.mjs` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | Add `expect(true).toBe(true)` in a unit test; run audit — exit 1 |
| **Green** | Remove hollow assertion |
| **Evidence** | `node scripts/general/audit-hollow-tests.mjs` → `audit-hollow-tests: ok` |
| **Depends on** | — |
| **Status** | DONE |

### TST-S05 — Gate-skips audit

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S05 |
| **Seam** | `node scripts/general/audit-gate-skips.mjs` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | Introduce forbidden skip pattern; audit fails |
| **Green** | Remove skip |
| **Evidence** | `audit-gate-skips: ok` via `pnpm run test:audit:fast` |
| **Depends on** | — |
| **Status** | DONE |

### TST-S06 — Vitest default lane

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S06 |
| **Seam** | `SEAM-GATE-LANES` lane `default` in `results/tests/summary.json` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | Break one default-lane test; `pnpm run test` → `failed > 0` |
| **Green** | Fix test or code at seam |
| **Evidence** | `results/tests/summary.json` `{lane:"default",failed:0}` (2026-08-08) |
| **Depends on** | TST-S03 |
| **Status** | DONE |

### TST-S07 — Vitest tech-docs lane

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S07 |
| **Seam** | `SEAM-GATE-LANES` lane `tech-docs` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | Break `tests/tech-docs-generator/snapshot.test.ts`; lane fails |
| **Green** | Fix snapshot data or test |
| **Evidence** | `results/tests/summary.json` `{lane:"tech-docs",failed:0}`; **195 tests** in `vitest-tech-docs-results.json` |
| **Depends on** | — |
| **Status** | DONE |

### TST-S08 — Coverage gate

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S08 |
| **Seam** | `pnpm run test:coverage` → `results/coverage/coverage-summary.json` `total.lines.pct` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | Lower coverage below 90% on gate include set |
| **Green** | Add tests at public seams (not lower gate) |
| **Evidence** | `total.lines.pct` **100%** on gate files (2026-08-08) |
| **Depends on** | TST-S06 |
| **Status** | DONE |

### TST-S09 — Fast release gate

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S09 |
| **Seam** | `SEAM-GATE-FULL` — `pnpm run gate` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | Any sub-step in `release:gate:fast` fails |
| **Green** | Fix failing sub-gate |
| **Evidence** | `pnpm run gate` exit 0 (2026-08-08) |
| **Depends on** | TST-S01–TST-S08, TST-S04, TST-S05 |
| **Status** | DONE |

### TST-S10 — Fork boundaries

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S10 |
| **Seam** | `pnpm run scan:boundaries` — 0 Studio ↔ Planner edges |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | Add cross-import; scan reports edge |
| **Green** | Remove import |
| **Evidence** | **931 files / 0 edges** (2026-08-08) |
| **Depends on** | — |
| **Status** | DONE |

### TST-S11 — Asset cutover smoke

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S11 |
| **Seam** | `node scripts/asset-cutover-smoke.mjs` → `results/asset-cutover/smoke-report.json` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | Break R2 env; `overall` ≠ `pass` |
| **Green** | Fix env or worker path |
| **Evidence** | `smoke-report.json` `overall:"pass"` |
| **Depends on** | — |
| **Status** | DONE |

### TST-S12 — R2 bucket fail-closed (code review)

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S12 |
| **Seam** | `SEAM-R2-BUCKET` — exported `resolveCatalogBucketName()` in `site/lib/storage/r2Catalog.ts` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | `pnpm exec vitest run --config tests/vitest.config.ts tests/unit/lib/storage/r2Catalog.test.ts` — test `throws when bucket env is missing and dev bypass is off` |
| **Green** | `resolveCatalogBucketName()` throws when `DEV_AUTH_BYPASS` off and no bucket env |
| **Evidence** | `r2Catalog.test.ts` pass; `test:priority-7` includes file; no hardcoded `oando-assets-clean-*` in `r2Catalog.ts` |
| **Depends on** | — |
| **Status** | DONE |

### TST-S13 — Playwright report path + gitignore (code review)

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S13 |
| **Seam** | `SEAM-PLAYWRIGHT-REPORT` — `config/build/playwright.config.ts` HTML reporter + root `.gitignore` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | `pnpm exec vitest run --config tests/vitest.config.ts tests/unit/config/root-configs.test.ts` — expects `results/playwright-report` |
| **Green** | Playwright `outputFolder: ../../results/playwright-report`; `.gitignore` lists `playwright-report/` |
| **Evidence** | `root-configs.test.ts` pass; `.gitignore` line 19 `playwright-report/` |
| **Depends on** | — |
| **Status** | DONE |

### TST-S14 — P0 results file isolation

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S14 |
| **Seam** | `pnpm run p0:unit` writes `vitest-p0-results.json` not `vitest-results.json` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | Change `p0:unit` output to `vitest-results.json`; full lane overwrites |
| **Green** | `--outputFile.json=../results/tests/vitest-p0-results.json` in `package.json` |
| **Evidence** | `package.json` `p0:unit` script; JSON written 2026-08-08 |
| **Depends on** | TST-S03 |
| **Status** | DONE |

### TST-S20 — Rate-limit IP normalization (P1-3)

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S20 |
| **Seam** | `SEAM-CLIENT-IP` — `normalizeClientIp()` in `site/lib/clientIp.ts`; used by `withAuth`, `getPublicApiIp`, `resolveClientIp` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | `getPublicApiIp` without headers returned `127.0.0.1` — split rate-limit buckets vs `localhost` |
| **Green** | Map `127.0.0.1` / `::1` → `localhost` before rate-limit keys |
| **Evidence** | `pnpm exec vitest run tests/unit/lib/clientIp.test.ts tests/unit/app/api/_lib/public.test.ts` pass (2026-08-08) |
| **Depends on** | — |
| **Status** | DONE |

### TST-S21 — withAuth test scope (P1-3 false stderr)

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S21 |
| **Seam** | `tests/unit/features/shared/api/withAuth.test.ts` stderr during error-serialization test |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | `rateLimitScope: "mirror:throw"` produced `[withAuth:mirror:throw]` in audit stderr — misread as prod blocker |
| **Green** | Rename scope to `handler-serialize-error`; keep intentional error-serialization test |
| **Evidence** | `withAuth.test.ts` pass; no `mirror:throw` in stderr (2026-08-08) |
| **Depends on** | — |
| **Status** | DONE |

---

## OPEN slices

### TST-S15 — Strict 90% inventory coverage

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S15 |
| **Seam** | `scripts/coverage-policy.mjs` `COVERAGE_GATE_STRICT` 90% on expanded include list |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Add `site/lib/catalog/` file to strict inventory without tests; `pnpm run test:coverage` fails strict threshold |
| **Green** | Add unit tests at exported function seams only |
| **Evidence** | `results/coverage/coverage-summary.json` strict inventory ≥90% |
| **Depends on** | TST-S08 |
| **Status** | OPEN |

### TST-S16 — Playwright audit-3b (full spec)

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S16 |
| **Seam** | `SEAM-E2E-PLANNER-3B` — `tests/e2e/audit-3b-planner-fixes.spec.ts` @ `http://localhost:3000` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | `pnpm dev` then `pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/audit-3b-planner-fixes.spec.ts` — expect fail on fix #4 or #1–#3 |
| **Green** | Minimal Planner fix per failing case; one case at a time |
| **Evidence** | `results/planner/audit-3b/click-log.txt` + Playwright exit 0 |
| **Depends on** | WRK-S04, DB-S02 |
| **Status** | OPEN |

### TST-S17 — Playwright audit-3c

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S17 |
| **Seam** | `tests/e2e/audit-3c-planner-polish.spec.ts` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Run spec; first failing test |
| **Green** | Fix one polish issue |
| **Evidence** | `results/planner/audit-3c/` dated folder |
| **Depends on** | TST-S16 |
| **Status** | OPEN |

### TST-S18 — Playwright audit-2a Studio

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S18 |
| **Seam** | `SEAM-E2E-STUDIO-2A` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | `pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/audit-2a-studio-journey.spec.ts` |
| **Green** | Fix failing journey step |
| **Evidence** | `results/studio/audit-2a/` |
| **Depends on** | — |
| **Status** | OPEN |

### TST-S19 — Playwright audit-4a marketing

| Field | Value |
|-------|-------|
| **Slice ID** | TST-S19 |
| **Seam** | `SEAM-E2E-MARKETING-4A` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Run `audit-4a-marketing-journey.spec.ts`; fail on responsive or CTA case |
| **Green** | Fix marketing component at failing seam |
| **Evidence** | `results/marketing/audit-4a/` |
| **Depends on** | SITE-S08–SITE-S10 |
| **Status** | OPEN |

---

## Path ownership (reference)

| Domain | Dev disk | Prod | Mode selector |
|--------|----------|------|----------------|
| Furniture JSON | `platform/shared/data/furniture/` | Admin `furniture_catalog` | `furnitureCatalogMode.ts` |
| Asset bytes | `site/public/assets/catalog/**` | Storage `catalog-assets` | `catalogAssetStorage.server.ts` |
| CDN/R2 | — | `CLOUDFLARE_R2_CATALOG_BUCKET` | `r2Catalog.ts` |

**Rule:** No literals `oo08082026`, `oando-assets-clean-20260805`, `oando-asset-cdn` in `site/lib/**` or `tests/setup.ts`.

---

## Key commands

| Command | Artifact |
|---------|----------|
| `pnpm run p0:unit` | `results/tests/vitest-p0-results.json` |
| `pnpm run test` | `results/tests/summary.json` (2 lanes) |
| `pnpm run gate` | composite exit 0 |
| `node scripts/asset-cutover-smoke.mjs` | `results/asset-cutover/smoke-report.json` |

*Blockers: [`Failures.md`](../Failures.md) only.*
