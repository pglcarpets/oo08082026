# CSS ownership

Shared system: **`site/focss/`** (plain CSS tree; `@focss/*` alias). Not an npm package.

Verify with `pnpm run verify:focss` (five checks: import graph, site CSS, fences,
module imports, structure), then `lint:ui:strict`, `pnpm run ops check:composer-styles`,
`pnpm run check:style-tokens`.

## Design systems (live)

| System | Routes | CSS entry | Controls | Chrome |
|--------|--------|-----------|----------|--------|
| **Site** | `(site)/*`, offline | `site/focss/site/entry.css` | `scheme-*`, `.btn-primary`, `home-*` | No shadcn on marketing entry |
| **Admin** | `/admin/*` | `site/focss/admin/entry.css` | Ecru + FOCSS tokens | FOCSS-native (`ShadcnChrome` removed, phase 13) |
| **Planner fork** | `/ooplanner*` | `site/focss/planner/entry.css` | Planner-local UI + FOCSS tokens | dockview themed via `planner/dock.css` |
| **Studio fork** | `/oostudio*` | `site/focss/studio/entry.css` | Studio-local UI + FOCSS tokens | dockview themed via `studio/dock.css` |

**Do not cross-import:** Site entry must never load admin shadcn/tailwind product packs. Planner FOCSS must not import Studio FOCSS (or the reverse). Do not resurrect `focss/zones/` or repo-root `focss/`.

Reference: [`site/focss/README.md`](../../site/focss/README.md) · live board `/admin/design-kit/` when admin auth works.

## Rules

- TSX: structure and behavior. CSS: repeated presentation and surface layout.
- Semantic tokens only — no raw palette values, no inline colors to bypass tokens.
- One global styling home under `site/focss/`. Extract shared primitives only after repeated real use.
- Light product surfaces use the **ecru paper stack** where admin FOCSS defines it (`--color-ecru-*` via `--surface-*` in `base/tokens/` when that tree is the active design system).
- Do **not** thrash token sheets for feature experiments.
- Hardcoding / token drift: prefer gated checks —  
  `pnpm run lint:ui:strict` · `pnpm run check:style-tokens` · `pnpm run ops check:composer-styles`  
  (broad one-shot hardcode auditors were removed 2026-08-02).
- **No `core/` or `core/locked/` as live homes**.

## Zone packages (live)

| Package | Root | Role |
|---|---|---|
| Shared base (site/admin design system) | `focss/base/` | tokens, type, bridges, document |
| Site marketing | `focss/site/` | Public surface |
| Admin | `focss/admin/` | Shell, primitives, pages, svg studio sheets (CSS present even if app routes lag) |
| Cross-feature | `focss/features/` | `product/foundation` (no shadcn), `product/entry` (admin + shadcn), shadcn pack |
| Planner fork | `focss/planner/` | Foundation attach + zone `base/` aliases, chrome, controls, workspace, dock |
| Studio fork | `focss/studio/` | Same shape as planner (no product/entry / shadcn) |
| Tech-docs | `tech-docs-generator/src/styles/` | Not FOCSS; admin opens via external link only ([`tech-docs-link.md`](./tech-docs-link.md)) |

**Inventory:** Success = **one canonical path per concern**.  
**Page rule:** tokens + base + one zone entry.  
**File size:** Prefer ≤500 lines per CSS file; hard max 800 (see `focss/README.md`).

## Layout import barrels

| Layout | Import | Design system |
|--------|--------|---------------|
| Site | `app/(site)/globals.css` → `@focss/site/entry.css` | Site |
| Admin | `@focss/admin/entry.css` | Admin product (FOCSS-native; `ShadcnChrome` removed) |
| Planner workspace | `@focss/planner/entry.css` → product **foundation** (no shadcn) | Planner fork |
| Studio workspace | `@focss/studio/entry.css` → product **foundation** (no shadcn) | Studio fork |

## Shell chrome (forked apps)

| Surface | Pattern |
|---|---|
| Planner top bar / dock | `components/Planner/*` + `focss/planner/*` |
| Studio top bar / dock | `components/Studio/*` + `focss/studio/*` |
| Admin shell | `features/admin/ui/*` + `focss/admin/*` |

After shared CSS changes: `pnpm run ops lint:ui` (strict: `pnpm run lint:ui:strict`) and focused browser checks where UI acceptance applies.

## Living design kit (visual contract)

Route: `/admin/design-kit/` (admin auth required).

The design kit is the materials board for admin primitives when that surface is live.

**Verification:** `pnpm run ops test:design-kit` when Playwright harness exists (`config/build/playwright.config.ts`).

## Zone shell contract (anti-drift)

| Layer | Location | Allowed | Forbidden |
|---|---|---|---|
| **1. Tokens** | zone `base/` + shared `focss/base/` | Semantic `--surface-*`, `--text-*`, `--color-*` | Feature-specific raw hex |
| **2. Primitives** | `components/ui/*` (admin) or app-local `ui/*` (forks) | One control system per zone | Fourth button system |
| **3. Zone shells** | `focss/{site,admin,planner,studio}/` | Layout, section rhythm, stages | Cross-zone presentation imports |

**Surface rule:** Light chrome uses ecru/semantic surfaces where admin/site systems apply. Pure `bg-white` shells fail `lint:ui` when that rule is wired.

**Enforcement:** `pnpm run lint:ui:strict` · `pnpm run ops check:composer-styles` · `pnpm run ops check:product-icons` · `pnpm run verify:focss` · forked scans `pnpm run ops scan:tokens` / `pnpm run ops scan:hardcoding`.

Detail for engines/packages: `stack.md`. Process: `Agents/INDEX.md`. Programme stop-drift + remediation: [`../governance/focss-stop-drift.md`](../governance/focss-stop-drift.md).

## Migration status (FOCSS)

| Area | Live state |
|---|---|
| CSS home | `site/focss/` (`@focss/*`) |
| Site / admin / base / features | Present |
| Planner + Studio forked zones | Present, self-contained entries |
| `ooshared/` shared package | **Not present** — do not document as live |
| `zones/` transitional paths | **Gone** |

**Verification:** `pnpm run verify:focss` · `pnpm run lint:ui:strict` · `pnpm run ops check:composer-styles` · `pnpm run check:style-tokens`
