# Agentic Loop

**plan → implement → verify → gate.** One task at a time. A task that has not passed gate
is not done, regardless of how complete the code looks.

Binding rules: [`rules.md`](./rules.md). Plan: [`../plan/README.md`](../plan/README.md) · [`../plan/overview.md`](../plan/overview.md) · [`../plan/decisions.md`](../plan/decisions.md) · [`../plan/history.md`](../plan/history.md).

**Gate means both vitest lanes.** `pnpm run test` prints two summaries (default
and tech-docs); a task is not gated on one of them.

**Pre-existing needs a baseline.** Declaring a failure "not mine" requires a run
at the commit before the work, not an argument about which files were touched.

---

## The loop

```text
        ┌──────────────────────────────────────────────┐
        │                                              │
        ▼                                              │
   ┌────────┐    ┌───────────┐    ┌────────┐    ┌──────┴─┐
   │  PLAN  │───▶│ IMPLEMENT │───▶│ VERIFY │───▶│  GATE  │
   └────────┘    └───────────┘    └────────┘    └────────┘
        │                              │             │
        │  entry conditions unmet      │  red        │  fail
        ▼                              ▼             ▼
      STOP                        back to        back to
    and ask                      IMPLEMENT        PLAN
```

Two return paths, and they are not the same. A red **verify** means the implementation is
wrong — fix it. A failed **gate** means the task was wrong — replan it. Never fix a gate
failure by adjusting the gate.

---

## 1. PLAN

Entry conditions. **All must hold before any file is edited.**

| # | Condition | How it is checked |
|---|---|---|
| 1 | The task is covered by a rule in `docs/governance/rules.md` | Read it. If not covered → **STOP and ask** (E1) |
| 2 | The task belongs to the current phase | Current numbered file under `docs/plan/`. Later-phase work → **STOP** (E2) |
| 3 | Prerequisites for the phase are met | Prior phase blockers in `Failures.md` understood; do not invent status files |
| 4 | The task's blockers are cleared | `Failures.md` carries no open blocker naming this task |
| 5 | `pnpm run typecheck` exits 0 | Run it. A tree that is already red cannot attribute a new failure |
| 6 | The failing assertion is identified | K7. Know what "fixed" will look like before starting |

Output of PLAN: the task's row in `status.md`, with its exit criteria written **before**
work starts. Criteria added afterwards are not criteria; they are a description of what
happened.

## 2. IMPLEMENT

- Write the failing assertion first (K7). Watch it fail. A test that has never failed proves nothing.
- Change only what the task names. No opportunistic refactors (E2).
- Never suppress: no `eslint-disable`, no `@ts-expect-error`, no `.skip`, no lowered threshold (K1, K4, K5, K6).
- If the work reveals a defect outside the task, record it in `Failures.md` and leave it. Do not fix it here.

## 3. VERIFY

Run against the change, unpiped, exit codes visible:

```bash
pnpm run lint
```

```bash
pnpm run typecheck
```

```bash
pnpm run typecheck:tests
```

```bash
pnpm exec vitest run --config tests/vitest.config.ts <the paths this task touched>
```

Then the evidence the task's criteria demand — browser run, stored artifact, measured
figure. Evidence is a stored artifact plus the command that regenerates it (E3). A sentence
in a Markdown file is not evidence.

**Verify is red → return to IMPLEMENT.** Not to PLAN, and not forward.

## 4. GATE

The task's exit criteria, every one, with evidence attached:

```bash
pnpm run build
```

```bash
pnpm run test
```

Plus clear `Failures.md` when claiming ship / closing a ticket.

Three outcomes, and only three:

| Outcome | Meaning | Next |
|---|---|---|
| **PASS** | Every criterion met, every piece of evidence attached | Clear `Failures.md` if needed; next task |
| **FAIL** | A criterion is unmet | Return to PLAN. The task was mis-scoped |
| **BLOCKED** | A criterion cannot be evaluated — missing instrument, absent table, env not wired | Record in `Failures.md` with the blocking reason; clear by engineering. **No owner freeze** — do not stop the programme waiting for approval |

**BLOCKED is not FAIL and must never be recorded as PASS with a note.** The Product Studio
draft path spent two sessions marked complete while its table did not exist in either
database. That is what BLOCKED exists to prevent.

---

## Stop conditions

Stop and ask, mid-task, without finishing:

1. A rule in `governance.md` does not cover the situation (E1).
2. Two rules conflict (E1).
3. The task requires removing something. It is archived to `.archive/`, never deleted, and only after approval (E4).
4. The task requires a dependency change (D1).
5. The only way forward is to weaken a threshold, skip a test or suppress an error (K4–K6).
6. The task needs a decision that is the owner's — data home, scope, product behaviour.

Stopping is not failure. Proceeding on an assumption is.

## What a task looks like when it is done

- Ship claims match live code + fresh commands; no invented PASS from plan text.
- Every exit criterion has evidence: a command, its output, and where the artifact is stored.
- `Failures.md` carries anything found and not fixed, with a repro command (or stays empty when none).
- No file outside the task's scope changed.
