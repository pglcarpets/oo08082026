# Documentation handbook

## Authority map

| Need | Open |
|------|------|
| Process floor | `AGENTS.md` |
| Plan | `plans/README.md` |
| Blockers | `Failures.md` |
| Doc index | `CONTENTS.md` |
| Structure | `DOC-MAP.md` |

## Rules

- Do not create shadow plans outside `plans/`.
- Do not invent PASS from plan files or `results/`.
- Edit `plans/**` only when the owner asks for plan work.
- `plans/` is pinned to **README + six root programme plans** (`database-plan.md`,
  `ops-deploy-plan.md`, `site-plan.md`, `tech-docs-plan.md`, `testing-plan.md`,
  `workspaces-plan.md`). `check:plans-purity` rejects subfolders, extra files,
  and retired plan names (OUTSTANDING/FINISH-PLAN/CHECKLIST/…).
  `plans/README.md` numbers the six programmes in execution order.