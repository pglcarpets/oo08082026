# API route index

**Scope:** API handlers only — `site/app/api/**/route.ts`. **Pages:** [`routes-pages.md`](./routes-pages.md). Package map: [`product-map.md`](./product-map.md).

**Not in this index:** tech-docs SPA (Vite on **:3001** / subdomain) — admin only **links** to it; no Next API. See [`tech-docs-link.md`](./tech-docs-link.md).

Hand-synced 2026-08-01 from on-disk `route.ts` files (top-up 2026-08-06: added `/api/categories`, `/api/features`). Prefer regenerate: `pnpm run docs:sync` (repo root) when the generator is convenient.

| Methods | Path |
|---------|------|
| GET | `/api` |
| GET | `/api/admin/analytics` |
| PATCH, DELETE | `/api/admin/catalogs/[type]/[id]` |
| GET, POST | `/api/admin/catalogs/[type]` — `type`: `standard`, `configurator` |
| GET, PATCH | `/api/admin/features` |
| GET, PATCH | `/api/admin/plans/[id]` |
| GET, PATCH, DELETE | `/api/admin/plans` |
| POST | `/api/admin/price-books/[bookId]/action` |
| GET | `/api/admin/price-books/[bookId]` |
| GET | `/api/admin/price-books` |
| POST | `/api/admin/themes/publish` |
| GET | `/api/admin/themes` |
| POST | `/api/ai-advisor` |
| POST | `/api/audit` |
| GET | `/api/business-stats` |
| GET | `/api/categories` |
| POST | `/api/configurator/smart-wizard` |
| GET | `/api/csrf` |
| GET, PATCH | `/api/customer-queries/manage` |
| POST | `/api/customer-queries` |
| GET | `/api/dev-tools/lighthouse` |
| GET | `/api/dev/auth-bypass-status` |
| POST | `/api/exports` |
| GET | `/api/features` |
| GET | `/api/files/exports/[filename]` |
| GET | `/api/files/furniture/[filename]` — disk mode only; Supabase mode serves bucket URLs |
| GET | `/api/files/projects/[filename]` |
| GET | `/api/files/uploads/[filename]` |
| POST | `/api/filter` |
| POST | `/api/generate-alt` |
| GET | `/api/git-user` |
| GET | `/api/health` |
| POST | `/api/log-error` |
| GET | `/api/nav-categories` |
| GET, POST | `/api/nav-search` |
| GET | `/api/Planner/catalog` |
| POST | `/api/Planner/catalog/upload` |
| POST | `/api/Planner/handoff` |
| GET, POST | `/api/Planner/projects` |
| GET, PATCH, DELETE | `/api/Planner/projects/[id]` |
| POST | `/api/Planner/sketch-to-plan` |
| GET, POST | `/api/plans` |
| GET, PUT, DELETE | `/api/plans/[id]` |
| GET | `/api/products` |
| GET | `/api/products/filter` |
| POST | `/api/Studio/ai/generate` |
| POST | `/api/Studio/ai/restyle` |
| POST | `/api/Studio/ai/suggest` |
| GET, POST | `/api/Studio/furniture` |
| GET, PATCH, DELETE | `/api/Studio/furniture/[id]` |
| POST | `/api/Studio/furniture/[id]/publish` |
| POST | `/api/Studio/furniture/upload` |
| GET | `/api/theme/active` |
| GET, POST | `/api/theme/manage` |
| POST | `/api/tracking` |

## Notes

- **Forked apps:** Studio + Planner talk only to `/api/Studio/*` and `/api/Planner/*` (case as on disk). Storage is mode-aware — `site/platform/*/data/` in dev, Supabase in production. `site/data/storage/` is legacy with no code references.
- **Auth:** Residual user routes often use Supabase session via shared helpers. Admin routes use `withAuth({ role: "admin" })` or `requireAdminSession`.
- **CSRF:** Plan mutations and some admin mutations validate CSRF (`GET /api/csrf` first) where wired.
- **Admin catalog:** Canonical HTTP is `/api/admin/catalogs/{type}` (`standard` | `configurator`).
- **Auth roles (forked apps):** `/api/Planner/projects*` is `member` — parity with `/api/plans`. `/api/Planner/catalog`, `/api/Planner/handoff` and the `/api/Studio/furniture*` tree stay `guest`: anonymous catalog browsing and lead capture are intended. `goLive` on publish is admin-only.
- **Presence is not proof:** a `route.ts` on disk does not prove the handler loads. Check `Failures.md` before relying on one.
- **Absent vs older indexes:** no `/api/admin/product-studio/*`, no lowercase `/api/planner/*` tree (fork uses `/api/Planner/*`).
