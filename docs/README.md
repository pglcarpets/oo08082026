# Docs



**Authority:** user > live code + fresh proof > `Agents/` > this tree.



Truth-synced **2026-08-03** against live code, root commands (`package.json` + `ops`), and both live databases.

Where a doc and the code disagree, the code wins — fix the doc, not the claim.



New here: [`../START.md`](../START.md).

Every document, listed: [`../CONTENTS.md`](../CONTENTS.md).

How the doc system is shaped: [`../DOC-MAP.md`](../DOC-MAP.md).



## Find it



| Need | Open |

|------|------|

| Deploy, migrate, seed, roll back | [`../OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md) · `pnpm run ops list` |

| Where code goes | [`architecture/product-map.md`](./architecture/product-map.md) |

| Where a subsystem starts | [`architecture/source-map.md`](./architecture/source-map.md) |

| Engines, runtime, persistence limits | [`architecture/stack.md`](./architecture/stack.md) |

| Page routes | [`architecture/routes-pages.md`](./architecture/routes-pages.md) |

| API routes + auth roles | [`architecture/routes-api.md`](./architecture/routes-api.md) |

| CSS | [`architecture/css.md`](./architecture/css.md) · [`governance/focss-stop-drift.md`](./governance/focss-stop-drift.md) |

| Tech-docs SPA link | [`architecture/tech-docs-link.md`](./architecture/tech-docs-link.md) |

| Live tables, RLS, `archive` schema | [`database/schema.md`](./database/schema.md) |

| Persistence modes (disk vs Supabase) | [`database/overview.md`](./database/overview.md) |

| Seeding | [`database/seeding.md`](./database/seeding.md) |

| Backup / restore | [`database/restore.md`](./database/restore.md) |

| Programme rules + enforcement | [`governance/rules.md`](./governance/rules.md) |

| Plan direction | [`../plans/`](../plans/) · [`../plans/01-handover.md`](../plans/01-handover.md) |

| Blockers | [`../Failures.md`](../Failures.md) |

| VS Code agent customizations | [`../.github/`](../.github/) — file-scoped instructions + 16 role skills (the former `/gate` skill and `/new-test` prompt no longer exist; see [`../CONTENTS.md`](../CONTENTS.md) § `.github/`) |



## Folders



| Folder | Owns |

|--------|------|

| `architecture/` | Where code lives, what runs it, every route index, source pointers |

| `database/` | Schema, persistence modes, seeding, restore |

| `governance/` | Programme rules, charter, benchmarks, loop, FOCSS drift ratchet |

| `plans/` | Direction only — pinned to **README + `1.md`–`6.md`** (repo root, not under `docs/`) |



`docs/site/` and `docs/api/` were folded into `architecture/` on 2026-08-01. Page

routes, API routes and the tech-docs link are all architecture concerns.



`docs/governance/commands.md` became `architecture/source-map.md` — a reading map,

not a rule.



## Boundary with `Agents/`



Deliberately not merged:



- **`Agents/`** — how a session works. Short, read every time, changes rarely.

- **`docs/governance/`** — what the programme commits to, with enforcement columns

  and an establishment date. Reference material, consulted occasionally.



Where governance restates a session rule, `Agents/` is the source.



## Commands



Root `package.json` keeps ~44 scripts (dev, gates, tests). Operational work uses

**`pnpm run ops <name>`** — see [`../README.md`](../README.md) and

[`../OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md).



## Conventions



- No `docs/audits/`. Raw tool output belongs in `results/` — never PASS.

- `plans/` is pinned; `pnpm run check:docs-all` runs `check:plans-purity` among others.

- FOCSS debt: `pnpm run check:style-tokens`.

- Process floor: [`../AGENTS.md`](../AGENTS.md) · [`../Agents/INDEX.md`](../Agents/INDEX.md).


