# Database & persistence plan — AUDITED 2026-08-08

**Status:** PARTIAL — mode-aware wrappers verified; asset-cutover smoke pass; contact DB smoke pass; Products bucket retirement, type regen, and Supabase-mode Planner proof OPEN. **P0:** Catalog DB missing catalog_categories and catalog_products tables — migration 20260801130000_create_furniture_catalog.sql exists but not applied.
**Owner / when to use:** Anyone touching Supabase migrations, persistence selectors, or R2/CDN asset cutover.
**Related:** [`Failures.md`](../Failures.md) · [`OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md) · [05-workspaces-plan.md](./05-workspaces-plan.md) · [03-ops-deploy-plan.md](./03-ops-deploy-plan.md) · `docs/database/schema.md` · `site/platform/supabase/migrations*/`

**Databases:** Admin `rxzpznmxbaoxpikowmfc` · Products `erpweaiypimorcunaimz`

---

## Goal

One source of truth per data domain: dev disk (`DEV_AUTH_BYPASS=1`) vs Supabase (Admin + Products) with mode-aware wrappers only — no dual-write, no raw `fs` in production API paths, and every table has matching grants + RLS policies.

---

## Who does what

| Role | Responsibility |
|------|----------------|
| DBA / infra | Apply migrations (`db:apply`, `db:apply:admin`); retire Products buckets after smoke |
| Feature dev | Use wrappers (`writeFurnitureItem`, planner store, etc.) — never raw disk helpers in routes |
| Workspace owner | Prove `feature_flags` grants unblock Planner place-furniture ([05-workspaces-plan.md](./05-workspaces-plan.md)) |

---

## Current state

| Data | Dev (disk) | Prod (Supabase) | Mode selector | Verdict |
|------|------------|-----------------|---------------|---------|
| Planner projects | `platform/Planner/data/projects/` | Admin `oando_plans` | `lib/Planner/plannerPersistenceMode.ts` | Wrapper exists — **not live-proven in Supabase preview** |
| Furniture library | `platform/shared/data/furniture/` | Admin DB + `catalog-assets` | `lib/catalog/furnitureCatalogMode.ts` | Admin path live; Products `furniture_catalog` + bucket **still exist** — not retired |
| Descriptors | `site/inventory/descriptors/` | Admin `block_descriptors` | `blockDescriptorStore.supabase.ts` | Supabase select path wired |
| Contact queries | — | Admin `customer_queries` | Admin client | DB smoke **pass** (`results/asset-cutover/smoke-report.json` contact → 201); unit smoke re-run optional |
| Planner symbols/GLB | — | Products `catalog-assets` | — | **OPEN — migrate to Admin or document keep** |
| `feature_flags` grants | — | Products + Admin migrations | `20260806120000_feature_flags_grants.sql` | Both Admin and Products migrations created; Admin applied locally — **live Planner proof OPEN** |
| Type drift | Hand-patches in `database.types.ts` | CLI regen overwrites | `pnpm run ops db:types*` | **OPEN regen + patch merge** |

**Migration governance:** baseline `P4_migration_no_rollback = 42`; new migrations need `-- rollback` section.

**Mode-aware writes:** grep shows `fs.writeFile` only in `exportsStore.ts` helper; Studio call sites gated by `getFurnitureCatalogMode() === "disk"` — **verified 2026-08-08**.

---

## Step-by-step instructions

1. **Dry-run Admin migrations**
   ```powershell
   pnpm run ops db:apply:admin -- --dry
   ```
   **Expect:** no pending migrations or listed SQL only. **If pending:** review SQL + rollback, then apply without `--dry`.

2. **Apply Admin migrations** (when dry-run shows work)
   ```powershell
   pnpm run ops db:apply:admin
   ```
   **Expect:** `all up to date` or success; entry in `_local_migration_history`.

3. **Prove `feature_flags` unblocks Planner** — after grants, re-run [05-workspaces-plan.md](./05-workspaces-plan.md) `audit-3b` with `DEV_AUTH_BYPASS=0` on preview.

4. **Asset cutover smokes**
   ```powershell
   pnpm exec vitest run --config tests/vitest.config.ts tests/unit/lib/assetPaths.test.ts
   pnpm exec vitest run --config tests/vitest.config.ts tests/unit/scripts/asset-cutover-r2.smoke.test.ts
   node scripts/asset-cutover-smoke.mjs
   ```
   **Expect:** exit 0. Artifacts under `results/asset-cutover/` — verify `overall: "pass"` in `smoke-report.json`.

5. **Contact DB smokes** (requires live Admin keys in `.env.local`)
   ```powershell
   pnpm exec vitest run --config tests/vitest.config.ts tests/unit/features/site/contact/createCustomerQuery.db.smoke.test.ts
   pnpm exec vitest run --config tests/vitest.config.ts tests/unit/app/api/customer-queries/route.db.smoke.test.ts
   ```

6. **Regenerate types** (after schema change)
   ```powershell
   pnpm run ops db:types:admin
   pnpm run ops db:types
   pnpm run typecheck
   git diff --exit-code site/platform/types/
   ```
   **Expect:** re-apply hand-patches from `site/platform/types/patches/*.json` if CLI overwrote furniture/descriptor shapes.

7. **Retire Products furniture bucket** — only after apex catalog smoke green ([03-ops-deploy-plan.md](./03-ops-deploy-plan.md)) + R2 decode 824/824:
   - Delete Products `furniture_catalog` rows, `catalog-assets` objects, and `f_vitest_*` junk in one window.
   - Update `docs/database/schema.md`.

---

## Verification checklist

- [ ] `pnpm run ops db:apply:admin -- --dry` — no surprise pending SQL
- [ ] No raw `fs.writeFile` in `site/app/api/**` without disk-mode guard
- [ ] `asset-cutover-r2.smoke.test.ts` — pass
- [ ] Contact DB smokes — pass with live keys
- [ ] `pnpm run ops db:types:admin` + `db:types` — clean diff or patched intentionally
- [ ] `pnpm run typecheck` — exit 0 after type gen
- [ ] Apex `GET /api/categories` count > 0 before Products bucket retirement
- [ ] Dated `results/database/*` artifact before marking COMPLETE

---

## Open items

1. **P0:** Re-prove Planner `placeFurnitureAt` after Admin `feature_flags` grants (with [05-workspaces-plan.md](./05-workspaces-plan.md)).
2. **P1:** Retire Products `furniture_catalog` + `catalog-assets` after apex catalog smoke green (verified) + R2 decode 824/824 (verify `results/asset-cutover/smoke-report.json`).
3. **P1:** Regenerate types and reconcile patches.
4. **P2:** Decide symbols/GLB — Admin vs Products; document in schema.
5. **P2:** Split `assetPaths.ts` into `assetAliases`, `catalogNesting`, `imageVariant`, `legacyRewrite`.
6. **P2:** Drop Worker legacy `/images` dual-serve after DB URL rewrite.
7. **P2:** Asset cutover Phase 09 (contact fallback + `home.*` i18n).

---

## Key paths & commands

| Item | Path / command |
|------|----------------|
| Admin migrations | `site/platform/supabase/migrations.admin/` |
| Products migrations | `site/platform/supabase/migrations/` |
| Planner persistence | `lib/Planner/plannerPersistenceMode.ts`, `site/server/Planner/plannerStore.ts` |
| Furniture catalog mode | `lib/catalog/furnitureCatalogMode.ts` |
| Asset paths | `site/lib/assetPaths.ts` |
| R2 clean bucket | `oando-assets-clean-20260805` |
| Catalog file route | `site/app/api/files/catalog/[...path]/route.ts` |
| Apply Admin DB | `pnpm run ops db:apply:admin` |
| Type gen | `pnpm run ops db:types:admin` · `pnpm run ops db:types` |
| Governance | `pnpm run check:governance` |

*Never dual-write. Blockers: [`Failures.md`](../Failures.md) only.*
