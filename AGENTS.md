<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Process floor

## 1. Truth
- **User Wins.** Then: live code + fresh commands > `AGENTS.md` > `Agents/` > `docs/`.
- Never invent browser/build state — run a command.
- **Blockers:** `Failures.md` only.
- **Placement:** plans → `plans/*.md` · audits → `agent-reports/**/*.md` · evidence → `results/**`.

## 2. Work
- Repo root only. **Never create worktrees.** **`pnpm`** only.
- Smallest sound change. No handwritten `any`.
- Secrets: `.env.local` (and `site/.env.local`).
- UI: `http://localhost:3000` only — never `127.0.0.1`.
- Max **2** parallel subagents; queue the rest. Dependent steps stay serial.

## 3. Layout
Studio (`/oostudio`) and Planner (`/ooplanner`) are **forked** — never import each other. Run `pnpm run scan:boundaries` before committing either tree.

| Path | Role |
|------|------|
| `site/` | Next app |
| `site/app/(site)`, `site/app/admin` | Marketing + Admin |
| `site/{components,lib,hooks,store,server}/{Studio,Planner}/` | Fork trees |
| `site/focss/` | CSS (`@focss/*`) |
| `tests/`, `tech-docs-generator/`, `config/build/` | Tests, inventory SPA, harness |
| `site/platform/shared/data/` | Furniture (disk dev only) |
| `plans/` · `.archive/audit/` · `results/` | Plans · audit MD (archived) · generated output |

`site/data/storage/` is legacy — do not write there.

## 4. Databases

| | Ref | Holds |
|---|-----|-------|
| **Admin** | `rxzpznmxbaoxpikowmfc` | Plans, profiles, handoffs, teams, price books, queries, audit, **furniture** + **descriptors** |
| **Products** | `erpweaiypimorcunaimz` | Marketing catalog, configurator, flags, themes |

Staff/customer + furniture + descriptors → **Admin**. Marketing catalog tables → **Products**.

## 5. Persistence (no dual-write)

> **Production filesystem is read-only.** Raw disk helpers will throw `EROFS`. All runtime writes must use mode-aware wrappers.

Disk when `DEV_AUTH_BYPASS=1` (non-prod). Else Supabase. Prod FS is read-only. Use mode-aware wrappers (`writeFurnitureItem`, …), never raw disk helpers.

| Data | Disk | Supabase | Selector |
|------|------|----------|----------|
| Plans | `site/platform/Planner/data/projects/` | `oando_plans` | [`plannerPersistenceMode.ts`](site/lib/Planner/plannerPersistenceMode.ts) |
| Furniture | `site/platform/shared/data/furniture/` | `furniture_catalog` | [`furnitureCatalogMode.ts`](site/lib/catalog/furnitureCatalogMode.ts) |
| Descriptors | `site/inventory/descriptors/` | `block_descriptors` | (same as furniture) |

Seed: `pnpm run seed:furniture` (off the read path).

## 6. Gates
- Before done: `pnpm run check:layout`, then `pnpm run gate`.
- Ship: `pnpm run release:gate`.
- CSS: `verify:focss`, `lint:ui:strict`, `check:style-tokens`.
- `pnpm run test` = **two** vitest lanes (default + tech-docs). Check both. DOM: **happy-dom**.

## 7. Migrations
- Need `-- rollback`. `check:governance` ratchets `P4_migration_no_rollback` against the current baseline (`config/quality/governance-baseline.json`).
- Apply: `pnpm run ops db:apply` / `db:apply:admin` — always `--dry` first.
- Grants **and** policies. Types: `ops db:types:admin`, `ops db:types`.

## 8. Traps
1. One green test summary ≠ full suite.
2. Migration without `-- rollback`.
3. Disk write in prod.
4. Studio ↔ Planner import.
5. `127.0.0.1` instead of `localhost`.
6. Audit MD under `plans/`, or PNG under `agent-reports/`.

## 9. Handbooks
| Topic | Open |
|-------|------|
| Standard | `Agents/01-standard.md` |
| Testing | `Agents/02-testing.md`, `Testing-handbook.md` |
| Browser | `Agents/03-browser.md` |
| Blockers | `Agents/04-failures.md`, `Failures.md` |
| Docs | `Agents/05-documentation.md`, `DOC-MAP.md`, `CONTENTS.md` |
| Architecture | `Agents/06-architecture.md`, `docs/architecture/product-map.md`, `docs/architecture/stack.md`, `docs/architecture/routes.md` |
| CSS | `Agents/07-css.md`, `docs/architecture/css.md` |
| Tech-docs SPA | `tech-docs-generator/README.md` (detail also in product-map § Tech-docs) |
| Onboarding / ops | `START.md`, `OPERATIONS_RUNBOOK.md`, `README.md`, `Testing-handbook.md` |
| Plans / audits | `plans/README.md`, `agent-reports/README.md` |

| JIT | Applies to |
|-----|------------|
| `.github/instructions/focss.instructions.md` | `site/focss/**/*.css` |
| `.github/instructions/testing.instructions.md` | `tests/**/*.{ts,tsx}` |
| `.github/instructions/boundaries.instructions.md` | Studio/Planner forks |
| `.github/instructions/migrations.instructions.md` | `**/supabase/migrations/**/*.sql` |
| `.github/skills/README.md` | 16 skills (no `/gate` or `/new-test`) |
