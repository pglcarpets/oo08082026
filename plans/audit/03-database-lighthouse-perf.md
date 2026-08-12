# Database + Lighthouse/Perf Audit (File 3 of 5)

**Tracks:** 5 (Database), 6 (Lighthouse + perf)
**Agent:** C
**Report outputs:** `agent-reports/audit/05-database.md`, `agent-reports/audit/06-lighthouse.md`

---

## Track 5 — Database

### Scope
Two Supabase projects (AGENTS.md §4):
- **Admin** `rxzpznmxbaoxpikowmfc` — plans, profiles, handoffs, teams, price books, customer_queries, audit, furniture library + `catalog-assets`.
- **Products** `erpweaiypimorcunaimz` — catalog, configurator, descriptors, flags.

Persistence (AGENTS.md §5): dev=disk (`DEV_AUTH_BYPASS=1`), prod=Supabase (read-only fs). Mode-aware wrappers required (`writeFurnitureItem`, `plannerPersistenceMode`, `furnitureCatalogMode`). Never dual-write.

### Method
- List migrations under `**/supabase/migrations/**/*.sql`; verify each has a `-- rollback` section.
- `pnpm run check:governance` (ratchets `P4_migration_no_rollback` against baseline 42).
- For each migration: RLS `policy` + `grant` presence (Supabase requires both).
- Types regen: `db:types:admin` + `db:types` — verify types match schema.
- `pnpm run check:launch` (db_test_connection).
- Grep route handlers / server actions for raw disk writes (`fs.write`, `writeFileSync`, `platform/*/data/`) in prod paths — flag any bypassing mode-aware wrappers.
- Legacy: `site/data/storage/` must not be written to.
- RLS spot check: anon/authenticated roles on `customer_queries`, `oando_plans`, `furniture_catalog`, `block_descriptors`.

### Findings checklist
- Migration missing `-- rollback`.
- RLS policy without `grant … to anon, authenticated`.
- Type drift (generated types vs live schema).
- Mode-aware wrapper bypassed (raw disk write in a route handler/server action).
- Dual-write to disk + Supabase.
- `site/data/storage/` writes.
- Missing RLS on a table exposed via API.
- `_local_migration_history` tracking gaps (migrations < 20260524 not applied).

## Track 6 — Lighthouse + Performance

### Method
- Run Lighthouse (CLI or PageSpeed) against `http://localhost:3000/` and key routes on desktop + mobile presets.
- Routes: `/`, `/products`, `/products/[slug]`, `/ooplanner`, `/oostudio`, `/contact`, `/showrooms`.
- Capture: Performance, Accessibility, Best Practices, SEO scores + per-metric (LCP, INP, CLS, TBT, FCP, SI, TTI).
- Budgets (from oo-deep-audit-v2): LCP ≤2.5s, INP ≤200ms, CLS ≤0.1.
- Bundle: `pnpm run build:site` then inspect `.next/` standalone output / bundle analyzer; flag heavy chunks (fabric, jspdf, drizzle, mastra, gsap).
- Web Vitals instrumentation: `@vercel/analytics` mounted; check `onLCP/onINP/onCLS` reporters in `SiteAnalytics.tsx`.
- Fonts: `next/font` or self-hosted; FOIT/FOUT; font-display swap.

### Findings checklist
- Any route LCP > 2.5s (mobile).
- Any route INP > 200ms.
- Any route CLS > 0.1.
- Large JS bundle chunk > 250kb gzipped on a primary route.
- Render-blocking resources.
- Unoptimized images (`<img>` without `next/image` or explicit width/height).
- Missing font-display swap.
- Missing Web Vitals reporters.

## Evidence requirements
- Lighthouse JSON per route saved under `agent-reports/audit/lighthouse/`.
- Bundle size numbers from build output.
- file:line for heavy imports.

## Out of scope
- Applying perf fixes (propose only).
- Changing migrations (propose rollback text only).

## Acceptance
- [ ] `05-database.md`, `06-lighthouse.md` written.
- [ ] Each P0/P1 has command output / Lighthouse JSON / file:line.
- [ ] No source changes, no migrations applied.
