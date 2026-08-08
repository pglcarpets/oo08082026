# Programme plans

Seven active programmes plus this index. **Flat folder only** — no subfolders, no extra files. Blockers live in [`Failures.md`](../Failures.md) only.

**Authority:** user instruction > live code > this tree > [`plans/01-handover.md`](./01-handover.md).

---

## How to use this set

1. **Pick your programme** from the table below (or start with Testing if you are unsure).
2. **Read the whole plan** — Goal, Current state, then Step-by-step instructions.
3. **Run commands from repo root** in PowerShell (`e:\oo08082026`); use `pnpm` only.
4. **Record evidence** under `results/` (not in these files). Mark items OPEN until you have a dated artifact.
5. **Update the plan** when audits change — bump the `AUDITED YYYY-MM-DD` date and adjust verdicts.

### Suggested read order (onboarding)

| Order | When |
|-------|------|
| [02-testing-plan.md](./02-testing-plan.md) | Before any gate or CI work |
| [03-ops-deploy-plan.md](./03-ops-deploy-plan.md) | Before deploy, DNS, or production smoke |
| [04-database-plan.md](./04-database-plan.md) | Before migrations, persistence, or asset cutover |
| [05-workspaces-plan.md](./05-workspaces-plan.md) | Before Planner (`/ooplanner`) or Studio (`/oostudio`) changes |
| [06-site-plan.md](./06-site-plan.md) | Before marketing, i18n, or member-suite UI |
| [07-tech-docs-plan.md](./07-tech-docs-plan.md) | Before `tech-docs-generator` or docs DNS |

Cross-links: workspace chrome → [06-site-plan.md](./06-site-plan.md) track C2; grants / `feature_flags` → [04-database-plan.md](./04-database-plan.md); e2e routes → [02-testing-plan.md](./02-testing-plan.md).

---

## Scripts — when to run what

Every user-invocable script (everything invocable by hand, plus the ones the plans call
out) and **when** each should be run. Gate entrypoints live under `scripts/general/`
(see its `README.md` for the npm-script mapping); one-shots live under `scripts/AsNeeded/`
(allow-listed in `ALLOWLIST.md`). All commands run from the **repo root**.

| When | Command | Plan doc |
|------|---------|----------|
| **Before any commit** | `pnpm run check:layout` | [02-testing-plan.md](./02-testing-plan.md) · [08-oo-start-checklist.md](./08-oo-start-checklist.md) |
| **Before any commit** | `pnpm run typecheck && pnpm run gate` | [08-oo-start-checklist.md](./08-oo-start-checklist.md) |
| **Before touching Studio ↔ Planner** | `pnpm run scan:boundaries` | [05-workspaces-plan.md](./05-workspaces-plan.md) · [08-oo-start-checklist.md](./08-oo-start-checklist.md) |
| **After CSS changes** | `pnpm run verify:focss` (+ `lint:ui:strict`, `check:composer-styles`, `check:style-tokens`) | [06-site-plan.md](./06-site-plan.md) |
| **After editing plans** | `node scripts/general/check-plans-purity.mjs` | [00-README.md](./00-README.md) · [08-oo-start-checklist.md](./08-oo-start-checklist.md) |
| **Scripts hygiene pass** | `node scripts/AsNeeded/_audit-stale-scripts.mjs` | [02-testing-plan.md](./02-testing-plan.md) |
| **Fast unit slice** | `pnpm run p0:unit` | [02-testing-plan.md](./02-testing-plan.md) · [08-oo-start-checklist.md](./08-oo-start-checklist.md) |
| **Both vitest lanes** | `pnpm run test` | [02-testing-plan.md](./02-testing-plan.md) |
| **Auth session unit** | `pnpm exec vitest run --config tests/vitest.config.ts tests/unit/lib/auth/session.test.ts` | [02-testing-plan.md](./02-testing-plan.md) · [03-ops-deploy-plan.md](./03-ops-deploy-plan.md) |
| **Targeted e2e audits** (`audit-3b/3c/2a/4a`) | `pnpm exec playwright test -c config/build/playwright.config.ts …` | [02-testing-plan.md](./02-testing-plan.md) · [05-workspaces-plan.md](./05-workspaces-plan.md) · [06-site-plan.md](./06-site-plan.md) |
| **Tech-docs snapshot tests** | `pnpm exec vitest run --config tests/vitest.tech-docs.config.ts …` | [07-tech-docs-plan.md](./07-tech-docs-plan.md) |
| **Responsive pass (all breakpoints)** | `node scripts/responsive-audit.mjs` | [05-workspaces-plan.md](./05-workspaces-plan.md) · [06-site-plan.md](./06-site-plan.md) |
| **Product migrations (dry-run first)** | `pnpm run ops db:apply -- --dry` → `pnpm run ops db:apply` | [04-database-plan.md](./04-database-plan.md) |
| **Admin/Planner migrations** | `pnpm run ops db:apply:admin -- --dry` → `pnpm run ops db:apply:admin` | [04-database-plan.md](./04-database-plan.md) |
| **Seed furniture (once per env)** | `pnpm run seed:furniture` (after `db:apply:admin`) | [04-database-plan.md](./04-database-plan.md) |
| **Connection smoke** | `pnpm run ops db:test` | [03-ops-deploy-plan.md](./03-ops-deploy-plan.md) · [`OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md) |
| **Type regeneration** | `pnpm run ops db:types:admin` → `pnpm run ops db:types` | [04-database-plan.md](./04-database-plan.md) |
| **Asset cutover smoke** | `node scripts/asset-cutover-smoke.mjs` | [04-database-plan.md](./04-database-plan.md) |
| **Apex / Worker origin drift** | `node scripts/general/check-worker-origin.mjs` | [03-ops-deploy-plan.md](./03-ops-deploy-plan.md) |
| **Full ship gate** | `pnpm run release:gate` (fast: `pnpm run gate`) | [02-testing-plan.md](./02-testing-plan.md) |

*Repo inventory: `pnpm run ops list` for every operational command; `scripts/general/README.md`
for the gate-entrypoint mapping; `scripts/AsNeeded/ALLOWLIST.md` for the one-shot allowlist.*

---

## Programmes

| # | Programme | Plan | Focus |
|---|-----------|------|--------|
| 1 | **Testing & tooling** | [02-testing-plan.md](./02-testing-plan.md) | Vitest lanes, gates, Playwright, scripts hygiene |
| 2 | **Ops & deploy** | [03-ops-deploy-plan.md](./03-ops-deploy-plan.md) | Vercel, Cloudflare Worker, DNS, auth/session |
| 3 | **Data & assets** | [04-database-plan.md](./04-database-plan.md) | Supabase (Admin + Products), persistence, R2/CDN cutover |
| 4 | **Workspaces** | [05-workspaces-plan.md](./05-workspaces-plan.md) | Planner `/ooplanner` + Studio `/oostudio` (fork isolation) |
| 5 | **Site & UI** | [06-site-plan.md](./06-site-plan.md) | Marketing, i18n, member suite, responsive polish |
| 6 | **Tech docs** | [07-tech-docs-plan.md](./07-tech-docs-plan.md) | `tech-docs-generator`, snapshot seam |

---

## Purity gate

`plans/` must contain **exactly** `00-README.md` plus the eight plan documents above. No subfolders. Markdown only.

```powershell
# From repo root
node scripts/general/check-plans-purity.mjs
# Or via ops (currently flaky on Windows; prefer direct node invocation below):
pnpm run ops check:plans-purity
```

**When to run:** before committing plan edits; included in `pnpm run check:docs-all` / governance.

**If it fails:** remove extra files or subfolders; fold working notes into a programme plan or [`Failures.md`](../Failures.md) — do not add `OUTSTANDING.md`, `CHECKLIST.md`, or nested folders.
