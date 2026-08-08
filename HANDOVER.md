# Handover — 2026-08-08

**For:** Owner / next session  
**Branch:** `main`  
**Status:** Commit in this session bundles catalog/CDN, fonts, plans hygiene, and tech-docs database/blockers.

---

## TL;DR

- **Catalog/CDN:** Local dev serves catalog images via `/api/files/catalog/*` + R2 clean bucket fallback; removed bogus `gallery/*.jpg` rewrites and retry loops.
- **Fonts:** Helvetica 400 uses full `HelveticaNeue-Roman.otf`; removed corrupt HTML woff2 files; fixed SVG font CSS in planner demos.
- **Plans:** Consolidated to **7 files** — `README.md` + six programme plans (flat; no subfolders).
- **Tech docs:** Tech Stack and Database pages now document **two Supabase projects** (Admin `rxzpznmxbaoxpikowmfc`, Products `erpweaiypimorcunaimz`) and **active blockers** (mirrors `Failures.md`).
- **Only active blocker:** **F3** — `docs.oando.co.in` DNS (manual Cloudflare).

---

## Database route (for tech stack)

There is **no** product HTTP route at `/database`. Database documentation lives in the **tech-docs SPA**:

| What | Where |
|------|--------|
| Tech-docs page | `/database` (dev `:3001`, prod `docs.oando.co.in/database`) |
| Admin DB client | `@/platform/supabase/server` → `createAuthServerClient()` · env `NEXT_ADMIN_SUPABASE_URL` |
| Products DB client | `@/platform/supabase/server` → `createServerClient()` · env `NEXT_PUBLIC_SUPABASE_URL` |
| Admin migrations | `site/platform/supabase/migrations.admin/` |
| Products migrations | `site/platform/supabase/migrations/` |
| Catalog asset API (new) | `GET /api/files/catalog/[...path]` — R2-backed, not Supabase |

Persistence selectors (dev disk vs prod Supabase): `plannerPersistenceMode.ts`, `furnitureCatalogMode.ts`, block descriptor store.

---

## What changed this session

### Catalog & CDN (`site/lib/assetPaths.ts`, R2, Worker, tests)

- Dev CDN default `""`; prod `https://oando.co.in`.
- Rewrite `/assets/catalog/*` → `/api/files/catalog/*`.
- Worker key aliases (`assets/catalog/` → `catalog/`, strip `gallery/`).
- `FilterGrid` stops bogus image candidate loops.

### Fonts (`site/lib/fonts.ts`, corrupt public woff2 removed)

- Body weight 400: `HelveticaNeue-Roman.otf` (was 9KB woff2 subset).
- Deleted 6 HTML files masquerading as `.woff2`.
- `CategoryListingHero`: removed `font-serif`.
- `PlannerFeatureDemo`: SVG text uses CSS `font-family: var(--font-sans)`.

### Plans cleanup

Consolidated to six programme plans: `workspaces-plan.md` (Planner+Studio), `site-plan.md` (marketing/i18n/UI), `database-plan.md` (+ asset cutover), `ops-deploy-plan.md` (+ auth/session), `testing-plan.md` (+ scripts hygiene), `tech-docs-plan.md`.  
`check:plans-purity` allow-list: README + those six files only; subfolders rejected.

### Tech docs

- `tech-docs-generator/src/data/databaseBoundaries.ts` — two-project table + persistence routes.
- `tech-docs-generator/src/data/activeBlockers.ts` — mirrors `Failures.md` F3.
- `TechStack.tsx` — Database boundaries + Active blockers sections.
- `Database.tsx` — Two Supabase projects section at top.

### Admin deploy fix

- Removed duplicate `site/app/admin/icon.png`; icons block removed from admin layout (Vercel prebuilt lambda error).

---

## Verification

```powershell
pnpm run gate
node scripts/general/check-plans-purity.mjs
# Catalog smoke (dev server on :3000):
# GET /api/files/catalog/workstations/oando-workstations--deskpro/image-1.webp → 200
```

---

## Open items (next session)

| Priority | Item |
|----------|------|
| P1 | **F3** — Add `docs.oando.co.in` DNS in Cloudflare |
| P2 | Commit pushed; confirm Vercel deploy picks up catalog API + fonts |
| P3 | `assetPaths.ts` decomposition (see `plans/database-plan.md` asset cutover section) |
| P4 | Admin `feature_flags` grants — `placeFurnitureAt` e2e |
| P5 | Member-suite UI polish track C (`plans/site-plan.md`) |
| P6 | `pnpm run release:gate` after deploy |

---

## Key references

| Doc | Purpose |
|-----|---------|
| `Failures.md` | Active blockers (F3 only) |
| `plans/README.md` | Programme plan index (6 programmes) |
| `plans/database-plan.md` | DB persistence, grants, R2/CDN cutover |
| `AGENTS.md` | Agent rules, DB project IDs |

**Authority:** user instruction > live code > `AGENTS.md` > `docs/`.  
**Handover prepared:** 2026-08-08.
