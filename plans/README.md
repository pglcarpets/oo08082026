# Programme plans

Six active programmes plus this index. **Flat folder only** — no subfolders, no extra files. Blockers live in [`Failures.md`](../Failures.md) only.

**Authority:** user instruction > live code > this tree > [`HANDOVER.md`](../HANDOVER.md).

---

## How to use this set

1. **Pick your programme** from the table below (or start with Testing if you are unsure).
2. **Read the whole plan** — Goal, Current state, then Step-by-step instructions.
3. **Run commands from repo root** in PowerShell (`e:\Websites\oo05082026`); use `pnpm` only.
4. **Record evidence** under `results/` (not in these files). Mark items OPEN until you have a dated artifact.
5. **Update the plan** when audits change — bump the `AUDITED YYYY-MM-DD` date and adjust verdicts.

### Suggested read order (onboarding)

| Order | When |
|-------|------|
| [testing-plan.md](./testing-plan.md) | Before any gate or CI work |
| [ops-deploy-plan.md](./ops-deploy-plan.md) | Before deploy, DNS, or production smoke |
| [database-plan.md](./database-plan.md) | Before migrations, persistence, or asset cutover |
| [workspaces-plan.md](./workspaces-plan.md) | Before Planner (`/ooplanner`) or Studio (`/oostudio`) changes |
| [site-plan.md](./site-plan.md) | Before marketing, i18n, or member-suite UI |
| [tech-docs-plan.md](./tech-docs-plan.md) | Before `tech-docs-generator` or docs DNS |

Cross-links: workspace chrome → [site-plan.md](./site-plan.md) track C2; grants / `feature_flags` → [database-plan.md](./database-plan.md); e2e routes → [testing-plan.md](./testing-plan.md).

---

## Programmes

| # | Programme | Plan | Focus |
|---|-----------|------|--------|
| 1 | **Testing & tooling** | [testing-plan.md](./testing-plan.md) | Vitest lanes, gates, Playwright, scripts hygiene |
| 2 | **Ops & deploy** | [ops-deploy-plan.md](./ops-deploy-plan.md) | Vercel, Cloudflare Worker, DNS, auth/session |
| 3 | **Data & assets** | [database-plan.md](./database-plan.md) | Supabase (Admin + Products), persistence, R2/CDN cutover |
| 4 | **Workspaces** | [workspaces-plan.md](./workspaces-plan.md) | Planner `/ooplanner` + Studio `/oostudio` (fork isolation) |
| 5 | **Site & UI** | [site-plan.md](./site-plan.md) | Marketing, i18n, member suite, responsive polish |
| 6 | **Tech docs** | [tech-docs-plan.md](./tech-docs-plan.md) | `tech-docs-generator`, snapshot seam |

---

## Purity gate

`plans/` must contain **exactly** `README.md` plus the six `*-plan.md` files above. No subfolders. Markdown only.

```powershell
# From repo root
node scripts/general/check-plans-purity.mjs
# Or via ops (if run-ops path quoting works on your machine):
pnpm run ops check:plans-purity
```

**When to run:** before committing plan edits; included in `pnpm run check:docs-all` / governance.

**If it fails:** remove extra files or subfolders; fold working notes into a programme plan or [`Failures.md`](../Failures.md) — do not add `OUTSTANDING.md`, `CHECKLIST.md`, or nested folders.
