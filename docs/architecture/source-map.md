# Pointers, Commands and Recovery

> **Scope narrowed 2026-07-28; truth-synced 2026-08-03 (+ ops dispatch).**  
> Pointers, commands, and recovery only — not a second status ledger.  
> Plan: `plans/README.md`. Blockers: `Failures.md`.

Reference document. Never executed as a step.

---

## Live source pointers

Where to start reading for each concern. Re-check before implementing — live code is
authoritative.

| Concern | Starting source |
|---|---|
| Furniture Studio UI | `site/components/Studio/Studio.tsx` |
| Studio dock shell | `site/components/Studio/StudioDockShell.tsx` (`dockview-react`) |
| Studio store (mode-aware) | `site/server/Studio/studioStore.ts` |
| Studio FOCSS | `site/focss/studio/entry.css` |
| Floor Planner UI | `site/components/Planner/Planner.tsx` |
| Planner dock shell | `site/components/Planner/PlannerDockShell.tsx` (`dockview-react`) |
| Planner store (mode-aware) | `site/server/Planner/plannerStore.ts` |
| Planner FOCSS | `site/focss/planner/entry.css` |
| Studio / Planner route entries | `site/app/oostudio/*`, `site/app/ooplanner/*` → `features/{Studio,Planner}` |
| Plan-symbol PNG contract | `site/lib/catalog/planSymbolPngContract.ts` |
| Local PNG mirror | `site/public/png-catalog/` |
| Descriptors | `site/inventory/descriptors/` (dev) · `block_descriptors` (prod — admin DB) |
| Persistence selectors | `site/lib/Planner/plannerPersistenceMode.ts` · `site/lib/catalog/furnitureCatalogMode.ts` |
| Supabase stores | `site/lib/Planner/projectsStore.supabase.ts` · `site/lib/catalog/furnitureCatalogStore.supabase.ts` · `site/lib/catalog/blockDescriptorStore.supabase.ts` |
| Catalog asset bucket | `site/features/shared/catalog/catalogAssetStorage.server.ts` |
| Migration runner | `scripts/db_apply_migrations.ts` |
| Furniture seeding | `scripts/seed_furniture_catalog.ts` |
| Commercial pricing (admin residual) | `site/features/admin/pricing/resolveWorkspaceCommercialPricing.server.ts` |
| Mastra retrieval | `site/lib/ai/mastra/catalogRetrieval.ts` |
| Site launch link | `site/components/ui/PlannerLaunchLink.tsx` |
| UI package policy | `scripts/general/lint-ui-contract.mjs` |
| FOCSS Admin entry | `site/focss/admin/entry.css` |
| Admin shell | `site/features/admin/ui/AdminLayoutShell.tsx` |
| Admin → Architecture docs (tech-docs) | `site/lib/admin/techDocsUrl.ts` + System nav; full note [`tech-docs-link.md`](./tech-docs-link.md) |
| Tech-docs Vite app | `tech-docs-generator/` · `pnpm run tech-docs:dev` → **:3001** |

**Absent trees (do not treat as live):** `site/features/admin/product-studio/**`,
legacy lowercase `site/features/planner/**` product module cluster (fork entries are `features/Planner` + `@planner/*`).

**Present (do not claim missing):** `site/proxy.ts` (Next 16 edge entry),
`config/build/playwright.config.ts` + rest of harness, `site/i18n/` messages +
config (plus root `i18n/request.ts` re-export for next-intl cwd validation).

---

## Final command sequence

Run from repository root. Prefer the **smallest** set that covers the change. Full
programme sequence (many steps need harness files listed in `Failures.md`):

```bash
pnpm run check:layout && pnpm run check:docs-all && pnpm run lint:ui:strict && pnpm run ops check:product-icons && pnpm run ops check:composer-styles && pnpm run check:style-tokens && pnpm run check:governance
```

```bash
pnpm run typecheck && pnpm run typecheck:tests
```

```bash
pnpm run test
```

```bash
pnpm run scan:boundaries && pnpm run ops scan:tokens && pnpm run verify:focss
```

```bash
pnpm run build
```

```bash
pnpm run gate
```

Expected: every command that applies exits 0. If a command cannot start (missing
`config/build/*`, missing install), log under `Failures.md` — do not invent green.

Instruments and bars: [`benchmarks.md`](../governance/benchmarks.md).

---

## Evidence locations

Raw tool output: repo-root `results/`. Blockers: `Failures.md`.

---

## Recovery rules

| Failure | Recovery |
|---|---|
| Configuration error | Reset the affected workspace profile through its Admin API |
| Invalid personal layout | Discard `PlannerWorkspacePreferencesV2`; fall back to strict defaults |
| Draft conflict | Preserve both revisions; offer server, local copy or reviewed retry |
| Offline save | Retain the idempotent newest strict document until acknowledged |
| Product publish failure | Retain the draft and the current released PNG; never replace release identity on failure |
| AI failure | Discard the proposal only; document and manual tools stay operational |
| Price failure | Retain unpriced quantities; block only priced-quote claims |
| Application rollback | Use a version that can read every V2 record already written |

---

## Research pointers

- Programme control: [`../governance/rules.md`](../governance/rules.md)
- Locked decisions and configuration envelope: [`charter.md`](../governance/charter.md)
- Benchmarks and standards: [`benchmarks.md`](../governance/benchmarks.md)
- FOCSS map: [`css.md`](./css.md)
- FOCSS stop-drift: [`focss-stop-drift.md`](../governance/focss-stop-drift.md)
- React Aria (admin/product controls): [react-spectrum.adobe.com/react-aria](https://react-spectrum.adobe.com/react-aria/)
- Fabric canvas: live under `site/components/{Planner,Studio}`

Historical essays and old shadcn/React-Flow programme notes: git history / `.archive/` only.
Live source owns execution decisions.
