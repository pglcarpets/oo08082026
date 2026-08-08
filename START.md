# Start here

Walkthrough for someone who has never opened this repository. Read top to bottom
once — about fifteen minutes.

| Index | Role |
|-------|------|
| [`CONTENTS.md`](./CONTENTS.md) | Every document, numbered |
| [`DOC-MAP.md`](./DOC-MAP.md) | Structure and authority order |
| [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md) | Deploy, migrate, roll back |

---

## 1. What this repository is

One Next.js application under `site/` serves **four** surfaces:

| Surface | Route | What it is |
|---------|-------|------------|
| Marketing | `/` | Oando's public site |
| Admin | `/admin/*` | Catalog ops, CRM, price books, flags, themes |
| **Furniture Studio** | `/oostudio` | Authors furniture — draws it, sizes it, publishes it |
| **Floor Planner** | `/ooplanner` | Places that furniture on a floor plan, produces a BOQ |

Studio and Planner are the product. The other two are supporting surfaces.

Member-suite routes (`/dashboard`, `/portal/*`) share `GlobalNavHeader` +
`shell-global-nav` chrome (One&Only wordmark, suite nav links). Portal pages
wrap in `PortalShell` with `shell-portal` typography tokens.

A second package, `tech-docs-generator/`, is an optional Vite SPA for staff
(`/tech-stack` on port 3001). It is not the customer product.

### Commands (two tiers)

Root `package.json` keeps **53** scripts for daily dev, gates, and tests.
Everything else — db, backup, seeds, focused e2e, i18n, assets — runs through
**ops**:

```bash
pnpm run ops list          # every operational command
pnpm run ops db:apply -- --dry
pnpm run ops gate:open3d
```

See [`README.md`](./README.md) § Commands and [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md).

## 2. The one rule that shapes everything

**Studio and Planner are forked. They never import each other.**

Each owns a full vertical slice — components, lib, hooks, store, server handlers,
CSS zone — duplicated on purpose. A fix in one does not propagate to the other,
and that is intentional: they evolve at different speeds.

```
site/components/Studio/    site/components/Planner/
site/lib/Studio/           site/lib/Planner/
site/server/Studio/        site/server/Planner/
site/focss/studio/         site/focss/planner/
@studio/*                  @planner/*
```

```bash
pnpm run scan:boundaries
```

That command fails the build on any edge between them, on a reintroduced shared
module, and on a resurrected pre-fork directory. Run it before you commit anything
that touches either tree.

## 3. So how do they talk?

They don't — they meet at a **shared backing store** and never at a shared module.

```
Studio saves furniture
        │
        ▼
POST /api/Studio/furniture ──▶ server/Studio/studioStore.ts
                                        │ writeFurnitureItem
                                        ▼
                    ┌───────────────────────────────────┐
                    │  furniture_catalog        (prod)  │
                    │  platform/shared/data/…   (dev)   │
                    └───────────────────────────────────┘
                                        ▲
                                        │ listCatalog
GET /api/Planner/catalog ──▶ server/Planner/plannerStore.ts
        │
        ▼
Planner rail shows it, user places it on the plan
```

Both stores declare the same backing location independently. That string matching
*is* the contract — there is no shared constant, by design.

A second Studio path, `POST /api/Studio/furniture/[id]/publish`, writes versioned
**descriptors** for catalog release. The Planner rail does not read those. Don't
confuse the two.

Going the other way, `POST /api/Planner/handoff` records a finished BOQ into
`planner_handoffs` for staff follow-up.

## 4. The thing that will bite you first

**Production has a read-only filesystem.**

Persistence is *exclusive-mode*: one or the other, never both.

| | Selected when | Planner projects | Furniture library |
|---|---|---|---|
| **disk** | `DEV_AUTH_BYPASS=1`, non-production | `platform/Planner/data/projects/` | `platform/shared/data/furniture/` |
| **supabase** | everything else | `oando_plans` | `furniture_catalog` + `catalog-assets` bucket |

Locally you are almost always on **disk**. Production is always **supabase**.

The failure mode is nasty because it is quiet: seed content is committed to git,
so in production the Planner rail renders furniture and looks healthy, while every
save silently fails. If you add a route that writes, call the **mode-aware
wrapper** (`writeFurnitureItem`, `listCatalog`, `persistFurnitureUpload`), never
the raw disk helper.

Selectors: `lib/Planner/plannerPersistenceMode.ts`, `lib/catalog/furnitureCatalogMode.ts`.

## 5. Two databases, not one

| DB | Project ref | Holds |
|----|-------------|-------|
| **Products** | `erpweaiypimorcunaimz` | Catalog, configurator, descriptors, flags |
| **Admin** | `rxzpznmxbaoxpikowmfc` | Plans, profiles, handoffs, teams, price books, queries, audit, furniture library (`furniture_catalog` + `catalog-assets` bucket — moved here in cutover), published descriptors |

Picking the wrong one is the most common database mistake here. Rule of thumb:
**anything a customer or staff member owns** is Admin; **anything in the catalog**
is Products.

The live Planner store is `public.oando_plans`. There is also an `archive.plans`
— that is a retired table kept for its data. Do not read it.

Full table map: [`docs/database/schema.md`](./docs/database/schema.md).

## 6. Run it

```bash
pnpm install
```

Install from the **repo root only**. Never inside `site/` or `tech-docs-generator/`.

Put secrets in the **repo-root** `.env.local`. Next loads it via `site/next.config.js`.

```bash
pnpm dev
```

| Surface | URL |
|---------|-----|
| Marketing | http://localhost:3000 |
| Studio | http://localhost:3000/oostudio |
| Planner | http://localhost:3000/ooplanner |

Always `localhost:3000`, never `127.0.0.1` — auth cookies are host-bound.

**Tech-docs SPA** (optional inventory UI):

```bash
pnpm run tech-docs:dev
```

http://localhost:3001/tech-stack — separate Vite app, not part of the Next server.

## 7. Before you commit

```bash
pnpm run typecheck && pnpm run scan:boundaries && pnpm run gate
```

Two things people get wrong:

1. **`pnpm run test` runs two vitest lanes** — default and tech-docs. Each prints
   its own summary and only the last survives a `| tail`. One green summary is
   not a green suite. JSON reports: `results/tests/vitest-results.json` and
   `results/tests/vitest-tech-docs-results.json`.
2. **Every migration needs a `-- rollback` section.** `check:governance` ratchets
   the count of migrations without one and fails when it rises.

**Test-quality audits** (fast, no browser):

| Command | What it guards |
|---------|----------------|
| `pnpm run test:audit:hollow` | Hollow patterns across all `tests/**` |
| `pnpm run test:audit:fake-test` | Tech-docs lane + generator strict rules |
| `pnpm run test:audit:gate-skips` | No `test.skip` in gate Playwright specs |

`release:gate` runs hollow and gate-skips. `tech-docs:gate` runs fake-test-audit
inside the tech-docs package.

## 8. Where to go next

| You want to | Read |
|-------------|------|
| Product reference (API map, UI policy) | [`README.md`](./README.md) |
| Add a feature | [`docs/architecture/product-map.md`](./docs/architecture/product-map.md) |
| Find where something lives | [`docs/architecture/source-map.md`](./docs/architecture/source-map.md) |
| Touch the database | [`docs/database/schema.md`](./docs/database/schema.md) |
| Deploy or migrate | [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md) (`pnpm run ops …`) |
| Write or run tests | [`Testing-handbook.md`](./Testing-handbook.md) |
| Change CSS | [`docs/architecture/css.md`](./docs/architecture/css.md) |
| Programme direction | [`plans/`](./plans/) + live code (`DOC-MAP.md`) |
| Tech-docs package | [`tech-docs-generator/README.md`](./tech-docs-generator/README.md) |
| Know what is broken | [`Failures.md`](./Failures.md) |
| Work as an agent here | [`AGENTS.md`](./AGENTS.md) → [`Agents/INDEX.md`](./Agents/INDEX.md) |
| VS Code agent customizations | [`.github/`](./.github/) — file-scoped instructions + 16 role skills (no `/gate` or `/new-test` commands exist; see [`CONTENTS.md`](./CONTENTS.md) § `.github/`) |
