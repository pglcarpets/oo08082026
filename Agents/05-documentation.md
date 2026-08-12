# Documentation handbook

## Authority map

| Need | Open |
|------|------|
| Process floor | `AGENTS.md` |
| Plan | `plans/README.md` |
| Audit reports | `agent-reports/audit/` (MD only) |
| Blockers | `Failures.md` |
| Doc index | `CONTENTS.md` |
| Structure | `DOC-MAP.md` |

## Rules

- Do not create shadow plans outside `plans/`.
- Do not invent PASS from plan files or `results/`.
- Edit `plans/**` only when the owner asks for plan work.
- **Placement:** programme plans → `plans/*.md` (flat); audit reports/briefs →
  `agent-reports/audit/*.md` only; generated evidence → `results/**`.
- `check:plans-purity` rejects subfolders, non-Markdown, and unlisted plan files.
  Retired plan names (OUTSTANDING/FINISH-PLAN/CHECKLIST/…) stay forbidden.