# OO Deep Audit + 85% Strict Quality Program

**Plan location:** `plans/oo-deep-audit-85-strict-quality-program.md` (repository-local).

**Status:** Phase A COMPLETE 2026-08-12 — reports in [`agent-reports/audit/`](../agent-reports/audit/00-audit-summary.md). Do not re-run Phase A. Phase B/C still pending. Leftover P1/P2 are TST/OPS/PX IDs in [`00-README.md`](./00-README.md), not new audit tracks.
**Repo:** `E:\oo08082026` — Next 16 `site/` + `tech-docs-generator/` + `tests/` + `workers/`
**Authority:** user > live code + fresh commands > `AGENTS.md` > `Agents/` > `docs/`
**Bar:** 85% very strict, all 4 metrics, proper (non-hollow) tests. Execute slowly, check 3×, no shortcuts.
**Home:** This plan lives in `plans/` (flat Markdown only). Audit reports stay in `agent-reports/audit/`. Raw evidence (PNG/JSON/HTML/TXT) goes to `results/audit/` per `AGENTS.md` §1.

---

## Decisions (your review, 2026-08-11)

1. **85% on gated profiles** — keep 95→85 on planner-gate / site / admin + add 85% to inventory (today no threshold). You said "right for 85% as long as it's a proper test." Proper = `test:audit:hollow` 0 violations, `audit-gate-skips` 0, no `any`, both lanes green.
2. **`plans/` flat** — "go as per repo rules." No subfolders, no unlisted files. Audit output here in `agent-reports/audit/`.
3. **Speed vs quality** — "totally your call." Methodical: read → evidence → plan → TDD slice → gate → 3× check.
4. **Agents** — "ok to your idea." `AGENTS.md §2` caps 2 parallel; 3rd queues. Max 3 total.
5. **85% on all 4 metrics** — "ok to your idea." Statements/branches/functions/lines, no selective lowering.
6. **Perf gate** — "can't offer a decent suggestion." Audit Lighthouse in Phase A, fix P0s, gate in Phase C.

## Pushback on record

- 95→85 **relaxes** the gate (repo is at 95% today on 3 profiles). Accepted on condition of proper tests.
- Lighthouse gate will initially fail (LCP/fabric). Audit-first, gate-later.
- DB live tests skip silently without `SUPABASE_AUTH_DATABASE_URL` / `PRODUCTS_DATABASE_URL` — green local can be false; audit notes skips.

---

## 11 tracks (your 6 + 5 more)

| # | Track | Source files | Report |
|---|-------|--------------|--------|
| 1 | UI Desktop | `site/components/site/Header.tsx`, `site/focss/*`, `(site)`+`/oostudio`+`/ooplanner`+`/admin` @ 1440/1920 | `01-ui-desktop.md` |
| 2 | UI Mobile | `MobileNavDrawer.tsx`, safe-area, touch ≥44px @ 390/360 + tablet 820 | `02-ui-mobile.md` |
| 3 | SEO | `site/app/robots.ts`, `sitemap.ts`, `routeMetadata.ts`, `seo.ts`, `routeClassification.ts`, `proxy.ts` | `03-seo.md` |
| 4 | Security | `site/proxy.ts`, `site/lib/security/csrf.ts`, `withAuth.ts`, `rateLimit.ts`, `env.server.ts` | `04-security.md` |
| 5 | Database | 2 DBs (Admin `rxzpznmxbaoxpikowmfc` / Products `erpweaiypimorcunaimz`), `migrations/`+`migrations.admin/`, RLS grant+policy, `archive` | `05-database.md` |
| 6 | Lighthouse+perf | LCP≤2.5s/INP≤200ms/CLS≤0.1, `SiteAnalytics.tsx` (no vitals reporters), `next/font`, `next/image`, `fabric/jspdf/mastra` | `06-lighthouse.md` |
| 7 | Accessibility | WCAG 2.2 AA + 44×44, `tests/e2e/accessibility.spec.ts` (AxeBuilder), landmarks/focus/ARIA | `07-accessibility.md` |
| 8 | i18n | `site/i18n/*` (5 locales, `localePrefix:"never"`), `LanguageSwitcher.tsx`, `htmlLang` bug, `check-i18n-key-parity.mjs` | `08-i18n.md` |
| 9 | API safety | `docs/architecture/routes.md` (65+), `audit-api-route-safety.mjs` | `09-api-route-safety.md` |
| 10 | Console+runtime | `page.on(console/pageerror/requestfailed)`, hydration, 404s | `10-console-runtime.md` |
| 11 | VR+E2E | `ui-polish-pass1-audit.mjs`, `responsive-audit.mjs`, `playwright-gate-specs.json` (10), `hollow-test-patterns`, `audit-gate-skips` | `11-visual-regression-e2e.md` |

**Report skeleton:** Overview · Method (commands, viewports, routes) · Findings `[P0|P1|P2|P3]` w/ evidence (file:line / command / `results/audit/` path) · Deferred · Changed files = `None (audit only)` · Blockers (proposed `Failures.md` rows, not applied).

## Phases

**A — Audit (no code changes).** 2 parallel + 1 queued agent. `pnpm dev` (DEV_AUTH_BYPASS=1, disk) on `localhost:3000` only. `networkidle`+`fonts.ready` before screenshots. Evidence → `results/audit/{screenshots,a11y,lighthouse,console}`. Reports → `agent-reports/audit/`. Master `00-audit-summary.md` last.
- Agent A (tracks 1,2,7) — **DONE 2026-08-11**. Reports written; evidence in `results/audit/`.
- Agent B (tracks 3,4,8,9) — pending.
- Agent C (tracks 5,6,10,11) — pending, queued.

**B — 85% strict (after audit review).** 4 files, 16 numbers + inventory threshold:

| File | Constant | 95→85 |
|------|----------|-------|
| `tests/vitest.shared.ts` | `VITEST_PLANNER_GATE_THRESHOLDS` | 85×4 |
| `tests/vitest.site.config.ts` | `thresholds` | 85×4 |
| `tests/vitest.admin.coverage.config.ts` | `thresholds` | 85×4 |
| `scripts/coverage-policy.mjs` | `COVERAGE_GATE_PLANNER/ADMIN/SITE/INVENTORY_ASPIRATION` | 85×4 |
| `tests/vitest.coverage.inventory.config.ts` | add `thresholds` (today none) | 85×4 new |

Proper-test enforcement: `test:audit:hollow` 0, `audit-gate-skips` 0, `audit-eslint-disable` 0, no `any`, `pnpm run test` both lanes green, `scan:boundaries` green.

**C — Fix P0s→P1s.** One slice/PR, TDD red→green, `pnpm run gate` before review, `pnpm run release:gate` before merge.

## Verification (fresh commands only)

```
pnpm run check:layout
pnpm run scan:boundaries
pnpm run verify:focss
pnpm run lint && pnpm run lint:ui:strict
pnpm run typecheck && pnpm run typecheck:tests
pnpm run check:site-ui
pnpm run check:style-tokens
pnpm run check:governance        # P4_migration_no_rollback vs 42
pnpm run check:launch             # validate-launch-env + scan_secrets + db_test_connection
pnpm run gate                     # fast
pnpm run test                     # BOTH lanes — read results/tests/vitest-results.json AND vitest-tech-docs-results.json
pnpm run build
pnpm run test:a11y
pnpm run test:planner-catalog
pnpm run test:coverage && pnpm run test:coverage:site
pnpm run release:gate
```

Browser probes: `node scripts/ui-polish-pass1-audit.mjs`, `node scripts/responsive-audit.mjs`, `npx lighthouse http://localhost:3000 --output json --output-path results/audit/lighthouse/root-mobile.json --form-factor=mobile`.

## Hard rules

- Browser: `http://localhost:3000` only, never `127.0.0.1`.
- No writes to `site/data/storage/` (legacy). No dual-write. Use mode-aware wrappers.
- No migration without `-- rollback`. No `any`.
- Only `.md` in `agent-reports/audit/`. Raw evidence in `results/audit/`.
- Never invent browser/build state — fresh command or it didn't happen.

## Progress

- [x] Repo read at depth (AGENTS, Agents/1-7, docs/architecture, docs/database, Testing-handbook, vitest configs, coverage-policy, package.json gates, proxy, i18n, robots, sitemap)
- [x] Plan approved with pushback recorded
- [x] Phase A — Agent A done (tracks 1, 2, 7): `01-ui-desktop.md`, `02-ui-mobile.md`, `07-accessibility.md` + evidence in `results/audit/`
- [x] Phase A — Agent B (tracks 3, 4, 8, 9): `03-seo.md`, `04-security.md`, `08-i18n.md`, `09-api-route-safety.md`
- [x] Phase A — Agent C (tracks 5, 6, 10, 11): `05-database.md`, `06-lighthouse.md`, `10-console-runtime.md`, `11-visual-regression-e2e.md`
- [x] Phase A — `00-audit-summary.md`
- [ ] Phase B — 85% strict thresholds (4 files)
- [ ] Phase C — remaining OPEN IDs in [`00-README.md`](./00-README.md) (audit P1s TST-S22–S28 already DONE)
