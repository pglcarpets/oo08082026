# Doc map

What lives where, and what wins.

## Authority

```
user  >  live code + fresh commands  >  AGENTS.md  >  Agents/  >  docs/**
```

- Docs are not proof. `results/` is never PASS.
- Blockers only in **`Failures.md`**.
- Code beats docs — fix the doc.

## Placement

| Kind | Where |
|------|--------|
| Plans | `plans/*.md` (flat) |
| Audits | `agent-reports/**/*.md` |
| Evidence | `results/**` |
| Blockers | `Failures.md` |

## Layers

| Layer | Role |
|-------|------|
| Root | Front doors — see table below |
| `Agents/` | Session handbooks ([`INDEX`](./Agents/INDEX.md)) |
| `docs/` | Reference (`architecture/`, `database/`, `governance/`) |
| `.github/` | JIT instructions + skills |
| `.archive/` | Retired — never authority |

### Root files

| File | For |
|------|-----|
| [`START.md`](./START.md) | First read |
| [`README.md`](./README.md) | Product / API |
| [`AGENTS.md`](./AGENTS.md) | Process floor |
| [`CONTENTS.md`](./CONTENTS.md) | Full index |
| [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md) | Deploy / migrate |
| [`Testing-handbook.md`](./Testing-handbook.md) | How to test |
| [`Failures.md`](./Failures.md) | Open blockers |
| [`plans/README.md`](./plans/README.md) | Plans |
| [`agent-reports/README.md`](./agent-reports/README.md) | Audits |

## Don't mix

| | Session | Programme | Evidence |
|--|---------|-----------|----------|
| Folder | `Agents/` | `docs/governance/` | `results/` |
| Plans vs audits | `plans/` = intent | `agent-reports/` = findings | |

## Checks

```bash
pnpm run check:docs-all
pnpm run docs:check:root-links
```

## Add a doc

1. Prefer edit over add.  
2. Plans → `plans/`. Audits → `agent-reports/`. Evidence → `results/`.  
3. Row in [`CONTENTS.md`](./CONTENTS.md).  
4. Run checks above.
