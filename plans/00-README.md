# 00 — Slice ID Registry

**Last updated:** 2026-08-13

Single source of truth for every slice ID across all numbered plans. Every plan (01–10) links here as its registry.

---

## Summary

**90 DONE · 33 OPEN · 1 PARTIAL** (plan slices). Audit Phase A archived in [`agent-reports/audit/00-audit-summary.md`](../agent-reports/audit/00-audit-summary.md) — do not re-run. Failures.md stays empty.

---

## HO-S — Handover slices ([01-handover.md](./01-handover.md))

| ID | Status | Evidence |
|----|--------|----------|
| HO-S01 | **DONE** 2026-08-09 | `results/tests/vitest-p0-results.json` — 23 files / 146 tests |
| HO-S02 | **DONE** 2026-08-09 | `check:docs-all` exit 0 |
| HO-S03 | **DONE** 2026-08-09 | All programme plans AUDITED |
| HO-S04 | **DONE** 2026-08-09 | `check-plans-purity` OK |
| HO-S05 | **DONE** 2026-08-09 | `activeBlockers.ts` ↔ Failures |
| HO-S06 | **DONE** 2026-08-09 | Registry ↔ handover aligned |

---

## TST-S — Testing slices ([02-testing-plan.md](./02-testing-plan.md))

| ID | Status | Focus |
|----|--------|-------|
| TST-S01 | **DONE** | `typecheck` |
| TST-S02 | **DONE** | `typecheck:tests` |
| TST-S03 | **DONE** | `p0:unit` → vitest-p0-results |
| TST-S04 | **DONE** | Hollow test audit |
| TST-S05 | **DONE** | Gate-skips audit |
| TST-S06 | **DONE** | Vitest default lane |
| TST-S07 | **DONE** | Vitest tech-docs lane |
| TST-S08 | **DONE** | Coverage gate |
| TST-S09 | **DONE** | Fast release gate |
| TST-S10 | **DONE** | Boundary scan checks |
| TST-S11 | **DONE** | Asset smoke |
| TST-S12 | **DONE** | R2 fail-closed |
| TST-S13 | **DONE** | Playwright report path |
| TST-S14 | **DONE** | p0 results isolation |
| TST-S20 | **DONE** | Client IP rate-limit key |
| TST-S21 | **DONE** | withAuth test scope |
| TST-S15 | **RETIRED** | COVERAGE_GATE_STRICT 90% inventory — superseded by audit |
| TST-S16 | **RETIRED** | SEAM-E2E-PLANNER-3B — superseded by audit |
| TST-S17 | **RETIRED** | audit-3c polish — superseded by audit |
| TST-S18 | **RETIRED** | SEAM-E2E-STUDIO-2A — superseded by audit |
| TST-S19 | **RETIRED** | SEAM-E2E-MARKETING-4A — superseded by audit |
| TST-S22 | **DONE** 2026-08-12 | AUDIT-EXPORTS-01: `/api/exports` gated (member+CSRF+rate-limit) — `tests/unit/app/api/exports/route.test.ts` 5/5 |
| TST-S23 | **DONE** 2026-08-12 | AUDIT-I18N-01: `<html lang>` wired via `getHtmlLang` — `tests/unit/app/layout.test.tsx` 3/3 |
| TST-S24 | **DONE** 2026-08-12 | AUDIT-SHOWROOMS-01: GSAP scroll-reveal gated on `motionReady` — `tests/e2e/showrooms-console-clean.spec.ts` pass |
| TST-S25 | **DONE** 2026-08-12 | AUDIT-TOOLAUTOSUBMIT-01: `toolautosubmit=""` — Header + MobileNavDrawer; console clean |
| TST-S26 | **DONE** 2026-08-12 | AUDIT-A11Y-01: `btn-accent` fill → `--color-accent-strong` (4.91:1) — homepage axe WCAG2AA clean |
| TST-S27 | **DONE** 2026-08-12 | AUDIT-MOBILE-01: footer 44px, dots 44px hit, pills/chips/breadcrumb ≥44 — `tests/e2e/touch-targets.spec.ts` 2/2 |
| TST-S28 | **DONE** 2026-08-12 | AUDIT-A11Y-02: `aside role=toolbar` → `div role=toolbar` (Planner+Studio) — `test:a11y` 3/3 green |
| TST-S29 | **OPEN** P2 | P2-6: default test lane 17 fails → fix 13 resolvePdpPlanSvgThumb + sitePackageRoot + docs + dev-tools |
| TST-S30 | **OPEN** P2 | P2-8: tech-docs lane JSON stale → two-lane gate reads both |
| TST-S31 | **DONE** 2026-08-12 | P2-2: api-route-safety `other` surface enforced (rate-limit + GET auth allowlist) — audit ok |
| TST-S32 | **DONE** 2026-08-12 | P2-1: `/api/git-user` admin-gated — `tests/unit/app/api/git-user/route.test.ts` 4/4 |
| TST-S33 | **DONE** 2026-08-12 | `/api/dev/auth-bypass-status` 404 in prod — test added |
| TST-S34 | **OPEN** P2 | P2-7: VR baselines only 6 marketing routes → add ooplanner/oostudio/portal/dashboard |
| TST-S35 | **OPEN** P2 | P2-4: `htmlLang.ts` maps fr/de/es → `*-IN` (should be fr-FR/de-DE/es-ES); contradicts `LOCALE_HREFLANG` |

---

## OPS-S — Operations slices ([03-ops-deploy-plan.md](./03-ops-deploy-plan.md))

| ID | Status | Seam / evidence |
|----|--------|-----------------|
| OPS-S01 | **DONE** 2026-08-10 | `docs.oando.co.in` HTTPS 200 |
| OPS-S02 | **DONE** | `check-worker-origin.mjs` OK |
| OPS-S03 | **DONE** | Apex `GET /api/categories/` JSON |
| OPS-S04 | **DONE** | Apex static CSS 200 |
| OPS-S06 | **DONE** | pnpm 11.20.0 + frozen lockfile |
| OPS-S07 | **DONE** | Apex `/ooplanner/` proxy header |
| OPS-S08 | **DONE** | Apex catalog asset HEAD 200 |
| OPS-S09 | **DONE** | Apex `X-Robots-Tag` fixed — F4 closed |
| OPS-S05 | **OPEN** P1 | Vercel token lifecycle: revoke exposed token; vault only |
| OPS-S10 | **OPEN** P2 | P2-9: `/ooplanner/projects/` 401s in bypass mode |
| OPS-S11 | **OPEN** P2 | P2-10: sitemap lists 308-redirected `/planner/features/3d-view/` |
| OPS-S12 | **OPEN** P3 | P3-seo: duplicate `og:locale:alternate` + `og:image:alt` `&amp;` |

---

## COST-S — Vercel cost + SEO ([10-vercel-cost-seo-performance.md](./10-vercel-cost-seo-performance.md))

| ID | Status | Seam |
|----|--------|------|
| COST-S00 | **OPEN** | File plan + `vercel.json` `regions: ["bom1"]` |
| COST-S01 | **OPEN** | Disable `/_next/image` in production |
| COST-S02 | **OPEN** | Static default locale (no `cookies()`/`headers()`) |
| COST-S03 | **OPEN** | Worker cache marketing HTML + `/_next/static` |
| COST-S04 | **OPEN** | Sitemap PDPs + drop `3d-view` |
| COST-S05 | **OPEN** | Homepage CLS ≤ 0.1 |
| COST-S06 | **OPEN** | Content SEO (optional) |

---

## DB-S — Database slices ([04-database-plan.md](./04-database-plan.md))

| ID | Status | Seam |
|----|--------|------|
| DB-S01 | **DONE** | Dry-run: all migrations applied |
| DB-S02 | **DONE** | Admin client env + grants; feature flags smoke |
| DB-S03 | **DONE** | Asset-cutover unit + smoke |
| DB-S09 | **DONE** | Types write UTF-8 (no BOM) |
| DB-S06 | **PARTIAL** P1 | Contact query DB smoke — re-run with Admin keys |
| DB-S04 | **OPEN** P1 | `ops db:types:admin` + typecheck |
| DB-S05 | **OPEN** P1 | `ops db:types` (Products CLI link) |
| DB-S07 | **OPEN** P1 | Retire Products `furniture_catalog` |
| DB-S08 | **OPEN** P1 | Planner save → `oando_plans` (no bypass) |
| DB-S10 | **OPEN** — | `ops db:test` |
| DB-S11 | **OPEN** P2 | DB-1: exports disk-only; breaks on prod read-only FS |
| DB-S12 | **OPEN** P3 | DB-2: `customer_queries` anon-insert POLICY but no anon GRANT |
| DB-S13 | **OPEN** P3 | DB-3: schema.md omits `block_descriptors` from Products service-role-only |

---

## WRK-S — Workspace slices ([05-workspaces-plan.md](./05-workspaces-plan.md))

| ID | Status | Note |
|----|--------|------|
| WRK-S01–S08 | **DONE** | audit-3b fixes #1–#8 |
| WRK-S09 | **DONE** 2026-08-10 | Member Planner e2e (Supabase, DEV_AUTH_BYPASS=0) |
| WRK-S12 | **DONE** | Boundary scan |
| WRK-S13 | **DONE** 2026-08-10 | Responsive audit workspaces (4/4 OK, 10px→11px) |
| WRK-S14 | **DONE** 2026-08-10 | PlannerProjectMenu wired + audit-3c verify |
| WRK-S15 | **OPEN** P2 | P2-5: `/oostudio/` CLS=0.30 + no vitals reporters |
| WRK-S16 | **OPEN** P2 | P2-7: VR coverage missing `/ooplanner`, `/oostudio` |
| WRK-S17 | **OPEN** P2 | P2-9: `/ooplanner/projects/` 401 in bypass (client fetch) |

---

## SITE-S — Site slices ([06-site-plan.md](./06-site-plan.md))

| ID | Status | Note |
|----|--------|------|
| SITE-S01–S07 | **DONE** | Early fixes |
| SITE-S08 | **DONE** | — |
| SITE-S09 | **DONE** | — |
| SITE-S10 | **DONE** | Marquee eager load |
| SITE-S11 | **DONE** | — |
| SITE-S12 | **DONE** 2026-08-10 | Responsive audit marketing (48/48 OK) |
| SITE-S14 | **DONE** | — |
| SITE-S15 | **DONE** 2026-08-10 | Footer locale switcher e2e (hi, 2 passed) |
| SITE-S16 | **DONE** 2026-08-10 | Contact/enquiry path + Resend notifier (19 passed) |
| SITE-S17 | **DONE** | — |
| SITE-S18 | **DONE** | — |
| SITE-S19 | **OPEN** P2 | LH-3: oostudio CLS=0.30 + raw img no dims in Planner islands |
| SITE-S20 | **DONE** 2026-08-12 | 8.3: LanguageSwitcher cookie Secure on HTTPS |
| SITE-S21 | **OPEN** P3 | 3.2: duplicate og:locale:alternate + og:image:alt entity |
| SITE-S22 | **OPEN** P2 | LH-4: /products + /ooplanner Lighthouse timeout |

---

## TECH-S — Tech-docs slices ([07-tech-docs-plan.md](./07-tech-docs-plan.md))

| ID | Status | Note |
|----|--------|------|
| TECH-S01 | **DONE** | Snapshot test isolated Node lane (17/17) |
| TECH-S02 | **DONE** | `pnpm --filter oando-tech-docs gate` |
| TECH-S03 | **DONE** | Root `pnpm run test` tech-docs lane green |
| TECH-S04 | **DONE** | `activeBlockers.ts` cleared (F3 closed) |
| TECH-S05 | **DONE** 2026-08-10 | Prod `docs.oando.co.in` → 200 |
| TECH-S06 | **DONE** | Admin vs Products DB boundaries in docs |
| TECH-S07 | **OPEN** P2 | VR-3/P2-8: tech-docs lane JSON stale — two-lane misread risk |
| TECH-S08 | **OPEN** P2 | VR-2/P2-6: default lane 17 red tests (resolvePdpPlanSvgThumb + sitePackageRoot + docs + dev-tools) |

---

## PX-S — Proxy/auth slices ([09-proxy-auth-hardening-plan.md](./09-proxy-auth-hardening-plan.md))

| ID | Status | Note |
|----|--------|------|
| PX-S00 | **DONE** | Fail-closed API writes; CSP polish; locale matcher removed |
| PX-S01 | **DONE** | 308 short-circuits (svg-catalog, admin studio, /crm, /ops) |
| PX-S02 | **DONE** | Maintenance policy A + label copy |
| PX-S03 | **DONE** | `dashboard/layout` `requireAuthUser` |
| PX-S04 | **DONE** | Drop `a_session_*` |
| PX-S05 | **DONE** | Admin API auth inventory test |
| PX-S06 | **DONE** | COOP/CORP headers; docs |
| PX-S07 | **DONE** 2026-08-12 | SEC-2: `/api/git-user` admin-gated + test |
| PX-S08 | **DONE** 2026-08-12 | SEC-3: `/api/dev/auth-bypass-status` 404 in prod + test |
| PX-S09 | **OPEN** P2 | SEC-4: CSP `script-src 'unsafe-inline'` (ratcheted P2=2) |
| PX-S10 | **DONE** 2026-08-12 | API-2: api-route-safety `other` surface enforced |
| PX-S11 | **OPEN** P2 | P2-9: `/ooplanner/projects/` 401 in bypass |

---

## CHK-S — Session start checklist ([08-oo-start-checklist.md](./08-oo-start-checklist.md))

Always OPEN by design — re-checked at each session start.

| ID | Check | Expect |
|----|-------|--------|
| CHK-S01 | Repo root + `.env.local` + node/pnpm versions | Paths exist |
| CHK-S02 | `pnpm install` from root | `check:layout` OK |
| CHK-S03 | `check:layout` · `verify:focss` · `typecheck` · `p0:unit` | All green |
| CHK-S04 | Read Failures.md + 01-handover | Pick OPEN slice |
| CHK-S05 | `pnpm dev` → localhost:3000 | `/`, `/ooplanner`, `/oostudio` load |
| CHK-S06 | `pnpm run scan:boundaries` | 0 cross-fork edges |
| CHK-S07 | Know Admin vs Products project IDs | AGENTS.md § Databases |
| CHK-S08 | `pnpm run test` = two lanes | Both summaries green |
| CHK-S09 | `check:docs-all` / purity before commit | Exit 0 |
| CHK-S10 | Pick one OPEN id from registry | Start red/green |
| CHK-S11 | Read audit master summary | Know P1/P2 backlog + healthy PASS list |
| CHK-S12 | Verify catalog DB image coverage | 0 products with `images=[]` + null flagship |

---

## AUDIT — Deep audit findings ([agent-reports/audit/00-audit-summary.md](../agent-reports/audit/00-audit-summary.md))

11-track audit complete 2026-08-12. Evidence in `results/audit/`. Reports stay in `agent-reports/audit/` (not `.archive/`). Proposed Failures.md rows were never filed.

### P1 — all mapped and DONE (7)

| ID | Finding | Mapped to |
|----|---------|-----------|
| AUDIT-EXPORTS-01 | `POST /api/exports` un-gated + raw disk write | TST-S22 **DONE** |
| AUDIT-I18N-01 | `<html lang="en">` hardcoded | TST-S23 **DONE** |
| AUDIT-SHOWROOMS-01 | `/showrooms/` hydration crash | TST-S24 **DONE** |
| AUDIT-TOOLAUTOSUBMIT-01 | `toolautosubmit` React warning (41/51 routes) | TST-S25 **DONE** |
| AUDIT-A11Y-01 | Hero color-contrast 3.28:1 (needs 4.5:1) | TST-S26 **DONE** |
| AUDIT-MOBILE-01 | Touch targets <44×44 site-wide | TST-S27 **DONE** |
| AUDIT-A11Y-02 | `aria-allowed-role` on Planner/Studio tool rail | TST-S28 **DONE** |

### P2 — mapped (10)

| ID | Finding | Mapped to |
|----|---------|-----------|
| AUDIT-P2-1 | `GET /api/git-user` leaks committer email | TST-S32 / PX-S07 **DONE** |
| AUDIT-P2-2 | `audit-api-route-safety.mjs` skips "other" surface | TST-S31 / PX-S10 **DONE** |
| AUDIT-P2-3 | CSP `script-src 'unsafe-inline'` | PX-S09 **OPEN** |
| AUDIT-P2-4 | `htmlLang.ts` mis-maps fr/de/es → `*-IN` | TST-S35 **OPEN** |
| AUDIT-P2-5 | LCP / CLS / no vitals reporters | WRK-S15 · SITE-S19 · SITE-S22 **OPEN** (COST-S05 owns homepage CLS — leave 10) |
| AUDIT-P2-6 | Default test lane 17 fails | TST-S29 / TECH-S08 **OPEN** |
| AUDIT-P2-7 | VR baselines only 6 marketing routes | TST-S34 / WRK-S16 **OPEN** |
| AUDIT-P2-8 | Tech-docs lane JSON stale | TST-S30 / TECH-S07 **OPEN** |
| AUDIT-P2-9 | `/ooplanner/projects/` 401 in bypass | OPS-S10 · WRK-S17 · PX-S11 **OPEN** |
| AUDIT-P2-10 | Sitemap lists 308 `/planner/features/3d-view/` | OPS-S11 **OPEN** (COST-S04 overlap — leave 10) |

---

## OPEN by priority

| Pri | Count | IDs |
|-----|-------|-----|
| **P1** | 5 | OPS-S05 · DB-S04 · DB-S05 · DB-S07 · DB-S08 |
| **P1 PARTIAL** | 1 | DB-S06 |
| **P2** | 16 | TST-S29 · TST-S30 · TST-S34 · TST-S35 · OPS-S10 · OPS-S11 · DB-S11 · WRK-S15 · WRK-S16 · WRK-S17 · SITE-S19 · SITE-S22 · TECH-S07 · TECH-S08 · PX-S09 · PX-S11 |
| **P3** | 4 | OPS-S12 · DB-S12 · DB-S13 · SITE-S21 |
| **COST** | 7 | COST-S00–S06 (owned by 10 — do not expand here) |
| **—** | 1 | DB-S10 |

CHK-S01–S12 stay OPEN by design (session start) and are not in the 33.

## Active plans

| Plan | File | Status |
|------|------|--------|
| Mobile app shell (10-phase) | [`oo-ux-shell-program.md`](./oo-ux-shell-program.md) | Plan awaiting approval |
| Vercel cost + SEO | [`10-vercel-cost-seo-performance.md`](./10-vercel-cost-seo-performance.md) | COST-S00–S06 OPEN |

85% programme: retired — Phase A in `agent-reports/audit/`; Phase B text remains in [`02-testing-plan.md`](./02-testing-plan.md).
