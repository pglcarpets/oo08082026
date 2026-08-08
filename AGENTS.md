<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Process & Rules

## 1. Authority & Truth
*   **User Wins:** User instructions override everything (including this file).
*   **Source of Truth:** Live code + filesystem + fresh root commands > `AGENTS.md` > `Agents/` > `docs/`.
*   **Do Not Invent:** Never claim browser outcomes or build states without verifying via a fresh command. Rely on live code, not stale notes.
*   **Blockers:** Tracked in `Failures.md` only. Raw tool output goes in `results/`.

## 2. Execution Protocol
*   **Root Only:** Always work from the repo root. **Never create worktrees.**
*   **Package Manager:** Use **`pnpm`** exclusively from the root.
*   **Code Quality:** Make the smallest sound change. Preserve unrelated code. No handwritten `any`.
*   **Secrets:** Store only in `.env.local` (and `site/.env.local`).
*   **UI Testing:** Strict use of `http://localhost:3000` (Auth cookies are host-bound. Never use `127.0.0.1`).

## 3. Product Layout & Architecture
**CRITICAL:** Studio (`/oostudio`) and Planner (`/ooplanner`) are strictly forked. **They never import each other.** Run `pnpm run scan:boundaries` before committing changes to either tree.

| Path | Role |
|------|------|
| `site/` | Next app (`pnpm dev` / `pnpm build`) |
| `site/app/(site)`, `site/app/admin` | Marketing (Root `/`) + Admin routes |
| `site/components/{Studio,Planner}` | Fork trees (also applies to `lib/`, `hooks/`, etc.) |
| `site/focss/` | CSS home (`@focss/*`) |
| `tests/`, `tech-docs-generator/`, `config/build/` | Vitest/Playwright, Vite UI, Harness configs |
| `site/platform/shared/data/` | Furniture library + exports (**dev disk mode only**) |
| `site/platform/{Studio,Planner}/data/` | Per-fork uploads/projects (**dev disk mode only**) |

*Note: `site/data/storage/` is legacy. Do not write to it.*

## 4. Databases
We use **two distinct databases**. (Rule of thumb: Customer/staff data is Admin; Catalog data is Products).

| Role | Project ID | Holds |
|------|------------|-------|
| **Admin** | `rxzpznmxbaoxpikowmfc` | Plans, profiles, handoffs, teams, price books, queries, audit, furniture library + `catalog-assets` |
| **Products** | `erpweaiypimorcunaimz` | Catalog, configurator, descriptors, flags |

## 5. Persistence (Never Dual-Write)
Production uses a read-only filesystem (Supabase). Dev uses disk (`DEV_AUTH_BYPASS=1`). Route handlers **must** use mode-aware wrappers (e.g., `writeFurnitureItem`), never raw disk helpers.

| Data | Disk (Dev) | Supabase (Prod) | Mode Selector |
|------|------------|-----------------|---------------|
| Planner projects | `platform/Planner/data/projects/` | `oando_plans` (Admin) | `lib/Planner/plannerPersistenceMode.ts` |
| Furniture library | `platform/shared/data/furniture/` | `furniture_catalog` (Admin) | `lib/catalog/furnitureCatalogMode.ts` |
| Published desc. | `site/inventory/descriptors/` | `block_descriptors` (Admin)| (Same as furniture) |

*Note: Seeding is off the read path via `pnpm run seed:furniture`.*

## 6. Verification & Gates
*   **Fast checks:** `pnpm run check:layout` (before completion), `pnpm run gate`.
*   **Full checks:** `pnpm run release:gate`.
*   **CSS/UI Linting:** `verify:focss`, `lint:ui:strict`, `check:composer-styles`, `check:style-tokens`.
*   **Tests (`pnpm run test`):** Runs **two lanes** (default + tech-docs). Check BOTH summaries; one green summary does not equal a passing suite. Unit DOM environment is **happy-dom**.

## 7. Migrations
*   **Rollbacks Required:** Every migration needs a `-- rollback` section. `check:governance` ratchets `P4_migration_no_rollback` against a baseline of **42** and fails if it rises.
*   **Applying:** `db:apply` runs lexicographically at/after `20260524` (tracked in `_local_migration_history`). Always use `--dry` first.
*   **Supabase:** Requires **grants AND policies**. (e.g., a policy without `grant select … to anon, authenticated` fails).
*   **Types:** Regenerate post-schema changes: `db:types:admin` and `db:types`.

## 8. Common Mistakes (Checklist)
1.  **Test Suites:** Misreading `pnpm run test` (failing to check both lane summaries).
2.  **Migrations:** Forgetting the `-- rollback` section and failing governance.
3.  **Filesystem:** Writing to disk in production instead of using mode-aware wrappers.
4.  **Boundaries:** Importing Studio components into Planner (or vice versa).
5.  **Environment:** Using `127.0.0.1` instead of `localhost:3000`, breaking auth.

## 9. Context & Handbooks

### Agent Handbooks
*   **Standard:** `Agents/01-standard.md`
*   **Testing:** `Agents/02-testing.md`, `Testing-handbook.md`
*   **Browser / E2E:** `Agents/03-browser.md`
*   **Blockers:** `Agents/04-failures.md`, `Failures.md`
*   **Docs / Maps:** `Agents/05-documentation.md`, `docs/README.md`, `DOC-MAP.md`, `CONTENTS.md`
*   **Architecture:** `Agents/06-architecture.md`, `docs/architecture/product-map.md`
*   **CSS:** `Agents/07-css.md`, `docs/architecture/css.md`
*   **Ops:** `START.md` (Onboarding), `OPERATIONS_RUNBOOK.md` (Deploy/Rollback), `README.md`

### VS Code Customizations (JIT Instructions)
| File | Applies to | Purpose |
|------|------------|---------|
| `.github/instructions/focss.instructions.md` | `site/focss/**/*.css` | FOCSS boundaries, tokens, verification |
| `.github/instructions/testing.instructions.md` | `tests/**/*.{ts,tsx}` | Conventions, mocking, two-lane awareness |
| `.github/instructions/boundaries.instructions.md`| `site/**/{Studio,Planner}/**` | Fork isolation rules |
| `.github/instructions/migrations.instructions.md`| `**/supabase/migrations/**/*.sql`| Rollbacks, Supabase grants |
| `.github/skills/README.md` | Agent skills | 16 pinned skills (Note: no `/gate` or `/new-test` commands exist) |