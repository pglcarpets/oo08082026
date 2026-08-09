# Plans

**Start:** [`00-README.md`](./00-README.md) (registry + gates). **Close:** [`01-handover.md`](./01-handover.md).

| Doc | Focus |
|-----|--------|
| [00-README](./00-README.md) | Master registry (status authority) |
| [01-handover](./01-handover.md) | Session close HO-S* |
| [02-testing](./02-testing-plan.md) | Gates, Vitest, Playwright |
| [03-ops](./03-ops-deploy-plan.md) | Vercel, Worker, DNS |
| [04-database](./04-database-plan.md) | Migrations, types, persistence |
| [05-workspaces](./05-workspaces-plan.md) | Planner / Studio |
| [06-site](./06-site-plan.md) | Marketing, member suite |
| [07-tech-docs](./07-tech-docs-plan.md) | tech-docs-generator, F3 |
| [08-oo-start](./08-oo-start-checklist.md) | Session start CHK-S* |
| [09-proxy-auth](./09-proxy-auth-hardening-plan.md) | Proxy/auth (DONE) |

**Authority:** user > live code > AGENTS.md > this tree. **Blockers:** [`Failures.md`](../Failures.md).  
**Purity:** `node scripts/general/check-plans-purity.mjs` — flat Markdown only.
