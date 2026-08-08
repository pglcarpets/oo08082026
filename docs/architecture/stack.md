# Stack

What runs this application, how the interactive surfaces are actually built, and
which declared packages are genuinely wired.

**Authority:** root `package.json` / `pnpm-lock.yaml` + live imports. When this
file and the code differ, the code wins. Verified 2026-08-01 by reading the
manifests and counting real imports across `site/**`.

This file states architectural limits. It is not PASS proof — that comes from
fresh commands.

---

## 1. Toolchain

| Item | Value | Note |
|------|-------|------|
| Node | **24** | Pinned in every CI workflow. The root package declares **no `engines`** field — CI is the only statement of the version |
| Package manager | **pnpm 11.20.0** | Exact, via `packageManager`. Install from repo root only |
| Framework | **Next 16.3.0-preview.10** | A preview release. Treat upgrade notes as load-bearing |
| React | **19.2.8** | Pinned exact, not caret |
| TypeScript | **^7.0.2** | |
| Bundler | **webpack, explicitly** | `dev` and `build:site` both pass `--webpack`. Next 16 defaults to Turbopack; this is a deliberate opt-out — do not remove the flag casually |
| CSS engine | **Tailwind v4** | Via `@tailwindcss/postcss` in `config/build/postcss.config.mjs`. See §3 |
| Test | Vitest **^4.1.10**, Playwright **^1.62.1** | Two vitest lanes — see `Testing-handbook.md` |

Next config resolution: `site/next.config.js` is what Next loads
(`site/next.config.ts` re-exports it), merging `config/build/next.config.js` plus
the `next-intl` plugin.

**Build is two packages, not one.**

```
build → build:site       → check-sharp → next build site --webpack → prepare-standalone.cjs
      → build:tech-docs  → the Vite inventory SPA
```

So `tech-docs-generator` is optional *to the product* but **not optional to
`pnpm run build`**. Package `test` / `tech-docs:gate` may still be red when
`Failures.md` lists F1 — that does not block `build:site`, but it does block a
green `tech-docs:gate` / CI tech-docs workflow.

If `node_modules/next` is missing, run `pnpm install` from root before making any
claim about build state.

---

## 2. Workspace

| Boundary | Owns |
|----------|------|
| Repo root | pnpm, gates, scripts, **all product dependencies** |
| `site/` | Marketing, Admin, forked Planner/Studio, API — the Next app |
| `tech-docs-generator/` | Repo inventory SPA (Vite), the only other workspace package |
| `config/build/` | Harness — `next.config.js`, `postcss.config.mjs`, `tsconfig.json`, `playwright.config.ts`, gate spec lists, `vitest-console-reporter.ts` |
| `tests/` | Vitest + Playwright specs for both packages |

There is no `site/package.json`. Product deps are declared on the **root** package,
which is why `pnpm install` inside `site/` corrupts the tree.

`pnpm-workspace.yaml` carries `allowBuilds` (pnpm 11) — an explicit allowlist of
which packages may run postinstall scripts. Two entries are deliberately `false`:
`canvas` (Fabric's optional native dep, unbuildable on Node 24 and unnecessary for
browser Fabric) and the ONNX binaries pulled in transitively by the RAG deps.

---

## 3. CSS: FOCSS on Tailwind v4

FOCSS is not a replacement for Tailwind — it is a layer **on top of** it.
`site/focss/base/scan.css` and each zone entry begin with `@import "tailwindcss"`,
and the PostCSS pipeline runs `@tailwindcss/postcss`.

What that means in practice:

- Tailwind v4 provides the utility engine and the `@reference` mechanism.
- FOCSS owns the **semantic tokens** and zone structure; you write against tokens,
  not raw utilities, in product TSX.
- `tailwind-merge` and `clsx` handle class composition; `tw-animate-css` supplies
  animation utilities (CSS-imported, no TS import).
- Four zone entries, one per surface: `site/`, `admin/`, `planner/`, `studio/`.
  No cross-zone imports.

Detail: [`css.md`](./css.md). Drift ratchet:
[`../governance/focss-stop-drift.md`](../governance/focss-stop-drift.md).

---

## 4. How the interactive workspace is built

This is the part that matters. Studio and Planner are the product, and they are
assembled from five layers that each own one concern.

### The layers

```
   dockview-react        panel layout — draggable, resizable, persisted
        │
        ├── Fabric 7      2D canvas: the drawing/placement surface
        └── React Aria    accessible controls inside panels
        │
   Zustand               canvas + workspace state, per app
        │
   GSAP / Framer Motion  motion
```

| Layer | Package | Live use | What it owns |
|-------|---------|----------|--------------|
| Docking | `dockview-react` 7.0.4 | 4 files | Each app has its **own** `DockShell`. No shared dock state between them, and not FlexLayout |
| 2D canvas | `fabric` 7.4.0 | 18 files | The interactive surface in both apps. Scale differs by app: Studio **0.2 px/mm**, Planner **0.05 px/mm** |
| 3D | — | **removed** | `three`, `@react-three/fiber`, `@react-three/drei` dropped 2026-08-03. The former `public/vendor/open3d-floorplan/` embed directory is also absent on disk (verified 2026-08-06) |
| Controls | `react-aria-components` | 9 files | Accessible primitives wrapped per app under `components/{Studio,Planner}/ui/` |
| State | `zustand` 5.0.14 | 7 files | Per-app canvas and workspace stores |
| Motion | `gsap` + `@gsap/react` | **31 / 30 files** | The dominant animation layer, mostly marketing and chrome |
| Motion | `framer-motion` | 10 files | Component-level transitions |

Two consequences worth internalising:

**The canvas scale differs between apps.** 0.2 px/mm in Studio versus 0.05 px/mm
in Planner. A geometry helper copied from one app to the other will silently
produce objects at 4× or ¼ size. This is one of the reasons the trees are forked.

**GSAP is the animation system here, not Framer Motion.** With 31 files against
10, reaching for Framer in new work adds a second idiom to a codebase that already
has a dominant one.

### Supporting the interaction

| Concern | Package | Live use |
|---------|---------|----------|
| URL as state | `nuqs` | 8 files — filter/selection state survives reload and is shareable |
| Server actions | `next-safe-action` | 9 files — typed action results, used by the contact and admin forms |
| Forms | `react-hook-form` + `@hookform/resolvers` + `zod` | 4 / 3 / 17 files |
| Server cache | `@tanstack/react-query` | 2 files — `QueryProvider` in the site layout |
| Env validation | `@t3-oss/env-nextjs` | 1 file |
| Icons | `@phosphor-icons/react` | Through each app's `PhIcon` + `phIconMap`. No inline SVG, no Lucide |
| Export | `jspdf` | 2 files — plan/BOQ PDF |
| Search | `fuse.js` | 1 file — fuzzy catalog search |
| Carousel | `embla-carousel-react` (+ autoplay) | 2 files — marketing |
| Raster | `sharp` | 2 files — plan-symbol PNG and thumbnails |

### Data and platform

| Concern | Package | Live use |
|---------|---------|----------|
| Supabase client | `@supabase/supabase-js` + `@supabase/ssr` | Service-role and request-scoped clients under `site/platform/supabase/` (`@/platform/supabase/*`) |
| SQL / schema | `drizzle-orm` (7 files), `postgres` (1) | Schema under `site/platform/drizzle/schema/`; drizzle-kit journal at `site/platform/drizzle/migrations/meta/_journal.json`. Ship migrations are raw SQL under `site/platform/supabase/migrations*` |
| Object storage | `@aws-sdk/client-s3` | 2 files — **R2 backup/ops only**, never a live write path |
| Analytics | `@vercel/analytics`, `@vercel/speed-insights` | Marketing |
| AI | `@mastra/core` (7 files), `@lancedb/lancedb` (1), `@orama/orama` (1) | Retrieval for the advisor surface |

### Declared but not imported

Verified by searching every file type under `site/` and `scripts/`:

| Package | Imports | Verdict |
|---------|---------|---------|
| `@xyflow/react` | **0** | No longer declared in `package.json` at all (removed; verified 2026-08-06) |
| `three-stdlib` | **0** | No longer declared in `package.json` at all (removed; verified 2026-08-06) |
| `polygon-clipping` | **0 code** (1 incidental mention) | Declared but not wired |

Package policy says a direct dependency needs a live import or a documented build
role. `polygon-clipping` has neither — flag it to the owner rather than removing it
unilaterally (governance E4: retire deliberately — removal needs owner approval,
and git history is the archive for anything git tracks).

Do **not** reintroduce svgcanvas, Excalidraw, tldraw, Klecks, or FlexLayout as the
workspace dock without an explicit owner decision.

---

## 5. Persistence limits

Production runs on a **read-only filesystem**. An `fs.writeFile` on a request path
is a production bug, not a fallback.

Exclusive mode — `DEV_AUTH_BYPASS=1` on a non-production build selects disk,
everything else selects Supabase. Never both.

| Data | Supabase (prod) | Disk (dev) |
|------|-----------------|------------|
| Planner projects | `oando_plans` (admin DB) | `platform/Planner/data/projects/` |
| Furniture library | `furniture_catalog` + `catalog-assets` bucket (admin DB) | `platform/shared/data/furniture/` |
| Published descriptors | `block_descriptors` (products DB) | `site/inventory/descriptors/` |

Selectors: `lib/Planner/plannerPersistenceMode.ts`,
`lib/catalog/furnitureCatalogMode.ts`. Route handlers call the mode-aware store
wrappers, never the raw disk helpers.

The failure mode is quiet: seed content is committed to git, so in production the
Planner rail renders and looks healthy while every save fails.

---

## 6. Plan-symbol release (PNG)

| Layer | Owns |
|-------|------|
| Contract | `lib/catalog/planSymbolPngContract.ts` — `planSymbolPngUrl` + checksum (+ mime), 2 px/mm, 40 mm pad |
| Bytes | Supabase Storage `catalog-assets` via `features/shared/catalog/catalogAssetStorage.server.ts` |
| Release record | `block_descriptors` (Supabase mode) or `site/inventory/descriptors/` (disk) |
| Dev mirror | `site/public/assets/others/legacy/png-catalog/` — never release authority |

Quality gate before publish: `assertPlanSymbolPngQuality` + `checksumPngBuffer`.
Do not claim DB release authority without a live publish path and proof.

---

## 7. i18n

| Item | Value |
|------|-------|
| Framework | `next-intl` **^4.13.4** — marketing site only |
| Config | `site/i18n/{config,routing,request}.ts`; locales `en`, `hi`, `fr`, `de`, `es` (default `en`) |
| Messages | `site/i18n/messages/{en,hi,fr,de,es}.json` |
| Plugin | `createNextIntlPlugin("./i18n/request.ts")` in `site/next.config.js` |
| Root shim | `i18n/request.ts` re-exports `site/i18n/request.ts`. Required: next-intl validates against `process.cwd()` (often the monorepo root for `next build site`), while webpack’s app context is `site/` — do **not** pass `./site/i18n/...` or the prefix doubles under `site/` |
| OG/Twitter images | Marketing `opengraph-image.tsx` / `twitter-image.tsx` use `export const runtime = "nodejs"` (Edge runtime removed — Next 16 deprecated it). |

Planner, Studio and Admin are English-oriented; they are not wired to `next-intl`.

---

## 8. Security at runtime

**Edge:** Next 16 uses `site/proxy.ts` — `export async function proxy` plus
`export const config.matcher`, not `middleware.ts`. It applies CSP and security
headers, the protected-page cookie bounce, maintenance-mode write 503s, and
member-only write blocks for unauthenticated `/api/plans`.

**Handlers:** forked product APIs are gated in the handler by
`withAuth({ role, requireCsrf })` plus rate limits — `admin` | `member` | `guest`.
`/api/Planner/projects*` is `member`; the catalog, handoff and Studio furniture
routes are `guest` by intent.

**Secrets:** `.env.local` and deploy secrets only. CSRF helpers under
`site/lib/security/`. `DEV_AUTH_BYPASS=1` is set by `pnpm dev` for local only and
is hard-ignored when `NODE_ENV=production`.

---

## 9. Package policy

- A direct dependency needs a **live import** or a documented build role. §4 lists
  the current exceptions.
- License check before adding. Prefer an existing platform library. No competitor
  assets or trade dress.
- Benchmark-only packages do not belong in root product deps.
- New package scripts use `pnpm exec`, not `npx` — `check:governance` ratchets the
  `npx` count.

## 10. Honesty

Browser proof is required for interactive canvas claims; unit-green is not the
same thing. Disk-store green is not a hosted multi-tenant claim — and because
local dev runs on the disk mode, local proof says nothing about the Supabase path
production uses. Blockers: [`../../Failures.md`](../../Failures.md).
