# OOplannerOOStudio

`site/` Next app. Product = Studio + Planner. New? → [`START.md`](./START.md).

| | Route |
|--|-------|
| Studio | `/oostudio` |
| Planner | `/ooplanner` |
| Marketing | `/` |
| Admin | `/admin/*` |

```bash
pnpm install   # root only
pnpm dev       # http://localhost:3000  (not 127.0.0.1)
```

| | |
|--|--|
| Secrets | repo-root `.env.local` |
| Root | `dev` `build` `test` `typecheck` `lint` `gate` `release:gate` `scan:boundaries` `seed:furniture` |
| Ops | `pnpm run ops list` |
| Place | plans → `plans/*.md` · audits → `agent-reports/**/*.md` · evidence → `results/**` · blockers → `Failures.md` |

## Fork + data

No Studio ↔ Planner imports. `pnpm run scan:boundaries`.

| | Studio | Planner |
|--|--------|---------|
| Alias | `@studio/*` | `@planner/*` |
| CSS | `focss/studio/` | `focss/planner/` |

```
POST /api/Studio/furniture → furniture_catalog (Admin) / disk
GET  /api/Planner/catalog  ← same store
```

| | When | Plans | Furniture |
|--|------|-------|-----------|
| disk | `DEV_AUTH_BYPASS=1`, non-prod | `site/platform/Planner/data/projects/` | `site/platform/shared/data/furniture/` |
| supabase | else | `oando_plans` | `furniture_catalog` (Admin) |

Prod FS read-only → mode wrappers (`plannerPersistenceMode.ts`, `furnitureCatalogMode.ts`).

| DB | Ref |
|----|-----|
| Admin | `rxzpznmxbaoxpikowmfc` — plans, staff, furniture, descriptors |
| Products | `erpweaiypimorcunaimz` — marketing catalog, configurator, flags |

API: Studio `/api/Studio/*` · Planner `/api/Planner/*` · disk assets `/api/files/*` (don’t rename).  
Routes: [`docs/architecture/routes.md`](./docs/architecture/routes.md) · schema: [`docs/database/schema.md`](./docs/database/schema.md) · stack: [`docs/architecture/stack.md`](./docs/architecture/stack.md).

## Checks

```bash
pnpm run typecheck && pnpm run scan:boundaries && pnpm run gate
```

`pnpm run test` = two lanes (check both). Migrations need `-- rollback`.  
Audits: `test:audit:hollow` · `fake-test` · `gate-skips`. FOCSS + `PhIcon` only in forks.

| | |
|--|--|
| Index | [`CONTENTS.md`](./CONTENTS.md) · [`DOC-MAP.md`](./DOC-MAP.md) |
| Ops | [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md) |
| Tests | [`Testing-handbook.md`](./Testing-handbook.md) |
| Blockers | [`Failures.md`](./Failures.md) |
| Agents | [`AGENTS.md`](./AGENTS.md) |
