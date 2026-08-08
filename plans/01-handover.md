# Handover -- Session Close

**Date:** 2026-08-08
**Branch:** main
**Status:** ACTIVE — repo docs, plans, scripts, and Drizzle schema aligned with live two-DB architecture; all plan-referenced scripts verified on disk.

---

## 1. What Changed (this session, in order)

| # | Change | Files | Evidence |
|---|--------|-------|----------|
| 1 | **Audited database structure** — confirmed two Supabase projects (Products `erpweaiypimorcunaimz` / Admin `rxzpznmxbaoxpikowmfc`), 19 Products tables (incl. legacy `furniture_catalog` + `block_descriptors`), 23 Admin tables (canonical copies migrated in Phase 05), RLS + `archive` schema | `docs/database/*` · `site/platform/types/*` | Two-DB report |
| 2 | **Aligned all markdown to repo truth** — `block_descriptors` + `furniture_catalog` location (Products → Admin) across root, docs, Agents | `AGENTS.md`, `README.md`, `START.md`, `docs/**/*.md`, `Agents/*.md` | Zero stale product-DB refs remain |
| 3 | **Updated `docs/architecture/`** and removed a stale generated file | `docs/architecture/{README,product-map,stack,source-map,tech-docs-link,routes-pages}.md`, deleted `sitemap-routes.csv` | Dir clean; 9 files + `.gitkeep` |
| 4 | **Updated all plans + related MDs** — blocker taxonomy F1/F2 → P0-1/P0-2/P0-3, `HANDOVER.md` → `plans/01-handover.md`, purity count 6→8, checklist UTF-16→UTF-8 | `plans/*.md`, `Failures.md`, `CONTENTS.md`, `DOC-MAP.md` | `check-plans-purity` OK |
| 5 | **Updated all scripts** — repo refs `oo05082026`/`ayushonmicrosoft` → `oo08082026`/`pglcarpets`, wrong local path, `block_descriptors`/`furniture_catalog` moved to Admin in DB-check/seed/descriptor scripts | `scripts/*.{ps1,bat,mjs,ts}` | `node --check` all pass |
| 6 | **Fixed 7 Drizzle-schema / migration drift items** — removed phantom `profiles.email`/`profiles.role` + their indexes, removed non-existent `review_links`/`review_comments`, added `furnitureCatalog` + `blockDescriptors` to Admin schema, updated unit test | `site/platform/drizzle/schema/planner.ts`, `migrations/0001_add_missing_indexes.sql`, `tests/unit/platform/drizzle/schema/planner.test.ts` | Unit test 3/3 pass |
| 7 | **Updated plan files + related docs** — F1/F2 → P0-1/P0-2 in runbook, testing handbook, stack, restore, benchmarks; removed resolved drift from `docs/database/schema.md` | `OPERATIONS_RUNBOOK.md`, `Testing-handbook.md`, `docs/**/*.md` | 0 stale F1/F2 refs |
| 8 | **Added "Scripts — when to run what"** consolidated table to the plans index | `plans/00-README.md` | `check-plans-purity` OK |

---

## 2. Verification

| Gate | Command | Result | Evidence |
|------|---------|--------|----------|
| Planner schema unit | `pnpm exec vitest run tests/unit/platform/drizzle/schema/planner.test.ts` | **3/3 pass** | Table names match live Admin DB |
| Modified `.mjs` syntax | `node --check` on changed scripts | **All pass** | No parse errors |
| Plans purity | `node scripts/general/check-plans-purity.mjs` | **OK** | README + 8 plan docs, no subfolders |
| Script existence | `Test-Path` on all plan-referenced scripts | **All present** | 10/10 on disk |
| Stale ref scan | grep for F1/F2, `HANDOVER.md`, `oo05082026`, product-DB descriptor refs | **Clean** | 0 remaining |

---

## 3. Current Architecture (quick reference)

- **Two DBs:** Products (catalog/configurator/themes/flags — legacy furniture + descriptor copies remain) · Admin/Planner (plans, profiles, handoffs, teams, price books, queries, audit, **furniture_catalog + block_descriptors canonical**).
- **`profiles` has no `email`/`role`** — writing either returns PGRST204 (previously broke every Planner save).
- **`archive.plans` is not the Planner store — `public.oando_plans` is.**
- **Every migration needs a `-- rollback` section** (governance baseline `P4_migration_no_rollback = 42`); grants + policies both required.
- **Persistence is exclusive-mode** — disk under `DEV_AUTH_BYPASS=1`, Supabase otherwise; never dual-write.
---

## 4. Active Blockers (from `Failures.md`, 5 rows)

| ID | Priority | Blocker |
|----|----------|---------|
| F3 | P0 | `docs.oando.co.in` no public DNS (NXDOMAIN) |
| P0-1 | P0 | Product page hydration mismatches (6 routes) |
| P1-2 | P1 | Theme fetch fails (falls back to local tokens) |
| P1-3 | P1 | Auth `withAuth:mirror:throw` + rate-limit 401s from `127.0.0.1` |
| P1-4 | P1 | `pnpm-lock.yaml` v9.0 vs `packageManager` pnpm@11.20.0 |

Blocker → plan mapping: hydration → 06-site-plan #4 · theme → 06-site-plan · auth 127.0.0.1 → 02-testing-plan #2 · lockfile → 03-ops-deploy-plan #5.

---

## 5. Where to Go Next

| Priority | Item | Plan / Doc |
|----------|------|------------|
| P0 | Close click-to-place (audit-3b) with live Supabase proof | [05-workspaces-plan.md](./05-workspaces-plan.md) |
| P0 | F3 docs DNS CNAME in Cloudflare | [03-ops-deploy-plan.md](./03-ops-deploy-plan.md) |
| P1 | Regenerate DB types (`ops db:types:admin` / `db:types`) and reconcile | [04-database-plan.md](./04-database-plan.md) |
| P1 | Fix marketing hydration + ledger findings | [06-site-plan.md](./06-site-plan.md) |
| P1 | Theme fetch fails (falls back to local tokens) | [06-site-plan.md](./06-site-plan.md) |
| P1 | Auth `withAuth:mirror:throw` + rate-limit 401s from `127.0.0.1` | [02-testing-plan.md](./02-testing-plan.md) |
| P1 | `pnpm-lock.yaml` v9.0 vs `packageManager` pnpm@11.20.0 | [03-ops-deploy-plan.md](./03-ops-deploy-plan.md) |
| P2 | Expand strict 90% inventory coverage + E2E `audit-3b/3c/2a/4a` | [02-testing-plan.md](./02-testing-plan.md) |

**Scripts — when to run what:** consolidated table in [00-README.md](./00-README.md#scripts--when-to-run-what); full inventory via `pnpm run ops list`.

---

## 6. Quick Start for Next Session

1. Read this handover.
2. Read `Failures.md` (5 rows — 1 P0 + 4 P1).
3. Run the Fast Gate from `08-oo-start-checklist.md`.
4. Pick a programme from `plans/00-README.md` (suggested: 05-workspaces-plan for audit-3b, or 06-site-plan for hydration/theme/auth).
5. Bump plan `AUDITED` dates and existing artifacts under `results/` as items land.

---

*Generated: 2026-08-08*
