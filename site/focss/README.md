# FOCSS (site/focss)

Alias `@focss/*` → `site/focss/*`. Plain CSS tree — **not** an npm package.

## Live zones

| Zone | Entry | Used by |
|------|-------|---------|
| Site | `site/entry.css` | `app/(site)/globals.css` |
| Admin | `admin/entry.css` | `app/admin/layout.tsx` |
| Planner | `planner/entry.css` | `/ooplanner` workspace |
| Studio | `studio/entry.css` | `/oostudio` workspace |
| Base | `base/` | Shared tokens for site/admin design system |
| Features | `features/` | product foundation / product+shadcn entry / admin packs |

## Product foundation vs shadcn

| Sheet | Shadcn | Used by |
|-------|--------|---------|
| `features/product/foundation.css` | **No** | Planner + Studio zone entries |
| `features/product/entry.css` | **Yes** | Admin entry only (until phase 13 RAC) |
| `features/product/index.css` | theme bridge | Admin `@reference` only |

## Planner / Studio entry chain

Each of `planner/` and `studio/` attaches to **product foundation** (no shadcn), then its own workspace stack (no shared `ooshared/`):

```
../features/product/foundation.css   ← scan + runtime + base + document
{zone}/base/index.css                ← zone aliases only (var → foundation tokens)
{zone}/chrome.css
{zone}/controls.css
{zone}/polish.css
{zone}/workspace-shell.css
{zone}/workspace.css
{zone}/dock.css                      → after dockview-react CSS from TSX
```

Entries:

- `planner/entry.css`
- `studio/entry.css`

Do **not** import Planner FOCSS from Studio (or reverse). Do **not** load `product/entry.css` (shadcn) into fork zones.

## Token homes

| Layer | Role |
|-------|------|
| `base/tokens/` + bridges (site/admin) | Shared marketing/admin semantic tokens |
| `planner/base/*` / `studio/base/*` | Per-app palette + semantic tokens |
| `site/lib/Planner/plannerTokens.ts` | Planner mm/layout defaults |
| `site/lib/Studio/studioTokens.ts` | Studio mm/layout defaults |

## Token / hardcoding scans (forked apps)

```bash
pnpm run ops scan:tokens
pnpm run ops scan:hardcoding
pnpm run ops scan:hardcoding -- --strict
```

## Structural verify

```bash
pnpm run verify:focss
```
