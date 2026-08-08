# `docs/site/` — page route maps

**Not the plan.** Live plan: [`docs/plan/README.md`](../plan/README.md).

**Not the package layout map.** That is [`docs/architecture/product-map.md`](../architecture/product-map.md).

This folder keeps **page-route inventories** and related **site/admin surface notes**:

| File | Role | Regenerate |
|------|------|------------|
| [`pages.md`](./pages.md) | Live pages + redirects notes | Prefer generator / hand-sync vs filesystem |
| [`sitemap-routes.csv`](./sitemap-routes.csv) | Marketing route CSV for site probes | `pnpm run docs:sync:sitemap-csv` |
| [`tech-docs-link.md`](./tech-docs-link.md) | Admin **Architecture docs** external link (dev :3001 / prod subdomain) | Hand-maintained with `techDocsUrl.ts` |

APIs: [`docs/api/routes.md`](../api/routes.md) (`pnpm run docs:sync:routes`).

## Live interactive apps (not marketing `(site)` only)

- `/` — marketing homepage (`site/app/(site)/page.tsx`)
- `/oostudio` — Furniture Studio
- `/ooplanner`, `/ooplanner/projects`, `/ooplanner/projects/[id]` — Floor Planner
- Admin `/admin/*` — residual admin; **Architecture docs** opens tech-docs on **:3001** (dev) or **docs subdomain** (prod) — not a Next route

## Note on the tech-docs SPA

The inventory UI under `tech-docs-generator/` is optional and **its vitest lane is
currently failing** — see `Failures.md` F1. Do not treat its generated pages as
authority over live code.

## Archived

`.archive/docs/site/` essays are not live authority.
