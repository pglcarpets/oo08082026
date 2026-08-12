---
applyTo: "site/{components,lib,hooks,store,server}/{Studio,Planner}/**/*.{ts,tsx}"
description: "Studio/Planner fork boundary rules - applies when editing forked code"
---

# Studio/Planner Fork Boundaries

**Critical Rule**: Studio and Planner are completely forked trees that **never import each other**.

## Namespace Structure

Each fork owns a full vertical slice:

| Concern | Studio | Planner |
|---------|--------|---------|
| Components | `site/components/Studio/` | `site/components/Planner/` |
| Lib | `site/lib/Studio/` | `site/lib/Planner/` |
| Hooks | `site/hooks/Studio/` | `site/hooks/Planner/` |
| Store | `site/store/Studio/` | `site/store/Planner/` |
| Server | `site/server/Studio/` | `site/server/Planner/` |
| CSS | `site/focss/studio/` | `site/focss/planner/` |
| Import alias | `@studio/*` | `@planner/*` |
| Domain types | `site/lib/Studio/studioTypes.ts` | `site/lib/Planner/plannerTypes.ts` |
| Palette | `site/lib/Studio/studioPalette.ts` | `site/lib/Planner/plannerPalette.ts` |
| Canvas scale | 0.2 px/mm | 0.05 px/mm |

## Allowed Imports

- Studio code: `@studio/*` only
- Planner code: `@planner/*` only
- Shared utilities: `site/lib/helpers/`, `site/lib/auth/`, etc.

## Forbidden Imports

- Studio → Planner (any direction)
- Planner → Studio (any direction)
- Cross-fork component imports
- Shared modules between forks (duplicated on purpose)

## How They Communicate

They **never call each other directly**. They meet at a shared backing store:

```
Studio saves furniture
        ↓
POST /api/Studio/furniture → server/Studio/studioStore.ts
        ↓
    [Supabase or disk]
        ↓
Planner reads furniture
        ↓
GET /api/Planner/furniture → server/Planner/plannerStore.ts
```

## Verification

```bash
pnpm run scan:boundaries
```

This scan fails on:
- Cross-app imports
- Reintroduced shared modules
- Resurrected pre-fork directories

**Run before committing** anything that touches either tree.

## Why Forked?

They evolve at different speeds. A fix in one does **not** propagate to the other, and that's intentional. Each owns its palette, domain types, UI primitives, hooks, stores, server store, and CSS zone.

## References

- Architecture: [`docs/architecture/product-map.md`](../../docs/architecture/product-map.md)
- Handbook: [`Agents/06-architecture.md`](../../Agents/06-architecture.md)
- Onboarding: [`START.md`](../../START.md) §2
