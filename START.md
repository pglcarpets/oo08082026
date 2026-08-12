# Start here

| | |
|--|--|
| Index | [`CONTENTS.md`](./CONTENTS.md) · [`DOC-MAP.md`](./DOC-MAP.md) |
| Ops | [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md) |
| Plans / audits | [`plans/`](./plans/README.md) · [`agent-reports/`](./agent-reports/README.md) |
| Blockers | [`Failures.md`](./Failures.md) |

## App

`site/` Next app. Product = Studio + Planner.

| | Route |
|--|-------|
| Studio | `/oostudio` |
| Planner | `/ooplanner` |
| Marketing | `/` |
| Admin | `/admin/*` |

```bash
pnpm install          # root only; secrets → `.env.local`
pnpm dev              # http://localhost:3000  — never 127.0.0.1
pnpm run ops list     # non-daily commands
```

| | Path |
|--|------|
| Plans | `plans/*.md` |
| Audits | `agent-reports/**/*.md` |
| Evidence | `results/**` |

## Fork

No Studio ↔ Planner imports. `pnpm run scan:boundaries`.

```
@studio/*  ·  @planner/*
POST /api/Studio/furniture → furniture_catalog (Admin) / disk
GET  /api/Planner/catalog  ← same store
```

## Persistence

Prod FS **read-only**. One mode only.

| | When | Plans | Furniture |
|--|------|-------|-----------|
| disk | `DEV_AUTH_BYPASS=1`, non-prod | `platform/Planner/data/projects/` | `platform/shared/data/furniture/` |
| supabase | else | `oando_plans` | `furniture_catalog` (Admin) |

Use mode wrappers. Selectors: `plannerPersistenceMode.ts`, `furnitureCatalogMode.ts`.

| DB | Ref | Holds |
|----|-----|-------|
| Admin | `rxzpznmxbaoxpikowmfc` | plans, staff, furniture, descriptors |
| Products | `erpweaiypimorcunaimz` | marketing catalog, configurator, flags |

## Commit

```bash
pnpm run typecheck && pnpm run scan:boundaries && pnpm run gate
```

- `pnpm run test` = **two** lanes — check both (`results/tests/*.json`).
- Migrations need `-- rollback`.

| | |
|--|--|
| Product / routes / stack | [`README.md`](./README.md) · [`docs/architecture/routes.md`](./docs/architecture/routes.md) · [`stack.md`](./docs/architecture/stack.md) |
| Tests | [`Testing-handbook.md`](./Testing-handbook.md) |
| Agents | [`AGENTS.md`](./AGENTS.md) |
| Tech-docs SPA | [`tech-docs-generator/README.md`](./tech-docs-generator/README.md) |
