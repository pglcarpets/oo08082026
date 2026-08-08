# OOplannerOOStudio

One Next.js application under `site/` serving four surfaces. Two of them are the
product; two support it.

| Surface | Route | What it does |
|---------|-------|--------------|
| **Furniture Studio** | `/oostudio` | Authors furniture — draw it, size it, publish it to the catalog |
| **Floor Planner** | `/ooplanner` | Places that furniture on a floor plan and produces a BOQ |
| Marketing | `/` | Oando's public site |
| Admin | `/admin/*` | Catalog ops, CRM, price books, feature flags, themes |

New to the repository? [`START.md`](./START.md) walks through it in fifteen
minutes. This file is the reference.

## Quick start

```bash
pnpm install
```

Install from the **repo root only** — never inside `site/` or `tech-docs-generator/`.

Put secrets in the **repo-root** `.env.local`. Next loads it via `site/next.config.js`.

```bash
pnpm dev
```

| Surface | URL |
|---------|-----|
| Marketing | http://localhost:3000 |
| Studio | http://localhost:3000/oostudio |
| Planner | http://localhost:3000/ooplanner |

Always `localhost`, never `127.0.0.1` — auth cookies are host-bound.

## Commands

Root `package.json` is intentionally small (53 scripts as of 2026-08-06). Use it
for the daily loop; use **ops** for operational work.

| Tier | Examples |
|------|----------|
| **Root** | `dev`, `build`, `test`, `typecheck`, `lint`, `gate`, `release:gate`, `scan:boundaries`, `seed:furniture` |
| **Ops** | `pnpm run ops db:apply`, `pnpm run ops backup:supabase:r2`, `pnpm run ops test:e2e:nav`, `pnpm run ops list` |
| **Tech-docs** | `tech-docs:dev`, `tech-docs:gate`; generate/test via `ops tech-docs:generate` or `pnpm --filter oando-tech-docs …` |
| **VS Code** | File-scoped instructions in [`.github/instructions/`](./.github/instructions/); 16 role skills in [`.github/skills/`](./.github/skills/) (no `/gate` or `/new-test` commands exist) |

Full gate inventory: [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md) §7.

## Tech-docs inventory (optional)

Staff-facing repo inventory — routes, deps, CI, generated docs. Not the customer
product.

| Need | Command |
|------|---------|
| Dev SPA | `pnpm run tech-docs:dev` → http://localhost:3001/tech-stack |
| Regenerate inventory | `pnpm run ops tech-docs:generate` |
| Package tests | `pnpm --filter oando-tech-docs test` or `pnpm run ops test:tech-docs` |
| CI gate | `pnpm run tech-docs:gate` |

Generated output lives in `generated-documents/` (wiped on each generate). Vite
cache and staging copies use `results/tooling/tech-docs/`. Details:
[`tech-docs-generator/README.md`](./tech-docs-generator/README.md).

## Separation

Studio and Planner are two standalone trees. Each owns its palette, domain types,
UI primitives, hooks, stores, server store and CSS zone — duplicated on purpose. A
fix in one does **not** propagate to the other, and that is the point: they evolve
at different speeds.

| Concern | Studio | Planner |
|---------|--------|---------|
| Namespace roots | `site/{components,lib,hooks,store,server}/Studio/` | `site/{components,lib,hooks,store,server}/Planner/` |
| Import alias | `@studio/*` | `@planner/*` |
| Domain types | `lib/Studio/studioTypes.ts` | `lib/Planner/plannerTypes.ts` |
| Palette / tokens | `lib/Studio/studioPalette.ts` | `lib/Planner/plannerPalette.ts` |
| Canvas scale | 0.2 px/mm | 0.05 px/mm |
| Server store | `server/Studio/studioStore.ts` | `server/Planner/plannerStore.ts` |
| CSS zone | `site/focss/studio/` | `site/focss/planner/` |
| Routes | `/oostudio` | `/ooplanner`, `/ooplanner/projects` |

Allowed: `studio → @studio/*`, `planner → @planner/*`.
Forbidden: any edge between them, in either direction.

```bash
pnpm run scan:boundaries
```

That scan fails on a cross-app import, a reintroduced shared module, or a
resurrected pre-fork directory. `site/focss/base/` is retained untouched as the
foundation for the site/admin zone port.

## How Studio output reaches the Planner

They never call each other. They meet at a shared backing store, through separate
handlers.

```
Studio save  ──▶  POST /api/Studio/furniture  ──▶  server/Studio/studioStore.ts
                                                          │ writeFurnitureItem
                                                          ▼
                            furniture_catalog (admin DB)  ·  platform/shared/data/furniture/ (dev)
                                                          ▲
                                                          │ listCatalog
Planner rail ──▶  GET /api/Planner/catalog    ──▶  server/Planner/plannerStore.ts
```

Both stores declare that backing location independently — the match *is* the
contract, with no shared constant by design.

A second Studio path, `POST /api/Studio/furniture/[id]/publish`, writes versioned
**descriptors** for catalog release. The Planner rail does not read those.

Outbound, `POST /api/Planner/handoff` records a finished BOQ into
`planner_handoffs` for staff follow-up.

## Persistence

Exclusive mode — one or the other, never both.

| | Selected when | Planner projects | Furniture library | Descriptors |
|---|---|---|---|---|
| **disk** | `DEV_AUTH_BYPASS=1`, non-production | `platform/Planner/data/projects/` | `platform/shared/data/furniture/` | `site/inventory/descriptors/` |
| **supabase** | everything else | `oando_plans` | `furniture_catalog` + `catalog-assets` (admin) | `block_descriptors` (admin) |

**Production's filesystem is read-only.** The failure mode is quiet: seed content
is committed to git, so the Planner rail renders and looks healthy while every
save fails. A route that writes must call the mode-aware wrapper
(`writeFurnitureItem`, `listCatalog`, `persistFurnitureUpload`), never the raw
disk helper.

Selectors: `lib/Planner/plannerPersistenceMode.ts`, `lib/catalog/furnitureCatalogMode.ts`.
`site/data/storage/` is legacy with zero code references — do not write to it.

## API map

Each app talks only to its own namespace.

| Route | Owner | Role |
|-------|-------|------|
| `GET /api` | — | health |
| `GET/POST /api/Studio/furniture` | Studio | list / create | 
| `GET/PATCH/DELETE /api/Studio/furniture/[id]` | Studio | read / update / delete |
| `POST /api/Studio/furniture/[id]/publish` | Studio | publish descriptor (`goLive` admin-only) |
| `POST /api/Studio/furniture/upload` | Studio | multipart upload |
| `POST /api/Studio/ai/{generate,suggest,restyle}` | Studio | AI helpers |
| `GET /api/Planner/catalog` | Planner | read-only rail listing (guest) |
| `POST /api/Planner/catalog/upload` | Planner | custom furniture upload |
| `GET/POST /api/Planner/projects` | Planner | plan list / create (**member**) |
| `GET/PATCH/DELETE /api/Planner/projects/[id]` | Planner | plan read / update / delete (**member**) |
| `POST /api/Planner/handoff` | Planner | BOQ handoff to staff |
| `POST /api/Planner/sketch-to-plan` | Planner | sketch image → walls/rooms |
| `POST /api/exports` | neutral | export upload |
| `GET /api/files/{furniture,projects,exports,uploads}/…` | neutral | disk-mode assets |
| `GET /api/git-user` | neutral | topbar identity |

`/api/files/*` URLs are persisted inside stored records — do not rename them. They
are the **disk-mode** form; in Supabase mode the stored `*_url` fields are absolute
`catalog-assets` bucket URLs instead.

Full index with auth roles: [`docs/architecture/routes-api.md`](./docs/architecture/routes-api.md).

## UI

FOCSS plus **minimum** React Aria wrappers; no shadcn in the forked apps. Each app
carries its own copy under `site/components/{Planner,Studio}/ui/`:

- `OoButton` / `OoInput` / `OoTextArea` / `OoDialog` (Planner only — Studio's
  dialogs are hand-rolled)
- `ExportMenu`, `DockPanelButtons`, `DraggableCanvasOverlay`,
  `SidePanelResizeHandle`, `TopBarShell`, `PanelEmptyState`

**Marketing site** uses `site/components/site/Header.tsx` with `--type-nav-size`
nav links. **Member suite** (`/dashboard`, `/portal/*`) uses `GlobalNavHeader` +
`shell-global-nav`; portal routes wrap in `PortalShell` with `shell-portal` type
tokens.

**Icons:** `@phosphor-icons/react` only, through each app's `PhIcon.tsx` +
`phIconMap.ts`. No inline SVG, no direct Phosphor imports in components, no Lucide.

Each app has a top toolbar (`PlannerTopToolbar` / `StudioTopToolbar`) fully wired
to real actions via per-app `toolbarHandlers` maps (`Planner.tsx`, `Studio.tsx`);
file actions (New/Import/Save/Export) live in the toolbar row. Verified by live
e2e 2026-08-06 (`tests/e2e/audit-3b-planner-fixes.spec.ts`).

## Databases

Two Supabase projects. Picking the wrong one is the most common mistake here.

| Role | Ref | Holds |
|------|-----|-------|
| Products | `erpweaiypimorcunaimz` | Marketing catalog, configurator, themes, flags (furniture + descriptors moved to Admin in cutover) |
| Admin | `rxzpznmxbaoxpikowmfc` | Plans, profiles, handoffs, teams, price books, queries, audit |

Rule of thumb: anything a customer or staff member owns is **Admin**; anything in
the catalog is **Products**. Table map:
[`docs/database/schema.md`](./docs/database/schema.md).

## Checks

```bash
pnpm run typecheck && pnpm run scan:boundaries && pnpm run gate
```

Two things people get wrong:

- **`pnpm run test` runs two vitest lanes** — default and tech-docs. Each prints
  its own summary and only the last survives a `| tail`. One green summary is not
  a green suite.
- **Every migration needs a `-- rollback` section.** `check:governance` ratchets
  the count without one and fails when it rises.

**Test-quality audits:**

| Command | Scope |
|---------|-------|
| `pnpm run test:audit:hollow` | All `tests/**` — hollow `expect`, empty catches, zero-expect `it` |
| `pnpm run test:audit:fake-test` | Tech-docs lane + generator tests |
| `pnpm run test:audit:gate-skips` | Gate Playwright specs — no `test.skip` |

Tests live under `tests/unit/**` (name-mirrored) and `tests/e2e/`. Live-database
smoke suites skip silently without service env — see
[`Testing-handbook.md`](./Testing-handbook.md).

Product package name: `ooplanner-oostudio`. Optional tech-docs package:
`oando-tech-docs` under `tech-docs-generator/`.

## Where next

| You want to | Read |
|-------------|------|
| Be walked through the product | [`START.md`](./START.md) |
| Find any document | [`CONTENTS.md`](./CONTENTS.md) · [`DOC-MAP.md`](./DOC-MAP.md) |
| Ops / db / backup | [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md) · `pnpm run ops list` |
| Deploy, migrate, roll back | [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md) |
| Know what is broken | [`Failures.md`](./Failures.md) |
| Work as an agent here | [`AGENTS.md`](./AGENTS.md) → [`Agents/INDEX.md`](./Agents/INDEX.md) |
