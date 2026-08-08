# Governance

What the programme has committed to, and which command enforces it.

| File | Answers |
|------|---------|
| [`rules.md`](./rules.md) | The binding programme rules, each with an enforcement column |
| [`charter.md`](./charter.md) | Locked decisions, configuration and storage envelope, baseline |
| [`benchmarks.md`](./benchmarks.md) | Every measurable bar and the instrument that produces it |
| [`focss-stop-drift.md`](./focss-stop-drift.md) | FOCSS allow/forbid list and the CSS debt ratchet |

## Not the same as `Agents/`

| | `Agents/` | here |
|---|---|---|
| Question | How do I work right now? | What has the programme committed to? |
| Length | Short — read every session | Long — consulted occasionally |
| Form | Imperative rules | Rules **plus enforcement columns** and a date |

Where this folder restates a session rule, **`Agents/` is the source.** Governance
exists to make a rule phase-enforceable, not to re-derive it. The working loop
(plan → implement → verify → gate) lives in
[`../../Agents/INDEX.md`](../../Agents/INDEX.md); the separate `agent-loop.md` that
used to duplicate it here is retired to `.archive/docs/`.

## Automated ratchets

`pnpm run check:governance` fails when a count **rises** above
`config/quality/governance-baseline.json`. It does not require zero — it stops the
debt growing.

| Rule | Baseline | Meaning |
|------|----------|---------|
| `D2_npx` | 37 | Package scripts using `npx` — prefer `pnpm exec`, which resolves inside the lockfile |
| `D3_dead_overrides` | 0 | A `package.json#overrides` block pnpm does not read |
| `D6_nonportable_in_gate` | 0 | `pwsh`/`python` inside a CI-reachable script chain (CI is ubuntu) |
| `P2_csp_unsafe_inline` | 2 | `'unsafe-inline'` in production `script-src` |
| `P4_migration_no_rollback` | 42 | Migrations with no `-- rollback` section |
| `S2_stray_report` | 0 | Report-shaped files under `plans/` |

In practice: **a new migration without a `-- rollback` section fails the gate**,
and so does a new package script written with `npx`.

Re-baseline with `node scripts/general/check-governance.mjs --update` — but that
is a deliberate act, not a way past a red gate.

## Other enforcement

`check:docs-all` bundles the documentation checks — handbook names, plan-folder
purity, `Failures.md` language, root link resolution. Three of those asserted a
retired layout until 2026-08-01 and failed on correct files. If a checker fails
while the files are demonstrably present, suspect the checker, then fix the
checker rather than bending the docs to it.
