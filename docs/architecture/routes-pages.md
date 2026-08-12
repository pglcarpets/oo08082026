# Page route classification

**Scope:** live `site/app/**/page.tsx` modules observed on disk.  
**APIs:** [`routes-api.md`](./routes-api.md). Package map: [`product-map.md`](./product-map.md). Plans: [`plans/README.md`](../../plans/README.md).

*Hand-synced 2026-08-01 against filesystem. Base Next config: `config/build/next.config.js` (merged by `site/next.config.js`).*

## Interactive apps (live)

| URL | Module |
|-----|--------|
| `/` | `app/(site)/page.tsx` — **marketing homepage** (not a redirect to Studio) |
| `/oostudio` | `app/oostudio/page.tsx` → `features/Studio/page` |
| `/ooplanner` | `app/ooplanner/page.tsx` → `features/Planner/page` |
| `/ooplanner/projects` | `app/ooplanner/projects/page.tsx` |
| `/ooplanner/projects/[id]` | `app/ooplanner/projects/[id]/page.tsx` |
| `/offline` | `app/offline/page.tsx` |

## Site — live pages (`app/(site)/`)

- `/` → `app/(site)/page.tsx` (marketing home)
- `/about` → `app/(site)/about/page.tsx`
- `/access` → `app/(site)/access/page.tsx`
- `/career` → `app/(site)/career/page.tsx`
- `/choose-product` → `app/(site)/choose-product/page.tsx`
- `/clients` → `app/(site)/clients/page.tsx`
- `/compare` → `app/(site)/compare/page.tsx`
- `/contact` → `app/(site)/contact/page.tsx`
- `/dashboard` → `app/(site)/dashboard/page.tsx`
- `/downloads` → `app/(site)/downloads/page.tsx`
- `/planning` → `app/(site)/planning/page.tsx`
- `/planner` → `app/(site)/planner/page.tsx` (marketing)
- `/planner/features` → `app/(site)/planner/features/page.tsx` (marketing)
- `/planner/features/[slug]` → `app/(site)/planner/features/[slug]/page.tsx` (marketing)
- `/planner/help` → `app/(site)/planner/help/page.tsx` (marketing)
- `/portal/[id]` → `app/(site)/portal/[id]/page.tsx`
- `/portal/guest` → `app/(site)/portal/guest/page.tsx`
- `/portal/guest/view/[id]` → `app/(site)/portal/guest/view/[id]/page.tsx`
- `/portal` → `app/(site)/portal/page.tsx`
- `/privacy` → `app/(site)/privacy/page.tsx`
- `/products/[category]/[product]` → `app/(site)/products/[category]/[product]/page.tsx`
- `/products/[category]` → `app/(site)/products/[category]/page.tsx`
- `/products` → `app/(site)/products/page.tsx`
- `/products/category/[slug]` → `app/(site)/products/category/[slug]/page.tsx`
- `/quote-cart` → `app/(site)/quote-cart/page.tsx`
- `/refund-and-return-policy` → `app/(site)/refund-and-return-policy/page.tsx`
- `/service` → `app/(site)/service/page.tsx`
- `/showrooms` → `app/(site)/showrooms/page.tsx`
- `/sitemap` → `app/(site)/sitemap/page.tsx`
- `/solutions/[category]` → `app/(site)/solutions/[category]/page.tsx`
- `/solutions` → `app/(site)/solutions/page.tsx`
- `/sustainability` → `app/(site)/sustainability/page.tsx`
- `/terms` → `app/(site)/terms/page.tsx`
- `/trusted-by` → `app/(site)/trusted-by/page.tsx`
- `/login` → `app/(site)/login/page.tsx`

**Note (2026-08-06):** the old "missing `@/features/planner/*` imports" item is no
longer tracked in `Failures.md`; re-verify if a build error appears.

## Admin (live app routes)

- `/admin` → `app/admin/page.tsx`
- `/admin/analytics` → `app/admin/analytics/page.tsx`
- `/admin/catalog` → `app/admin/catalog/page.tsx`
- `/admin/crm` → `app/admin/crm/page.tsx`
- `/admin/crm/clients` → `app/admin/crm/clients/page.tsx`
- `/admin/crm/projects` → `app/admin/crm/projects/page.tsx`
- `/admin/crm/projects/[id]` → `app/admin/crm/projects/[id]/page.tsx`
- `/admin/crm/quotes` → `app/admin/crm/quotes/page.tsx`
- `/admin/customer-queries` → `app/admin/customer-queries/page.tsx`
- `/admin/design-kit` → `app/admin/design-kit/page.tsx`
- `/admin/features` → `app/admin/features/page.tsx`
- `/admin/inventory` → `app/admin/inventory/page.tsx`
- `/admin/planner-catalog` → `app/admin/planner-catalog/page.tsx`
- `/admin/plans` → `app/admin/plans/page.tsx`
- `/admin/plans/[id]` → `app/admin/plans/[id]/page.tsx`
- `/admin/price-books` → `app/admin/price-books/page.tsx`
- `/admin/settings` → `app/admin/settings/page.tsx`
- `/admin/themes` → `app/admin/themes/page.tsx`
- `/admin/workspace-catalog` → `app/admin/workspace-catalog/page.tsx`

**Absent (docs may still mention):** `/admin/product-studio`, the interactive `/planner/*` **app** tree (note: four `/planner*` marketing pages DO exist under `(site)/` — see Site list), `/admin/svg-editor`.

## Redirects

Live Next config (`site/next.config.ts`) is a minimal stub — **no redirect table** on disk. Classification-driven marketing redirects in `site/features/site/data/routeClassification.ts` may still list intent; they are not Next redirects until config wires them.

## Contract

`site/platform/route-contract.json` may describe additional contracts; verify against live routes before relying on it.
