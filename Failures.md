# Active blockers

Plan direction: [`plans/`](./plans/) -- handover: [`plans/01-handover.md`](./plans/01-handover.md).  
Browser for any claim: **`http://localhost:3000` only**.

Remove rows only after verified fix with evidence; add a row when a real ship blocker appears.

Also mirrored in tech-docs: **Tech Stack -- Active blockers** (`tech-docs-generator/src/data/activeBlockers.ts`).

---

| ID | Priority | Blocker | Evidence | Owner action |
|----|----------|---------|----------|--------------|
| **F3** | P0 | `docs.oando.co.in` has **no public DNS** (NXDOMAIN). | `Resolve-DnsName` / `curl` -> could not resolve. Separate from apex Worker. | Add CF DNS for `docs` -> tech-docs host; ship docs separately per `docs/architecture/tech-docs-link.md`. |
| **P0-1** | P0 | **Product pages hydrate with mismatched `srcSet`** -- SSR renders worker-proxy URLs differently than client. | `results/console-audit/errors.json` -- 28 errors across 6 routes (hydration mismatches + 404s on `/products/workstations/`, `/products/seating/`, `/dashboard/`, `/portal/`). | Stabilize `NEXT_PUBLIC_ASSET_BASE_URL` or normalize worker URLs in image loader. |
| **P0-2** | P0 | **Catalog DB missing `catalog_categories` and `catalog_products` tables** in Products project. | `results/tests/audit-extract.txt` -- `relation catalog_products does not exist` (42P01). Migration `20260801130000_create_furniture_catalog.sql` exists but **not applied**. | Apply migration to Products DB; verify `db:apply` tracked at/after `20260801`. |
| **P0-3** | P0 | **Worker proxy returns 404 for catalog assets** that exist in S3. | `results/asset-cutover/smoke-report.json` -- `catalog/flagship/categories/soft-seating.webp` and `catalog/seating/cafe/oando-seating--cafe-sleek/cafe_high_2.webp` both worker=404, s3=200. | Update `workers/oando-worker-proxy` routing to handle `/assets/catalog/*` paths. |
| **P1-1** | P1 | **Test result JSON stale** -- `vitest-results.json` overwritten by focused runs (180 tests), masking full suite (2784 tests). | `results/tests/vitest-results.json` vs `results/tests/full-test-run-4.log`. | Save full-suite JSON to separate file; prevent overwrite by focused runs. |
| **P1-2** | P1 | **Theme fetch fails** -- falls back to local tokens. | `results/tests/audit-extract.txt` -- `Failed to fetch active theme`. | Verify `block_themes` table seeded in Products DB. |
| **P1-3** | P1 | **Auth handler `withAuth:mirror:throw` errors** in test stderr + rate limit 401s from `127.0.0.1`. | `results/tests/audit-extract.txt` -- `[withAuth:mirror:throw] error`; `GET .../rate_limits 401 (Unauthorized)`. | Fix rate limit key to use `localhost` not `127.0.0.1`; clean up auth error mirroring. |
| **P1-4** | P1 | **pnpm lockfile version mismatch** -- `pnpm-lock.yaml` v9.0 (pnpm 10.x) vs `packageManager` pnpm@11.20.0. | `pnpm-lock.yaml` header vs `package.json#packageManager`. | Regenerate lockfile with pnpm 11.20.0: `pnpm install --no-frozen-lockfile`. |

**Not blockers for the reported 404s:** Page Rules / WAF inventing path 404s (unverified via API -- token lacks zone DNS/rules read -- but Worker is a transparent proxy and `CF-Cache-Status: DYNAMIC`; 404s carry `x-matched-path: /404` + `x-vercel-cache: HIT` from origin). Local Next routes for portal/dashboard/ooplanner **exist** under `site/app/`.

---

*Last updated: 2026-08-08*
