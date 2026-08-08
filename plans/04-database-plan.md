# Database & persistence plan — vertical slices

**AUDITED:** 2026-08-08 · **Databases:** Admin `rxzpznmxbaoxpikowmfc` · Products `erpweaiypimorcunaimz`.  
**Related:** [`docs/database/schema.md`](../docs/database/schema.md) · [`04-database-plan.md`](./04-database-plan.md).

**Rule:** Mode-aware wrappers only — never dual-write; every migration needs `-- rollback`.

---

## DONE slices

### DB-S03 — Asset cutover unit smokes

| Field | Value |
|-------|-------|
| **Slice ID** | DB-S03 |
| **Seam** | `tests/unit/lib/assetPaths.test.ts` + `tests/unit/scripts/asset-cutover-r2.smoke.test.ts` |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | _(completed)_ |
| **Green** | _(completed)_ |
| **Evidence** | Vitest pass; `node scripts/asset-cutover-smoke.mjs` `overall:"pass"` |
| **Depends on** | — |
| **Status** | DONE |

### DB-S09 — Types UTF-8 write (BOM strip — code review)

| Field | Value |
|-------|-------|
| **Slice ID** | DB-S09 |
| **Seam** | `scripts/db_gen_admin_types.ts` `writeFileSync(..., "utf8")` + `plans/08-oo-start-checklist.md` UTF-8 |
| **Seam confirmation** | - [x] Owner confirms seam |
| **Red** | Write types with UTF-16 BOM; `typecheck` or parse fails |
| **Green** | Admin types gen uses `utf8`; checklist file UTF-8 |
| **Evidence** | `db_gen_admin_types.ts` line 242 `utf8`; checklist readable UTF-8 (2026-08-08) |
| **Depends on** | — |
| **Status** | DONE |

---

## PARTIAL slices

### DB-S02 — feature_flags grants unblock Planner (P0)

| Field | Value |
|-------|-------|
| **Slice ID** | DB-S02 |
| **Seam** | Admin migration `20260806120000_feature_flags_grants.sql` + live `audit-3b` #4 layer count |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | `pnpm run ops db:apply:admin -- --dry` shows pending grants OR `audit-3b` logs `permission denied for table feature_flags` |
| **Green** | Apply Admin migration; re-run `WRK-S04` with `DEV_AUTH_BYPASS=0` on preview |
| **Evidence** | `pnpm run ops db:apply:admin` success; `results/planner/audit-3b/` ≥1 layer |
| **Depends on** | DB-S01 |
| **Status** | PARTIAL — migration exists; live Planner proof OPEN |

### DB-S06 — Contact DB smokes

| Field | Value |
|-------|-------|
| **Slice ID** | DB-S06 |
| **Seam** | `tests/unit/app/api/customer-queries/route.db.smoke.test.ts` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Run smoke without Admin keys — skip or fail |
| **Green** | With `.env.local` Admin keys: smoke passes |
| **Evidence** | `smoke-report.json` contact 201; optional dedicated `results/database/contact-smoke.txt` |
| **Depends on** | DB-S10 |
| **Status** | PARTIAL — cutover smoke pass; unit smokes optional re-run |

---

## OPEN slices

### DB-S01 — Admin migrations dry-run

| Field | Value |
|-------|-------|
| **Slice ID** | DB-S01 |
| **Seam** | `pnpm run ops db:apply:admin -- --dry` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Pending migration listed unexpectedly |
| **Green** | Review SQL + rollback; apply or document skip |
| **Evidence** | `results/database/db-apply-admin-dry.txt` |
| **Depends on** | — |
| **Status** | OPEN |

### DB-S04 — Regenerate Admin types (P1)

| Field | Value |
|-------|-------|
| **Slice ID** | DB-S04 |
| **Seam** | `SEAM-DB-TYPES-ADMIN` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Stale column in `database.admin.types.ts` vs live DB; `typecheck` fails after schema change |
| **Green** | `pnpm run ops db:types:admin`; `pnpm run typecheck` exit 0 |
| **Evidence** | `git diff site/platform/types/database.admin.types.ts` intentional; `typecheck` log |
| **Depends on** | DB-S01 |
| **Status** | OPEN |

### DB-S05 — Regenerate Products types — CLI linked blocked (P1)

| Field | Value |
|-------|-------|
| **Slice ID** | DB-S05 |
| **Seam** | `SEAM-DB-TYPES-PRODUCTS` — `pnpm run ops db:types` (`supabase gen types --linked`) |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | `pnpm run ops db:types` fails — no `supabase/.temp/linked-project.json` or CLI not linked to Products `erpweaiypimorcunaimz` |
| **Green** | `supabase link --project-ref erpweaiypimorcunaimz`; regen; merge patches from `site/platform/types/patches/*.json` if needed |
| **Evidence** | `site/platform/types/database.types.ts` regen + `pnpm run typecheck` exit 0 |
| **Depends on** | DB-S04 |
| **Status** | OPEN — **blocked** without Supabase CLI link (code review follow-up) |

### DB-S07 — Retire Products furniture_catalog (P1)

| Field | Value |
|-------|-------|
| **Slice ID** | DB-S07 |
| **Seam** | Apex `GET /api/categories/` + R2 smoke before bucket delete |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Delete Products rows before apex green — categories empty |
| **Green** | One-window delete per runbook after OPS-S03 + TST-S11 green |
| **Evidence** | `results/database/products-retire.txt` + updated `docs/database/schema.md` |
| **Depends on** | OPS-S03, DB-S05, DB-S08 |
| **Status** | OPEN |

### DB-S08 — Planner Supabase persistence proof (P1)

| Field | Value |
|-------|-------|
| **Slice ID** | DB-S08 |
| **Seam** | `POST` save project on preview with `DEV_AUTH_BYPASS=0` → Admin `oando_plans` row |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Save returns error or row missing in Admin DB |
| **Green** | Fix `plannerPersistenceMode` / store at API seam |
| **Evidence** | `results/database/planner-supabase-save.txt` with project id |
| **Depends on** | DB-S02, WRK-S09 |
| **Status** | OPEN |

### DB-S10 — Connection smoke

| Field | Value |
|-------|-------|
| **Slice ID** | DB-S10 |
| **Seam** | `pnpm run ops db:test` |
| **Seam confirmation** | - [ ] Owner confirms seam before red |
| **Red** | Missing `SUPABASE_*` URLs in `.env.local` |
| **Green** | Configure env; smoke passes both DBs |
| **Evidence** | `results/database/db-test.txt` |
| **Depends on** | CHK-S01 |
| **Status** | OPEN |

---

## Persistence map (reference)

| Data | Dev | Prod | Selector |
|------|-----|------|----------|
| Planner projects | `platform/Planner/data/projects/` | Admin `oando_plans` | `plannerPersistenceMode.ts` |
| Furniture | `platform/shared/data/furniture/` | Admin `furniture_catalog` | `furnitureCatalogMode.ts` |
| Descriptors | `site/inventory/descriptors/` | Admin `block_descriptors` | `blockDescriptorStore.supabase.ts` |

---

## Key commands

| Command | Purpose |
|---------|---------|
| `pnpm run ops db:apply:admin -- --dry` | Admin migration preview |
| `pnpm run ops db:types:admin` | Admin types |
| `pnpm run ops db:types` | Products types (needs link) |
| `pnpm run check:governance` | `P4_migration_no_rollback=42` |

*Blockers: [`Failures.md`](../Failures.md) only.*
