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
