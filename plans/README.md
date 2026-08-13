# Plans

Flat Markdown only. No subfolders. No generated files.

| Doc | Focus |
|-----|--------|
| [00-README.md](./00-README.md) | Slice ID registry (all plans) |
| [revise-00-01-02-plans.md](./revise-00-01-02-plans.md) | This revision — registry, handover, testing |
| [oo-ux-shell-program.md](./oo-ux-shell-program.md) | Mobile shell + UX program |
| [01-handover.md](./01-handover.md) | Session handover |
| [02-testing-plan.md](./02-testing-plan.md) | Gates, Vitest, Playwright |
| [03-ops-deploy-plan.md](./03-ops-deploy-plan.md) | Vercel, Worker, DNS |
| [04-database-plan.md](./04-database-plan.md) | Migrations, types |
| [05-workspaces-plan.md](./05-workspaces-plan.md) | Planner / Studio |
| [06-site-plan.md](./06-site-plan.md) | Marketing, member suite |
| [07-tech-docs-plan.md](./07-tech-docs-plan.md) | tech-docs |
| [08-oo-start-checklist.md](./08-oo-start-checklist.md) | Session start |
| [09-proxy-auth-hardening-plan.md](./09-proxy-auth-hardening-plan.md) | Proxy/auth hardening |
| [10-vercel-cost-seo-performance.md](./10-vercel-cost-seo-performance.md) | Vercel bill + SEO/CWV |

## Retired

| Doc | Was | Superseded by |
|-----|-----|---------------|
| [oo-deep-audit-85-strict-quality-program.md](./oo-deep-audit-85-strict-quality-program.md) | 11-track audit + 85% programme | Phase A archived in `.archive/audit/`. Phase B stays in [`02-testing-plan.md`](./02-testing-plan.md); leftover P1/P2 are IDs in [`00-README.md`](./00-README.md) |
| [oo-deep-audit-v2.md](./oo-deep-audit-v2.md) | Ten-phase remediation plan | `oo-ux-shell-program.md` |
| [phase1-mobile-app-shell.md](./phase1-mobile-app-shell.md) | Phase 1 PR (10-file diffs) | `oo-ux-shell-program.md` § PHASE 1 |
| [Mobile app shell for oando.co.md](./Mobile%20app%20shell%20for%20oando.co.md) | Raw brief seed | `oo-ux-shell-program.md` |

| Kind | Where |
|------|--------|
| Plans | `plans/*.md` |
| Audits | `.archive/audit/*.md` (archived) |
| Evidence | `results/**` |
| Blockers | [`Failures.md`](../Failures.md) |

Purity: `node scripts/general/check-plans-purity.mjs`.
