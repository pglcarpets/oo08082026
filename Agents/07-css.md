# CSS

## Bar
- CSS home: **`site/focss/`** as `@focss/*` — plain tree, not an npm package.
- Read `docs/architecture/css.md` before style changes.
- Read `docs/governance/focss-stop-drift.md` for allow/forbid + debt ratchet.

## Zone entries

| Surface | Entry |
|---------|--------|
| Site | `@focss/site/entry.css` |
| Admin | `@focss/admin/entry.css` only (FOCSS + React Aria controls) |
| Planner | `@focss/planner/entry.css` |
| Studio | `@focss/studio/entry.css` |
| Tokens | `@focss/base/*` |

No Studio↔Planner FOCSS cross-import. No shadcn chrome resurrection.

## Marketing type scale (site zone)

Defined in `site/focss/base/type/typography.css`, consumed via `type-marketing.css`:

| Token | Role |
|-------|------|
| `--type-nav-size` | Site header + `shell-global-nav` link size |
| `--type-kicker-size` | Section kickers (`home-kicker`, `shell-portal-kicker`, proof strips) |
| `--type-body-size` | Body copy default |

Suite chrome: `shell-global-nav.css` (dashboard/portal header), `shell-portal.css` (portal page frame).

## Hard rules
- Colour/density via semantic tokens.
- Forbidden: raw hex/rgb in product TSX; parallel CSS trees; nested `focss` packages.
- Fix structure before adding sheets.

## Verify
```powershell
pnpm run verify:focss
pnpm run lint:ui:strict
pnpm run ops check:composer-styles
pnpm run check:style-tokens
```

`verify:focss` is five checks in one script — import graph, site CSS, fences,
module imports, structure. A failure names which one; fix that, not the whole tree.

`site/focss/base/` is retained untouched as the foundation for the site/admin zone
port. Do not restructure it opportunistically.

## VS Code Customization

When editing CSS files under `site/focss/`, VS Code Copilot automatically loads
[`.github/instructions/focss.instructions.md`](../.github/instructions/focss.instructions.md)
with zone boundaries, token rules, and verification commands.
