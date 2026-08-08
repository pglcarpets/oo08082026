# Plans navigation

Microscopic TDD programme plans for `e:\oo08082026`. **Start at the master index.**

| Doc | Purpose |
|-----|---------|
| [**00-README.md**](./00-README.md) | Master index — slice registry, dependency graph, seams glossary, gate commands |
| [01-handover.md](./01-handover.md) | Session-close vertical slices only |
| [02-testing-plan.md](./02-testing-plan.md) | Vitest lanes, gates, Playwright audits |
| [03-ops-deploy-plan.md](./03-ops-deploy-plan.md) | Vercel, Cloudflare Worker, DNS |
| [04-database-plan.md](./04-database-plan.md) | Migrations, types, persistence, R2 cutover |
| [05-workspaces-plan.md](./05-workspaces-plan.md) | Planner `/ooplanner` + Studio `/oostudio` |
| [06-site-plan.md](./06-site-plan.md) | Marketing, i18n, member suite, hydration |
| [07-tech-docs-plan.md](./07-tech-docs-plan.md) | `tech-docs-generator`, docs DNS (F3) |
| [08-oo-start-checklist.md](./08-oo-start-checklist.md) | Pre-session checklist → slice IDs |

**Authority:** user instruction > live code > [`AGENTS.md`](../AGENTS.md) > this tree.  
**Blockers:** [`Failures.md`](../Failures.md) only (not duplicated here).  
**Purity:** `node scripts/general/check-plans-purity.mjs` — flat `plans/`, Markdown only, no subfolders.
