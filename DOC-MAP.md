# Doc map

How documentation in this repository is organised, who owns what, and which file
wins when two disagree. For a flat list of every document see
[`CONTENTS.md`](./CONTENTS.md); to be walked through the product see
[`START.md`](./START.md).

---

## Authority order

```
user instruction
      ▼
live code + fresh command output
      ▼
AGENTS.md  →  Agents/*.md
      ▼
docs/**
```

Consequences worth stating plainly:

- A doc is never proof. `results/` output is never PASS.
- Root `plans/` holds all programme plans (2026-08-06); `docs/superpowers/specs/` redirects to `plans/`.
- Active blockers live in **`Failures.md` only**, nowhere else.
- If a doc and the code disagree, the code wins: fix the doc.

## The four layers

### 1. Root — the front doors

Short, high-traffic, and the only files a newcomer must read.

| File | Answers |
|------|---------|
| [`START.md`](./START.md) | "What is this, how do I run it, what bites first?" |
| [`CONTENTS.md`](./CONTENTS.md) | "Which document covers X?" |
| `DOC-MAP.md` (this) | "How is this organised and what wins?" |
| [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md) | Deploy, migrate, seed, roll back — **`pnpm run ops`** for most steps |
| [`AGENTS.md`](./AGENTS.md) | The process floor — binding on every session |
| [`README.md`](./README.md) | Product reference, fork rules, API map, root vs `ops` commands |
| [`Testing-handbook.md`](./Testing-handbook.md) | How to test, two lanes, audits, focused runs via `ops` |
| [`Failures.md`](./Failures.md) | What is broken right now |
| [`HANDOVER.md`](./HANDOVER.md) | Latest session handover — typography/chrome (`27a51e6`) + portal shell (`33254ea`) |

### 2. `Agents/` — how a session works

Eight short handbooks, indexed by [`Agents/INDEX.md`](./Agents/INDEX.md). Read
every session, changed rarely. Kebab-case filenames (`01-standard.md` …) asserted
by `check:agents-md` and `check:agents-folder` — keep the files, `AGENTS.md`, and
both checkers in step.

### 3. `docs/` — reference

| Folder | Owns |
|--------|------|
| `architecture/` | Where code lives, what runs it, route indexes, source pointers |
| `database/` | Schema, persistence modes, seeding, restore |
| `governance/` | Programme rules with enforcement, charter, benchmarks, loop |

**Other package:** [`tech-docs-generator/README.md`](./tech-docs-generator/README.md)
— optional Vite inventory SPA (`pnpm run tech-docs:dev` on port 3001). Indexed in
[`CONTENTS.md`](./CONTENTS.md) § Other packages.

### 4. `.github/` — VS Code customizations

Just-in-time instructions and skills loaded by VS Code Copilot when
editing specific file types. Not handbooks — they
complement `Agents/` by providing context only when relevant.

| Folder | Owns |
|--------|------|
| `.github/instructions/` | File-scoped rules (`applyTo` patterns) — FOCSS, testing, boundaries, migrations |
| `.github/skills/` | 16 pinned role skills for matching tasks (no `/gate` or `/new-test` commands exist — gates run via `pnpm run gate`) |

Indexed in [`CONTENTS.md`](./CONTENTS.md) § `.github/` — VS Code customizations.

### 5. `.archive/` — retired, never authority

Governance rule **E4: retire deliberately.** Git history is the archive for
anything git tracks, so `.archive/` is only for material that should stay
browsable without git archaeology — superseded essays, retired index pages.
Nothing there is live.

---

## Two boundaries people get wrong

### `Agents/` vs `docs/governance/`

Not merged, deliberately.

| | `Agents/` | `docs/governance/` |
|---|---|---|
| Question | How do I work right now? | What has the programme committed to? |
| Length | Short — read every session | Long — consulted occasionally |
| Changes | Rarely | Per programme decision |
| Form | Imperative rules | Rules **plus enforcement columns** and a date |

Where governance restates a session rule, **`Agents/` is the source**; governance
exists to make it phase-enforceable, not to re-derive it. Merging them would push
reference material into files that must stay short enough to read every time —
that is the cost we are avoiding.

### `architecture/` vs everything else

As of 2026-08-01, `docs/site/` and `docs/api/` are gone. Page routes, API routes
and the tech-docs link are all *architecture* — where things live and what serves
them — and two single-file folders made the map harder to read than the content
justified.

| Was | Now |
|-----|-----|
| `docs/site/pages.md` | `docs/architecture/routes-pages.md` |
| `docs/api/routes.md` | `docs/architecture/routes-api.md` |
| `docs/site/tech-docs-link.md` | `docs/architecture/tech-docs-link.md` |
| `docs/site/sitemap-routes.csv` | `docs/architecture/sitemap-routes.csv` |
| `docs/governance/commands.md` | `docs/architecture/source-map.md` |
| `docs/site/README.md`, `overview.md`, `docs/api/README.md` | `.archive/docs/` |

`commands.md` moved because it was never a rule — it is a map of where to start
reading, which is architecture.

Generators updated with it: `generate-route-index.mjs`,
`generate-sitemap-csv.ts`, `generate-route-classification.mjs`.

---

## Enforcement

| Check | Asserts |
|-------|---------|
| `check:docs-all` | Layout + failures + agents + plan purity + docs purity (single entry) |
| `docs:check:root-links` | Root Markdown links resolve |
| `ops` | Dispatches 140 operational scripts (`pnpm run ops list`; counted 2026-08-06) |

All doc checks run under `pnpm run check:docs-all`. Root links:
`pnpm run docs:check:root-links`.

Three of these asserted a retired layout until 2026-08-01 and failed on correct
files. If a doc checker fails while the files are demonstrably present, suspect
the checker — then fix the checker, not the docs.

---

## Adding a document

1. Does it belong in an existing file? Prefer editing over adding.
2. Reference → `docs/`. Session rule → `Agents/`. Front door → root, sparingly.
3. Programme plans live in `plans/` only — do not recreate shadow plan trees under `docs/`.
4. Add the row to [`CONTENTS.md`](./CONTENTS.md).
5. `pnpm run check:docs-all`.
