# Contents

Every document in this repository, numbered. **99** tracked Markdown files
(83 excluding the 16 skill files) in the live tree. Structure and authority
order: [`DOC-MAP.md`](./DOC-MAP.md). Walkthrough:
[`START.md`](./START.md).

Truth-synced 2026-08-06 against live code, root commands (`ops`), and both live databases.

---

## Root â€” front doors

| â„– | File | Covers |
|---|------|--------|
| 01 | [`START.md`](./START.md) | Walkthrough: product, fork rule, Studioâ†’Planner, persistence, run commands, ops tier |
| 02 | [`CONTENTS.md`](./CONTENTS.md) | This index |
| 03 | [`DOC-MAP.md`](./DOC-MAP.md) | Doc structure, authority order, `Agents/` vs `governance/`, enforcement |
| 04 | [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md) | Deploy sequence, migrations, grants, seeding, rollback, incidents, backups |
| 05 | [`AGENTS.md`](./AGENTS.md) | Process floor, product layout, persistence, verification, agent meta-rules |
| 06 | [`README.md`](./README.md) | Product reference, API map, UI policy, root vs `ops` commands |
| 07 | [`Testing-handbook.md`](./Testing-handbook.md) | Test rules, two lanes, audits, `ops` for focused e2e |
| 08 | [`Failures.md`](./Failures.md) | Active blockers only â€” F1â€“F3 deploy blockers (Worker origin / apex catalog / docs DNS) |
| 09 | [`HANDOVER.md`](./HANDOVER.md) | Session handover â€” plans alignment + execution order (2026-08-06); superseded 2026-08-03 handover retained below it |
| 10 | [`.github/skills/README.md`](./.github/skills/README.md) | Pinned agent skills registry (16 global skills) |

## `Agents/` â€” session handbooks

| â„– | File | Covers |
|---|------|--------|
| 11 | [`Agents/INDEX.md`](./Agents/INDEX.md) | **What the folder is for**, handbook index, authority, working loop, product summary |
| 12 | [`Agents/01-standard.md`](./Agents/01-standard.md) | Work bar, evidence rules, no-`any` rule and why it matters |
| 13 | [`Agents/02-testing.md`](./Agents/02-testing.md) | Test commands, two lanes, persistence mode in tests, live-DB skips |
| 14 | [`Agents/03-browser.md`](./Agents/03-browser.md) | Browser proof, surfaces, why dev bypass â‰  production path |
| 15 | [`Agents/04-failures.md`](./Agents/04-failures.md) | Blocker recording, baseline requirement for "pre-existing" |
| 16 | [`Agents/05-documentation.md`](./Agents/05-documentation.md) | Docs bar, routing table, plan-folder and handbook-name rules |
| 17 | [`Agents/06-architecture.md`](./Agents/06-architecture.md) | Placement, product shape, store modes, Studioâ†’Planner note |
| 18 | [`Agents/07-css.md`](./Agents/07-css.md) | FOCSS fence, zone entries, hard rules, verification |

## `docs/architecture/`

| â„– | File | Covers |
|---|------|--------|
| 19 | [`docs/README.md`](./docs/README.md) | Docs front door and folder map |
| 20 | [`docs/architecture/README.md`](./docs/architecture/README.md) | Architecture index |
| 21 | [`docs/architecture/product-map.md`](./docs/architecture/product-map.md) | Vision, where code goes, domains, UI zones, **how Studio output reaches the Planner** |
| 22 | [`docs/architecture/stack.md`](./docs/architecture/stack.md) | Toolchain, workspace, **FOCSS-on-Tailwind**, **how the interactive workspace is built**, live-vs-declared deps, persistence limits, security |
| 23 | [`docs/architecture/source-map.md`](./docs/architecture/source-map.md) | Where to start reading for each concern; absent vs present trees |
| 24 | [`docs/architecture/css.md`](./docs/architecture/css.md) | CSS ownership, design systems, FOCSS zones |
| 25 | [`docs/architecture/routes-pages.md`](./docs/architecture/routes-pages.md) | Page route inventory |
| 26 | [`docs/architecture/routes-api.md`](./docs/architecture/routes-api.md) | API route inventory + auth roles |
| 27 | [`docs/architecture/tech-docs-link.md`](./docs/architecture/tech-docs-link.md) | Admin â†’ tech-docs SPA link and its current status |

## `docs/database/`

| â„– | File | Covers |
|---|------|--------|
| 28 | [`docs/database/README.md`](./docs/database/README.md) | Database index, the two projects |
| 29 | [`docs/database/overview.md`](./docs/database/overview.md) | Live docs map, advisors, **persistence modes** |
| 30 | [`docs/database/schema.md`](./docs/database/schema.md) | Both projects, all live tables, RLS, `archive` schema, grants, known drift |
| 31 | [`docs/database/seeding.md`](./docs/database/seeding.md) | Seed commands incl. `seed:furniture`, troubleshooting |
| 32 | [`docs/database/restore.md`](./docs/database/restore.md) | Backups, restore paths, maintenance, degraded mode, rollback caution |

## `docs/governance/`

| â„– | File | Covers |
|---|------|--------|
| 33 | [`docs/governance/README.md`](./docs/governance/README.md) | Governance index + **ratchet baselines** |
| 34 | [`docs/governance/rules.md`](./docs/governance/rules.md) | Programme rules with enforcement columns |
| 35 | [`docs/governance/charter.md`](./docs/governance/charter.md) | Locked decisions, configuration envelope, **storage envelope** |
| 36 | [`docs/governance/benchmarks.md`](./docs/governance/benchmarks.md) | Measurable bars and their instruments |
| 37 | [`docs/governance/focss-stop-drift.md`](./docs/governance/focss-stop-drift.md) | FOCSS allow/forbid and debt ratchet |

## `plans/` — programme plans (flat: README + 6)

| № | File | Covers |
|---|------|--------|
| 38 | [`plans/00-README.md`](./plans/00-README.md) | Programme plan index |
| 39 | [`plans/02-testing-plan.md`](./plans/02-testing-plan.md) | Testing, gates, scripts hygiene |
| 40 | [`plans/03-ops-deploy-plan.md`](./plans/03-ops-deploy-plan.md) | Deploy, Worker, DNS, auth/session |
| 41 | [`plans/04-database-plan.md`](./plans/04-database-plan.md) | Database, persistence, R2/CDN cutover |
| 42 | [`plans/05-workspaces-plan.md`](./plans/05-workspaces-plan.md) | Planner `/ooplanner` + Studio `/oostudio` |
| 43 | [`plans/06-site-plan.md`](./plans/06-site-plan.md) | Marketing, i18n, member suite, UI polish |
| 44 | [`plans/07-tech-docs-plan.md`](./plans/07-tech-docs-plan.md) | Tech-docs generator, snapshot seam |

## Other packages

| â„– | File | Covers |
|---|------|--------|
| 57 | [`tech-docs-generator/README.md`](./tech-docs-generator/README.md) | Optional Vite inventory; 31-file test lane; `tech-docs:gate` |

## `.github/` â€” VS Code customizations

Just-in-time instructions and skills loaded by VS Code Copilot when editing specific file types.

| â„– | File | Covers |
|---|------|--------|
| 58 | [`.github/instructions/focss.instructions.md`](./.github/instructions/focss.instructions.md) | FOCSS zone boundaries, token rules, verification (applies to `site/focss/**/*.css`) |
| 59 | [`.github/instructions/testing.instructions.md`](./.github/instructions/testing.instructions.md) | Test conventions, persistence mocking, two-lane awareness (applies to `tests/**/*.{ts,tsx}`) |
| 60 | [`.github/instructions/boundaries.instructions.md`](./.github/instructions/boundaries.instructions.md) | Studio/Planner fork isolation rules (applies to forked code under `site/`) |
| 61 | [`.github/instructions/migrations.instructions.md`](./.github/instructions/migrations.instructions.md) | Migration rollback requirements, Supabase grants (applies to `site/platform/supabase/migrations/**/*.sql`) |
| 62 | [`.github/skills/README.md`](./.github/skills/README.md) | Agent skills â€” 16 pinned role skills loaded for matching tasks (no `/gate` or `/new-test` commands exist) |

## Not documents

| Path | What |
|------|------|
| `docs/architecture/sitemap-routes.csv` | Generated marketing route CSV (`pnpm run ops docs:sync:sitemap-csv`) |
| `results/` | Raw tool output. **Never PASS.** |
| `.archive/` | Retired material. Never authority. |

---

## By question

| Question | Go to |
|----------|-------|
| What is this product? | 01 |
| Where do I put this code? | 21, 23 |
| Which database, which table? | 30 |
| Why did my write fail in production? | 01 Â§4, 22, 05 |
| How do I add a migration? | 04 Â§2 |
| Why is the Planner rail empty? | 04 Â§5, 31 |
| How does Studio furniture reach the Planner? | 01 Â§3, 21 |
| Which library do I use for animation / canvas / docking? | 22 Â§4 |
| Is this dependency actually used? | 22 Â§4 |
| What counts as proof? | 08, 12 |
| How do I run a db / backup / seed command? | 05, `pnpm run ops list` |
| Hollow or fake tests? | 08 (`test:audit:*`) |
| Tech-docs SPA / gate? | 27, 44 |
| Full-site UI polish? | 38â€“56 |
| What is broken right now? | 08 |
| Latest session handover? | 09 |
| Why did a doc checker fail on a file that exists? | 03 |
