# Docs

**Authority:** user > live code + fresh proof > `Agents/` > this tree.  
Code wins when docs lag — fix the doc.

| | |
|--|--|
| New | [`../START.md`](../START.md) |
| Index | [`../CONTENTS.md`](../CONTENTS.md) |
| Map | [`../DOC-MAP.md`](../DOC-MAP.md) |

## Find it

| Need | Open |
|------|------|
| Deploy / migrate | [`../OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md) · `pnpm run ops list` |
| Where code goes | [`architecture/product-map.md`](./architecture/product-map.md) |
| Start reading | [`architecture/source-map.md`](./architecture/source-map.md) |
| Stack | [`architecture/stack.md`](./architecture/stack.md) |
| Pages / API | [`architecture/routes-pages.md`](./architecture/routes-pages.md) · [`routes-api.md`](./architecture/routes-api.md) |
| CSS | [`architecture/css.md`](./architecture/css.md) · [`governance/focss-stop-drift.md`](./governance/focss-stop-drift.md) |
| Tech-docs link | [`architecture/tech-docs-link.md`](./architecture/tech-docs-link.md) |
| Schema / seed / restore | [`database/schema.md`](./database/schema.md) · [`seeding.md`](./database/seeding.md) · [`restore.md`](./database/restore.md) |
| Persistence modes | [`database/overview.md`](./database/overview.md) |
| Programme rules | [`governance/rules.md`](./governance/rules.md) |
| Plans / audits | [`../plans/README.md`](../plans/README.md) · [`../agent-reports/audit/`](../agent-reports/audit/) |
| Blockers | [`../Failures.md`](../Failures.md) |
| VS Code skills | [`.github/skills/README.md`](../.github/skills/README.md) |

## Folders

| Folder | Owns |
|--------|------|
| `architecture/` | Code placement, stack, routes, CSS map |
| `database/` | Schema, modes, seed, restore |
| `governance/` | Rules, charter, benchmarks, FOCSS debt |

Plans live at repo-root **`plans/`** (not under `docs/`). Audits → `agent-reports/`. Evidence → `results/`.

## `Agents/` vs governance

| | `Agents/` | `docs/governance/` |
|--|-----------|-------------------|
| Question | How do I work now? | What is the programme committed to? |
| Length | Short | Long + enforcement columns |

Session rule conflict → **`Agents/` wins**.

## Conventions

- No `docs/audits/`. Raw output → `results/` (never PASS).
- `pnpm run check:docs-all` · FOCSS debt: `pnpm run check:style-tokens`.
- Process: [`../AGENTS.md`](../AGENTS.md) · [`../Agents/INDEX.md`](../Agents/INDEX.md).
- Ops: root scripts for daily work; `pnpm run ops list` for the rest.
