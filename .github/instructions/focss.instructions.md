---
applyTo: "site/focss/**/*.css"
description: "FOCSS CSS system rules - applies when editing CSS files in site/focss/"
---

# FOCSS CSS System

FOCSS is a semantic token layer on top of Tailwind v4. Never write raw utilities in product TSX - use semantic tokens defined here.

## Zone Boundaries (Critical)

| Zone | Entry | Allowed | Forbidden |
|------|-------|---------|-----------|
| **base** | `focss/base/` | tokens, type, bridges | Product-specific styles |
| **site** | `focss/site/entry.css` | Marketing surface | Admin shadcn, product packs |
| **admin** | `focss/admin/entry.css` | Admin shell + shadcn | Site marketing styles |
| **planner** | `focss/planner/entry.css` | Planner fork only | Studio imports, cross-zone |
| **studio** | `focss/studio/entry.css` | Studio fork only | Planner imports, cross-zone |

**Never cross-import zones.** Planner FOCSS must not import Studio FOCSS (or reverse). Site entry must never load admin shadcn.

## Token Rules

- Use semantic tokens only (`--surface-*`, `--color-ecru-*`), never raw palette values
- No inline colors to bypass tokens
- Do not thrash token sheets for feature experiments
- Light product surfaces use ecru paper stack where admin FOCSS defines it

## File Structure

- Prefer ≤500 lines per CSS file; hard max 800
- One canonical path per concern
- Page rule: tokens + base + one zone entry
- No `core/` or `core/locked/` as live homes

## Verification

After editing FOCSS files, run:

```bash
pnpm run verify:focss          # Five checks: import graph, site CSS, fences, module imports, structure
pnpm run lint:ui:strict        # Strict UI contract
pnpm run check:style-tokens    # Token drift detection
```

## References

- Full FOCSS docs: [`site/focss/README.md`](../../site/focss/README.md)
- Architecture: [`docs/architecture/css.md`](../../docs/architecture/css.md)
- Handbook: [`Agents/07-css.md`](../../Agents/07-css.md)
