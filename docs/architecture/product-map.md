# Product vision and architecture

When docs and code differ, **code wins**. User instruction wins over both. Plan direction is right; details here can be wrong — verify against live code.

**Live architecture is three files:**

| File | Owns |
|---|---|
| **This README** | Vision, placement, domains, UI zones, current vs target |
| [`css.md`](./css.md) | FOCSS / Product CSS (**detail kept**) |
| [`stack.md`](./stack.md) | Engines, runtime, PNG release, i18n, package policy |

Everything else formerly under this folder is in `.archive/docs/architecture/`.

## Vision

1. Admin / catalog tooling publishes trusted inventory (residual admin surface + Studio).
2. Site helps visitors discover Oando (marketing residual under `app/(site)`).
3. Interactive design: **Floor Planner** (`/ooplanner`) places products; **Furniture Studio** (`/oostudio`) authors furniture.
4. Planner can produce layout + BOQ-style outputs from its own document model.

Canvas fidelity, catalog honesty, and clear handoff matter equally.

## Where code goes

| Path | Ownership |
|---|---|
| `site/app/` | Routes, layouts, API — keep thin |
| `site/features/` | Product behavior (admin, site, crm, ops, forked Planner/Studio route entries) |
| `site/components/` | Shared UI + forked `Planner/` + `Studio/` app UIs |
| `site/lib/` | Shared utilities, catalog core, forked `Planner/` + `Studio/` libs |
| `site/hooks`, `site/store`, `site/server` | Forked app hooks/stores/disk servers under `Planner/` / `Studio/` |
| `site/platform/` | DB, Supabase, types, route contracts |
| `site/focss/` | Shared CSS tree (`@focss/*`) — not a package |
| `site/i18n/` | next-intl home — config + `messages/{en,hi,fr,de,es}.json`; plugin `./i18n/request.ts` (+ root `i18n/request.ts` re-export for monorepo cwd) |
| `site/platform/{shared,Studio,Planner}/data/` | Furniture library, uploads, projects, exports — **dev disk mode only** |
| `tests/` | Unit (name-mirror), integration, browser |
| `site/inventory/descriptors/` | Descriptor JSON / local release records |
| `site/public/assets/` | Nested asset tree — `{catalog,marketing,others}` on disk (2026-08-06) |
| `site/public/assets/others/legacy/png-catalog/` | Local PNG mirror (public URL `/png-catalog` via rewrite) |

Decision tree / package map: this README.  
Routes: [`routes.md`](./routes.md). Plans: [`plans/README.md`](../../plans/README.md).  
CSS: [`css.md`](./css.md) · stop-drift: [`focss-stop-drift.md`](../governance/focss-stop-drift.md) · tree: [`site/focss/README.md`](../../site/focss/README.md).  
Stack: [`stack.md`](./stack.md).

### Product roots (live)

| Area | Root |
|---|---|
| Site (marketing) | `app/(site)/`, `components/home/`, `features/site/` |
| Admin | `app/admin/`, `features/admin/` (**no** `product-studio` tree on disk) |
| Admin → Architecture docs | External link (System nav) to tech-docs SPA — **dev :3001**, **prod subdomain** — see § Tech-docs below |
| Floor Planner (fork) | `app/ooplanner/`, `features/Planner/`, `components/Planner/`, `lib/Planner/`, `@planner/*` |
| Furniture Studio (fork) | `app/oostudio/`, `features/Studio/`, `components/Studio/`, `lib/Studio/`, `@studio/*` |
| Tech-docs (optional inventory UI) | `tech-docs-generator/` — Vite, not Next; not FOCSS |
| Plan-symbol contract | `lib/catalog/planSymbolPngContract.ts` |
| Catalog adapters | `lib/catalog/` |

Root `/` is the **marketing homepage** (`site/app/(site)/page.tsx`). There is no
`site/app/page.tsx` and no redirect to `/oostudio`.

## Domains

| Domain | Owns | Does not own |
|---|---|---|
| **Site** | Marketing, SEO, discovery, contact | Forked canvas document model |
| **Admin** | Catalog ops, CRM demo, themes, price books, inventory views | Customer layout canvas |
| **Planner (fork)** | `/ooplanner` design, Fabric place, disk projects | Studio furniture graph |
| **Studio (fork)** | `/oostudio` furniture authoring, AI helpers, disk furniture | Planner project documents |
| **CRM / Ops** | Admin CRM demo + `customer_queries` ops | Top-level `/crm` routes |

**Separation:** Studio ↔ Planner must not import each other (`pnpm run scan:boundaries`).

### How Studio output reaches the Planner

The Studio writes the furniture library; the Planner rail reads it. No module is
shared — each fork declares its own store and they meet at the same backing
location.

```
Studio save  →  POST /api/Studio/furniture  →  server/Studio/studioStore.ts
                                                     ↓ writeFurnitureItem
                        furniture_catalog (prod)  /  platform/shared/data/furniture/ (dev)
                                                     ↑ listCatalog
Planner rail →  GET /api/Planner/catalog    →  server/Planner/plannerStore.ts
```

A second path — `POST /api/Studio/furniture/[id]/publish` — writes versioned
descriptors (`block_descriptors` in prod [admin DB], `site/inventory/descriptors/` in dev)
plus lifecycle. **The Planner rail does not read descriptors**; that path feeds
catalog release, not the rail.

Outbound: `POST /api/Planner/handoff` records a BOQ handoff for staff follow-up
in `planner_handoffs`. Not part of the Studio→Planner path.

## UI zones

| System | Routes | Controls |
|---|---|---|
| **Site** | `(site)/*` | FOCSS site entry — no shadcn on marketing chrome |
| **Admin** | `/admin/*` | FOCSS admin — FOCSS-native chrome; `ShadcnChrome` removed (phase 13, per `site/app/admin/layout.tsx`) |
| **Planner fork** | `/ooplanner*` | FOCSS `planner/entry.css` + Planner-local UI primitives |
| **Studio fork** | `/oostudio*` | FOCSS `studio/entry.css` + Studio-local UI primitives |

FOCSS = appearance/layout. Admin chrome is FOCSS-native (`ShadcnChrome` removed). React Aria = selected composites in forked apps. Phosphor = icons. Enforced by `pnpm run lint:ui:strict` where wired.

Shared rules: semantic tokens; distinct loading/empty/error states; no silent failure; WCAG 2.2 AA; keyboard without dragging. UI claims need fresh browser proof.

## Current vs target

| Area | Live on disk |
|---|---|
| Interactive apps | `/oostudio`, `/ooplanner` (+ projects) |
| Workspace layout | **dockview-react** in each forked DockShell |
| 2D canvas | Fabric in each forked app |
| 3D | **Removed 2026-08-03** — no `three` in app; the Open3D vendor embed (`public/vendor/open3d-floorplan/`) is also absent on disk now |
| Store | Mode-aware: `site/platform/*/data/` (dev) or Supabase (prod). `site/data/storage/` is legacy, zero references |
| Plan symbol (2D) contract | PNG fields via `planSymbolPngContract.ts`; local files under `site/public/assets/others/legacy/png-catalog/` (dev mirror only) |
| Persistence | Exclusive mode — disk under `DEV_AUTH_BYPASS=1`, else Supabase. Never dual-write |
| Descriptors | `site/inventory/descriptors/*.json` present |
| Legacy `/planner` app routes | **absent** — no longer tracked in `Failures.md`; re-verify residual `@/features/planner/*` imports if a build error appears |
| Product Studio admin (`/admin/product-studio`) | **absent** |
| Edge | **`site/proxy.ts` present** (Next 16); no `middleware.ts` |
| i18n | **`site/i18n/` present** — config + messages; plugin `./i18n/request.ts`; root `i18n/request.ts` re-exports for monorepo `process.cwd()` |

Blockers: [`Failures.md`](../../Failures.md). Plans: [`plans/README.md`](../../plans/README.md). Stack: [`stack.md`](./stack.md).

## Quality targets

WCAG 2.2 AA · OWASP ASVS L2 (risk-based) · LCP ≤2.5s · INP ≤200ms · CLS ≤0.1.

Bars, not PASS certificates. Proof = fresh commands / browser evidence.

## Archived (not live authority)

`.archive/docs/architecture/`: numbered essays `01`–`14` and related. Live CSS map is `css.md`.

## Source pointers

Where to start reading. Live code wins.

| Concern | Start |
|---|---|
| Studio UI | `site/components/Studio/Studio.tsx` |
| Studio store | `site/server/Studio/studioStore.ts` |
| Planner UI | `site/components/Planner/Planner.tsx` |
| Planner store | `site/server/Planner/plannerStore.ts` |
| Persistence modes | `site/lib/Planner/plannerPersistenceMode.ts` · `site/lib/catalog/furnitureCatalogMode.ts` |
| Furniture / descriptors (Supabase) | catalog stores under `site/lib/catalog/` |
| Catalog assets | `site/features/shared/catalog/catalogAssetStorage.server.ts` |
| Migrations / furniture seed | `scripts/db_apply_migrations.ts` · `scripts/seed_furniture_catalog.ts` |
| Admin shell | `site/features/admin/ui/AdminLayoutShell.tsx` |
| Tech-docs URL | `site/lib/admin/techDocsUrl.ts` |
| Tech-docs package | `tech-docs-generator/` · `pnpm run tech-docs:dev` → **:3001** |
| Proxy | `site/proxy.ts` |
| Playwright harness | `config/build/playwright.config.ts` |

**Absent:** `site/features/admin/product-studio/**`, legacy lowercase `features/planner/**` product cluster.

## Tech-docs (inventory SPA)

Optional Vite SPA — **not** product authority. Admin System → Architecture docs is an **external link** (`techDocsUrl.ts`).

| | |
|--|--|
| Dev | `pnpm run tech-docs:dev` → http://localhost:3001/tech-stack (strict port; product stays **:3000**) |
| Prod URL | `NEXT_PUBLIC_TECH_DOCS_URL` (default `https://docs.oando.co.in`) |
| Generate | `pnpm run ops tech-docs:generate` → `generated-documents/` (wiped each run) |
| Gate | `pnpm run tech-docs:gate` |
| CSS | `tech-docs-generator/src/styles/` — **not** FOCSS |
| Detail | [`tech-docs-generator/README.md`](../../tech-docs-generator/README.md) · stack: [`stack.md`](./stack.md) §1–2 |

Blockers: root [`Failures.md`](../../Failures.md) only.
