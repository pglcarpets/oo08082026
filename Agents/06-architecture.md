# Architecture

## Bar
- Live architecture docs: `docs/architecture/product-map.md` · `css.md` · `stack.md`.
- Read product-map before placing code.
- Read css + `docs/governance/focss-stop-drift.md` before style changes.
- Read stack for engines / PNG / package limits.
- Match surrounding patterns. Do not invent a second architecture in chat.

## Product shape
- **Studio** `/oostudio` · **Planner** `/ooplanner` — separate `@studio/*` / `@planner/*`, no cross-imports.
- Residual marketing `app/(site)` · admin `app/admin`.
- Fabric 2D · dockview shells (no in-app Three.js — removed 2026-08-03).
- Store: `server/{Studio,Planner}/` mode-aware wrappers — disk under
  `site/platform/{shared,Studio,Planner}/data/` in dev, Supabase in production.
  `site/data/storage/` is **legacy** with zero code references.

## Catalog symbols
- Contract: `site/lib/catalog/planSymbolPngContract.ts` when present.
- Descriptors: `site/inventory/descriptors/` (disk mode) or `block_descriptors`
  (Supabase mode). PNG mirror on disk: `site/public/assets/others/legacy/png-catalog/`
  (public URL stays `/png-catalog` via rewrite) — dev only.
- Furniture library: `platform/shared/data/furniture/` (disk) or
  `furniture_catalog` + the `catalog-assets` bucket (Supabase).

## Studio → Planner

The Studio writes the furniture library; the Planner rail reads it. There is no
shared module — each fork declares its own store and they meet at the same
backing location. Keep it that way (`pnpm run scan:boundaries`).

## VS Code Customization

When editing forked code under `site/{components,lib,hooks,store,server}/{Studio,Planner}/`,
VS Code Copilot automatically loads
[`.github/instructions/boundaries.instructions.md`](../.github/instructions/boundaries.instructions.md)
with fork isolation rules and the allowed/forbidden import map.

For SQL migrations under `site/platform/supabase/migrations/`, it loads
[`.github/instructions/migrations.instructions.md`](../.github/instructions/migrations.instructions.md)
with rollback requirements, Supabase grants + policies, and type regeneration.
