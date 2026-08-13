# Vercel cost + SEO performance

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Registry:** [`00-README.md`](./00-README.md) · Evidence: `results/cost-seo/`

**Goal:** Cut the Vercel invoice by stopping work we already buy from Cloudflare/R2, then make marketing HTML cacheable so Core Web Vitals and crawl discovery improve — without leaving Vercel.

**Architecture:** Stay on the current split. Cloudflare worker is the apex. R2 already serves `/assets/`. Vercel stays the Next origin for Planner, Studio, admin, and APIs. Marketing pages become cacheable English HTML. Product and hero photos are served as the existing R2 webp files, not through `/_next/image`.

**Tech Stack:** Next.js App Router on Vercel, Cloudflare Worker (`workers/oando-worker-proxy`), R2 `ASSET_BUCKET`, next-intl (`localePrefix: "never"`), `next/image` kept only for layout/`sizes` (unoptimized).

## Global Constraints

- Stay on Vercel. No host migration, no OpenNext, no Railway/Fly in this programme.
- **All work is inside this git repo.** No other trees, no `~/.grok/` artefacts as deliverables, no `docs/superpowers/plans/`, no agent worktrees, no `git worktree add`. Never create worktrees. If a skill says to use an isolated worktree, ignore it.
- Repo root only. `pnpm` only.
- Studio (`/oostudio`) and Planner (`/ooplanner`) stay forked. Do not import across them.
- Production filesystem is read-only. No raw disk writes. Catalog photos live on R2, not `site/public` in prod.
- UI checks use `http://localhost:3000` only.
- `pnpm run test` is two Vitest lanes. Check both.
- Before done: `pnpm run check:layout`, then `pnpm run gate`. Ship: `pnpm run release:gate`.
- Plans stay flat Markdown under `plans/`. Evidence under `results/`. Blockers only in `Failures.md`.
- Do not change `X-Robots-Tag` allow-list on the worker (`oando.co.in` stays `all`).
- Do not invent browser/build state — measure production after each ship.

## Why this order

Live production (`https://oando.co.in/`, 2026-08-13):

| Finding | Evidence |
|---------|----------|
| Lighthouse SEO 100 | chrome-devtools mobile audit |
| HTML never cached | `cache-control: private, no-store`, `cf-cache-status: BYPASS`, `x-vercel-cache: MISS`, `age: 0` |
| TTFB 640ms (56% of LCP) | performance trace NAVIGATION_0 |
| CLS 0.32 (poor) | same trace; budget 0.1 |
| `/_next/image` on in prod | `config/build/next.config.js` `useUnoptimizedImages` is false when `VERCEL_ENV === "production"` |
| Sitemap 38 URLs, 0 PDPs | live `/sitemap.xml`; `/api/products` returns 50+ products |
| Crest gallery "Photo coming soon" | live `/products/tables/crest/` while JSON-LD lists 3 catalog webps |
| Function region iad1 | `x-vercel-id: sin1::iad1` |

Vercel bills Image Optimization (transformations + cache writes + transfer), Fluid Compute (every uncached HTML hit), and Fast Data Transfer of HTML/JS/`/_next/image` through the worker (`cacheEverything: false`).

Do not migrate until Phases 1–3 have a week of invoice data.

## Non-goals

- Leaving Vercel.
- Locale-prefixed URLs (`/hi/about/`) — later programme.
- Rewriting homepage copy / local-SEO NAP (Phase 6, optional).
- Moving tech-docs off Vercel.
- Field CrUX — cannot be forced.

## Success metrics

Measure on `https://oando.co.in/` after each ship. Record under `results/cost-seo/`.

| Metric | Now | Target after Phases 1–4 |
|--------|-----|-------------------------|
| Homepage `cache-control` | `private, no-store` | `public, s-maxage≥300, stale-while-revalidate` (or CDN HIT) |
| `cf-cache-status` on `/` | `BYPASS` | `HIT` on repeat (after worker Phase 3) |
| `x-vercel-cache` on `/` | `MISS` | `HIT` / `STALE` on repeat, or request never reaches Vercel |
| Document TTFB | 640ms | < 200ms on a warm edge |
| CLS | 0.32 | ≤ 0.1 |
| `/_next/image` on `/` and a PDP | present | zero first-party asset requests |
| Sitemap product PDPs | 0 | ≥ publishable products from `/api/products` |
| Crest gallery | "Photo coming soon" | real catalog webp |

## Slice IDs

| ID | Phase | Status |
|----|-------|--------|
| COST-S00 | File this plan + pin `bom1` in `vercel.json` | OPEN |
| COST-S01 | Disable `/_next/image` in production | OPEN |
| COST-S02 | Static default locale (no `cookies()`/`headers()`) | OPEN |
| COST-S03 | Worker cache for marketing HTML + `/_next/static` | OPEN |
| COST-S04 | Sitemap PDPs + drop `3d-view` | OPEN |
| COST-S05 | Homepage CLS ≤ 0.1 | OPEN |
| COST-S06 | Content SEO (optional) | OPEN |

---

## File map

| File | Role |
|------|------|
| `plans/10-vercel-cost-seo-performance.md` | This programme plan |
| `vercel.json` | `regions: ["bom1"]` |
| `site/lib/images/optimizerMode.ts` | Testable optimizer flag |
| `config/build/next.config.js` | Turn Image Optimization off in production |
| `site/components/site/MarketingImage.tsx` | `unoptimized` for `/assets/` |
| `site/components/home/HomepageHero.tsx` | LCP poster unoptimized + reserved height |
| `site/components/ProductGallery.tsx` | Unoptimized R2 src |
| `site/features/site/catalog/ProductViewer.tsx` | Same |
| `site/features/site/catalog/FilterGrid.components.tsx` | Category grids |
| `site/i18n/request.ts` | No `cookies()` / `headers()` |
| `tests/unit/i18n/request.test.ts` | Default locale, no `next/headers` |
| `site/app/(site)/layout.tsx` | `export const revalidate = 300` |
| `workers/oando-worker-proxy/src/index.js` | Cache allowlisted GET |
| `site/app/sitemap.ts` | Emit PDPs; no empty category shells |
| `site/lib/catalog/site/getProducts.ts` | Do not cache empty catalog |
| `site/lib/catalog/site/categories.ts` | Empty input → no fake categories |
| `site/features/site/data/routeClassification.ts` | Drop `/planner/features/3d-view` |
| `site/lib/fonts.ts` | Fallback adjust; drop extra preloads |

---

### Phase 0 — File the plan + pin region (COST-S00)

All work inside this repo. No worktrees.

- [x] Write `plans/10-vercel-cost-seo-performance.md` (this file).
- [ ] Row in `plans/README.md`, COST-S table in `plans/00-README.md`, row in `CONTENTS.md`. `pnpm run check:docs-all`.
- [ ] Pin functions in `vercel.json`:

```json
{
  "regions": ["bom1"]
}
```

---

### Phase 1 — Turn off `/_next/image` (COST-S01)

Disable the optimizer in production. Keep `next/image` for `fill` / `sizes`. Browser requests `/assets/...`; worker serves R2.

Helper + tests: `site/lib/images/optimizerMode.ts`, `tests/unit/lib/images/optimizerMode.test.ts`.

- Production → unoptimized `true`.
- Escape hatch: `NEXT_IMAGE_UNOPTIMIZED=0` forces optimizer on.
- Add `unoptimized` on HomepageHero, ProductGallery, FilterGrid, ProductViewer, MarketingImage (`/assets/` srcs).
- Crest must show catalog webp, not “Photo coming soon”.
- After deploy: no `/_next/image/?url=` for first-party assets. Evidence: `results/cost-seo/phase1-no-next-image.txt`.

### Phase 2 — Cacheable marketing HTML (COST-S02)

`site/i18n/request.ts` must not import `next/headers`. Always `en` + `en` messages.

Update `tests/unit/i18n/request.test.ts` and `tests/e2e/site-locale-switch.spec.ts`. Add `export const revalidate = 300` on `(site)/layout.tsx` only.

After deploy: `cache-control` is not `private, no-store`. Evidence: `results/cost-seo/phase2-html-headers.txt`.

### Phase 3 — Worker cache (COST-S03)

Allowlist GET/HEAD 200s without session cookies and without Set-Cookie. Do not cache `/api/`, `/admin/`, `/ooplanner/`, `/oostudio/`, `/portal/`, `/dashboard/`, `/login/`, `/access/`.

TTL: `/_next/static/*` immutable 1y; marketing HTML `s-maxage=300, stale-while-revalidate=3600`. Keep `X-Robots-Tag` rewrite. Deploy origin before worker.

Evidence: `results/cost-seo/phase3-cf-cache.txt`.

### Phase 4 — Sitemap products (COST-S04)

`buildRequestedCategoryCatalog([])` must not emit six empty categories. Do not cache an empty catalog tree. Drop `/planner/features/3d-view` (OPS-S11). Tests in `tests/unit/app/(site)/sitemap.test.ts`.

Evidence: `results/cost-seo/phase4-sitemap-count.txt`.

### Phase 5 — CLS ≤ 0.1 (COST-S05)

After Phase 1. Font `adjustFontFallback`; drop Helvetica 500/700 preload. Hero min-height via FOCSS token if one exists.

Evidence: `results/cost-seo/phase5-cls.txt`.

### Phase 6 — Optional content SEO (COST-S06)

Homepage subline (furniture / India / Patna). Filter `project-abdul-hai` from `/api/products`. Real sitemap lastmod after Phase 4.

---

## PR plan

| PR | Title | Depends | Ships |
|----|-------|---------|-------|
| 0 | `docs: file cost/SEO plan + pin bom1 in vercel.json` | — | COST-S00 |
| 1 | `fix(images): disable next/image optimizer in production` | — | COST-S01 |
| 2 | `fix(i18n): static default locale so marketing HTML can cache` | — | COST-S02 |
| 3 | `feat(worker): cache marketing HTML and /_next/static` | PR 2 | COST-S03 |
| 4 | `fix(seo): emit product URLs and drop 3d-view from sitemap` | — | COST-S04 |
| 5 | `fix(cwv): homepage font fallback and hero min-height` | PR 1 | COST-S05 |
| 6 | content SEO | PR 4 | COST-S06 optional |

Each PR: tests first, `pnpm run typecheck`, `pnpm run gate`. No worktrees.

## Key decisions

1. Stay on Vercel.
2. Optimizer off in production.
3. Marketing is English-static.
4. Worker caches only allowlisted GET 200s.
5. Empty catalog ≠ six category URLs.

## Rollback

- PR 1: `NEXT_IMAGE_UNOPTIMIZED=0`.
- PR 2: revert `request.ts`.
- PR 3: revert worker; keep robots rewrite.
- PR 4: revert sitemap.

## Open question (does not block PR 1)

Locale switcher after Phase 2: leave visible (no SSR effect) or hide until prefixed URLs. Default: leave visible.
