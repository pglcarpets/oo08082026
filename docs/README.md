# Docs

**Authority:** user > live code + fresh proof > `Agents/` > this tree.  
Code wins when docs lag.

> **Production filesystem is read-only.** Runtime writes use mode-aware wrappers.
> See [`AGENTS.md`](../AGENTS.md) §5.

| | |
|--|--|
| New | [`../START.md`](../START.md) |
| Index | [`../CONTENTS.md`](../CONTENTS.md) · [`../DOC-MAP.md`](../DOC-MAP.md) |

## Find it

| Need | Open |
|------|------|
| Where code goes / source pointers / tech-docs | [`architecture/product-map.md`](./architecture/product-map.md) |
| Stack (Node, Next, FOCSS, packages) | [`architecture/stack.md`](./architecture/stack.md) |
| Pages + API | [`architecture/routes.md`](./architecture/routes.md) |
| CSS | [`architecture/css.md`](./architecture/css.md) · [`governance/focss-stop-drift.md`](./governance/focss-stop-drift.md) |
| Schema | [`database/schema.md`](./database/schema.md) |
| DB ops (modes, seed, restore) | [`database/ops.md`](./database/ops.md) |
| Programme rules | [`governance/rules.md`](./governance/rules.md) |
| Charter / benchmarks | [`governance/charter.md`](./governance/charter.md) · [`benchmarks.md`](./governance/benchmarks.md) |
| Deploy | [`../OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md) |
| Plans / audits | [`../plans/README.md`](../plans/README.md) · [`../agent-reports/`](../agent-reports/README.md) |
| Tech-docs package | [`../tech-docs-generator/README.md`](../tech-docs-generator/README.md) |
| Blockers | [`../Failures.md`](../Failures.md) |

## Layout (11 files)

| Path | Owns |
|------|------|
| `architecture/product-map.md` | Placement, Studio→Planner, source pointers, tech-docs |
| `architecture/stack.md` | Toolchain, workspace, FOCSS-on-Tailwind, package truth |
| `architecture/routes.md` | Page + API inventories |
| `architecture/css.md` | FOCSS zones |
| `database/schema.md` | Tables, RLS, archive |
| `database/ops.md` | Modes, advisors, seed, restore |
| `governance/rules.md` | Programme rules + enforcement |
| `governance/charter.md` | Locked decisions |
| `governance/benchmarks.md` | Measurable bars |
| `governance/focss-stop-drift.md` | CSS debt ratchet |

Plans → repo-root `plans/`. Audits → `agent-reports/`. Evidence → `results/`.

Session rules: [`../Agents/INDEX.md`](../Agents/INDEX.md) beats governance restatements.
