# Agents

## What this folder is for

`AGENTS.md` at the repo root is loaded into **every** session automatically. That
makes it expensive — everything in it costs context on every task, whether or not
the task touches CSS, or tests, or the database. So the root file holds only the
floor: authority, layout, persistence, verification, migrations.

This folder holds the detail, split by topic, so you read the CSS rules when you
are changing CSS and not otherwise. Seven handbooks, one page each.

| File | Read it when |
|------|--------------|
| [`01-standard.md`](./01-standard.md) | Always — the work bar and what counts as evidence |
| [`02-testing.md`](./02-testing.md) | Writing or running tests |
| [`03-browser.md`](./03-browser.md) | Claiming anything about the UI |
| [`04-failures.md`](./04-failures.md) | Something is broken and needs recording |
| [`05-documentation.md`](./05-documentation.md) | Editing docs |
| [`06-architecture.md`](./06-architecture.md) | Deciding where code goes |
| [`07-css.md`](./07-css.md) | Touching styles |

Agent-directed meta-rules — user-wins, do-not-modify, commit policy — live in
[`../AGENTS.md`](../AGENTS.md), not repeated atop every handbook.

**Not the same as `docs/governance/`.** That folder holds programme commitments
with enforcement columns and an establishment date: long, consulted occasionally.
This folder is how a session works: short, read every time. Where the two overlap,
**this folder is the source** — governance exists to make a rule phase-enforceable,
not to restate it.

Filenames are asserted by `check:agents-md` and `check:agents-folder`. Rename one
and you must update both checkers and the `AGENTS.md` handbook table in the same
change; that trio drifted once and failed the gate on files that were present.

## Authority

```
user instruction  >  live code + fresh commands  >  Agents/  >  docs/
```

- Owner sets the goal. Clear goals execute without ceremony.
- Fresh evidence decides PASS / FAIL / ship. No fake proof.
- Programme direction: `plans/` + live code. Audit reports: `agent-reports/audit/` (MD only).
- Active blockers: root `Failures.md` alone. Raw/generated output: `results/`, never PASS.

## Working loop

plan → implement → verify → gate. One task at a time; a task that has not passed
its gate is not done, however finished the code looks. Verify with the smallest
command that proves the claim; run the broad gates when claiming completion rather
than progress.

## Execution floor

- Repo-root checkout. No worktrees. `pnpm` from root only.
- Smallest sound change; preserve unrelated owner work; no handwritten `any`.
- Secrets only in `.env.local` (and `site/.env.local` when Next loads from `site/`).
- UI claims: `http://localhost:3000` only, never `127.0.0.1`.
- Before completion: `pnpm run check:layout`.

## The product, briefly

One Next app under `site/` serving four surfaces: marketing `/`, admin `/admin/*`,
**Furniture Studio** `/oostudio`, **Floor Planner** `/ooplanner`. Studio and
Planner are fully forked — separate `@studio/*` and `@planner/*` trees that never
import each other (`pnpm run scan:boundaries`). They meet only at a shared backing
store: the Studio writes the furniture library, the Planner rail reads it.

Persistence is exclusive-mode. `DEV_AUTH_BYPASS=1` on a non-production build
selects **disk**; everything else selects **Supabase**. Production's filesystem is
read-only, so a route that writes must call the mode-aware store wrapper, never the
raw disk helper. Selectors: `lib/Planner/plannerPersistenceMode.ts`,
`lib/catalog/furnitureCatalogMode.ts`.

## Where to look

| Need | Open |
|------|------|
| Onboarding | [`../START.md`](../START.md) |
| Index | [`../CONTENTS.md`](../CONTENTS.md) · [`../DOC-MAP.md`](../DOC-MAP.md) |
| Deploy / migrate | [`../OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md) · `pnpm run ops list` |
| Where code goes | [`../docs/architecture/product-map.md`](../docs/architecture/product-map.md) |
| Start reading | [`../docs/architecture/source-map.md`](../docs/architecture/source-map.md) |
| Schema | [`../docs/database/schema.md`](../docs/database/schema.md) |
| Programme rules | [`../docs/governance/rules.md`](../docs/governance/rules.md) |
| Blockers | [`../Failures.md`](../Failures.md) |
| Product | [`../README.md`](../README.md) |
| Plans / audits | [`../plans/README.md`](../plans/README.md) · [`../agent-reports/README.md`](../agent-reports/README.md) |

## VS Code Customizations

Just-in-time instructions loaded when editing specific file types:

| File | Applies to | Purpose |
|------|-----------|---------|
| [`.github/instructions/focss.instructions.md`](../.github/instructions/focss.instructions.md) | `site/focss/**/*.css` | FOCSS zone boundaries, token rules |
| [`.github/instructions/testing.instructions.md`](../.github/instructions/testing.instructions.md) | `tests/**/*.{ts,tsx}` | Test conventions, persistence mocking |
| [`.github/instructions/boundaries.instructions.md`](../.github/instructions/boundaries.instructions.md) | Studio/Planner forked code | Fork isolation rules |
| [`.github/instructions/migrations.instructions.md`](../.github/instructions/migrations.instructions.md) | `site/platform/supabase/migrations/**/*.sql` | Rollback requirements, Supabase grants |

Skills: [`.github/skills/README.md`](../.github/skills/README.md) (16 role skills).
No `/gate` or `/new-test` commands — use `pnpm run gate` ([`OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md) §7).
