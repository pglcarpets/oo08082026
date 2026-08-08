# Standard

## Bar
- Root `AGENTS.md` wins.
- Smallest sound change. Preserve unrelated work.
- No handwritten `any`.
- Commit/push only when the owner asks.

## Execution
- Repo root only. **No worktrees.**
- **pnpm** from root only — never inside `site/` or `tech-docs-generator/`.
- Secrets only in `.env.local` / `site/.env.local` when required.
- Do not invent product behavior from plans.

## Evidence
- Live code + fresh commands decide PASS/FAIL.
- Do not claim browser outcomes from unit tests alone.
- Optional raw dumps: `results/` only (never ship as PASS proof).
- `pnpm run test` prints **two** lane summaries; one is not the suite.
- Calling a failure pre-existing requires a baseline run at the prior commit.

## Types
- No handwritten `any` — including "the generated types lag" escape hatches. Those
  casts hid a live bug where `ensurePlannerProfile` wrote columns `profiles` does
  not have, failing every production Planner save. Regenerate the types instead:
  `pnpm run ops db:types:admin`, `pnpm run ops db:types` (ops wrappers — they are
  not root package.json scripts).
